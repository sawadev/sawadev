import type { KeyProvider } from '@sawadev/shared';
import type { ServerWebSocket } from 'bun';
import type { Exec } from 'dockerode';
import { validateSessionFromCookieHeader } from '../auth/sessions';
import { PROVIDER_ENV, getDecryptedKey } from '../secrets/keys';
import { getManagedContainer } from '../workspaces/docker';
import { touchWorkspace } from '../workspaces/service';
import { type ExecAttachment, attachExec } from './exec-attach';

/** Données attachées à chaque connexion WebSocket (terminal ou agent). */
export interface TerminalData {
  workspaceId: string;
  cmd: string[];
  /** Variables d'env injectées à l'exec (ex. clé API agent). Jamais loggées. */
  env: string[];
  exec?: Exec;
  attachment?: ExecAttachment;
  pendingInput: string[];
}

/** Shell interactif : bash si présent, sinon sh. */
const SHELL = [
  '/bin/sh',
  '-lc',
  'if command -v bash >/dev/null 2>&1; then exec bash; else exec sh; fi',
];

type ClientMsg = { type: 'input'; data: string } | { type: 'resize'; cols: number; rows: number };

const TERMINAL_PREFIX = '/ws/terminal/';
const AGENT_PREFIX = '/ws/agent/';

/** Construit l'exec d'une session agent : injecte la clé du fournisseur choisi. */
function agentSession(provider: KeyProvider): { cmd: string[]; env: string[] } {
  const env: string[] = [];
  const key = getDecryptedKey(provider);
  if (key) env.push(`${PROVIDER_ENV[provider]}=${key}`);
  // Commande de l'agent configurable ; à défaut, un shell (l'agent peut être lancé à la main).
  const agentCmd = Bun.env.AGENT_CMD;
  const cmd = agentCmd ? ['/bin/sh', '-lc', agentCmd] : SHELL;
  return { cmd, env };
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
    session = agentSession(providerParam);
  } else {
    session = { cmd: SHELL, env: [] };
  }

  const data: TerminalData = { workspaceId, ...session, pendingInput: [] };
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
