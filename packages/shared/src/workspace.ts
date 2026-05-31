/** Cycle de vie d'un workspace (SPEC §3 bis). */
export type WorkspaceLifecycle = 'always-on' | 'idle-stop';

/** Statut runtime du conteneur sous-jacent. */
export type WorkspaceStatus = 'running' | 'stopped' | 'missing' | 'unknown';

/** Un workspace (projet) tel qu'exposé par l'API. */
export interface Workspace {
  id: string;
  name: string;
  image: string;
  lifecycle: WorkspaceLifecycle;
  status: WorkspaceStatus;
  createdAt: number;
  lastOpenedAt: number | null;
}

/** Corps de POST /api/workspaces. */
export interface CreateWorkspaceRequest {
  name: string;
  /** Image Docker ; défaut côté serveur si absent. */
  image?: string;
}
