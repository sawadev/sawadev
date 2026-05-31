import type { CreateWorkspaceRequest } from '@sawadev/shared';
import { Hono } from 'hono';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  startWorkspace,
  stopWorkspace,
} from './service';

/** Routes /api/workspaces. Montées derrière requireSession (cf. app.ts). */
export function workspaceRoutes(): Hono {
  const app = new Hono();

  app.get('/', async (c) => c.json(await listWorkspaces()));

  app.post('/', async (c) => {
    const body = (await c.req.json().catch(() => null)) as CreateWorkspaceRequest | null;
    const name = body?.name?.trim();
    if (!name) return c.json({ error: 'invalid_name' }, 400);
    try {
      const ws = await createWorkspace({ name, image: body?.image });
      return c.json(ws, 201);
    } catch (err) {
      return c.json({ error: 'create_failed', detail: String((err as Error).message) }, 500);
    }
  });

  app.get('/:id', async (c) => {
    const ws = await getWorkspace(c.req.param('id'));
    return ws ? c.json(ws) : c.json({ error: 'not_found' }, 404);
  });

  app.post('/:id/start', async (c) => {
    const ws = await startWorkspace(c.req.param('id'));
    return ws ? c.json(ws) : c.json({ error: 'not_found' }, 404);
  });

  app.post('/:id/stop', async (c) => {
    const ws = await stopWorkspace(c.req.param('id'));
    return ws ? c.json(ws) : c.json({ error: 'not_found' }, 404);
  });

  app.delete('/:id', async (c) => {
    const ok = await deleteWorkspace(c.req.param('id'));
    return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
  });

  return app;
}
