import type { AgentProvider } from './keys';

export type AgentRole = 'user' | 'assistant';

/** Un message de la conversation chat (persisté). */
export interface AgentMessage {
  id: string;
  role: AgentRole;
  text: string;
  createdAt: number;
  /** Fournisseur ayant généré le message (réponses assistant) ; null côté user. */
  provider?: AgentProvider | null;
}

/** Corps de POST /api/workspaces/:id/agent/chat. */
export interface ChatRequest {
  provider: AgentProvider;
  prompt: string;
}

export interface ChatResponse {
  reply: AgentMessage;
}
