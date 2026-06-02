import type { KeyProvider } from '@sawadev/shared';
import type { ServerWebSocket } from 'bun';
import type { Exec } from 'dockerode';
import { validateSessionFromCookieHeader } from '../auth/sessions';
import { getConfig } from '../config';
import { getOrCreateToken } from '../mcp/tokens';
import { PROVIDER_ENV, getDecryptedKey } from '../secrets/keys';
import { getManagedContainer } from '../workspaces/docker';
import { touchWorkspace } from '../workspaces/service';
import { type ExecAttachment, attachExec } from './exec-attach';

/** Données attachées à chaque connexion WebSocket (terminal ou agent). */
export interface TerminalData {
  kind: 'terminal';
  workspaceId: string;
  cmd: string[];
  /** Variables d'env injectées à l'exec (ex. clé API agent). Jamais loggées. */
  env: string[];
  exec?: Exec;
  attachment?: ExecAttachment;
  pendingInput: string[];
}

type ClientMsg = { type: 'input'; data: string } | { type: 'resize'; cols: number; rows: number };

const TERMINAL_PREFIX = '/ws/terminal/';
const AGENT_PREFIX = '/ws/agent/';

/** Nom de session tmux sûr (la barre de statut l'affiche comme nom de workspace). */
export function sessionName(workspaceId: string): string {
  return workspaceId.replace(/[^a-zA-Z0-9_-]/g, '-') || 'ws';
}

/**
 * Nom de session tmux d'un **onglet** terminal : `${ws}-t-<termId>`. Le segment
 * `-t-` distingue les onglets de la session agent (`${ws}-agent`) et sert de
 * préfixe pour lister/tuer les sessions d'onglets.
 */
export function terminalSessionName(workspaceId: string, termId: string): string {
  const safe = termId.replace(/[^a-zA-Z0-9_-]/g, '-') || 'main';
  return `${sessionName(workspaceId)}-t-${safe}`;
}

/**
 * Commande terminal : se rattache à (ou crée) une session tmux persistante nommée
 * `session`, de sorte que shell et process en cours survivent aux déconnexions.
 * Repli vers un shell normal (non-persistant) si tmux est absent de l'image.
 */
export function terminalCmd(session: string): string[] {
  return [
    '/bin/sh',
    '-lc',
    `if command -v tmux >/dev/null 2>&1; then exec tmux new-session -A -s ${session}; else exec bash 2>/dev/null || exec sh; fi`,
  ];
}

/**
 * Commande agent : session tmux persistante exécutant `$AGENT_CMD` à la création
 * (ignoré au rattachement → l'agent en cours continue) ; à défaut un shell. Repli si tmux absent.
 */
export function agentCmd(session: string): string[] {
  return [
    '/bin/sh',
    '-lc',
    `if command -v tmux >/dev/null 2>&1; then if [ -n "$AGENT_CMD" ]; then exec tmux new-session -A -s ${session} sh -lc "$AGENT_CMD"; else exec tmux new-session -A -s ${session}; fi; else if [ -n "$AGENT_CMD" ]; then exec sh -lc "$AGENT_CMD"; else exec bash 2>/dev/null || exec sh; fi; fi`,
  ];
}

/** Construit l'exec d'une session agent : injecte la clé du fournisseur + `AGENT_CMD` (jamais loggés). */
function agentSession(
  provider: KeyProvider,
  workspaceId: string,
): { cmd: string[]; env: string[] } {
  const env: string[] = [];
  const key = getDecryptedKey(provider);
  if (key) env.push(`${PROVIDER_ENV[provider]}=${key}`);
  // Commande de l'agent configurable ; passée en env pour éviter tout problème de quoting.
  const agentCommand = Bun.env.AGENT_CMD;
  if (agentCommand) env.push(`AGENT_CMD=${agentCommand}`);
  // Serveur MCP du workspace (mêmes capacités que l'utilisateur).
  env.push(`SAWA_MCP_URL=${getConfig().mcpSelfUrl}`);
  env.push(`SAWA_MCP_TOKEN=${getOrCreateToken(workspaceId)}`);
  return { cmd: agentCmd(`${sessionName(workspaceId)}-agent`), env };
}

function isProvider(p: string): p is KeyProvider {
  return p === 'anthropic' || p === 'openai' || p === 'cursor';
}

/**
 * Tente l'upgrade d'un WebSocket terminal **ou** agent. Vérifie la session
 * avant ouverture (PLAN §8). Renvoie null si le chemin n'est pas un WS géré.
 */
export function tryUpgradeWs(
  req: Request,
  server: { upgrade: (req: Request, opts: { data: TerminalData }) => boolean },
): Response | null | undefined {
  const url = new URL(req.url);
  const isTerminal = url.pathname.startsWith(TERMINAL_PREFIX);
  const isAgent = url.pathname.startsWith(AGENT_PREFIX);
  if (!isTerminal && !isAgent) return null;

  if (!validateSessionFromCookieHeader(req.headers.get('cookie'))) {
    return new Response('unauthorized', { status: 401 });
  }

  const prefix = isTerminal ? TERMINAL_PREFIX : AGENT_PREFIX;
  const workspaceId = decodeURIComponent(url.pathname.slice(prefix.length));
  if (!workspaceId) return new Response('bad_request', { status: 400 });

  let session: { cmd: string[]; env: string[] };
  if (isAgent) {
    const providerParam = url.searchParams.get('provider') ?? 'anthropic';
    if (!isProvider(providerParam)) return new Response('unknown_provider', { status: 400 });
    session = agentSession(providerParam, workspaceId);
  } else {
    // `?s=<termId>` cible la session d'un onglet précis ; sinon session par défaut (legacy).
    const termId = url.searchParams.get('s');
    const name = termId ? terminalSessionName(workspaceId, termId) : sessionName(workspaceId);
    session = { cmd: terminalCmd(name), env: [] };
  }

  const data: TerminalData = { kind: 'terminal', workspaceId, ...session, pendingInput: [] };
  const upgraded = server.upgrade(req, { data });
  return upgraded ? undefined : new Response('upgrade_failed', { status: 426 });
}

function send(ws: ServerWebSocket<TerminalData>, msg: object): void {
  ws.send(JSON.stringify(msg));
}

/** Handlers WebSocket Bun partagés terminal/agent. */
export const terminalWebSocket = {
  async open(ws: ServerWebSocket<TerminalData>) {
    const container = await getManagedContainer(ws.data.workspaceId);
    if (!container) {
      send(ws, { type: 'exit', code: -1 });
      ws.close(1011, 'workspace_not_found');
      return;
    }
    touchWorkspace(ws.data.workspaceId); // activité -> réarme l'idle-stop
    try {
      const exec = await container.exec({
        Cmd: ws.data.cmd,
        Env: ws.data.env,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        WorkingDir: '/workspace',
      });
      ws.data.exec = exec;
      const attachment = await attachExec(exec.id, {
        onData: (chunk) => send(ws, { type: 'output', data: chunk }),
        onClose: () => {
          send(ws, { type: 'exit', code: 0 });
          ws.close();
        },
      });
      ws.data.attachment = attachment;
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
