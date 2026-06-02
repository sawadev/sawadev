import { Hono } from 'hono';
import { killTerminalSession, listTerminalSessions } from './sessions';

/** Routes /api/workspaces/:id/terminals. Montées derrière requireSession (cf. app.ts). */
export function terminalRoutes(): Hono {
  const app = new Hono();

  // Sessions terminal (onglets) vivantes du workspace.
  app.get('/:id/terminals', async (c) => c.json(await listTerminalSessions(c.req.param('id'))));

  // Tue la session d'un onglet (≠ fermer l'onglet, qui détache sans tuer).
  app.post('/:id/terminals/:term/kill', async (c) => {
    await killTerminalSession(c.req.param('id'), c.req.param('term'));
    return c.json({ ok: true });
  });

  return app;
}
