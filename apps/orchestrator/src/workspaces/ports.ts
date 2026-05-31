import type { Port } from '@sawadev/shared';
import { buildPreviewRoute, deletePreviewRoute, putPreviewRoute } from '../caddy/client';
import { getConfig } from '../config';
import { getDb } from '../db';
import { containerName } from './docker';

interface PortRow {
  workspace_id: string;
  port: number;
  subdomain: string;
}

/** Sous-domaine par défaut : <workspace>-<port> (PLAN §G, configurable plus tard). */
function subdomainFor(workspaceId: string, port: number): string {
  return `${workspaceId}-${port}`;
}

function toPort(row: PortRow): Port {
  const { domain, previewScheme } = getConfig();
  return {
    workspaceId: row.workspace_id,
    port: row.port,
    subdomain: row.subdomain,
    url: `${previewScheme}://${row.subdomain}.${domain}`,
  };
}

function workspaceExists(id: string): boolean {
  return getDb().query('SELECT 1 FROM workspaces WHERE id = ?').get(id) !== null;
}

export function listPorts(workspaceId: string): Port[] {
  return getDb()
    .query<PortRow, [string]>('SELECT * FROM ports WHERE workspace_id = ? ORDER BY port')
    .all(workspaceId)
    .map(toPort);
}

/** Expose un port : enregistre + crée la route Caddy vers le conteneur. */
export async function addPort(workspaceId: string, port: number): Promise<Port> {
  if (!workspaceExists(workspaceId)) throw new Error('workspace_not_found');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('invalid_port');

  const { domain } = getConfig();
  const subdomain = subdomainFor(workspaceId, port);
  const route = buildPreviewRoute(
    subdomain,
    `${subdomain}.${domain}`,
    `${containerName(workspaceId)}:${port}`,
  );
  await putPreviewRoute(route);

  getDb().run(
    `INSERT INTO ports (workspace_id, port, subdomain) VALUES (?, ?, ?)
     ON CONFLICT(workspace_id, port) DO UPDATE SET subdomain = excluded.subdomain`,
    [workspaceId, port, subdomain],
  );
  const row = getDb()
    .query<PortRow, [string, number]>('SELECT * FROM ports WHERE workspace_id = ? AND port = ?')
    .get(workspaceId, port);
  return toPort(row as PortRow);
}

/** Retire un port : supprime la route Caddy + l'enregistrement. */
export async function removePort(workspaceId: string, port: number): Promise<boolean> {
  const row = getDb()
    .query<PortRow, [string, number]>('SELECT * FROM ports WHERE workspace_id = ? AND port = ?')
    .get(workspaceId, port);
  if (!row) return false;
  await deletePreviewRoute(row.subdomain);
  getDb().run('DELETE FROM ports WHERE workspace_id = ? AND port = ?', [workspaceId, port]);
  return true;
}
