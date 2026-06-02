import type { CreateToolRequest } from '@sawadev/shared';
import { Hono } from 'hono';
import { TOOL_CATALOG } from './catalog';
import { createTool, deleteTool, listTools, setToolStatus, toolLogs } from './service';

/** Catalogue global des services managés. */
export function catalogRoutes(): Hono {
  const app = new Hono();
  app.get('/tools', (c) => c.json(TOOL_CATALOG));
  return app;
}

/** Routes /api/workspaces/:id/tools. Montées derrière requireSession (cf. app.ts). */
export function toolsRoutes(): Hono {
  const app = new Hono();

  app.get('/:id/tools', (c) => c.json(listTools(c.req.param('id'))));

  app.post('/:id/tools', async (c) => {
    const body = (await c.req.json().catch(() => null)) as CreateToolRequest | null;
    if (!body?.type) return c.json({ error: 'invalid_type' }, 400);
    const tool = createTool(c.req.param('id'), body.type);
    return tool ? c.json(tool, 201) : c.json({ error: 'unknown_type' }, 400);
  });

  app.post('/:id/tools/:tool/start', (c) => {
    const t = setToolStatus(c.req.param('id'), c.req.param('tool'), 'running');
    return t ? c.json(t) : c.json({ error: 'not_found' }, 404);
  });

  app.post('/:id/tools/:tool/stop', (c) => {
    const t = setToolStatus(c.req.param('id'), c.req.param('tool'), 'stopped');
    return t ? c.json(t) : c.json({ error: 'not_found' }, 404);
  });

  app.delete('/:id/tools/:tool', (c) => {
    const ok = deleteTool(c.req.param('id'), c.req.param('tool'));
    return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
  });

  app.get('/:id/tools/:tool/logs', (c) =>
    c.json({ logs: toolLogs(c.req.param('id'), c.req.param('tool')) }),
  );

  return app;
}
