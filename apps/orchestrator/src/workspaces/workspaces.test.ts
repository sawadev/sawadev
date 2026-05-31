import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../app';
import { resetConfigCache } from '../config';
import { closeDb, setDb } from '../db';
import { idleCandidates, readDevcontainerImage } from './service';

function freshApp() {
  resetConfigCache();
  closeDb();
  setDb(new Database(':memory:'));
  return createApp();
}

afterEach(() => closeDb());

describe('workspaces routes (auth)', () => {
  it('exige une session sur GET /api/workspaces', async () => {
    const app = freshApp();
    const res = await app.request('/api/workspaces');
    expect(res.status).toBe(401);
  });

  it('exige une session sur POST /api/workspaces', async () => {
    const app = freshApp();
    const res = await app.request('/api/workspaces', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('idleCandidates', () => {
  const now = 1_000_000;
  const rows = [
    { id: 'a', lifecycle: 'idle-stop', last_opened_at: now - 60_000 }, // inactif 60s
    { id: 'b', lifecycle: 'idle-stop', last_opened_at: now - 5_000 }, // récent
    { id: 'c', lifecycle: 'always-on', last_opened_at: 0 }, // jamais arrêté
  ];
  it('ne retient que les idle-stop dépassant le timeout', () => {
    expect(idleCandidates(rows, now, 30_000)).toEqual(['a']);
  });
  it('ignore tout sous le timeout', () => {
    expect(idleCandidates(rows, now, 120_000)).toEqual([]);
  });
});

describe('readDevcontainerImage', () => {
  it('lit le champ image (JSONC avec commentaires)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sawa-dc-'));
    mkdirSync(join(dir, '.devcontainer'));
    writeFileSync(
      join(dir, '.devcontainer', 'devcontainer.json'),
      '{\n  // image de base\n  "image": "node:20-bookworm"\n}',
    );
    expect(readDevcontainerImage(dir)).toBe('node:20-bookworm');
    rmSync(dir, { recursive: true, force: true });
  });
  it('renvoie null si absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sawa-dc-'));
    expect(readDevcontainerImage(dir)).toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });
});
