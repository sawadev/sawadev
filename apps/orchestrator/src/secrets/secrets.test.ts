import { Database } from 'bun:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createApp } from '../app';
import { resetConfigCache } from '../config';
import { closeDb, setDb } from '../db';
import { decryptSecret, encryptSecret } from './crypto';
import { getDecryptedKey, listKeyStatuses, setKey } from './keys';

function fresh() {
  resetConfigCache();
  closeDb();
  setDb(new Database(':memory:'));
}

beforeEach(fresh);
afterEach(() => closeDb());

describe('chiffrement AES-256-GCM', () => {
  it('round-trip chiffre/déchiffre', () => {
    const enc = encryptSecret('sk-ant-secret-value');
    expect(enc.ciphertext).not.toContain('sk-ant');
    expect(decryptSecret(enc)).toBe('sk-ant-secret-value');
  });

  it('échoue si le tag GCM est altéré', () => {
    const enc = encryptSecret('x'.repeat(20));
    enc.ciphertext[0] = enc.ciphertext[0] ^ 0xff;
    expect(() => decryptSecret(enc)).toThrow();
  });
});

describe('gestion des clés', () => {
  it("stocke chiffré, expose l'état sans la valeur, déchiffre en interne", () => {
    setKey('anthropic', 'sk-ant-abc12345');
    const statuses = listKeyStatuses();
    expect(statuses.find((s) => s.provider === 'anthropic')?.connected).toBe(true);
    expect(statuses.find((s) => s.provider === 'openai')?.connected).toBe(false);
    // La valeur n'est jamais dans le statut.
    expect(JSON.stringify(statuses)).not.toContain('sk-ant');
    // Mais elle est déchiffrable en interne (injection agent).
    expect(getDecryptedKey('anthropic')).toBe('sk-ant-abc12345');
  });
});

describe('routes /api/settings/keys', () => {
  async function authed() {
    const app = createApp();
    const res = await app.request('/api/auth/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'correct horse battery staple' }),
    });
    const sc = res.headers.get('set-cookie') ?? '';
    return { app, cookie: `sawa_session=${sc.match(/sawa_session=([^;]+)/)?.[1]}` };
  }

  it('exige une session', async () => {
    const app = createApp();
    expect((await app.request('/api/settings/keys')).status).toBe(401);
  });

  it('PUT puis GET ne renvoie jamais la clé', async () => {
    const { app, cookie } = await authed();
    const put = await app.request('/api/settings/keys', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ provider: 'anthropic', key: 'sk-ant-zzz99999' }),
    });
    expect(put.status).toBe(200);
    const get = await app.request('/api/settings/keys', { headers: { cookie } });
    const body = await get.text();
    expect(body).not.toContain('sk-ant');
    expect(body).toContain('"connected":true');
  });
});
