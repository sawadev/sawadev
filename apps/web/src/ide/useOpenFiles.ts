import { useState } from 'react';

interface OpenFilesState {
  tabs: string[];
  active: string | null;
}

/** Gère l'ensemble des fichiers ouverts (onglets) et l'onglet actif d'un IDE. */
export function useOpenFiles() {
  const [state, setState] = useState<OpenFilesState>({ tabs: [], active: null });

  const open = (path: string) =>
    setState((s) => ({
      tabs: s.tabs.includes(path) ? s.tabs : [...s.tabs, path],
      active: path,
    }));

  const close = (path: string) =>
    setState((s) => {
      const idx = s.tabs.indexOf(path);
      const tabs = s.tabs.filter((p) => p !== path);
      const active = s.active === path ? (tabs[idx] ?? tabs[idx - 1] ?? null) : s.active;
      return { tabs, active };
    });

  const setActive = (path: string) => setState((s) => ({ ...s, active: path }));

  return { tabs: state.tabs, active: state.active, open, close, setActive };
}
