'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
  async function logout() {
    const token = window.localStorage.getItem('holocron_token');
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }

    window.localStorage.removeItem('holocron_token');
    window.localStorage.removeItem('holocron_user');
    window.location.href = '/login';
  }

  return (
    <button className="nav-button" type="button" onClick={logout}>
      <LogOut size={18} />
      <span>Salir</span>
    </button>
  );
}
