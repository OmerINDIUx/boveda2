import { buildBrowserApiUrl } from './api-base';

const CHUNK_SIZE = 5 * 1024 * 1024;

export async function uploadFile(
  file: File,
  getToken: () => string | null
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
    await fetch(buildBrowserApiUrl(`/uploads/${uploadId}/chunks/${i}`), {
      method: 'POST',
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: form,
    });
  }

  return apiPost(buildBrowserApiUrl(`/uploads/${uploadId}/complete`), {}, getToken);
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
    throw new Error(`Upload failed: ${res.statusText}`);
  }
  return res.json();
}
