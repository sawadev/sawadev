import type { CreateActionRequest } from '@sawadev/shared';
import { Hono } from 'hono';
import {
  createAction,
  deleteAction,
  getRun,
  listActions,
  runAction,
  updateAction,
} from './service';

/** Routes /api/workspaces/:id/actions. Montées derrière requireSession (cf. app.ts). */
export function actionsRoutes(): Hono {
  const app = new Hono();

  app.get('/:id/actions', (c) => c.json(listActions(c.req.param('id'))));

  app.post('/:id/actions', async (c) => {
    const body = (await c.req.json().catch(() => null)) as CreateActionRequest | null;
    const label = body?.label?.trim();
    const command = body?.command?.trim();
    if (!label || !command) return c.json({ error: 'invalid_action' }, 400);
    return c.json(createAction(c.req.param('id'), label, command), 201);
  });

  // Le run d'un id de run précis (poll) — déclaré avant /:actionId pour la lisibilité.
  app.get('/:id/actions/runs/:runId', (c) => {
    const run = getRun(c.req.param('runId'));
    return run ? c.json(run) : c.json({ error: 'not_found' }, 404);
  });

  app.put('/:id/actions/:actionId', async (c) => {
    const body = (await c.req.json().catch(() => null)) as CreateActionRequest | null;
    const label = body?.label?.trim();
    const command = body?.command?.trim();
    if (!label || !command) return c.json({ error: 'invalid_action' }, 400);
    const a = updateAction(c.req.param('id'), c.req.param('actionId'), label, command);
    return a ? c.json(a) : c.json({ error: 'not_found' }, 404);
  });

  app.delete('/:id/actions/:actionId', (c) => {
    const ok = deleteAction(c.req.param('id'), c.req.param('actionId'));
    return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
  });

  app.post('/:id/actions/:actionId/run', async (c) => {
    const res = await runAction(c.req.param('id'), c.req.param('actionId'));
    return res ? c.json(res, 201) : c.json({ error: 'not_found' }, 404);
  });

  return app;
}
