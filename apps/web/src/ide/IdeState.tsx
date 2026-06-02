import type {
  AgentProvider,
  EditorViewState,
  TerminalTab,
  WorkspaceUiState,
} from '@sawadev/shared';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { putUiState } from '../api/files';
import { useUiState } from '../api/hooks';
import { type IdeApi, IdeCtx, type Selected } from './ide-context';

/** Slice d'état persisté (hors `dirty`, éphémère). */
interface Persisted {
  tabs: string[];
  active: string | null;
  preview: string | null;
  expanded: string[];
  selected: Selected | null;
  terminals: TerminalTab[];
  activeTerminal: string | null;
  agentProvider: AgentProvider | null;
}
const EMPTY: Persisted = {
  tabs: [],
  active: null,
  preview: null,
  expanded: [],
  selected: null,
  terminals: [],
  activeTerminal: null,
  agentProvider: null,
};

/** Id d'onglet terminal sûr (charset `[0-9a-f-]`, suffixe de session tmux). */
function newTermId(): string {
  return crypto.randomUUID().slice(0, 8);
}

const SAVE_DEBOUNCE_MS = 600;

/**
 * Détient le contexte IDE d'un workspace (onglets, explorateur, positions),
 * hydraté depuis le serveur et sauvegardé (débouncé) → persistant et synchronisé
 * entre appareils. Monter avec `key={workspaceId}` pour repartir propre par workspace.
 */
export function IdeStateProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const qc = useQueryClient();
  const { data } = useUiState(workspaceId);
  const [state, setState] = useState<Persisted>(EMPTY);
  const [dirty, setDirtyList] = useState<string[]>([]);
  const viewRef = useRef<Record<string, EditorViewState>>({});

  const stateRef = useRef(state);
  stateRef.current = state;
  const hydrated = useRef(false);
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Hydratation unique depuis le serveur.
  useEffect(() => {
    if (hydrated.current || !data) return;
    // Garantit ≥ 1 terminal au chargement (sinon onglet « Terminal 1 » par défaut).
    const terminals = data.terminals?.length
      ? data.terminals
      : [{ id: newTermId(), name: 'Terminal 1' }];
    setState({
      tabs: data.tabs ?? [],
      active: data.active ?? null,
      preview: data.preview ?? null,
      expanded: data.expanded ?? [],
      selected: data.selected ?? null,
      terminals,
      activeTerminal: data.activeTerminal ?? terminals[0]?.id ?? null,
      agentProvider: data.agentProvider ?? null,
    });
    viewRef.current = data.view ?? {};
    hydrated.current = true;
  }, [data]);

  const flush = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    const s = stateRef.current;
    const blob: WorkspaceUiState = {
      tabs: s.tabs,
      active: s.active,
      preview: s.preview,
      expanded: s.expanded,
      selected: s.selected,
      view: viewRef.current,
      terminals: s.terminals,
      activeTerminal: s.activeTerminal,
      agentProvider: s.agentProvider,
    };
    // Garde le cache react-query à jour → un retour de navigation réhydrate le dernier
    // état (sans GET). Reload / autre appareil refont un GET serveur (état persisté).
    qc.setQueryData(['ui-state', workspaceId], blob);
    putUiState(workspaceId, blob).catch(() => undefined);
  }, [workspaceId, qc]);

  const schedule = useCallback(() => {
    if (!hydrated.current) return; // n'écrase pas le serveur avant d'avoir chargé
    pending.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }, [flush]);

  // Sauvegarde sur changement du slice persisté (pas sur `dirty`).
  // biome-ignore lint/correctness/useExhaustiveDependencies: déclencheurs explicites
  useEffect(() => {
    schedule();
  }, [
    state.tabs,
    state.active,
    state.preview,
    state.expanded,
    state.selected,
    state.terminals,
    state.activeTerminal,
    state.agentProvider,
    schedule,
  ]);

  // Flush immédiat au démontage (navigation / changement de workspace).
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      flush();
    },
    [flush],
  );

  // ── Onglets ──
  const open = useCallback(
    (path: string) =>
      setState((s) => {
        if (s.tabs.includes(path)) return { ...s, active: path };
        const tabs = s.preview
          ? s.tabs.map((p) => (p === s.preview ? path : p))
          : [...s.tabs, path];
        return { ...s, tabs, active: path, preview: path };
      }),
    [],
  );
  const openPersistent = useCallback(
    (path: string) =>
      setState((s) => ({
        ...s,
        tabs: s.tabs.includes(path) ? s.tabs : [...s.tabs, path],
        active: path,
        preview: s.preview === path ? null : s.preview,
      })),
    [],
  );
  const promote = useCallback(
    (path: string) => setState((s) => (s.preview === path ? { ...s, preview: null } : s)),
    [],
  );
  const close = useCallback(
    (path: string) =>
      setState((s) => {
        const idx = s.tabs.indexOf(path);
        const tabs = s.tabs.filter((p) => p !== path);
        const active = s.active === path ? (tabs[idx] ?? tabs[idx - 1] ?? null) : s.active;
        return { ...s, tabs, active, preview: s.preview === path ? null : s.preview };
      }),
    [],
  );
  const setActive = useCallback((path: string) => setState((s) => ({ ...s, active: path })), []);

  const setDirty = useCallback((path: string, isDirty: boolean) => {
    setDirtyList((d) => {
      const has = d.includes(path);
      if (isDirty === has) return d;
      return isDirty ? [...d, path] : d.filter((p) => p !== path);
    });
    // Modifier un fichier en aperçu l'épingle.
    if (isDirty) setState((s) => (s.preview === path ? { ...s, preview: null } : s));
  }, []);

  // ── Explorateur ──
  const toggleExpand = useCallback(
    (dir: string) =>
      setState((s) => ({
        ...s,
        expanded: s.expanded.includes(dir)
          ? s.expanded.filter((d) => d !== dir)
          : [...s.expanded, dir],
      })),
    [],
  );
  const expand = useCallback(
    (dir: string) =>
      setState((s) => (s.expanded.includes(dir) ? s : { ...s, expanded: [...s.expanded, dir] })),
    [],
  );
  const setSelected = useCallback(
    (sel: Selected | null) => setState((s) => ({ ...s, selected: sel })),
    [],
  );

  // ── Terminaux ──
  const addTerminal = useCallback(
    (id?: string) =>
      setState((s) => {
        const tid = id ?? newTermId();
        if (s.terminals.some((t) => t.id === tid)) return { ...s, activeTerminal: tid };
        const name = `Terminal ${s.terminals.length + 1}`;
        return { ...s, terminals: [...s.terminals, { id: tid, name }], activeTerminal: tid };
      }),
    [],
  );
  const closeTerminal = useCallback(
    (id: string) =>
      setState((s) => {
        const idx = s.terminals.findIndex((t) => t.id === id);
        const terminals = s.terminals.filter((t) => t.id !== id);
        const activeTerminal =
          s.activeTerminal === id
            ? (terminals[idx]?.id ?? terminals[idx - 1]?.id ?? null)
            : s.activeTerminal;
        return { ...s, terminals, activeTerminal };
      }),
    [],
  );
  const renameTerminal = useCallback(
    (id: string, name: string) =>
      setState((s) => ({
        ...s,
        terminals: s.terminals.map((t) => (t.id === id ? { ...t, name } : t)),
      })),
    [],
  );
  const setActiveTerminal = useCallback(
    (id: string) => setState((s) => ({ ...s, activeTerminal: id })),
    [],
  );

  const setAgentProvider = useCallback(
    (p: AgentProvider) => setState((s) => ({ ...s, agentProvider: p })),
    [],
  );

  // ── Vues éditeur ──
  const getView = useCallback((path: string) => viewRef.current[path], []);
  const setView = useCallback(
    (path: string, vs: EditorViewState) => {
      viewRef.current = { ...viewRef.current, [path]: vs };
      schedule();
    },
    [schedule],
  );

  const api: IdeApi = {
    tabs: state.tabs,
    active: state.active,
    preview: state.preview,
    dirty,
    open,
    openPersistent,
    promote,
    close,
    setActive,
    setDirty,
    expanded: state.expanded,
    toggleExpand,
    expand,
    selected: state.selected,
    setSelected,
    getView,
    setView,
    terminals: state.terminals,
    activeTerminal: state.activeTerminal,
    addTerminal,
    closeTerminal,
    renameTerminal,
    setActiveTerminal,
    agentProvider: state.agentProvider,
    setAgentProvider,
  };

  return <IdeCtx.Provider value={api}>{children}</IdeCtx.Provider>;
}
