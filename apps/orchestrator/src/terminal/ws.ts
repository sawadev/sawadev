import type { ServerWebSocket } from 'bun';
import type { Exec } from 'dockerode';
import { validateSessionFromCookieHeader } from '../auth/sessions';
import { getManagedContainer } from '../workspaces/docker';
import { type ExecAttachment, attachExec } from './exec-attach';

/** Données attachées à chaque connexion WebSocket terminal. */
export interface TerminalData {
  workspaceId: string;
  exec?: Exec;
  attachment?: ExecAttachment;
  /** Saisies reçues avant que l'attache async soit prête (évite leur perte). */
  pendingInput: string[];
}

/** Shell lancé dans le workspace : bash si présent, sinon sh. */
const SHELL = [
  '/bin/sh',
  '-lc',
  'if command -v bash >/dev/null 2>&1; then exec bash; else exec sh; fi',
];

/** Messages client -> serveur. */
type ClientMsg = { type: 'input'; data: string } | { type: 'resize'; cols: number; rows: number };

const PREFIX = '/ws/terminal/';

/**
 * Tente l'upgrade WebSocket d'une requête /ws/terminal/:id.
 * Vérifie la session AVANT toute ouverture (PLAN §8). Renvoie une Response
 * d'erreur si la requête concerne ce endpoint mais échoue, ou null si la
 * requête n'est pas un endpoint terminal (à router ailleurs).
 */
export function tryUpgradeTerminal(
  req: Request,
  server: { upgrade: (req: Request, opts: { data: TerminalData }) => boolean },
): Response | null | undefined {
  const url = new URL(req.url);
  if (!url.pathname.startsWith(PREFIX)) return null;

  const session = validateSessionFromCookieHeader(req.headers.get('cookie'));
  if (!session) return new Response('unauthorized', { status: 401 });

  const workspaceId = decodeURIComponent(url.pathname.slice(PREFIX.length));
  if (!workspaceId) return new Response('bad_request', { status: 400 });

  const upgraded = server.upgrade(req, { data: { workspaceId, pendingInput: [] } });
  return upgraded ? undefined : new Response('upgrade_failed', { status: 426 });
}

function send(ws: ServerWebSocket<TerminalData>, msg: object): void {
  ws.send(JSON.stringify(msg));
}

/** Handlers WebSocket Bun pour le terminal. */
export const terminalWebSocket = {
  async open(ws: ServerWebSocket<TerminalData>) {
    const container = await getManagedContainer(ws.data.workspaceId);
    if (!container) {
      send(ws, { type: 'exit', code: -1 });
      ws.close(1011, 'workspace_not_found');
      return;
    }
    try {
      const exec = await container.exec({
        Cmd: SHELL,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        WorkingDir: '/workspace',
      });
      ws.data.exec = exec;
      // Attache native Bun (dockerode hijack inopérant sous Bun).
      const attachment = await attachExec(exec.id, {
        onData: (chunk) => send(ws, { type: 'output', data: chunk }),
        onClose: () => {
          send(ws, { type: 'exit', code: 0 });
          ws.close();
        },
      });
      ws.data.attachment = attachment;
      // Rejoue les saisies arrivées pendant l'attache.
      for (const data of ws.data.pendingInput) attachment.write(data);
      ws.data.pendingInput = [];
    } catch {
      send(ws, { type: 'exit', code: -1 });
      ws.close(1011, 'exec_failed');
    }
  },

  message(ws: ServerWebSocket<TerminalData>, raw: string | Buffer) {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
    } catch {
      return;
    }
    if (msg.type === 'input') {
      if (ws.data.attachment) ws.data.attachment.write(msg.data);
      else ws.data.pendingInput.push(msg.data);
    } else if (msg.type === 'resize') {
      ws.data.exec?.resize({ h: msg.rows, w: msg.cols }).catch(() => undefined);
    }
  },

  close(ws: ServerWebSocket<TerminalData>) {
    ws.data.attachment?.close();
  },
};
