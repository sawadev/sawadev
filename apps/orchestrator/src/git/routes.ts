import { Hono } from 'hono';
import {
  checkout,
  commit,
  getBranches,
  getDiff,
  getLog,
  getStatus,
  init,
  stage,
  unstage,
} from './service';

/** Routes /api/workspaces/:id/git. Montées derrière requireSession (cf. app.ts). */
export function gitRoutes(): Hono {
  const app = new Hono();

  app.get('/:id/git/status', async (c) => c.json(await getStatus(c.req.param('id'))));
  app.get('/:id/git/branches', async (c) => c.json(await getBranches(c.req.param('id'))));
  app.get('/:id/git/log', async (c) => {
    const n = Number(c.req.query('n')) || 30;
    return c.json(await getLog(c.req.param('id'), n));
  });
  app.get('/:id/git/diff', async (c) => {
    const out = await getDiff(
      c.req.param('id'),
      c.req.query('path'),
      c.req.query('staged') === '1',
    );
    return c.json({ diff: out });
  });

  app.post('/:id/git/stage', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { path?: string };
    return c.json(await stage(c.req.param('id'), body.path));
  });
  app.post('/:id/git/unstage', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { path?: string };
    return c.json(await unstage(c.req.param('id'), body.path));
  });
  app.post('/:id/git/commit', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { message?: string };
    const message = body.message?.trim();
    if (!message) return c.json({ error: 'empty_message' }, 400);
    return c.json(await commit(c.req.param('id'), message));
  });
  app.post('/:id/git/checkout', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { branch?: string };
    if (!body.branch) return c.json({ error: 'no_branch' }, 400);
    return c.json(await checkout(c.req.param('id'), body.branch));
  });
  app.post('/:id/git/init', async (c) => c.json(await init(c.req.param('id'))));

  return app;
}
