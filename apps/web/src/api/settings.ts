import type { ApiKeyStatus, KeyProvider, SystemVersion } from '@sawadev/shared';
import { apiGet, apiPost } from './client';

export function getVersion(): Promise<SystemVersion> {
  return apiGet<SystemVersion>('/api/system/version');
}

export function listKeys(): Promise<ApiKeyStatus[]> {
  return apiGet<ApiKeyStatus[]>('/api/settings/keys');
}

export function setKey(provider: KeyProvider, key: string): Promise<{ ok: true }> {
  return fetch('/api/settings/keys', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider, key }),
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}

export function deleteKey(provider: KeyProvider): Promise<{ ok: true }> {
  return fetch(`/api/settings/keys/${provider}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}

export function startUpdate(): Promise<{ started: boolean }> {
  return apiPost<{ started: boolean }>('/api/system/update');
}
