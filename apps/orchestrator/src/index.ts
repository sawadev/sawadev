import type { ServerWebSocket } from 'bun';
import { createApp } from './app';
import { type FileWatchData, fileWatchSocket, tryUpgradeFilesWs } from './files/watch-ws';
import { type TerminalData, terminalWebSocket, tryUpgradeWs } from './terminal/ws';
import { reconcilePreviewRoutes } from './workspaces/ports';
import { reconcileWorkspaceBinds, startIdleSweeper } from './workspaces/service';

/** Toutes les connexions WebSocket gérées (terminal/agent + surveillance fichiers). */
type WsData = TerminalData | FileWatchData;

const isFiles = (d: WsData): d is FileWatchData => d.kind === 'files';

/** Aiguille les handlers WebSocket selon le type de connexion. */
const websocket = {
  open(ws: ServerWebSocket<WsData>) {
    if (isFiles(ws.data)) fileWatchSocket.open();
    else terminalWebSocket.open(ws as ServerWebSocket<TerminalData>);
  },
  message(ws: ServerWebSocket<WsData>, raw: string | Buffer) {
    if (isFiles(ws.data)) fileWatchSocket.message(ws as ServerWebSocket<FileWatchData>, raw);
    else terminalWebSocket.message(ws as ServerWebSocket<TerminalData>, raw);
  },
  close(ws: ServerWebSocket<WsData>) {
    if (isFiles(ws.data)) fileWatchSocket.close(ws as ServerWebSocket<FileWatchData>);
    else terminalWebSocket.close(ws as ServerWebSocket<TerminalData>);
  },
};

const PORT = Number(Bun.env.PORT ?? 8787);
const app = createApp();

// Arrêt auto des workspaces 'idle-stop' inactifs.
startIdleSweeper();

// Répare les binds /workspace mal configurés (DooD) — auto-soin au démarrage.
reconcileWorkspaceBinds().catch(() => undefined);

// Rejoue les routes de preview vers Caddy (perdues si Caddy a redémarré).
reconcilePreviewRoutes().catch(() => undefined);

const server = Bun.serve<WsData>({
  port: PORT,
  fetch(req, srv) {
    // Upgrades WebSocket (auth vérifiée avant ouverture) : terminal/agent, puis surveillance fichiers.
    const term = tryUpgradeWs(req, srv);
    if (term !== null) return term;
    const files = tryUpgradeFilesWs(req, srv);
    if (files !== null) return files;
    return app.fetch(req, srv);
  },
  websocket,
});

console.log(`orchestrator listening on http://localhost:${server.port}`);
