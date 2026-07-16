'use client';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  language?: string;
  permissions: string[];
  roles: string[];
};

const PLATFORM_ADMIN_ROLE = 'admin';

const TOKEN_KEY = 'holocron_token';
const USER_KEY = 'holocron_user';
const LANGUAGE_KEY = 'holocron_lang';
const COOKIE_NAME = 'holocron_token';
const COOKIE_MAX_AGE = 60 * 60 * 8;

function writeTokenCookie(token: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearTokenCookie() {
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function hasPermission(permission: string): boolean {
  const user = getSessionUser();
  if (!user) return false;
  if (user.roles?.includes(PLATFORM_ADMIN_ROLE)) return true;
  return Boolean(user.permissions?.includes(permission));
}

export function setSession(token: string, user: SessionUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (user.language) {
    window.localStorage.setItem(LANGUAGE_KEY, user.language);
  }
  writeTokenCookie(token);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  clearTokenCookie();
}

export function getSessionToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(TOKEN_KEY) ?? undefined;
}
