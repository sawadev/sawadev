import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { getDb } from '../db';

/**
 * Chiffrement AES-256-GCM des secrets (clés API) au repos.
 * La clé est dérivée d'un secret d'instance (env SAWADEV_SECRET en prod ;
 * généré et persisté en dev). Les valeurs en clair ne quittent jamais le
 * serveur et ne sont jamais journalisées.
 */

const ALGO = 'aes-256-gcm';

/** Récupère/initialise le secret d'instance (32+ octets). */
function instanceSecret(): string {
  const fromEnv = Bun.env.SAWADEV_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  const db = getDb();
  const row = db
    .query<{ value: string }, [string]>('SELECT value FROM config WHERE key = ?')
    .get('instance_secret');
  if (row) return row.value;
  const generated = randomBytes(32).toString('base64');
  db.run('INSERT INTO config (key, value) VALUES (?, ?)', ['instance_secret', generated]);
  return generated;
}

function key(): Buffer {
  return createHash('sha256').update(instanceSecret()).digest();
}

export interface Encrypted {
  ciphertext: Buffer;
  iv: Buffer;
}

/** Chiffre une valeur en clair. L'IV (12o) et le tag GCM sont stockés ensemble. */
export function encryptSecret(plaintext: string): Encrypted {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // ciphertext = enc || tag (16o) ; déchiffrement: split.
  return { ciphertext: Buffer.concat([enc, tag]), iv };
}

/** Déchiffre une valeur. Lève si l'authentification GCM échoue. */
export function decryptSecret(enc: Encrypted): string {
  const data = enc.ciphertext;
  const tag = data.subarray(data.length - 16);
  const body = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv(ALGO, key(), enc.iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
}
