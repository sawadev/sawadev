import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { closeDb, getDb, setDb } from '../db';
import { mcpApiRoutes } from './routes';
import { getOrCreateToken, workspaceForToken } from './tokens';

function fresh(): void {
  closeDb();
  setDb(new Database(':memory:')); // setDb applique les migrations
}

function addWorkspace(id: string): void {
  getDb().run(
    `INSERT INTO workspaces (id, name, image, volume, lifecycle, created_at)
     VALUES (?, ?, ?, ?, 'always-on', 0)`,
    [id, id, 'img', `/tmp/${id}`],
  );
}

afterEach(() => closeDb());

describe('mcp tokens', () => {
  it('crée un token stable et le résout vers le workspace', () => {
    fresh();
    addWorkspace('w1');
    const t = getOrCreateToken('w1');
    expect(t).toHaveLength(43); // 32 octets base64url
    expect(getOrCreateToken('w1')).toBe(t); // idempotent
    expect(workspaceForToken(t)).toBe('w1');
    expect(workspaceForToken('bogus')).toBeNull();
    expect(workspaceForToken(undefined)).toBeNull();
  });
});

describe('mcp-api auth + surface', () => {
  it('401 sans token, 200 avec token valide', async () => {
    fresh();
    addWorkspace('w1');
    const app = mcpApiRoutes();
    const token = getOrCreateToken('w1');

    const noAuth = await app.request('/actions');
    expect(noAuth.status).toBe(401);

    const ok = await app.request('/actions', {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual([]);
  });

  it("n'expose aucune route destructive (delete/stop/remove)", async () => {
    fresh();
    addWorkspace('w1');
    const app = mcpApiRoutes();
    const h = { authorization: `Bearer ${getOrCreateToken('w1')}` };

    for (const req of [
      app.request('/actions/x', { method: 'DELETE', headers: h }),
      app.request('/tools/x', { method: 'DELETE', headers: h }),
      app.request('/tools/x/stop', { method: 'POST', headers: h }),
      app.request('/ports/3000', { method: 'DELETE', headers: h }),
    ]) {
      expect((await req).status).toBe(404); // route inexistante
    }
  });
});
