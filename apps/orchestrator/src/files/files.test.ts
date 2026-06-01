import { Database } from 'bun:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resetConfigCache } from '../config';
import { closeDb, getDb, setDb } from '../db';
import {
  PathTraversalError,
  copyWorkspacePath,
  deleteWorkspacePath,
  listDir,
  moveWorkspacePath,
  readWorkspaceFile,
  writeWorkspaceFile,
} from './service';

let root: string;

beforeEach(() => {
  resetConfigCache();
  closeDb();
  setDb(new Database(':memory:'));
  root = mkdtempSync(join(tmpdir(), 'sawa-files-'));
  getDb().run(
    `INSERT INTO workspaces (id, name, image, volume, lifecycle, created_at)
     VALUES ('w', 'w', 'busybox', ?, 'always-on', 0)`,
    [root],
  );
  // Arbre de départ.
  writeFileSync(join(root, 'README.md'), '# hello');
});

afterEach(() => {
  closeDb();
  rmSync(root, { recursive: true, force: true });
});

describe('confinement (anti path-traversal)', () => {
  it('rejette une sortie via ../', async () => {
    await expect(readWorkspaceFile('w', '../../etc/passwd')).rejects.toBeInstanceOf(
      PathTraversalError,
    );
    await expect(writeWorkspaceFile('w', 'a/../../escape', 'x')).rejects.toBeInstanceOf(
      PathTraversalError,
    );
  });

  it("traite un / initial comme la racine du workspace (pas celle de l'hôte)", async () => {
    await writeWorkspaceFile('w', '/sub/f.txt', 'root-relative');
    expect((await readWorkspaceFile('w', 'sub/f.txt')).content).toBe('root-relative');
  });

  it('refuse de supprimer la racine', async () => {
    await expect(deleteWorkspacePath('w', '/')).rejects.toBeInstanceOf(PathTraversalError);
  });
});

describe('CRUD fichiers', () => {
  it('liste, lit, écrit, déplace, supprime', async () => {
    // list
    const top = await listDir('w', '/');
    expect(top.map((n) => n.name)).toContain('README.md');

    // read
    expect((await readWorkspaceFile('w', 'README.md')).content).toBe('# hello');

    // write (dossier créé à la volée)
    await writeWorkspaceFile('w', 'src/index.ts', 'export const x = 1;\n');
    const src = await listDir('w', 'src');
    expect(src.find((n) => n.name === 'index.ts')?.type).toBe('file');

    // move
    await moveWorkspacePath('w', 'src/index.ts', 'src/main.ts');
    const moved = await listDir('w', 'src');
    expect(moved.map((n) => n.name)).toEqual(['main.ts']);

    // delete
    await deleteWorkspacePath('w', 'src');
    expect((await listDir('w', '/')).find((n) => n.name === 'src')).toBeUndefined();
  });

  it('trie dossiers avant fichiers', async () => {
    await writeWorkspaceFile('w', 'a.txt', '');
    await writeWorkspaceFile('w', 'zdir/b.txt', '');
    const top = await listDir('w', '/');
    expect(top[0]?.type).toBe('dir');
  });

  it('move : refuse un dossier dans son propre descendant', async () => {
    await writeWorkspaceFile('w', 'src/index.ts', '');
    await expect(moveWorkspacePath('w', 'src', 'src/nested')).rejects.toBeInstanceOf(
      PathTraversalError,
    );
  });

  it('copy : duplique un fichier (contenu préservé)', async () => {
    await writeWorkspaceFile('w', 'a.ts', 'export const x = 1;\n');
    await copyWorkspacePath('w', 'a.ts', 'a copy.ts');
    expect((await readWorkspaceFile('w', 'a copy.ts')).content).toBe('export const x = 1;\n');
    expect((await readWorkspaceFile('w', 'a.ts')).content).toBe('export const x = 1;\n'); // original intact
  });

  it('copy : refuse un dossier dans son propre descendant', async () => {
    await writeWorkspaceFile('w', 'dir/f.ts', '');
    await expect(copyWorkspacePath('w', 'dir', 'dir/sub')).rejects.toBeInstanceOf(
      PathTraversalError,
    );
  });
});
