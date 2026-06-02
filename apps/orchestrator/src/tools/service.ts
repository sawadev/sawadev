import type { ToolConnection, ToolInstance, ToolStatus } from '@sawadev/shared';
import { getDb } from '../db';
import { findToolType } from './catalog';

/**
 * Lifecycle des services **mocké** : on persiste l'instance et son état, sans créer
 * de vrai conteneur. L'UI est ainsi pleinement interactive ; M6 remplacera ce module
 * par la création dockerode réelle (réseau par workspace + conteneur `role=tool`).
 */

interface ToolRow {
  id: string;
  type: string;
  name: string;
  status: ToolStatus;
  conn_json: string;
  created_at: number;
}

function toInstance(row: ToolRow): ToolInstance {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    status: row.status,
    connection: JSON.parse(row.conn_json) as ToolConnection,
    createdAt: row.created_at,
  };
}

export function listTools(workspaceId: string): ToolInstance[] {
  return getDb()
    .query<ToolRow, [string]>(
      'SELECT id, type, name, status, conn_json, created_at FROM tools WHERE workspace_id = ? ORDER BY created_at',
    )
    .all(workspaceId)
    .map(toInstance);
}

function getRow(workspaceId: string, id: string): ToolRow | null {
  return (
    getDb()
      .query<ToolRow, [string, string]>(
        'SELECT id, type, name, status, conn_json, created_at FROM tools WHERE id = ? AND workspace_id = ?',
      )
      .get(id, workspaceId) ?? null
  );
}

/** Génère des infos de connexion plausibles (host DNS du réseau workspace, creds). */
function mockConnection(workspaceId: string, type: string, name: string): ToolConnection {
  const tt = findToolType(type);
  const host = `sawadev-${workspaceId}-${name}`;
  const port = tt?.defaultPort ?? 0;
  const password = crypto.randomUUID().slice(0, 12);
  const base: ToolConnection = { host, port, username: 'sawadev', password, database: 'app' };
  if (type === 'redis')
    return { host, port, password, url: `redis://:${password}@${host}:${port}` };
  if (type === 'mongo')
    return { ...base, url: `mongodb://sawadev:${password}@${host}:${port}/app` };
  return { ...base, url: `postgres://sawadev:${password}@${host}:${port}/app` };
}

export function createTool(workspaceId: string, type: string): ToolInstance | null {
  if (!findToolType(type)) return null;
  // Nom unique court : type + suffixe si déjà présent.
  const existing = listTools(workspaceId).filter((t) => t.type === type).length;
  const name = existing === 0 ? type : `${type}-${existing + 1}`;
  const id = crypto.randomUUID();
  const conn = mockConnection(workspaceId, type, name);
  getDb().run(
    'INSERT INTO tools (id, workspace_id, type, name, status, conn_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, workspaceId, type, name, 'running', JSON.stringify(conn), Date.now()],
  );
  return toInstance(getRow(workspaceId, id) as ToolRow);
}

export function setToolStatus(
  workspaceId: string,
  id: string,
  status: ToolStatus,
): ToolInstance | null {
  if (!getRow(workspaceId, id)) return null;
  getDb().run('UPDATE tools SET status = ? WHERE id = ? AND workspace_id = ?', [
    status,
    id,
    workspaceId,
  ]);
  return toInstance(getRow(workspaceId, id) as ToolRow);
}

export function deleteTool(workspaceId: string, id: string): boolean {
  const res = getDb().run('DELETE FROM tools WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
  return res.changes > 0;
}

/** Logs mockés (M6 : `docker logs` du conteneur tool). */
export function toolLogs(workspaceId: string, id: string): string {
  const row = getRow(workspaceId, id);
  if (!row) return '';
  return [
    `[mock] ${row.type} (${row.name}) — ${row.status}`,
    `[mock] listening on ${JSON.parse(row.conn_json).host}:${JSON.parse(row.conn_json).port}`,
    '[mock] real container logs will appear here once M6 lands.',
  ].join('\n');
}
