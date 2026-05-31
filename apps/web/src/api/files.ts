import type { FileContent, FileNode } from '@sawadev/shared';
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
