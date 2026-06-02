import type { ToolInstance, ToolType } from '@sawadev/shared';
import { apiGet, apiPost } from './client';

export function listCatalog(): Promise<ToolType[]> {
  return apiGet<ToolType[]>('/api/catalog/tools');
}
export function listTools(id: string): Promise<ToolInstance[]> {
  return apiGet<ToolInstance[]>(`/api/workspaces/${id}/tools`);
}
export function addTool(id: string, type: string): Promise<ToolInstance> {
  return apiPost<ToolInstance>(`/api/workspaces/${id}/tools`, { type });
}
export function startTool(id: string, toolId: string): Promise<ToolInstance> {
  return apiPost<ToolInstance>(`/api/workspaces/${id}/tools/${toolId}/start`);
}
export function stopTool(id: string, toolId: string): Promise<ToolInstance> {
  return apiPost<ToolInstance>(`/api/workspaces/${id}/tools/${toolId}/stop`);
}
export function deleteTool(id: string, toolId: string): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${id}/tools/${toolId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}
export function toolLogs(id: string, toolId: string): Promise<{ logs: string }> {
  return apiGet<{ logs: string }>(`/api/workspaces/${id}/tools/${toolId}/logs`);
}
