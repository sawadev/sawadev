/** Une entrée de l'arbre de fichiers (listing paresseux par dossier). */
export interface FileNode {
  /** Nom de l'entrée (sans le chemin). */
  name: string;
  /** Chemin relatif à la racine du workspace, normalisé (ex. 'src/index.ts'). */
  path: string;
  type: 'file' | 'dir';
}

/** Contenu d'un fichier texte. */
export interface FileContent {
  path: string;
  content: string;
}

/** Corps de POST /api/workspaces/:id/file/move. */
export interface MoveRequest {
  from: string;
  to: string;
}
