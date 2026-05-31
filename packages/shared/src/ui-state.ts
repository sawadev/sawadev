/** Position de vue d'un fichier dans l'éditeur (scroll + curseur/sélection). */
export interface EditorViewState {
  /** scrollTop en px du conteneur de l'éditeur. */
  scroll: number;
  /** Ancre de la sélection (offset dans le document). */
  anchor: number;
  /** Tête de la sélection (offset dans le document). */
  head: number;
}

/** Contexte IDE persistant d'un workspace (synchronisé entre appareils, GET/PUT). */
export interface WorkspaceUiState {
  /** Onglets ouverts (chemins relatifs). */
  tabs: string[];
  /** Onglet actif. */
  active: string | null;
  /** Onglet temporaire (aperçu). */
  preview: string | null;
  /** Dossiers dépliés dans l'explorateur. */
  expanded: string[];
  /** Élément sélectionné (focus) dans l'explorateur. */
  selected: { path: string; type: 'file' | 'dir' } | null;
  /** Position de vue par fichier. */
  view: Record<string, EditorViewState>;
}
