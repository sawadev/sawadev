import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { createApp } from './app';
import { resetConfigCache } from './config';
import { closeDb, setDb } from './db';
import { updaterScript } from './updater';

function freshApp() {
  resetConfigCache();
  closeDb();
  setDb(new Database(':memory:'));
  return createApp();
}

afterEach(() => closeDb());

describe('GET /api/health', () => {
  it('est public (200 sans session) et renvoie ok', async () => {
    const app = freshApp();
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});

describe('updaterScript', () => {
  it('enchaîne pull, up -d, health-check et rollback', () => {
    const s = updaterScript('/opt/sawadev', 'http://orchestrator:8787/api/health');
    expect(s).toContain('cd /opt/sawadev');
    expect(s).toContain('docker compose pull');
    expect(s).toContain('docker compose up -d');
    expect(s).toContain('/api/health');
    // rollback : retag de l'image précédente + recréation forcée
    expect(s).toContain('docker tag "$prev" "$ref"');
    expect(s).toContain('--force-recreate orchestrator');
  });
});
