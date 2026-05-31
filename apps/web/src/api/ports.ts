import type { Port } from '@sawadev/shared';
import { apiGet, apiPost } from './client';

export function listPorts(workspaceId: string): Promise<Port[]> {
  return apiGet<Port[]>(`/api/workspaces/${workspaceId}/ports`);
}

export function addPort(workspaceId: string, port: number): Promise<Port> {
  return apiPost<Port>(`/api/workspaces/${workspaceId}/ports`, { port });
}

export function removePort(workspaceId: string, port: number): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${workspaceId}/ports/${port}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}
