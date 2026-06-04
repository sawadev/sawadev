import { getConfig } from '../config';

/**
 * Pilotage des routes dynamiques de Caddy via son Admin API (PLAN §6.5).
 * L'Admin API n'est jamais exposée publiquement (localhost:2019).
 */

export interface CaddyRoute {
  '@id': string;
  match: [{ host: string[] }];
  handle: [{ handler: 'reverse_proxy'; upstreams: [{ dial: string }] }];
}

/** Construit l'objet route Caddy (fonction pure, testable). */
export function buildPreviewRoute(id: string, hostname: string, upstream: string): CaddyRoute {
  return {
    '@id': id,
    match: [{ host: [hostname] }],
    handle: [{ handler: 'reverse_proxy', upstreams: [{ dial: upstream }] }],
  };
}

const SERVER = 'srv0';

async function admin(path: string, init?: RequestInit): Promise<Response> {
  const { caddyAdmin } = getConfig();
  return fetch(`${caddyAdmin}${path}`, init);
}

/** Crée le serveur HTTP de base s'il n'existe pas encore. */
export async function ensureServer(): Promise<void> {
  const { previewScheme } = getConfig();
  const res = await admin(`/config/apps/http/servers/${SERVER}`);
  if (res.ok) {
    const body = await res.json().catch(() => null);
    if (body) return;
  }
  const listen = previewScheme === 'https' ? [':443'] : [':80'];
  await admin('/config/apps/http/servers', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ [SERVER]: { listen, routes: [] } }),
  });
}

/** Ajoute (ou remplace) une route de preview. */
export async function putPreviewRoute(route: CaddyRoute): Promise<void> {
  await ensureServer();
  // Idempotent : retire une éventuelle route existante de même @id.
  await admin(`/id/${route['@id']}`, { method: 'DELETE' }).catch(() => undefined);
  // Insertion EN TÊTE (index 0) : le Caddyfile place un catch-all `*.{domaine}`
  // terminal (respond 404) avant nos routes. Un POST (append) tomberait derrière
  // ce catch-all qui matche aussi `<sous-domaine>.{domaine}` → 404. On passe donc
  // devant lui via PUT à l'index 0.
  const res = await admin(`/config/apps/http/servers/${SERVER}/routes/0`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(route),
  });
  if (!res.ok) throw new Error(`caddy_route_failed_${res.status}`);
}

/** Supprime une route de preview par son @id (sous-domaine). */
export async function deletePreviewRoute(id: string): Promise<void> {
  await admin(`/id/${id}`, { method: 'DELETE' }).catch(() => undefined);
}
