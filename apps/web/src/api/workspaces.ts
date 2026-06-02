import type { CreateWorkspaceRequest, Workspace, WorkspaceStats } from '@sawadev/shared';
import { apiGet, apiPatch, apiPost } from './client';

export function getWorkspaceStats(id: string): Promise<WorkspaceStats> {
  return apiGet<WorkspaceStats>(`/api/workspaces/${id}/stats`);
}

export function listWorkspaces(): Promise<Workspace[]> {
  return apiGet<Workspace[]>('/api/workspaces');
}

export function getWorkspace(id: string): Promise<Workspace> {
  return apiGet<Workspace>(`/api/workspaces/${id}`);
}

export function createWorkspace(req: CreateWorkspaceRequest): Promise<Workspace> {
  return apiPost<Workspace>('/api/workspaces', req);
}

export function renameWorkspace(id: string, name: string): Promise<Workspace> {
  return apiPatch<Workspace>(`/api/workspaces/${id}`, { name });
}

export function startWorkspace(id: string): Promise<Workspace> {
  return apiPost<Workspace>(`/api/workspaces/${id}/start`);
}

export function stopWorkspace(id: string): Promise<Workspace> {
  return apiPost<Workspace>(`/api/workspaces/${id}/stop`);
}

export function deleteWorkspace(id: string): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${id}`, { method: 'DELETE', credentials: 'same-origin' }).then(
    (r) => {
      if (!r.ok) throw new Error(`http_${r.status}`);
      return { ok: true } as const;
    },
  );
}
