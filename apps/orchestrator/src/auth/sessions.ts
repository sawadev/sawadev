import { getConfig } from '../config';
import { getDb } from '../db';

export const SESSION_COOKIE = 'sawa_session';

interface SessionRow {
  id: string;
  expires_at: number;
}

/** Génère un token opaque de 256 bits encodé en base64url. */
function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

/** Crée une session et renvoie son token (= valeur du cookie). */
export function createSession(meta: { userAgent?: string; ip?: string }): string {
  const { sessionTtlSec } = getConfig();
  const id = newToken();
  const now = Date.now();
  getDb().run(
    'INSERT INTO sessions (id, created_at, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)',
    [id, now, now + sessionTtlSec * 1000, meta.userAgent ?? null, meta.ip ?? null],
  );
  return id;
}

/**
 * Valide un token de session. Renvoie l'id si valide (et prolonge l'expiration
 * glissante), sinon null. Purge les sessions expirées au passage.
 */
export function validateSession(token: string | undefined): string | null {
  if (!token) return null;
  const db = getDb();
  const row = db
    .query<SessionRow, [string]>('SELECT id, expires_at FROM sessions WHERE id = ?')
    .get(token);
  if (!row) return null;
  const now = Date.now();
  if (row.expires_at < now) {
    db.run('DELETE FROM sessions WHERE id = ?', [token]);
    return null;
  }
  // Expiration glissante.
  const { sessionTtlSec } = getConfig();
  db.run('UPDATE sessions SET expires_at = ? WHERE id = ?', [now + sessionTtlSec * 1000, token]);
  return row.id;
}

export function revokeSession(token: string | undefined): void {
  if (!token) return;
  getDb().run('DELETE FROM sessions WHERE id = ?', [token]);
}

/** Extrait et valide la session depuis un en-tête Cookie brut (upgrade WS). */
export function validateSessionFromCookieHeader(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return validateSession(match?.[1]);
}
