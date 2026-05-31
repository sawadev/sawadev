import type { SystemVersion } from '@sawadev/shared';
import { Hono } from 'hono';
import { requireSession } from './auth/middleware';
import { authRoutes } from './auth/routes';

/** Version courante de l'instance (injectée au build/MAJ ; statique au M0). */
export const CURRENT_VERSION = '0.1.0';

/** Construit l'application HTTP. Séparée de l'amorçage serveur pour les tests. */
export function createApp() {
  const app = new Hono();

  // Auth : routes publiques (state, login, setup, passkey/login) + protégées en interne.
  app.route('/api/auth', authRoutes());

  // Toute autre route /api/* exige une session valide (PLAN §8).
  app.use('/api/*', requireSession);

  app.get('/api/system/version', (c) => {
    const body: SystemVersion = {
      current: CURRENT_VERSION,
      latest: CURRENT_VERSION,
      channel: 'stable',
    };
    return c.json(body);
  });

  return app;
}
