/** Un fichier dans le statut git (codes porcelain X = index, Y = worktree). */
export interface GitFile {
  path: string;
  /** Code index (' ', 'M', 'A', 'D', 'R', '?'…). */
  x: string;
  /** Code worktree. */
  y: string;
}

/** Statut git d'un workspace. */
export interface GitStatus {
  repo: boolean;
  branch: string | null;
  ahead: number;
  behind: number;
  staged: GitFile[];
  unstaged: GitFile[];
  untracked: GitFile[];
}

export interface GitBranch {
  name: string;
  current: boolean;
}

export interface GitCommit {
  hash: string;
  subject: string;
  author: string;
  relative: string;
}

/** Résultat d'une action git (sortie brute + ok best-effort). */
export interface GitActionResult {
  ok: boolean;
  output: string;
}
