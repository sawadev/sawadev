import type { EditorViewState } from '@sawadev/shared';
import { createContext, useContext } from 'react';

export type NodeType = 'file' | 'dir';
export interface Selected {
  path: string;
  type: NodeType;
}

/** Contexte IDE d'un workspace : onglets, explorateur, positions de vue. */
export interface IdeApi {
  // Onglets (API héritée de useOpenFiles).
  tabs: string[];
  active: string | null;
  preview: string | null;
  dirty: string[];
  open: (path: string) => void;
  openPersistent: (path: string) => void;
  promote: (path: string) => void;
  close: (path: string) => void;
  setActive: (path: string) => void;
  setDirty: (path: string, isDirty: boolean) => void;
  // Explorateur.
  expanded: string[];
  toggleExpand: (dir: string) => void;
  expand: (dir: string) => void;
  selected: Selected | null;
  setSelected: (s: Selected | null) => void;
  // Position de vue par fichier.
  getView: (path: string) => EditorViewState | undefined;
  setView: (path: string, vs: EditorViewState) => void;
}

export const IdeCtx = createContext<IdeApi | null>(null);

export function useIde(): IdeApi {
  const c = useContext(IdeCtx);
  if (!c) throw new Error('IdeState provider missing');
  return c;
}
