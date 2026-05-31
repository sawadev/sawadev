import { describe, expect, it } from 'bun:test';
import { CURRENT_VERSION, createApp } from './app';

describe('GET /api/system/version', () => {
  it('renvoie la version courante au format SystemVersion', async () => {
    const app = createApp();
    const res = await app.request('/api/system/version');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      current: CURRENT_VERSION,
      latest: CURRENT_VERSION,
      channel: 'stable',
    });
  });
});
