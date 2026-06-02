import type { TerminalSessionInfo } from '@sawadev/shared';
import { apiGet, apiPost } from './client';

/** Sessions terminal (onglets) vivantes du workspace. */
export function listTerminals(workspaceId: string): Promise<TerminalSessionInfo[]> {
  return apiGet<TerminalSessionInfo[]>(`/api/workspaces/${workspaceId}/terminals`);
}

/** Tue la session tmux d'un onglet (≠ fermer l'onglet). */
export function killTerminal(workspaceId: string, termId: string): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>(
    `/api/workspaces/${workspaceId}/terminals/${encodeURIComponent(termId)}/kill`,
  );
}
