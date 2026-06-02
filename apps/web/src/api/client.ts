/** Client fetch typé minimal. Les cookies de session sont gérés par le navigateur. */

export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = body?.error ?? `http_${res.status}`;
    throw new ApiError(res.status, message, body?.retryAfter);
  }
  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(path, { credentials: 'same-origin' }).then((r) => parse<T>(r));
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => parse<T>(r));
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return fetch(path, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => parse<T>(r));
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return fetch(path, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => parse<T>(r));
}
