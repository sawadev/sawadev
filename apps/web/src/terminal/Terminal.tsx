import { FitAddon } from '@xterm/addon-fit';
import { Terminal as Xterm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef } from 'react';
import { useUI } from '../context';

/** Construit l'URL WebSocket terminal ou agent (proxifiée par Vite en dev). */
function wsUrl(workspaceId: string, kind: 'terminal' | 'agent'): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws/${kind}/${encodeURIComponent(workspaceId)}`;
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
}: {
  workspaceId: string;
  kind?: 'terminal' | 'agent';
}) {
  const host = useRef<HTMLDivElement>(null);
  const { theme } = useUI();

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

    // Ajuste les lignes/colonnes, en gardant **une ligne de marge** : le calcul du
    // FitAddon peut légèrement déborder et rogner la dernière ligne en bas de l'écran.
    const fitTerm = () => {
      fit.fit();
      if (term.rows > 1) term.resize(term.cols, term.rows - 1);
    };
    fitTerm();

    const ws = new WebSocket(wsUrl(workspaceId, kind));

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

    const sendResize = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'output') term.write(msg.data);
      else if (msg.type === 'exit') term.write('\r\n\x1b[90m[session closed]\x1b[0m\r\n');
    };
    ws.onopen = () => {
      fitTerm();
      sendResize();
    };

    const onData = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data }));
    });

    const onResize = () => {
      fitTerm();
      sendResize();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      onData.dispose();
      ws.close();
      term.dispose();
    };
  }, [workspaceId, theme, kind]);

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
