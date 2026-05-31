import { createApp } from './app';
import { type TerminalData, terminalWebSocket, tryUpgradeWs } from './terminal/ws';
import { startIdleSweeper } from './workspaces/service';

const PORT = Number(Bun.env.PORT ?? 8787);
const app = createApp();

// Arrêt auto des workspaces 'idle-stop' inactifs.
startIdleSweeper();

const server = Bun.serve<TerminalData>({
  port: PORT,
  fetch(req, srv) {
    // Upgrade WebSocket terminal/agent (auth vérifiée avant ouverture).
    const ws = tryUpgradeWs(req, srv);
    if (ws !== null) return ws;
    return app.fetch(req, srv);
  },
  websocket: terminalWebSocket,
});

console.log(`orchestrator listening on http://localhost:${server.port}`);
