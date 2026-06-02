import type { FileContent, FileNode, WorkspaceUiState } from '@sawadev/shared';
import { apiGet, apiPost } from './client';

export function listFiles(workspaceId: string, path = '/'): Promise<FileNode[]> {
  return apiGet<FileNode[]>(
    `/api/workspaces/${workspaceId}/files?path=${encodeURIComponent(path)}`,
  );
}

export function readFile(workspaceId: string, path: string): Promise<FileContent> {
  return apiGet<FileContent>(
    `/api/workspaces/${workspaceId}/file?path=${encodeURIComponent(path)}`,
  );
}

/** URL des octets bruts d'un fichier (images, SVG…), servie avec son content-type. */
export function rawFileUrl(workspaceId: string, path: string): string {
  return `/api/workspaces/${workspaceId}/file/raw?path=${encodeURIComponent(path)}`;
}

/** Contexte IDE persistant d'un workspace (onglets, explorateur, position). */
export function getUiState(workspaceId: string): Promise<WorkspaceUiState> {
  return apiGet<WorkspaceUiState>(`/api/workspaces/${workspaceId}/ui-state`);
}

export function putUiState(workspaceId: string, state: WorkspaceUiState): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${workspaceId}/ui-state`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(state),
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}

export function writeFile(
  workspaceId: string,
  path: string,
  content: string,
): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${workspaceId}/file?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content }),
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}

export function createDir(workspaceId: string, path: string): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>(`/api/workspaces/${workspaceId}/dir`, { path });
}

export function moveFile(workspaceId: string, from: string, to: string): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>(`/api/workspaces/${workspaceId}/file/move`, { from, to });
}

export function copyFile(workspaceId: string, from: string, to: string): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>(`/api/workspaces/${workspaceId}/file/copy`, { from, to });
}

/** Upload (octets bruts) d'un fichier vers `path` — utilisé par le drag & drop depuis l'OS. */
export function uploadFile(workspaceId: string, path: string, file: Blob): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${workspaceId}/file/raw?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    credentials: 'same-origin',
    body: file,
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}

export function deletePath(workspaceId: string, path: string): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${workspaceId}/file?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}
