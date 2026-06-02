import type { ActionRun, CreateActionRequest, QuickAction } from '@sawadev/shared';
import { apiGet, apiPost, apiPut } from './client';

export function listActions(workspaceId: string): Promise<QuickAction[]> {
  return apiGet<QuickAction[]>(`/api/workspaces/${workspaceId}/actions`);
}

export function createAction(workspaceId: string, body: CreateActionRequest): Promise<QuickAction> {
  return apiPost<QuickAction>(`/api/workspaces/${workspaceId}/actions`, body);
}

export function updateAction(
  workspaceId: string,
  actionId: string,
  body: CreateActionRequest,
): Promise<QuickAction> {
  return apiPut<QuickAction>(`/api/workspaces/${workspaceId}/actions/${actionId}`, body);
}

export function deleteAction(workspaceId: string, actionId: string): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${workspaceId}/actions/${actionId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}

export function runAction(workspaceId: string, actionId: string): Promise<{ runId: string }> {
  return apiPost<{ runId: string }>(`/api/workspaces/${workspaceId}/actions/${actionId}/run`);
}

export function getActionRun(workspaceId: string, runId: string): Promise<ActionRun> {
  return apiGet<ActionRun>(`/api/workspaces/${workspaceId}/actions/runs/${runId}`);
}
