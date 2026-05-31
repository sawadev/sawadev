import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { FileContent, FileNode } from '@sawadev/shared';
import { getConfig } from '../config';
import { getDb } from '../db';

/** Erreur de confinement : chemin hors de la racine du workspace. */
export class PathTraversalError extends Error {}
/** Workspace inconnu. */
export class WorkspaceNotFoundError extends Error {}

/** Racine hôte du volume d'un workspace existant. */
function workspaceRoot(id: string): string {
  const row = getDb()
    .query<{ volume: string }, [string]>('SELECT volume FROM workspaces WHERE id = ?')
    .get(id);
  if (!row) throw new WorkspaceNotFoundError(id);
  return resolve(row.volume);
}

/**
 * Résout un chemin relatif **strictement** sous la racine du workspace.
 * Un `/` initial désigne la racine du workspace (et non celle de l'hôte).
 * Toute tentative de sortie via `..` est rejetée.
 */
function safeResolve(root: string, relPath: string): string {
  const fromRoot = relPath.replace(/^[/\\]+/, '');
  const abs = resolve(root, fromRoot);
  const rel = relative(root, abs);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new PathTraversalError(relPath);
  }
  return abs;
}

/** Chemin relatif normalisé (toujours en POSIX, sans slash initial). */
function toRel(root: string, abs: string): string {
  return relative(root, abs).split(sep).join('/');
}

export async function listDir(id: string, relPath: string): Promise<FileNode[]> {
  const root = workspaceRoot(id);
  const abs = safeResolve(root, relPath || '/');
  const entries = await readdir(abs, { withFileTypes: true });
  return entries
    .map((e) => ({
      name: e.name,
      path: toRel(root, join(abs, e.name)),
      type: e.isDirectory() ? ('dir' as const) : ('file' as const),
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function readWorkspaceFile(id: string, relPath: string): Promise<FileContent> {
  const root = workspaceRoot(id);
  const abs = safeResolve(root, relPath);
  const info = await stat(abs);
  if (info.isDirectory()) throw new Error('is_directory');
  if (info.size > MAX_FILE_BYTES) throw new Error('file_too_large');
  return { path: toRel(root, abs), content: await readFile(abs, 'utf8') };
}

/**
 * Résout le chemin hôte absolu d'un fichier de workspace (anti path-traversal),
 * sans le lire — pour servir des octets bruts (images, etc.). Rejette les dossiers.
 */
export async function resolveWorkspaceFilePath(id: string, relPath: string): Promise<string> {
  const root = workspaceRoot(id);
  const abs = safeResolve(root, relPath);
  const info = await stat(abs);
  if (info.isDirectory()) throw new Error('is_directory');
  return abs;
}

/**
 * Résout le chemin hôte absolu d'un **dossier** de workspace (anti path-traversal) —
 * pour le surveiller (fs.watch). Un `/` initial / vide désigne la racine.
 */
export async function resolveWorkspaceDir(id: string, relPath: string): Promise<string> {
  const root = workspaceRoot(id);
  const abs = safeResolve(root, relPath || '/');
  const info = await stat(abs);
  if (!info.isDirectory()) throw new Error('not_a_directory');
  return abs;
}

export async function writeWorkspaceFile(
  id: string,
  relPath: string,
  content: string,
): Promise<void> {
  const root = workspaceRoot(id);
  const abs = safeResolve(root, relPath);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
}

export async function moveWorkspacePath(id: string, from: string, to: string): Promise<void> {
  const root = workspaceRoot(id);
  const absFrom = safeResolve(root, from);
  const absTo = safeResolve(root, to);
  if (absFrom === absTo) return; // no-op
  // Refuse de déplacer un dossier dans lui-même ou un de ses descendants.
  const rel = relative(absFrom, absTo);
  if (rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)) {
    throw new PathTraversalError('cannot move into descendant');
  }
  await mkdir(dirname(absTo), { recursive: true });
  await rename(absFrom, absTo);
}

export async function createWorkspaceDir(id: string, relPath: string): Promise<void> {
  const root = workspaceRoot(id);
  await mkdir(safeResolve(root, relPath), { recursive: true });
}

export async function deleteWorkspacePath(id: string, relPath: string): Promise<void> {
  const root = workspaceRoot(id);
  const abs = safeResolve(root, relPath);
  if (abs === root) throw new PathTraversalError('cannot delete root');
  if (!existsSync(abs)) return;
  await rm(abs, { recursive: true, force: true });
}
