import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

function filesWsUrl(workspaceId: string): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws/files/${encodeURIComponent(workspaceId)}`;
}

/**
 * Surveille côté serveur les dossiers `dirs` (racine + dépliés) via WebSocket et
 * invalide le cache react-query du dossier concerné quand son contenu change
 * (création / suppression / renommage externe — ex. l'agent dans le terminal).
 */
export function useFileWatch(workspaceId: string, dirs: string[]): void {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const dirsRef = useRef(dirs);
  dirsRef.current = dirs;

  useEffect(() => {
    if (!workspaceId) return;
    const ws = new WebSocket(filesWsUrl(workspaceId));
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'watch', dirs: dirsRef.current }));
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.type === 'change') {
          qc.invalidateQueries({ queryKey: ['files', workspaceId, m.dir === '' ? '/' : m.dir] });
        }
      } catch {
        // ignore
      }
    };
    return () => {
      wsRef.current = null;
      ws.close();
    };
  }, [workspaceId, qc]);

  // Réabonne le serveur quand l'ensemble des dossiers visibles change.
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'watch', dirs }));
    }
  }, [dirs]);
}
