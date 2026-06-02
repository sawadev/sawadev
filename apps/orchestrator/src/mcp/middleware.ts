import type { MiddlewareHandler } from 'hono';
import { workspaceForToken } from './tokens';

export interface McpVars {
  mcpWorkspaceId: string;
}

/**
 * Auth des routes `/mcp-api` : `Authorization: Bearer <token>` → workspace du token.
 * Indépendant des sessions cookie ; chaque token est limité à un seul workspace.
 */
export const requireMcpToken: MiddlewareHandler<{ Variables: McpVars }> = async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  const workspaceId = workspaceForToken(token);
  if (!workspaceId) return c.json({ error: 'unauthorized' }, 401);
  c.set('mcpWorkspaceId', workspaceId);
  await next();
};
