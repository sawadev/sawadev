import type { WorkspaceUiState } from '@sawadev/shared';
import { getDb } from '../db';

/** Taille max du blob de contexte (anti-abus). */
const MAX_STATE_BYTES = 64 * 1024;

export class UiStateTooLargeError extends Error {}

const EMPTY: WorkspaceUiState = {
  tabs: [],
  active: null,
  preview: null,
  expanded: [],
  selected: null,
  view: {},
};

/** Contexte IDE persistant d'un workspace (défaut vide si absent ou illisible). */
export function getUiState(workspaceId: string): WorkspaceUiState {
  const row = getDb()
    .query<{ state: string }, [string]>(
      'SELECT state FROM workspace_ui_state WHERE workspace_id = ?',
    )
    .get(workspaceId);
  if (!row) return EMPTY;
  try {
    return { ...EMPTY, ...(JSON.parse(row.state) as Partial<WorkspaceUiState>) };
  } catch {
    return EMPTY;
  }
}

/** Upsert du contexte IDE d'un workspace. */
export function setUiState(workspaceId: string, state: WorkspaceUiState): void {
  const json = JSON.stringify(state);
  if (json.length > MAX_STATE_BYTES) throw new UiStateTooLargeError();
  getDb().run(
    `INSERT INTO workspace_ui_state (workspace_id, state, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(workspace_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
    [workspaceId, json, Date.now()],
  );
}
