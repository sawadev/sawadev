/** État d'une exécution de Quick Action. */
export type ActionRunStatus = 'active' | 'done' | 'failed';

/** Résumé d'un run (sans la sortie). */
export interface ActionRunSummary {
  id: string;
  status: ActionRunStatus;
  exitCode: number | null;
  startedAt: number;
  endedAt: number | null;
}

/** Run complet (avec la sortie capturée). */
export interface ActionRun extends ActionRunSummary {
  output: string;
}

/** Définition d'une commande configurable, + son dernier run. */
export interface QuickAction {
  id: string;
  label: string;
  command: string;
  createdAt: number;
  lastRun: ActionRunSummary | null;
}

/** Corps de POST/PUT /api/workspaces/:id/actions. */
export interface CreateActionRequest {
  label: string;
  command: string;
}
