import { getDb } from '../db';

/** Token de capacité par workspace (256 bits base64url), comme les sessions. */
function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

/** Renvoie le token MCP du workspace (le crée si absent). Jamais loggé. */
export function getOrCreateToken(workspaceId: string): string {
  const db = getDb();
  const existing = db
    .query<{ token: string }, [string]>('SELECT token FROM mcp_tokens WHERE workspace_id = ?')
    .get(workspaceId);
  if (existing) return existing.token;
  const token = newToken();
  db.run(
    'INSERT INTO mcp_tokens (workspace_id, token, created_at) VALUES (?, ?, ?) ON CONFLICT(workspace_id) DO NOTHING',
    [workspaceId, token, Date.now()],
  );
  const row = db
    .query<{ token: string }, [string]>('SELECT token FROM mcp_tokens WHERE workspace_id = ?')
    .get(workspaceId);
  return row?.token ?? token;
}

/** Résout un token MCP en id de workspace (null si inconnu). */
export function workspaceForToken(token: string | undefined): string | null {
  if (!token) return null;
  const row = getDb()
    .query<{ workspace_id: string }, [string]>(
      'SELECT workspace_id FROM mcp_tokens WHERE token = ?',
    )
    .get(token);
  return row?.workspace_id ?? null;
}
