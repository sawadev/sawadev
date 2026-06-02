import type { Context } from 'hono';
import { Hono } from 'hono';
import { createAction, getRun, listActions, runAction } from '../actions/service';
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
} from '../git/service';
import { TOOL_CATALOG } from '../tools/catalog';
import { createTool, listTools, setToolStatus, toolLogs } from '../tools/service';
import { addPort, listPorts } from '../workspaces/ports';
import { getWorkspace } from '../workspaces/service';
import { type McpVars, requireMcpToken } from './middleware';

/**
 * API à token consommée par le proxy MCP des workspaces. **Toutes les routes sont
 * scoppées au workspace du token** (jamais d'id dans l'URL) et **non destructives**
 * (aucun delete/stop/remove). Réutilise la couche service existante.
 */
export function mcpApiRoutes(): Hono<{ Variables: McpVars }> {
  const app = new Hono<{ Variables: McpVars }>();
  app.use('*', requireMcpToken);
  const wid = (c: Context<{ Variables: McpVars }>) => c.get('mcpWorkspaceId');

  // ── Workspace ──
  app.get('/workspace', async (c) => {
    const ws = await getWorkspace(wid(c));
    return ws
      ? c.json({ id: ws.id, name: ws.name, status: ws.status })
      : c.json({ error: 'not_found' }, 404);
  });

  // ── Quick Actions ──
  app.get('/actions', (c) => c.json(listActions(wid(c))));
  app.post('/actions', async (c) => {
    const b = (await c.req.json().catch(() => null)) as { label?: string; command?: string } | null;
    const label = b?.label?.trim();
    const command = b?.command?.trim();
    if (!label || !command) return c.json({ error: 'invalid_action' }, 400);
    return c.json(createAction(wid(c), label, command), 201);
  });
  app.post('/actions/:id/run', async (c) => {
    const res = await runAction(wid(c), c.req.param('id'));
    return res ? c.json(res, 201) : c.json({ error: 'not_found' }, 404);
  });
  app.get('/runs/:runId', (c) => {
    const r = getRun(c.req.param('runId'));
    return r ? c.json(r) : c.json({ error: 'not_found' }, 404);
  });

  // ── Services (tools) ──
  app.get('/catalog', (c) => c.json(TOOL_CATALOG));
  app.get('/tools', (c) => c.json(listTools(wid(c))));
  app.post('/tools', async (c) => {
    const b = (await c.req.json().catch(() => null)) as { type?: string } | null;
    if (!b?.type) return c.json({ error: 'invalid_type' }, 400);
    const t = createTool(wid(c), b.type);
    return t ? c.json(t, 201) : c.json({ error: 'unknown_type' }, 400);
  });
  app.post('/tools/:id/start', (c) => {
    const t = setToolStatus(wid(c), c.req.param('id'), 'running');
    return t ? c.json(t) : c.json({ error: 'not_found' }, 404);
  });
  app.get('/tools/:id/logs', (c) => c.json({ logs: toolLogs(wid(c), c.req.param('id')) }));

  // ── Ports / preview ──
  app.get('/ports', (c) => c.json(listPorts(wid(c))));
  app.post('/ports', async (c) => {
    const b = (await c.req.json().catch(() => null)) as { port?: number } | null;
    if (!b || !Number.isInteger(b.port)) return c.json({ error: 'invalid_port' }, 400);
    try {
      return c.json(await addPort(wid(c), b.port as number), 201);
    } catch (err) {
      return c.json({ error: 'route_failed', detail: String((err as Error).message) }, 502);
    }
  });

  // ── Git ──
  app.get('/git/status', async (c) => c.json(await getStatus(wid(c))));
  app.get('/git/branches', async (c) => c.json(await getBranches(wid(c))));
  app.get('/git/log', async (c) => c.json(await getLog(wid(c), Number(c.req.query('n')) || 30)));
  app.get('/git/diff', async (c) =>
    c.json({ diff: await getDiff(wid(c), c.req.query('path'), c.req.query('staged') === '1') }),
  );
  app.post('/git/stage', async (c) => {
    const b = (await c.req.json().catch(() => ({}))) as { path?: string };
    return c.json(await stage(wid(c), b.path));
  });
  app.post('/git/unstage', async (c) => {
    const b = (await c.req.json().catch(() => ({}))) as { path?: string };
    return c.json(await unstage(wid(c), b.path));
  });
  app.post('/git/commit', async (c) => {
    const b = (await c.req.json().catch(() => ({}))) as { message?: string };
    const m = b.message?.trim();
    if (!m) return c.json({ error: 'empty_message' }, 400);
    return c.json(await commit(wid(c), m));
  });
  app.post('/git/checkout', async (c) => {
    const b = (await c.req.json().catch(() => ({}))) as { branch?: string };
    if (!b.branch) return c.json({ error: 'no_branch' }, 400);
    return c.json(await checkout(wid(c), b.branch));
  });
  app.post('/git/init', async (c) => c.json(await init(wid(c))));

  return app;
}
