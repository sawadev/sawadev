import type { CreatePortRequest, CreateWorkspaceRequest } from '@sawadev/shared';
import { Hono } from 'hono';
import { addPort, listPorts, removePort } from './ports';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaceStats,
  listWorkspaces,
  rebuildWorkspace,
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

  app.get('/:id/stats', async (c) => {
    const stats = await getWorkspaceStats(c.req.param('id'));
    return stats ? c.json(stats) : c.json({ error: 'unavailable' }, 404);
  });

  app.post('/:id/start', async (c) => {
    const ws = await startWorkspace(c.req.param('id'));
    return ws ? c.json(ws) : c.json({ error: 'not_found' }, 404);
  });

  app.post('/:id/stop', async (c) => {
    const ws = await stopWorkspace(c.req.param('id'));
    return ws ? c.json(ws) : c.json({ error: 'not_found' }, 404);
  });

  // Reconstruit le conteneur depuis .devcontainer/devcontainer.json.
  app.post('/:id/rebuild', async (c) => {
    try {
      const ws = await rebuildWorkspace(c.req.param('id'));
      return ws ? c.json(ws) : c.json({ error: 'not_found' }, 404);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'no_devcontainer_image') return c.json({ error: msg }, 400);
      return c.json({ error: 'rebuild_failed', detail: msg }, 500);
    }
  });

  app.delete('/:id', async (c) => {
    const ok = await deleteWorkspace(c.req.param('id'));
    return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
  });

  // ── Ports / preview ──
  app.get('/:id/ports', (c) => c.json(listPorts(c.req.param('id'))));

  app.post('/:id/ports', async (c) => {
    const body = (await c.req.json().catch(() => null)) as CreatePortRequest | null;
    if (!body || !Number.isInteger(body.port)) return c.json({ error: 'invalid_port' }, 400);
    try {
      return c.json(await addPort(c.req.param('id'), body.port), 201);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'workspace_not_found') return c.json({ error: msg }, 404);
      if (msg === 'invalid_port') return c.json({ error: msg }, 400);
      return c.json({ error: 'route_failed', detail: msg }, 502);
    }
  });

  app.delete('/:id/ports/:port', async (c) => {
    const port = Number(c.req.param('port'));
    const ok = await removePort(c.req.param('id'), port);
    return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
  });

  return app;
}
