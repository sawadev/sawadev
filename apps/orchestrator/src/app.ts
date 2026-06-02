import type { Channel, SystemVersion } from '@sawadev/shared';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { actionsRoutes } from './actions/routes';
import { agentRoutes } from './agent/routes';
import { requireSession } from './auth/middleware';
import { authRoutes } from './auth/routes';
import { getConfig } from './config';
import { fileRoutes } from './files/routes';
import { gitRoutes } from './git/routes';
import { mcpApiRoutes } from './mcp/routes';
import { settingsRoutes } from './secrets/routes';
import { getDockerOverview } from './system/docker';
import { terminalRoutes } from './terminal/routes';
import { catalogRoutes, toolsRoutes } from './tools/routes';
import { uiStateRoutes } from './uistate/routes';
import { launchUpdater } from './updater';
import { workspaceRoutes } from './workspaces/routes';

/** Version courante de l'instance (injectée au build/MAJ ; statique au M0). */
export const CURRENT_VERSION = '0.1.0';

/** Construit l'application HTTP. Séparée de l'amorçage serveur pour les tests. */
export function createApp() {
  const app = new Hono();

  // Sonde de santé publique (health-check de MAJ / load balancer).
  app.get('/api/health', (c) => c.json({ ok: true, version: CURRENT_VERSION }));

  // Auth : routes publiques (state, login, setup, passkey/login) + protégées en interne.
  app.route('/api/auth', authRoutes());

  // API consommée par le proxy MCP des workspaces (auth = token par workspace, hors session cookie).
  app.route('/mcp-api', mcpApiRoutes());

  // Toute autre route /api/* exige une session valide (PLAN §8).
  app.use('/api/*', requireSession);

  app.route('/api/workspaces', workspaceRoutes());
  app.route('/api/workspaces', fileRoutes());
  app.route('/api/workspaces', uiStateRoutes());
  app.route('/api/workspaces', terminalRoutes());
  app.route('/api/workspaces', actionsRoutes());
  app.route('/api/workspaces', gitRoutes());
  app.route('/api/workspaces', toolsRoutes());
  app.route('/api/workspaces', agentRoutes());
  app.route('/api/catalog', catalogRoutes());
  app.route('/api/settings', settingsRoutes());

  app.get('/api/system/docker', async (c) => c.json(await getDockerOverview()));

  app.get('/api/system/version', (c) => {
    const channel = (Bun.env.CHANNEL as Channel) || 'stable';
    const body: SystemVersion = {
      current: CURRENT_VERSION,
      latest: Bun.env.LATEST_VERSION || CURRENT_VERSION,
      channel,
    };
    return c.json(body);
  });

  app.post('/api/system/update', async (c) => {
    // Dev : pas de compose/updater configuré -> on refuse proprement.
    if (getConfig().domain === 'localhost' && !Bun.env.COMPOSE_DIR) {
      return c.json({ error: 'update_unavailable_in_dev' }, 409);
    }
    try {
      const id = await launchUpdater();
      return c.json({ started: true, updaterId: id });
    } catch (err) {
      return c.json({ error: 'update_failed', detail: String((err as Error).message) }, 500);
    }
  });

  // En prod, l'orchestrateur sert le build statique du front (SPA).
  const { webDist } = getConfig();
  if (webDist) {
    app.use('/*', serveStatic({ root: webDist }));
    app.notFound(async (c) => {
      const path = new URL(c.req.url).pathname;
      if (path.startsWith('/api') || path.startsWith('/ws')) {
        return c.json({ error: 'not_found' }, 404);
      }
      // Repli SPA : toute autre route renvoie index.html.
      return c.html(await Bun.file(`${webDist}/index.html`).text());
    });
  }

  return app;
}
