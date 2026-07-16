import { clearSession, getSessionToken } from './auth';
import { buildBrowserApiUrl } from './api-base';

const DEFAULT_TIMEOUT = 30_000;

function handleUnauthorized(response: Response) {
  if (response.status !== 401 || typeof window === 'undefined') {
    return;
  }

  clearSession();

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function resolveToken(token?: string): string | undefined {
  return token ?? getSessionToken();
}

async function readApiError(response: Response, method: string, path: string) {
  try {
    const payload = await response.json();
    if (Array.isArray(payload?.message)) {
      return `[${method} ${path}] ${payload.message.join(', ')}`;
    }
    if (typeof payload?.message === 'string') {
      return `[${method} ${path}] ${payload.message}`;
    }
  } catch {
    try {
      const text = await response.text();
      if (text) return `[${method} ${path}] ${text}`;
    } catch {
      return `[${method} ${path}] API error ${response.status}`;
    }
  }

  return `[${method} ${path}] API error ${response.status}`;
}

async function request<T>(
  method: string,
  path: string,
  options?: { body?: unknown; token?: string; signal?: AbortSignal; timeout?: number }
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options?.timeout ?? DEFAULT_TIMEOUT);

  const externalSignal = options?.signal;
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      throw new DOMException('Aborted', 'AbortError');
    }
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(buildBrowserApiUrl(path), {
      method,
      headers: {
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(resolveToken(options?.token)
          ? { Authorization: `Bearer ${resolveToken(options?.token)}` }
          : {}),
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });

    if (!response.ok) {
      handleUnauthorized(response);
      throw new Error(await readApiError(response, method, path));
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T>(path: string, token?: string, signal?: AbortSignal): Promise<T> {
  return request<T>('GET', path, { token, signal });
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string,
  signal?: AbortSignal
): Promise<T> {
  return request<T>('POST', path, { body, token, signal });
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  token?: string,
  signal?: AbortSignal
): Promise<T> {
  return request<T>('PATCH', path, { body, token, signal });
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  token?: string,
  signal?: AbortSignal
): Promise<T> {
  return request<T>('PUT', path, { body, token, signal });
}

export async function apiDelete<T>(path: string, token?: string, signal?: AbortSignal): Promise<T> {
  return request<T>('DELETE', path, { token, signal });
}
