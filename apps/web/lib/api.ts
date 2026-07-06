const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store'
  });

  if (!response.ok) {
    handleUnauthorized(response);
    throw new Error(await readApiError(response, 'GET', path));
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    handleUnauthorized(response);
    throw new Error(await readApiError(response, 'POST', path));
  }

  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    handleUnauthorized(response);
    throw new Error(await readApiError(response, 'PATCH', path));
  }

  return response.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    handleUnauthorized(response);
    throw new Error(await readApiError(response, 'PUT', path));
  }

  return response.json() as Promise<T>;
}
