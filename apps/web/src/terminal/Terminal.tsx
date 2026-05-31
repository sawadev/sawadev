import { FitAddon } from '@xterm/addon-fit';
import { Terminal as Xterm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef } from 'react';
import { useUI } from '../context';

/** Construit l'URL WebSocket du terminal (proxifiée par Vite en dev). */
function wsUrl(workspaceId: string): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws/terminal/${encodeURIComponent(workspaceId)}`;
}

const DARK = { background: '#16161c', foreground: '#dcdcd4', cursor: '#dcdcd4' };
const LIGHT = { background: '#ffffff', foreground: '#1d1d22', cursor: '#1d1d22' };

/** Terminal interactif : docker exec TTY via WebSocket ↔ xterm.js. */
export function WorkspaceTerminal({ workspaceId }: { workspaceId: string }) {
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
    fit.fit();

    const ws = new WebSocket(wsUrl(workspaceId));

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
      fit.fit();
      sendResize();
    };

    const onData = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data }));
    });

    const onResize = () => {
      fit.fit();
      sendResize();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      onData.dispose();
      ws.close();
      term.dispose();
    };
  }, [workspaceId, theme]);

  return (
    <div
      ref={host}
      style={{ height: '100%', width: '100%', padding: 8, boxSizing: 'border-box' }}
    />
  );
}
