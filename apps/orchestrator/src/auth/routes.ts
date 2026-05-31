import type { AuthState, PasswordRequest } from '@sawadev/shared';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { type Context, Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { getConfig } from '../config';
import { clientIp, requireSession } from './middleware';
import { checkPassword, createUser, isSetupDone } from './password';
import { bannedFor, clearFailures, recordFailure } from './rate-limit';
import { SESSION_COOKIE, createSession, revokeSession, validateSession } from './sessions';
import {
  hasPasskey,
  loginOptions,
  registrationOptions,
  verifyLogin,
  verifyRegistration,
} from './webauthn';

/** Pose le cookie de session sur la réponse courante. */
function setSessionCookie(c: Context, token: string): void {
  const { cookieSecure, sessionTtlSec } = getConfig();
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: sessionTtlSec,
  });
}

const MIN_PASSWORD_LEN = 8;

function readPassword(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const pwd = (body as PasswordRequest).password;
  if (typeof pwd !== 'string' || pwd.length < MIN_PASSWORD_LEN) return null;
  return pwd;
}

export function authRoutes(): Hono {
  const app = new Hono();

  // État public : sait-on si l'install est faite + si la requête est authentifiée.
  app.get('/state', (c) => {
    const token = getCookie(c, SESSION_COOKIE);
    const state: AuthState = {
      setupDone: isSetupDone(),
      authenticated: validateSession(token) !== null,
      hasPasskey: hasPasskey(),
    };
    return c.json(state);
  });

  // 1ère install : définit le mot de passe admin et ouvre une session.
  app.post('/setup', async (c) => {
    if (isSetupDone()) return c.json({ error: 'already_setup' }, 409);
    const pwd = readPassword(await c.req.json().catch(() => null));
    if (!pwd) return c.json({ error: 'weak_password' }, 400);
    await createUser(pwd);
    const token = createSession({ userAgent: c.req.header('user-agent'), ip: clientIp(c) });
    setSessionCookie(c, token);
    return c.json({ authenticated: true });
  });

  // Login mot de passe + anti-bruteforce.
  app.post('/login', async (c) => {
    const ip = clientIp(c);
    const ban = bannedFor(ip);
    if (ban > 0) return c.json({ error: 'banned', retryAfter: ban }, 429);
    const pwd = readPassword(await c.req.json().catch(() => null));
    if (!pwd) return c.json({ error: 'invalid_request' }, 400);
    if (!(await checkPassword(pwd))) {
      recordFailure(ip);
      return c.json({ error: 'invalid_credentials' }, 401);
    }
    clearFailures(ip);
    const token = createSession({ userAgent: c.req.header('user-agent'), ip });
    setSessionCookie(c, token);
    return c.json({ authenticated: true });
  });

  app.post('/logout', (c) => {
    revokeSession(getCookie(c, SESSION_COOKIE));
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    return c.json({ ok: true });
  });

  // ── Passkeys : enregistrement (session requise) ──
  app.post('/passkey/register/options', requireSession, async (c) => {
    return c.json(await registrationOptions());
  });

  app.post('/passkey/register/verify', requireSession, async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      flowId?: string;
      label?: string;
      response?: RegistrationResponseJSON;
    } | null;
    if (!body?.response) return c.json({ error: 'invalid_request' }, 400);
    const ok = await verifyRegistration(body.flowId, body.response, body.label);
    return ok ? c.json({ verified: true }) : c.json({ error: 'verification_failed' }, 400);
  });

  // ── Passkeys : connexion (public) ──
  app.post('/passkey/login/options', async (c) => {
    return c.json(await loginOptions());
  });

  app.post('/passkey/login/verify', async (c) => {
    const ip = clientIp(c);
    const ban = bannedFor(ip);
    if (ban > 0) return c.json({ error: 'banned', retryAfter: ban }, 429);
    const body = (await c.req.json().catch(() => null)) as {
      flowId?: string;
      response?: AuthenticationResponseJSON;
    } | null;
    if (!body?.response) return c.json({ error: 'invalid_request' }, 400);
    const ok = await verifyLogin(body.flowId, body.response);
    if (!ok) {
      recordFailure(ip);
      return c.json({ error: 'verification_failed' }, 400);
    }
    clearFailures(ip);
    const token = createSession({ userAgent: c.req.header('user-agent'), ip });
    setSessionCookie(c, token);
    return c.json({ authenticated: true });
  });

  return app;
}
