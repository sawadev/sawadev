import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CreateWorkspaceRequest,
  Workspace,
  WorkspaceStats,
  WorkspaceStatus,
} from '@sawadev/shared';
import { deletePreviewRoute } from '../caddy/client';
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

const ID_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const ID_ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Génère un id de workspace court et unique : 5 caractères alphanumériques
 * (1ʳᵉ lettre), sûr pour les noms de conteneur, réseaux et sous-domaines DNS.
 */
function generateWorkspaceId(): string {
  const db = getDb();
  for (let attempt = 0; attempt < 50; attempt++) {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    let id = '';
    for (let i = 0; i < bytes.length; i++) {
      const set = i === 0 ? ID_LETTERS : ID_ALNUM;
      id += set.charAt((bytes[i] ?? 0) % set.length);
    }
    if (!db.query('SELECT 1 FROM workspaces WHERE id = ?').get(id)) return id;
  }
  throw new Error('id_generation_failed');
}

/** Dossier du workspace vu par l'orchestrateur (mkdir / lecture / rm / colonne `volume`). */
function localDir(id: string): string {
  return join(getConfig().workspacesDir, id);
}

/** Source du bind `/workspace` : chemin **hôte** (résolu par le démon en DooD). */
function bindSource(id: string): string {
  return join(getConfig().hostWorkspacesDir, id);
}

/** Crée (et démarre pas) le conteneur d'un workspace avec le bon bind hôte. */
async function createWsContainer(id: string, image: string) {
  const { dockerNetwork } = getConfig();
  return getDocker().createContainer({
    Image: image,
    name: containerName(id),
    Labels: { [MANAGED_LABEL]: 'true', [WORKSPACE_LABEL]: id },
    Cmd: ['tail', '-f', '/dev/null'],
    WorkingDir: '/workspace',
    Tty: true,
    HostConfig: {
      Binds: [`${bindSource(id)}:/workspace`],
      NetworkMode: dockerNetwork,
      RestartPolicy: { Name: 'unless-stopped' },
      // Permet au conteneur de joindre l'orchestrateur sur l'hôte (dev / serveur MCP).
      ExtraHosts: ['host.docker.internal:host-gateway'],
    },
  });
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
export async function ensureImage(image: string): Promise<void> {
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
  const { workspaceImage } = getConfig();
  const image = req.image?.trim() || workspaceImage;
  const lifecycle = req.lifecycle === 'idle-stop' ? 'idle-stop' : 'always-on';
  const id = generateWorkspaceId();
  mkdirSync(localDir(id), { recursive: true });

  await ensureNetwork();
  await ensureImage(image);

  const container = await createWsContainer(id, image);
  await container.start();

  const now = Date.now();
  getDb().run(
    `INSERT INTO workspaces (id, name, image, container_id, volume, lifecycle, created_at, last_opened_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.name, image, container.id, localDir(id), lifecycle, now, now],
  );
  return rowToWorkspace(getRow(id) as WorkspaceRow, 'running');
}

/** Marque une activité sur le workspace (réarme le compteur d'inactivité). */
export function touchWorkspace(id: string): void {
  getDb().run('UPDATE workspaces SET last_opened_at = ? WHERE id = ?', [Date.now(), id]);
}

/** Décide quels workspaces 'idle-stop' arrêter (fonction pure, testable). */
export function idleCandidates(
  rows: { id: string; lifecycle: string; last_opened_at: number | null }[],
  now: number,
  timeoutMs: number,
): string[] {
  return rows
    .filter((r) => r.lifecycle === 'idle-stop')
    .filter((r) => now - (r.last_opened_at ?? 0) > timeoutMs)
    .map((r) => r.id);
}

/** Arrête les workspaces 'idle-stop' inactifs et en cours d'exécution. */
export async function sweepIdleWorkspaces(): Promise<string[]> {
  const { idleTimeoutSec } = getConfig();
  const rows = getDb()
    .query<{ id: string; lifecycle: string; last_opened_at: number | null }, []>(
      'SELECT id, lifecycle, last_opened_at FROM workspaces',
    )
    .all();
  const candidates = idleCandidates(rows, Date.now(), idleTimeoutSec * 1000);
  const stopped: string[] = [];
  for (const id of candidates) {
    if ((await statusOf(id)) === 'running') {
      await stopWorkspace(id);
      stopped.push(id);
    }
  }
  return stopped;
}

/** Démarre le balayage périodique d'inactivité. Renvoie une fonction d'arrêt. */
export function startIdleSweeper(intervalMs = 60_000): () => void {
  const timer = setInterval(() => {
    sweepIdleWorkspaces().catch(() => undefined);
  }, intervalMs);
  return () => clearInterval(timer);
}

/** Stats CPU/mémoire du conteneur (null si absent/arrêté). */
export async function getWorkspaceStats(id: string): Promise<WorkspaceStats | null> {
  const container = await getManagedContainer(id);
  if (!container) return null;
  try {
    // dockerode: stats one-shot (pas de flux).
    // biome-ignore lint/suspicious/noExplicitAny: forme dynamique des stats Docker
    const s = (await container.stats({ stream: false })) as any;
    const cpuDelta =
      (s.cpu_stats?.cpu_usage?.total_usage ?? 0) - (s.precpu_stats?.cpu_usage?.total_usage ?? 0);
    const sysDelta = (s.cpu_stats?.system_cpu_usage ?? 0) - (s.precpu_stats?.system_cpu_usage ?? 0);
    const cpus = s.cpu_stats?.online_cpus ?? s.cpu_stats?.cpu_usage?.percpu_usage?.length ?? 1;
    const cpuPct = sysDelta > 0 && cpuDelta > 0 ? (cpuDelta / sysDelta) * cpus * 100 : 0;
    const memBytes = (s.memory_stats?.usage ?? 0) - (s.memory_stats?.stats?.cache ?? 0);
    return {
      cpuPct: Math.round(cpuPct * 10) / 10,
      memBytes: Math.max(0, memBytes),
      memLimitBytes: s.memory_stats?.limit ?? 0,
    };
  } catch {
    return null;
  }
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

/** Renomme un workspace (nom d'affichage seulement ; l'id et les conteneurs sont inchangés). */
export async function renameWorkspace(id: string, name: string): Promise<Workspace | null> {
  const row = getRow(id);
  if (!row) return null;
  getDb().run('UPDATE workspaces SET name = ? WHERE id = ?', [name, id]);
  return rowToWorkspace({ ...row, name }, await statusOf(id));
}

/** Lit l'image déclarée dans un .devcontainer/devcontainer.json (JSONC toléré). */
export function readDevcontainerImage(volumeDir: string): string | null {
  const candidates = [
    join(volumeDir, '.devcontainer', 'devcontainer.json'),
    join(volumeDir, '.devcontainer.json'),
  ];
  const file = candidates.find((p) => existsSync(p));
  if (!file) return null;
  try {
    const raw = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '') // commentaires bloc
      .replace(/(^|[^:])\/\/.*$/gm, '$1'); // commentaires ligne
    const json = JSON.parse(raw) as { image?: string };
    return typeof json.image === 'string' && json.image ? json.image : null;
  } catch {
    return null;
  }
}

/**
 * Reconstruit le conteneur d'un workspace à partir de son devcontainer.json
 * (applique l'image déclarée). Le volume /workspace est préservé.
 */
export async function rebuildWorkspace(id: string): Promise<Workspace | null> {
  const row = getRow(id);
  if (!row) return null;
  const image = readDevcontainerImage(row.volume);
  if (!image) throw new Error('no_devcontainer_image');

  const old = await getManagedContainer(id);
  if (old) await old.remove({ force: true }).catch(() => undefined);
  await ensureImage(image);
  const container = await createWsContainer(id, image);
  await container.start();
  getDb().run('UPDATE workspaces SET image = ?, container_id = ? WHERE id = ?', [
    image,
    container.id,
    id,
  ]);
  return rowToWorkspace(getRow(id) as WorkspaceRow, 'running');
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const row = getRow(id);
  if (!row) return false;
  // Retire les routes Caddy de preview avant de tout supprimer.
  const ports = getDb()
    .query<{ subdomain: string }, [string]>('SELECT subdomain FROM ports WHERE workspace_id = ?')
    .all(id);
  for (const p of ports) await deletePreviewRoute(p.subdomain).catch(() => undefined);
  const container = await getManagedContainer(id);
  if (container) await container.remove({ force: true }).catch(() => undefined);
  getDb().run('DELETE FROM ports WHERE workspace_id = ?', [id]);
  getDb().run('DELETE FROM workspaces WHERE id = ?', [id]);
  // Supprime le volume bind (la suppression d'un workspace est explicite).
  rmSync(row.volume, { recursive: true, force: true });
  return true;
}

/**
 * Répare au démarrage les workspaces dont le bind `/workspace` ne pointe pas vers le bon
 * chemin hôte (déploiement DooD antérieur / changement de `HOST_WORKSPACES_DIR`) : recrée
 * le conteneur avec le bon bind. Les fichiers de l'explorateur (déjà au bon chemin) deviennent
 * visibles dans le terminal — explorateur et terminal convergent. Idempotent et tolérant.
 */
export async function reconcileWorkspaceBinds(): Promise<void> {
  const rows = getDb().query<WorkspaceRow, []>('SELECT * FROM workspaces').all();
  for (const row of rows) {
    try {
      const container = await getManagedContainer(row.id);
      if (!container) continue;
      const info = await container.inspect();
      const mount = (info.Mounts ?? []).find((m) => m.Destination === '/workspace');
      const expected = bindSource(row.id);
      if (mount?.Source === expected) continue; // déjà correct
      const running = info.State?.Running ?? false;
      await container.remove({ force: true }).catch(() => undefined);
      const fresh = await createWsContainer(row.id, row.image);
      if (running) await fresh.start();
      getDb().run('UPDATE workspaces SET container_id = ? WHERE id = ?', [fresh.id, row.id]);
      console.log(`reconciled workspace ${row.id}: /workspace bind → ${expected}`);
    } catch (err) {
      console.error(`reconcile workspace ${row.id} failed:`, (err as Error).message);
    }
  }
}
