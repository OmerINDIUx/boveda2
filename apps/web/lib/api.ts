const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const DEFAULT_TIMEOUT = 30_000;

function handleUnauthorized(response: Response) {
  if (response.status !== 401 || typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem('holocron_token');
  window.localStorage.removeItem('holocron_user');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
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
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });

    if (!response.ok) {
      handleUnauthorized(response);
      throw new Error(await readApiError(response, method, path));
    }

    return response.json() as Promise<T>;
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
