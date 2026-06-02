import type { TerminalSessionInfo } from '@sawadev/shared';
import { runInWorkspace } from './exec-run';
import { sessionName, terminalSessionName } from './ws';

/**
 * Extrait les sessions tmux d'**onglets** (préfixe `${ws}-t-`) de la sortie brute de
 * `tmux list-sessions`. Pur (testable sans Docker) : ignore la session agent et toute
 * autre session non préfixée.
 */
export function parseTerminalSessions(raw: string, workspaceId: string): TerminalSessionInfo[] {
  const prefix = `${sessionName(workspaceId)}-t-`;
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((n) => n.startsWith(prefix))
    .map((n) => ({ id: n.slice(prefix.length) }));
}

/** Liste les sessions terminal (onglets) vivantes du workspace. */
export async function listTerminalSessions(workspaceId: string): Promise<TerminalSessionInfo[]> {
  const raw = await runInWorkspace(workspaceId, [
    '/bin/sh',
    '-lc',
    "command -v tmux >/dev/null 2>&1 && tmux list-sessions -F '#{session_name}' 2>/dev/null || true",
  ]);
  return parseTerminalSessions(raw, workspaceId);
}

/** Tue la session tmux d'un onglet (le shell et ses process meurent). Idempotent. */
export async function killTerminalSession(workspaceId: string, termId: string): Promise<void> {
  await runInWorkspace(workspaceId, [
    '/bin/sh',
    '-lc',
    `tmux kill-session -t ${terminalSessionName(workspaceId, termId)} 2>/dev/null || true`,
  ]);
}
