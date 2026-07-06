'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';

export function NotificationsBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const token = window.localStorage.getItem('holocron_token') ?? undefined;
    if (!token) return;

    const load = async () => {
      const unread = await apiGet<number>('/notifications/unread-count', token);
      setCount(unread);
    };

    load().catch(() => undefined);
  }, []);

  return (
    <div className="notifications-bell">
      <Link className="nav-button notifications-trigger" href="/notifications">
        <Bell size={18} />
        <span>Notificaciones</span>
        {count ? (
          <strong className="notifications-count">{count > 99 ? '99+' : count}</strong>
        ) : null}
      </Link>
    </div>
  );
}
