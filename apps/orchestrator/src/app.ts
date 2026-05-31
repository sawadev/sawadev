import type { SystemVersion } from '@sawadev/shared';
import { Hono } from 'hono';

/** Version courante de l'instance (injectée au build/MAJ ; statique au M0). */
export const CURRENT_VERSION = '0.1.0';

/** Construit l'application HTTP. Séparée de l'amorçage serveur pour les tests. */
export function createApp() {
  const app = new Hono();

  app.get('/api/system/version', (c) => {
    // M0 : valeurs statiques. La détection réelle des MAJ (tags GHCR) arrive en M6.
    const body: SystemVersion = {
      current: CURRENT_VERSION,
      latest: CURRENT_VERSION,
      channel: 'stable',
    };
    return c.json(body);
  });

  return app;
}
