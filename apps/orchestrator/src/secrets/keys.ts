import type { ApiKeyStatus, KeyProvider } from '@sawadev/shared';
import { getDb } from '../db';
import { type Encrypted, decryptSecret, encryptSecret } from './crypto';

/** Fournisseurs exposés dans les réglages (même si aucune clé enregistrée). */
export const KNOWN_PROVIDERS: KeyProvider[] = ['anthropic', 'openai', 'cursor'];

/** Variable d'environnement injectée à l'agent pour chaque fournisseur. */
export const PROVIDER_ENV: Record<KeyProvider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  cursor: 'CURSOR_API_KEY',
};

export function setKey(provider: KeyProvider, value: string): void {
  const { ciphertext, iv } = encryptSecret(value);
  getDb().run(
    `INSERT INTO api_keys (provider, ciphertext, iv, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(provider) DO UPDATE SET ciphertext = excluded.ciphertext, iv = excluded.iv,
       created_at = excluded.created_at`,
    [provider, ciphertext, iv, Date.now()],
  );
}

export function deleteKey(provider: KeyProvider): boolean {
  const res = getDb().run('DELETE FROM api_keys WHERE provider = ?', [provider]);
  return res.changes > 0;
}

/** État (connecté/non) de chaque fournisseur — jamais la valeur. */
export function listKeyStatuses(): ApiKeyStatus[] {
  const rows = getDb().query<{ provider: string }, []>('SELECT provider FROM api_keys').all();
  const connected = new Set(rows.map((r) => r.provider));
  return KNOWN_PROVIDERS.map((provider) => ({ provider, connected: connected.has(provider) }));
}

/** Déchiffre une clé pour injection interne (jamais renvoyée au client). */
export function getDecryptedKey(provider: KeyProvider): string | null {
  const row = getDb()
    .query<{ ciphertext: Uint8Array; iv: Uint8Array }, [string]>(
      'SELECT ciphertext, iv FROM api_keys WHERE provider = ?',
    )
    .get(provider);
  if (!row) return null;
  const enc: Encrypted = {
    ciphertext: Buffer.from(row.ciphertext),
    iv: Buffer.from(row.iv),
  };
  return decryptSecret(enc);
}
