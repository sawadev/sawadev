export type Theme = 'dark' | 'light';
export type Device = 'mobile' | 'tablet' | 'desktop';

/** A single syntax-highlighted segment: [tokenClass, text]. */
export type CodeSeg = [string, string];

/** A line in the code renderer (or a blank gap). */
export interface CodeLine {
  gap?: boolean;
  add?: boolean;
  del?: boolean;
  ind?: number;
  t?: CodeSeg[];
}

export interface Workspace {
  id: string;
  stack: string;
  icon: string;
  on: boolean;
  last: string;
  res: string;
  branch: string;
}

export interface Port {
  name: string;
  port: number;
  on: boolean;
}

export type Msg =
  | { role: 'user'; text: string }
  | { role: 'agent'; text: string; muted?: boolean }
  | {
      role: 'tool';
      kind: 'cmd' | 'edit';
      icon: string;
      title: string;
      meta: string;
      body: 'out' | 'diff';
      approve?: boolean;
    };

export interface TreeNode {
  d: number;
  ic: 'folder' | 'file';
  n: string;
  open?: boolean;
  cur?: boolean;
  badge?: string;
}
