import { describe, expect, it } from 'bun:test';
import type { AgentMessage } from '@sawadev/shared';
import { buildMessages } from './service';

const msg = (role: 'user' | 'assistant', text: string, i: number): AgentMessage => ({
  id: String(i),
  role,
  text,
  createdAt: i,
});

describe('buildMessages', () => {
  it('compose system + historique + prompt', () => {
    const msgs = buildMessages(
      [msg('user', 'hi', 0), msg('assistant', 'hello', 1)],
      'how are you?',
    );
    expect(msgs[0].role).toBe('system');
    expect(msgs.slice(1)).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'how are you?' },
    ]);
  });

  it("borne l'historique à 10 tours", () => {
    const hist = Array.from({ length: 15 }, (_, i) => msg('user', `m${i}`, i));
    // 1 system + 10 historique + 1 prompt
    expect(buildMessages(hist, 'x')).toHaveLength(12);
  });
});
