'use client';

const DIRECT_API_FALLBACK = 'http://localhost:3001/api';
const BROWSER_PROXY_FALLBACK = '/api/backend';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function canUseDirectApiFromBrowser() {
  if (typeof window === 'undefined') {
    return false;
  }

  return LOCAL_HOSTS.has(window.location.hostname);
}

export function getBrowserApiBaseUrl() {
  if (typeof window === 'undefined') {
    return BROWSER_PROXY_FALLBACK;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configuredUrl) {
    return canUseDirectApiFromBrowser() ? DIRECT_API_FALLBACK : BROWSER_PROXY_FALLBACK;
  }

  if (!canUseDirectApiFromBrowser()) {
    try {
      const parsed = new URL(configuredUrl);
      if (LOCAL_HOSTS.has(parsed.hostname)) {
        return BROWSER_PROXY_FALLBACK;
      }
    } catch {
      return configuredUrl;
    }
  }

  return configuredUrl;
}

export function buildBrowserApiUrl(path: string) {
  return `${getBrowserApiBaseUrl()}${path}`;
}
