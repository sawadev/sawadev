import type { WorkspaceUiState } from '@sawadev/shared';
import { Hono } from 'hono';
import { UiStateTooLargeError, getUiState, setUiState } from './service';

/** Contexte IDE par workspace (onglets, explorateur, position éditeur). Sous /api/workspaces. */
export function uiStateRoutes(): Hono {
  const app = new Hono();

  app.get('/:id/ui-state', (c) => {
    return c.json(getUiState(c.req.param('id')));
  });

  app.put('/:id/ui-state', async (c) => {
    const body = (await c.req.json().catch(() => null)) as WorkspaceUiState | null;
    if (!body || !Array.isArray(body.tabs) || typeof body.view !== 'object') {
      return c.json({ error: 'invalid_body' }, 400);
    }
    try {
      setUiState(c.req.param('id'), body);
      return c.json({ ok: true });
    } catch (err) {
      if (err instanceof UiStateTooLargeError) return c.json({ error: 'state_too_large' }, 413);
      // FK (workspace inconnu) ou autre.
      return c.json({ error: 'ui_state_error', detail: String((err as Error).message) }, 400);
    }
  });

  return app;
}
