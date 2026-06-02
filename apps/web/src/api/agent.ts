import type { AgentMessage, AgentProvider, ChatResponse } from '@sawadev/shared';
import { apiGet, apiPost } from './client';

export function agentMessages(id: string): Promise<AgentMessage[]> {
  return apiGet<AgentMessage[]>(`/api/workspaces/${id}/agent/messages`);
}

export function agentChat(
  id: string,
  provider: AgentProvider,
  prompt: string,
): Promise<ChatResponse> {
  return apiPost<ChatResponse>(`/api/workspaces/${id}/agent/chat`, { provider, prompt });
}

export function agentClear(id: string): Promise<{ ok: true }> {
  return fetch(`/api/workspaces/${id}/agent/messages`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return { ok: true } as const;
  });
}
