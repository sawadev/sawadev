import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { CURRENT_VERSION, createApp } from './app';
import { resetConfigCache } from './config';
import { closeDb, setDb } from './db';

function freshApp() {
  resetConfigCache();
  closeDb();
  setDb(new Database(':memory:'));
  return createApp();
}

async function authedCookie(app: ReturnType<typeof createApp>): Promise<string> {
  const res = await app.request('/api/auth/setup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'correct horse battery staple' }),
  });
  const sc = res.headers.get('set-cookie') ?? '';
  const m = sc.match(/sawa_session=([^;]+)/);
  return `sawa_session=${m?.[1]}`;
}

afterEach(() => closeDb());

describe('GET /api/system/version', () => {
  it('exige une session', async () => {
    const app = freshApp();
    const res = await app.request('/api/system/version');
    expect(res.status).toBe(401);
  });

  it('renvoie la version courante au format SystemVersion une fois authentifié', async () => {
    const app = freshApp();
    const cookie = await authedCookie(app);
    const res = await app.request('/api/system/version', { headers: { cookie } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      current: CURRENT_VERSION,
      latest: CURRENT_VERSION,
      channel: 'stable',
    });
  });
});
