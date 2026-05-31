import type { Channel, SystemVersion } from '@sawadev/shared';
import { Hono } from 'hono';
import { requireSession } from './auth/middleware';
import { authRoutes } from './auth/routes';
import { getConfig } from './config';
import { fileRoutes } from './files/routes';
import { settingsRoutes } from './secrets/routes';
import { launchUpdater } from './updater';
import { workspaceRoutes } from './workspaces/routes';

/** Version courante de l'instance (injectée au build/MAJ ; statique au M0). */
export const CURRENT_VERSION = '0.1.0';

/** Construit l'application HTTP. Séparée de l'amorçage serveur pour les tests. */
export function createApp() {
  const app = new Hono();

  // Auth : routes publiques (state, login, setup, passkey/login) + protégées en interne.
  app.route('/api/auth', authRoutes());

  // Toute autre route /api/* exige une session valide (PLAN §8).
  app.use('/api/*', requireSession);

  app.route('/api/workspaces', workspaceRoutes());
  app.route('/api/workspaces', fileRoutes());
  app.route('/api/settings', settingsRoutes());

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

  return app;
}
