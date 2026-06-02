/** Onglet terminal persisté dans l'état IDE (synchronisé entre appareils). */
export interface TerminalTab {
  id: string;
  name: string;
}

/** Session tmux **vivante** côté serveur (GET /api/workspaces/:id/terminals). */
export interface TerminalSessionInfo {
  /** Identifiant d'onglet (suffixe de la session tmux `${ws}-t-<id>`). */
  id: string;
}
