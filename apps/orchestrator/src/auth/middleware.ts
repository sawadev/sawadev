import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { SESSION_COOKIE, validateSession } from './sessions';

/** Variables ajoutées au contexte Hono par le middleware d'auth. */
export interface AuthVars {
  sessionId: string;
}

/** Extrait l'IP cliente (Caddy pose X-Forwarded-For en prod). */
export function clientIp(c: Context): string {
  const fwd = c.req.header('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'local';
  return c.req.header('x-real-ip') ?? 'local';
}

/**
 * Exige une session valide. Rejette en 401 sinon.
 * À monter sur toutes les routes /api/* hors auth publiques et sur l'upgrade WS.
 */
export const requireSession: MiddlewareHandler<{ Variables: AuthVars }> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  const sessionId = validateSession(token);
  if (!sessionId) return c.json({ error: 'unauthorized' }, 401);
  c.set('sessionId', sessionId);
  await next();
};
