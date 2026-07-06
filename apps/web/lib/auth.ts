'use client';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  roles: string[];
};

export function getSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('holocron_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function hasPermission(permission: string): boolean {
  const user = getSessionUser();
  return Boolean(user?.permissions?.includes(permission));
}
