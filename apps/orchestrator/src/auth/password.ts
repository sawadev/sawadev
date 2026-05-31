import { getDb } from '../db';

/**
 * Hachage du mot de passe admin via argon2id natif de Bun (zéro dépendance).
 * Mono-utilisateur : une seule ligne app_user (id = 1).
 */

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: 'argon2id' });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export function isSetupDone(): boolean {
  const row = getDb()
    .query<{ n: number }, []>('SELECT COUNT(*) AS n FROM app_user WHERE id = 1')
    .get();
  return (row?.n ?? 0) > 0;
}

/** Crée l'utilisateur unique. Échoue si déjà présent (1ère install only). */
export async function createUser(password: string): Promise<void> {
  if (isSetupDone()) throw new Error('setup already done');
  const hash = await hashPassword(password);
  getDb().run('INSERT INTO app_user (id, password_hash, created_at) VALUES (1, ?, ?)', [
    hash,
    Date.now(),
  ]);
}

/** Vérifie le mot de passe admin. Faux si l'utilisateur n'existe pas encore. */
export async function checkPassword(password: string): Promise<boolean> {
  const row = getDb()
    .query<{ password_hash: string }, []>('SELECT password_hash FROM app_user WHERE id = 1')
    .get();
  if (!row) return false;
  return verifyPassword(password, row.password_hash);
}
