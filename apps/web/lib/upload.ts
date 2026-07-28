import { buildBrowserApiUrl } from './api-base';

const CHUNK_SIZE = 5 * 1024 * 1024;

export async function uploadFile(
  file: File,
  getToken: () => string | null,
  onProgress?: (progress: number) => void
): Promise<{ fileKey: string; fileName: string; mimeType: string; sizeBytes: number }> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  const { uploadId } = await apiPost<{ uploadId: string }>(
    buildBrowserApiUrl('/uploads/init'),
    { fileName: file.name, mimeType: file.type, totalSize: file.size, totalChunks },
    getToken
  );

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const form = new FormData();
    form.append('chunk', chunk, `chunk-${i}`);
    const response = await fetch(buildBrowserApiUrl(`/uploads/${uploadId}/chunks/${i}`), {
      method: 'POST',
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: form,
    });
    if (!response.ok) {
      throw new Error(await readUploadError(response));
    }
    onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
  }

  return apiPost(buildBrowserApiUrl(`/uploads/${uploadId}/complete`), {}, getToken);
}

async function readUploadError(response: Response) {
  try {
    const payload = await response.json();
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
    if (typeof message === 'string' && message.trim()) {
      return `No fue posible subir el archivo: ${message}`;
    }
  } catch {
    // The fallback below still gives the request status when the API did not return JSON.
  }
  return `No fue posible subir el archivo (${response.status} ${response.statusText}).`;
}

async function apiPost<T>(url: string, body: unknown, getToken: () => string | null): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readUploadError(res));
  }
  return res.json();
}
