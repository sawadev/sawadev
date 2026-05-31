import type { AuthResult, AuthState, PasskeyInfo } from '@sawadev/shared';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { apiGet, apiPost } from './client';

export function getAuthState(): Promise<AuthState> {
  return apiGet<AuthState>('/api/auth/state');
}

export function login(password: string): Promise<AuthResult> {
  return apiPost<AuthResult>('/api/auth/login', { password });
}

export function setup(password: string): Promise<AuthResult> {
  return apiPost<AuthResult>('/api/auth/setup', { password });
}

export function logout(): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>('/api/auth/logout');
}

/** Enregistre une passkey (utilisateur déjà authentifié). */
export async function registerPasskey(label?: string): Promise<boolean> {
  const { flowId, options } = await apiPost<{
    flowId: string;
    options: PublicKeyCredentialCreationOptionsJSON;
  }>('/api/auth/passkey/register/options');
  const response = await startRegistration({ optionsJSON: options });
  const res = await apiPost<{ verified?: boolean }>('/api/auth/passkey/register/verify', {
    flowId,
    label,
    response,
  });
  return res.verified === true;
}

export function listPasskeys(): Promise<PasskeyInfo[]> {
  return apiGet<PasskeyInfo[]>('/api/auth/passkeys');
}

export function deletePasskey(id: string): Promise<{ ok: true }> {
  return fetch(`/api/auth/passkeys/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}

/** Connexion par passkey (non authentifié). */
export async function loginWithPasskey(): Promise<AuthResult> {
  const { flowId, options } = await apiPost<{
    flowId: string;
    options: PublicKeyCredentialRequestOptionsJSON;
  }>('/api/auth/passkey/login/options');
  const response = await startAuthentication({ optionsJSON: options });
  return apiPost<AuthResult>('/api/auth/passkey/login/verify', { flowId, response });
}
