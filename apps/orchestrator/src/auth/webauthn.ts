import type { PasskeyInfo } from '@sawadev/shared';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { getConfig } from '../config';
import { getDb } from '../db';

/** Handle utilisateur stable (mono-utilisateur). */
const USER_HANDLE = new TextEncoder().encode('sawadev-user');
const USER_NAME = 'sawadev';

/** Challenges en attente (TTL court), indexés par flowId renvoyé au client. */
interface Pending {
  challenge: string;
  expiresAt: number;
}
const pending = new Map<string, Pending>();
const CHALLENGE_TTL_MS = 60_000;

function newFlowId(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString('base64url');
}

function storeChallenge(challenge: string): string {
  const flowId = newFlowId();
  pending.set(flowId, { challenge, expiresAt: Date.now() + CHALLENGE_TTL_MS });
  return flowId;
}

function takeChallenge(flowId: string | undefined): string | null {
  if (!flowId) return null;
  const p = pending.get(flowId);
  pending.delete(flowId);
  if (!p || p.expiresAt < Date.now()) return null;
  return p.challenge;
}

interface CredentialRow {
  id: string;
  public_key: Uint8Array;
  counter: number;
  transports: string | null;
  label: string | null;
}

function listCredentials(): CredentialRow[] {
  return getDb()
    .query<CredentialRow, []>('SELECT id, public_key, counter, transports, label FROM credentials')
    .all();
}

export function hasPasskey(): boolean {
  const row = getDb().query<{ n: number }, []>('SELECT COUNT(*) AS n FROM credentials').get();
  return (row?.n ?? 0) > 0;
}

/** Liste les passkeys enregistrées (métadonnées seulement, jamais la clé). */
export function listPasskeys(): PasskeyInfo[] {
  return getDb()
    .query<
      { id: string; label: string | null; created_at: number; last_used_at: number | null },
      []
    >('SELECT id, label, created_at, last_used_at FROM credentials ORDER BY created_at')
    .all()
    .map((r) => ({
      id: r.id,
      label: r.label,
      createdAt: r.created_at,
      lastUsedAt: r.last_used_at,
    }));
}

/** Supprime une passkey par son id. */
export function deletePasskey(id: string): boolean {
  return getDb().run('DELETE FROM credentials WHERE id = ?', [id]).changes > 0;
}

// ── Enregistrement (utilisateur authentifié) ─────────────────────────────────

export async function registrationOptions() {
  const { rpID, rpName } = getConfig();
  const existing = listCredentials();
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: USER_HANDLE,
    userName: USER_NAME,
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      transports: c.transports ? (JSON.parse(c.transports) as AuthenticatorTransport[]) : undefined,
    })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });
  const flowId = storeChallenge(options.challenge);
  return { flowId, options };
}

export async function verifyRegistration(
  flowId: string | undefined,
  response: RegistrationResponseJSON,
  label?: string,
): Promise<boolean> {
  const expectedChallenge = takeChallenge(flowId);
  if (!expectedChallenge) return false;
  const { rpID, rpOrigin } = getConfig();
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: rpOrigin,
    expectedRPID: rpID,
  });
  if (!verification.verified || !verification.registrationInfo) return false;
  const { credential } = verification.registrationInfo;
  getDb().run(
    `INSERT INTO credentials (id, public_key, counter, transports, label, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      credential.id,
      Buffer.from(credential.publicKey),
      credential.counter,
      credential.transports ? JSON.stringify(credential.transports) : null,
      label ?? null,
      Date.now(),
    ],
  );
  return true;
}

// ── Connexion (non authentifié) ──────────────────────────────────────────────

export async function loginOptions() {
  const { rpID } = getConfig();
  const creds = listCredentials();
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: creds.map((c) => ({
      id: c.id,
      transports: c.transports ? (JSON.parse(c.transports) as AuthenticatorTransport[]) : undefined,
    })),
    userVerification: 'preferred',
  });
  const flowId = storeChallenge(options.challenge);
  return { flowId, options };
}

export async function verifyLogin(
  flowId: string | undefined,
  response: AuthenticationResponseJSON,
): Promise<boolean> {
  const expectedChallenge = takeChallenge(flowId);
  if (!expectedChallenge) return false;
  const cred = getDb()
    .query<CredentialRow, [string]>(
      'SELECT id, public_key, counter, transports, label FROM credentials WHERE id = ?',
    )
    .get(response.id);
  if (!cred) return false;
  const { rpID, rpOrigin } = getConfig();
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: rpOrigin,
    expectedRPID: rpID,
    credential: {
      id: cred.id,
      // SQLite renvoie un Uint8Array<ArrayBufferLike> ; on le recopie en ArrayBuffer.
      publicKey: new Uint8Array(cred.public_key),
      counter: cred.counter,
      transports: cred.transports
        ? (JSON.parse(cred.transports) as AuthenticatorTransport[])
        : undefined,
    },
  });
  if (!verification.verified) return false;
  getDb().run('UPDATE credentials SET counter = ?, last_used_at = ? WHERE id = ?', [
    verification.authenticationInfo.newCounter,
    Date.now(),
    cred.id,
  ]);
  return true;
}
