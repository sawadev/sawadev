import type { AgentProvider, ChatRequest } from '@sawadev/shared';
import { Hono } from 'hono';
import { chat, clearMessages, listMessages } from './service';

function isProvider(p: string): p is AgentProvider {
  return p === 'anthropic' || p === 'openai' || p === 'cursor' || p === 'gemma';
}

/** Routes /api/workspaces/:id/agent. Montées derrière requireSession (cf. app.ts). */
export function agentRoutes(): Hono {
  const app = new Hono();

  app.get('/:id/agent/messages', (c) => c.json(listMessages(c.req.param('id'))));

  app.delete('/:id/agent/messages', (c) => {
    clearMessages(c.req.param('id'));
    return c.json({ ok: true });
  });

  app.post('/:id/agent/chat', async (c) => {
    const body = (await c.req.json().catch(() => null)) as ChatRequest | null;
    const prompt = body?.prompt?.trim();
    const provider = body?.provider ?? 'anthropic';
    if (!prompt) return c.json({ error: 'empty_prompt' }, 400);
    if (!isProvider(provider)) return c.json({ error: 'unknown_provider' }, 400);
    const reply = await chat(c.req.param('id'), provider, prompt);
    return c.json({ reply });
  });

  return app;
}
