import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { createApp } from '../app';
import { resetConfigCache } from '../config';
import { closeDb, setDb } from '../db';

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
