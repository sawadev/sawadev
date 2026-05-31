import { getConfig } from '../config';
import { getDb } from '../db';

interface AttemptRow {
  fails: number;
  banned_until: number | null;
}

/** Renvoie les secondes restantes de bannissement, ou 0 si l'IP est libre. */
export function bannedFor(ip: string): number {
  const row = getDb()
    .query<AttemptRow, [string]>('SELECT fails, banned_until FROM login_attempts WHERE ip = ?')
    .get(ip);
  if (!row?.banned_until) return 0;
  const remainingMs = row.banned_until - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

/** Enregistre un échec ; bannit l'IP au-delà du seuil. */
export function recordFailure(ip: string): void {
  const { maxLoginFails, banDurationSec } = getConfig();
  const db = getDb();
  const row = db
    .query<AttemptRow, [string]>('SELECT fails, banned_until FROM login_attempts WHERE ip = ?')
    .get(ip);
  const fails = (row?.fails ?? 0) + 1;
  const bannedUntil = fails >= maxLoginFails ? Date.now() + banDurationSec * 1000 : null;
  db.run(
    `INSERT INTO login_attempts (ip, fails, banned_until) VALUES (?, ?, ?)
     ON CONFLICT(ip) DO UPDATE SET fails = excluded.fails, banned_until = excluded.banned_until`,
    [ip, fails, bannedUntil],
  );
}

/** Réinitialise le compteur après un login réussi. */
export function clearFailures(ip: string): void {
  getDb().run('DELETE FROM login_attempts WHERE ip = ?', [ip]);
}
