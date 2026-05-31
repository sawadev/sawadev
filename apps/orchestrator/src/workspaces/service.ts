import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { CreateWorkspaceRequest, Workspace, WorkspaceStatus } from '@sawadev/shared';
import { getConfig } from '../config';
import { getDb } from '../db';
import {
  MANAGED_LABEL,
  WORKSPACE_LABEL,
  containerName,
  ensureNetwork,
  getDocker,
  getManagedContainer,
} from './docker';

interface WorkspaceRow {
  id: string;
  name: string;
  image: string;
  container_id: string | null;
  volume: string;
  lifecycle: 'always-on' | 'idle-stop';
  created_at: number;
  last_opened_at: number | null;
}

/** Convertit un nom libre en slug stable et unique. */
function slugify(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'workspace';
  const db = getDb();
  let id = base;
  let n = 2;
  while (db.query('SELECT 1 FROM workspaces WHERE id = ?').get(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

function rowToWorkspace(row: WorkspaceRow, status: WorkspaceStatus): Workspace {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    lifecycle: row.lifecycle,
    status,
    createdAt: row.created_at,
    lastOpenedAt: row.last_opened_at,
  };
}

function getRow(id: string): WorkspaceRow | null {
  return (
    getDb().query<WorkspaceRow, [string]>('SELECT * FROM workspaces WHERE id = ?').get(id) ?? null
  );
}

/** Statut runtime à partir du conteneur (le cas échéant). */
async function statusOf(id: string): Promise<WorkspaceStatus> {
  const container = await getManagedContainer(id);
  if (!container) return 'missing';
  try {
    const info = await container.inspect();
    return info.State.Running ? 'running' : 'stopped';
  } catch {
    return 'unknown';
  }
}

/** Tire l'image si absente localement. */
async function ensureImage(image: string): Promise<void> {
  const docker = getDocker();
  try {
    await docker.getImage(image).inspect();
    return;
  } catch {
    // absente -> pull
  }
  await new Promise<void>((resolvePull, reject) => {
    docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (e: Error | null) => (e ? reject(e) : resolvePull()));
    });
  });
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const rows = getDb()
    .query<WorkspaceRow, []>('SELECT * FROM workspaces ORDER BY created_at DESC')
    .all();
  return Promise.all(rows.map(async (r) => rowToWorkspace(r, await statusOf(r.id))));
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const row = getRow(id);
  if (!row) return null;
  return rowToWorkspace(row, await statusOf(id));
}

export async function createWorkspace(req: CreateWorkspaceRequest): Promise<Workspace> {
  const { workspaceImage, workspacesDir, dockerNetwork } = getConfig();
  const image = req.image?.trim() || workspaceImage;
  const id = slugify(req.name);
  const hostDir = join(workspacesDir, id);
  mkdirSync(hostDir, { recursive: true });

  await ensureNetwork();
  await ensureImage(image);

  const container = await getDocker().createContainer({
    Image: image,
    name: containerName(id),
    Labels: { [MANAGED_LABEL]: 'true', [WORKSPACE_LABEL]: id },
    Cmd: ['tail', '-f', '/dev/null'],
    WorkingDir: '/workspace',
    Tty: true,
    HostConfig: {
      Binds: [`${hostDir}:/workspace`],
      NetworkMode: dockerNetwork,
      RestartPolicy: { Name: 'unless-stopped' },
    },
  });
  await container.start();

  const now = Date.now();
  getDb().run(
    `INSERT INTO workspaces (id, name, image, container_id, volume, lifecycle, created_at)
     VALUES (?, ?, ?, ?, ?, 'always-on', ?)`,
    [id, req.name, image, container.id, hostDir, now],
  );
  return rowToWorkspace(getRow(id) as WorkspaceRow, 'running');
}

export async function startWorkspace(id: string): Promise<Workspace | null> {
  const row = getRow(id);
  if (!row) return null;
  const container = await getManagedContainer(id);
  if (container) await container.start().catch(() => undefined);
  getDb().run('UPDATE workspaces SET last_opened_at = ? WHERE id = ?', [Date.now(), id]);
  return rowToWorkspace(row, await statusOf(id));
}

export async function stopWorkspace(id: string): Promise<Workspace | null> {
  const row = getRow(id);
  if (!row) return null;
  const container = await getManagedContainer(id);
  if (container) await container.stop().catch(() => undefined);
  return rowToWorkspace(row, await statusOf(id));
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const row = getRow(id);
  if (!row) return false;
  const container = await getManagedContainer(id);
  if (container) await container.remove({ force: true }).catch(() => undefined);
  getDb().run('DELETE FROM workspaces WHERE id = ?', [id]);
  // Supprime le volume bind (la suppression d'un workspace est explicite).
  rmSync(row.volume, { recursive: true, force: true });
  return true;
}
