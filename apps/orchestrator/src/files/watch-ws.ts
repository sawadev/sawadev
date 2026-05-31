import { type FSWatcher, watch } from 'node:fs';
import type { ServerWebSocket } from 'bun';
import { validateSessionFromCookieHeader } from '../auth/sessions';
import { resolveWorkspaceDir } from './service';

const FILES_PREFIX = '/ws/files/';
const DEBOUNCE_MS = 200;

/** Données d'une connexion de surveillance de fichiers. */
export interface FileWatchData {
  kind: 'files';
  workspaceId: string;
  /** dossier (relatif) → watcher fs.watch (non-récursif). */
  watchers: Map<string, FSWatcher>;
  /** dossier → timer de debounce. */
  timers: Map<string, ReturnType<typeof setTimeout>>;
}

type ClientMsg = { type: 'watch'; dirs: string[] };

/**
 * Upgrade d'un WebSocket de surveillance de fichiers. Vérifie la session (PLAN §8).
 * Renvoie null si le chemin n'est pas `/ws/files/...`.
 */
export function tryUpgradeFilesWs(
  req: Request,
  server: { upgrade: (req: Request, opts: { data: FileWatchData }) => boolean },
): Response | null | undefined {
  const url = new URL(req.url);
  if (!url.pathname.startsWith(FILES_PREFIX)) return null;
  if (!validateSessionFromCookieHeader(req.headers.get('cookie'))) {
    return new Response('unauthorized', { status: 401 });
  }
  const workspaceId = decodeURIComponent(url.pathname.slice(FILES_PREFIX.length));
  if (!workspaceId) return new Response('bad_request', { status: 400 });
  const data: FileWatchData = {
    kind: 'files',
    workspaceId,
    watchers: new Map(),
    timers: new Map(),
  };
  const upgraded = server.upgrade(req, { data });
  return upgraded ? undefined : new Response('upgrade_failed', { status: 426 });
}

function safeSend(ws: ServerWebSocket<FileWatchData>, msg: object): void {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    // socket fermé : ignore.
  }
}

/** Émet un `change` pour `dir`, debouncé (un burst de créations = un seul refresh). */
function emitChange(ws: ServerWebSocket<FileWatchData>, dir: string): void {
  const { timers } = ws.data;
  clearTimeout(timers.get(dir));
  timers.set(
    dir,
    setTimeout(() => {
      timers.delete(dir);
      safeSend(ws, { type: 'change', dir });
    }, DEBOUNCE_MS),
  );
}

/** Aligne les watchers actifs sur l'ensemble de dossiers demandé par le client. */
async function setWatched(ws: ServerWebSocket<FileWatchData>, dirs: string[]): Promise<void> {
  const { watchers, workspaceId } = ws.data;
  const want = new Set(dirs);
  // Retire ceux qui ne sont plus visibles.
  for (const [dir, w] of watchers) {
    if (!want.has(dir)) {
      w.close();
      watchers.delete(dir);
    }
  }
  // Ajoute les nouveaux (non-récursif → un événement par dossier direct).
  for (const dir of want) {
    if (watchers.has(dir)) continue;
    try {
      const abs = await resolveWorkspaceDir(workspaceId, dir);
      const w = watch(abs, () => emitChange(ws, dir));
      w.on('error', () => {
        w.close();
        watchers.delete(dir);
      });
      watchers.set(dir, w);
    } catch {
      // dossier absent / invalide : ignoré (il sera (re)surveillé quand il existera).
    }
  }
}

/** Handlers WebSocket de surveillance de fichiers (dispatchés depuis index.ts). */
export const fileWatchSocket = {
  open() {
    // Rien : on attend le message `watch` du client (liste des dossiers visibles).
  },
  message(ws: ServerWebSocket<FileWatchData>, raw: string | Buffer) {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
    } catch {
      return;
    }
    if (msg.type === 'watch' && Array.isArray(msg.dirs)) void setWatched(ws, msg.dirs);
  },
  close(ws: ServerWebSocket<FileWatchData>) {
    for (const w of ws.data.watchers.values()) w.close();
    ws.data.watchers.clear();
    for (const t of ws.data.timers.values()) clearTimeout(t);
    ws.data.timers.clear();
  },
};
