import type { SetApiKeyRequest } from '@sawadev/shared';
import { Hono } from 'hono';
import { KNOWN_PROVIDERS, deleteKey, listKeyStatuses, setKey } from './keys';

function isKnownProvider(p: unknown): p is SetApiKeyRequest['provider'] {
  return typeof p === 'string' && (KNOWN_PROVIDERS as string[]).includes(p);
}

/** Routes /api/settings/keys (derrière requireSession). */
export function settingsRoutes(): Hono {
  const app = new Hono();

  app.get('/keys', (c) => c.json(listKeyStatuses()));

  app.put('/keys', async (c) => {
    const body = (await c.req.json().catch(() => null)) as SetApiKeyRequest | null;
    if (!isKnownProvider(body?.provider)) return c.json({ error: 'unknown_provider' }, 400);
    if (typeof body?.key !== 'string' || body.key.trim().length < 8) {
      return c.json({ error: 'invalid_key' }, 400);
    }
    setKey(body.provider, body.key.trim());
    return c.json({ ok: true });
  });

  app.delete('/keys/:provider', (c) => {
    const provider = c.req.param('provider');
    if (!isKnownProvider(provider)) return c.json({ error: 'unknown_provider' }, 400);
    return deleteKey(provider) ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
  });

  return app;
}
