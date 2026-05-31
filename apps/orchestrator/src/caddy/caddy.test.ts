import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetConfigCache } from '../config';
import { buildPreviewRoute, deletePreviewRoute, putPreviewRoute } from './client';

describe('buildPreviewRoute', () => {
  it('produit une route reverse_proxy host -> upstream', () => {
    const r = buildPreviewRoute('app-3000', 'app-3000.example.com', 'sawadev-ws-app:3000');
    expect(r['@id']).toBe('app-3000');
    expect(r.match[0].host).toEqual(['app-3000.example.com']);
    expect(r.handle[0].handler).toBe('reverse_proxy');
    expect(r.handle[0].upstreams[0].dial).toBe('sawadev-ws-app:3000');
  });
});

describe('appels Admin API (fetch mocké)', () => {
  const calls: { url: string; method: string; body?: string }[] = [];
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    calls.length = 0;
    resetConfigCache();
    // srv0 absent -> ensureServer PATCH ; routes POST OK ; DELETE OK.
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const u = typeof url === 'string' ? url : url.toString();
      calls.push({ url: u, method: init?.method ?? 'GET', body: init?.body as string });
      if (u.endsWith('/config/apps/http/servers/srv0') && (!init || init.method === undefined)) {
        return new Response('null', { status: 200 });
      }
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('putPreviewRoute crée le serveur puis poste la route', async () => {
    await putPreviewRoute(buildPreviewRoute('x-80', 'x-80.localhost', 'sawadev-ws-x:80'));
    const methods = calls.map((c) => `${c.method} ${new URL(c.url).pathname}`);
    expect(methods).toContain('PATCH /config/apps/http/servers');
    expect(methods).toContain('POST /config/apps/http/servers/srv0/routes');
    const post = calls.find((c) => c.url.endsWith('/routes'));
    expect(post?.body).toContain('"@id":"x-80"');
  });

  it('deletePreviewRoute supprime par @id', async () => {
    await deletePreviewRoute('x-80');
    expect(calls[0]?.method).toBe('DELETE');
    expect(calls[0]?.url).toContain('/id/x-80');
  });
});
