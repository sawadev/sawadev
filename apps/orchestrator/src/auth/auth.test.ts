import { Database } from 'bun:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createApp } from '../app';
import { resetConfigCache } from '../config';
import { closeDb, setDb } from '../db';

/** App + base neuve en mémoire pour chaque test (isolation totale). */
function freshApp() {
  resetConfigCache();
  closeDb();
  setDb(new Database(':memory:'));
  return createApp();
}

/** Extrait la valeur du cookie de session d'une réponse. */
function sessionCookie(res: Response): string | null {
  const sc = res.headers.get('set-cookie');
  if (!sc) return null;
  const m = sc.match(/sawa_session=([^;]+)/);
  return m ? `sawa_session=${m[1]}` : null;
}

const PWD = 'correct horse battery staple';

beforeEach(() => {
  resetConfigCache();
});
afterEach(() => {
  closeDb();
});

describe('auth state & setup', () => {
  it('annonce setup non fait au départ', async () => {
    const app = freshApp();
    const res = await app.request('/api/auth/state');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ setupDone: false, authenticated: false, hasPasskey: false });
  });

  it("setup crée l'admin, ouvre une session et refuse un 2e setup", async () => {
    const app = freshApp();
    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: PWD }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ authenticated: true });
    expect(sessionCookie(res)).toBeTruthy();

    const second = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: PWD }),
    });
    expect(second.status).toBe(409);
  });

  it('rejette un mot de passe trop court', async () => {
    const app = freshApp();
    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'short' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('login / session / logout', () => {
  async function setup(app: ReturnType<typeof createApp>) {
    await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: PWD }),
    });
  }

  it('login correct ouvre une session utilisable sur une route protégée', async () => {
    const app = freshApp();
    await setup(app);
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: PWD }),
    });
    expect(res.status).toBe(200);
    const cookie = sessionCookie(res);
    expect(cookie).toBeTruthy();

    const protRes = await app.request('/api/system/version', {
      headers: { cookie: cookie as string },
    });
    expect(protRes.status).toBe(200);
  });

  it('route protégée rejette sans session', async () => {
    const app = freshApp();
    await setup(app);
    const res = await app.request('/api/system/version');
    expect(res.status).toBe(401);
  });

  it('logout invalide la session', async () => {
    const app = freshApp();
    await setup(app);
    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: PWD }),
    });
    const cookie = sessionCookie(login) as string;
    await app.request('/api/auth/logout', { method: 'POST', headers: { cookie } });
    const after = await app.request('/api/system/version', { headers: { cookie } });
    expect(after.status).toBe(401);
  });

  it('mauvais mot de passe -> 401', async () => {
    const app = freshApp();
    await setup(app);
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'wrong wrong wrong' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('rate limit', () => {
  it("bannit l'IP après le seuil d'échecs", async () => {
    resetConfigCache();
    Bun.env.MAX_LOGIN_FAILS = '3';
    const app = freshApp(); // relit la config avec le seuil
    await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: PWD }),
    });
    const bad = () =>
      app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
        body: JSON.stringify({ password: 'nope nope nope' }),
      });
    expect((await bad()).status).toBe(401);
    expect((await bad()).status).toBe(401);
    expect((await bad()).status).toBe(401); // 3e échec -> ban
    const banned = await bad();
    expect(banned.status).toBe(429);
    expect((await banned.json()).retryAfter).toBeGreaterThan(0);
    Bun.env.MAX_LOGIN_FAILS = undefined;
  });
});

describe('passkeys', () => {
  it('register/options exige une session', async () => {
    const app = freshApp();
    const res = await app.request('/api/auth/passkey/register/options', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('login/options renvoie un challenge sans session', async () => {
    const app = freshApp();
    const res = await app.request('/api/auth/passkey/login/options', { method: 'POST' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.flowId).toBeTruthy();
    expect(body.options.challenge).toBeTruthy();
  });
});
