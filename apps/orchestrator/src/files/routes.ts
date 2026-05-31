import type { MoveRequest } from '@sawadev/shared';
import { type Context, Hono } from 'hono';
import {
  PathTraversalError,
  WorkspaceNotFoundError,
  deleteWorkspacePath,
  listDir,
  moveWorkspacePath,
  readWorkspaceFile,
  writeWorkspaceFile,
} from './service';

/** Convertit les erreurs du service fichiers en réponses HTTP. */
function fail(c: Context, err: unknown) {
  if (err instanceof WorkspaceNotFoundError) return c.json({ error: 'workspace_not_found' }, 404);
  if (err instanceof PathTraversalError) return c.json({ error: 'forbidden_path' }, 403);
  const msg = (err as Error).message;
  if (msg === 'ENOENT' || (err as NodeJS.ErrnoException).code === 'ENOENT') {
    return c.json({ error: 'not_found' }, 404);
  }
  return c.json({ error: 'file_error', detail: msg }, 400);
}

/** Routes fichiers. Montées sous /api/workspaces (derrière requireSession). */
export function fileRoutes(): Hono {
  const app = new Hono();

  app.get('/:id/files', async (c) => {
    try {
      return c.json(await listDir(c.req.param('id'), c.req.query('path') ?? '/'));
    } catch (err) {
      return fail(c, err);
    }
  });

  app.get('/:id/file', async (c) => {
    const path = c.req.query('path');
    if (!path) return c.json({ error: 'missing_path' }, 400);
    try {
      return c.json(await readWorkspaceFile(c.req.param('id'), path));
    } catch (err) {
      return fail(c, err);
    }
  });

  app.put('/:id/file', async (c) => {
    const path = c.req.query('path');
    if (!path) return c.json({ error: 'missing_path' }, 400);
    const body = (await c.req.json().catch(() => null)) as { content?: string } | null;
    if (typeof body?.content !== 'string') return c.json({ error: 'invalid_body' }, 400);
    try {
      await writeWorkspaceFile(c.req.param('id'), path, body.content);
      return c.json({ ok: true });
    } catch (err) {
      return fail(c, err);
    }
  });

  app.post('/:id/file/move', async (c) => {
    const body = (await c.req.json().catch(() => null)) as MoveRequest | null;
    if (!body?.from || !body?.to) return c.json({ error: 'invalid_body' }, 400);
    try {
      await moveWorkspacePath(c.req.param('id'), body.from, body.to);
      return c.json({ ok: true });
    } catch (err) {
      return fail(c, err);
    }
  });

  app.delete('/:id/file', async (c) => {
    const path = c.req.query('path');
    if (!path) return c.json({ error: 'missing_path' }, 400);
    try {
      await deleteWorkspacePath(c.req.param('id'), path);
      return c.json({ ok: true });
    } catch (err) {
      return fail(c, err);
    }
  });

  return app;
}
