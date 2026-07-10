'use client';

import { LogOut } from 'lucide-react';
import { clearSession, getSessionToken } from '../../lib/auth';
import { buildBrowserApiUrl } from '../../lib/api-base';

export function LogoutButton() {
  async function logout() {
    const token = getSessionToken();
    if (token) {
      await fetch(buildBrowserApiUrl('/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }

    clearSession();
    window.location.href = '/login';
  }

  return (
    <button className="nav-button" type="button" onClick={logout}>
      <LogOut size={18} />
      <span>Salir</span>
    </button>
  );
}
