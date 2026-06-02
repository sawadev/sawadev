import { FitAddon } from '@xterm/addon-fit';
import { Terminal as Xterm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef } from 'react';
import { useUI } from '../context';

/** Construit l'URL WebSocket terminal ou agent (proxifiée par Vite en dev). */
function wsUrl(workspaceId: string, kind: 'terminal' | 'agent', session?: string): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const base = `${proto}://${location.host}/ws/${kind}/${encodeURIComponent(workspaceId)}`;
  // `?s=<session>` cible la session tmux d'un onglet précis (terminal multi-onglets).
  return session ? `${base}?s=${encodeURIComponent(session)}` : base;
}

const DARK = {
  background: '#16161c',
  foreground: '#dcdcd4',
  cursor: '#dcdcd4',
  selectionBackground: 'rgba(255, 255, 255, 0.24)',
  selectionInactiveBackground: 'rgba(255, 255, 255, 0.14)',
  // Scrollbar discrète.
  scrollbarSliderBackground: 'rgba(255, 255, 255, 0.09)',
  scrollbarSliderHoverBackground: 'rgba(255, 255, 255, 0.16)',
  scrollbarSliderActiveBackground: 'rgba(255, 255, 255, 0.24)',
};
const LIGHT = {
  background: '#ffffff',
  foreground: '#1d1d22',
  cursor: '#1d1d22',
  selectionBackground: 'rgba(20, 20, 28, 0.18)',
  selectionInactiveBackground: 'rgba(20, 20, 28, 0.10)',
  // Scrollbar discrète.
  scrollbarSliderBackground: 'rgba(20, 20, 28, 0.11)',
  scrollbarSliderHoverBackground: 'rgba(20, 20, 28, 0.20)',
  scrollbarSliderActiveBackground: 'rgba(20, 20, 28, 0.28)',
};

/** Terminal interactif : docker exec TTY via WebSocket ↔ xterm.js. */
export function WorkspaceTerminal({
  workspaceId,
  kind = 'terminal',
  session,
  active = true,
  onActivity,
  onBell,
  clearNonce,
}: {
  workspaceId: string;
  kind?: 'terminal' | 'agent';
  /** Session tmux ciblée (onglet). Absent → session par défaut du workspace. */
  session?: string;
  /** Onglet visible : déclenche un re-fit (un onglet caché mesure 0). */
  active?: boolean;
  /** Appelé à chaque sortie (pour l'indicateur d'activité d'un onglet inactif). */
  onActivity?: () => void;
  /** Appelé sur la cloche du terminal (BEL). */
  onBell?: () => void;
  /** Incrémenter pour vider l'écran (Clear). */
  clearNonce?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const termRef = useRef<Xterm | null>(null);
  const refitRef = useRef<() => void>(() => {});
  const { theme } = useUI();

  // Callbacks tenus dans une ref : changent à chaque rendu sans relancer l'effet principal.
  const cbRef = useRef({ onActivity, onBell });
  cbRef.current = { onActivity, onBell };

  useEffect(() => {
    if (!host.current || !workspaceId) return;
    const term = new Xterm({
      cursorBlink: true,
      fontSize: 12.5,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      theme: theme === 'dark' ? DARK : LIGHT,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host.current);
    termRef.current = term;

    const ws = new WebSocket(wsUrl(workspaceId, kind, session));

    // Ajuste les lignes/colonnes, en gardant **une ligne de marge** : le calcul du
    // FitAddon peut légèrement déborder et rogner la dernière ligne en bas de l'écran.
    const fitTerm = () => {
      fit.fit();
      if (term.rows > 1) term.resize(term.cols, term.rows - 1);
    };
    const sendResize = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };
    const refit = () => {
      fitTerm();
      sendResize();
    };
    refitRef.current = refit;
    fitTerm();

    // Copier/coller : Cmd+C/V (mac) ou Ctrl+Shift+C/V (Linux/Windows).
    // Ctrl+C seul est laissé au PTY (SIGINT).
    term.attachCustomKeyEventHandler((e) => {
      if (e.type !== 'keydown') return true;
      const k = e.key.toLowerCase();
      const copy = (e.metaKey && !e.ctrlKey && k === 'c') || (e.ctrlKey && e.shiftKey && k === 'c');
      const paste =
        (e.metaKey && !e.ctrlKey && k === 'v') || (e.ctrlKey && e.shiftKey && k === 'v');
      if (copy) {
        const sel = term.getSelection();
        if (!sel) return true; // rien de sélectionné → ne rien intercepter
        navigator.clipboard?.writeText(sel);
        e.preventDefault();
        return false;
      }
      if (paste) {
        e.preventDefault();
        navigator.clipboard?.readText().then((txt) => {
          if (txt && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'input', data: txt }));
          }
        });
        return false;
      }
      return true;
    });

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'output') {
        term.write(msg.data);
        cbRef.current.onActivity?.();
      } else if (msg.type === 'exit') {
        term.write('\r\n\x1b[90m[session closed]\x1b[0m\r\n');
      }
    };
    ws.onopen = () => refit();

    const onData = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data }));
    });
    const onBellSub = term.onBell(() => cbRef.current.onBell?.());

    const onResize = () => refit();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      onData.dispose();
      onBellSub.dispose();
      ws.close();
      term.dispose();
      termRef.current = null;
      refitRef.current = () => {};
    };
  }, [workspaceId, theme, kind, session]);

  // Re-fit à l'activation : un onglet caché (display:none) mesure 0 → fit() est un no-op
  // tant qu'il est invisible ; on recalcule une fois affiché (frame suivante).
  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(() => refitRef.current());
    return () => cancelAnimationFrame(id);
  }, [active]);

  // Clear : vide l'écran + le scrollback xterm.
  useEffect(() => {
    if (clearNonce === undefined) return;
    termRef.current?.clear();
  }, [clearNonce]);

  return (
    <div
      ref={host}
      style={{
        height: '100%',
        width: '100%',
        padding: '8px 8px 12px',
        boxSizing: 'border-box',
        // Même fond que xterm → le padding apparaît comme une vraie marge du terminal.
        background: theme === 'dark' ? DARK.background : LIGHT.background,
      }}
    />
  );
}
