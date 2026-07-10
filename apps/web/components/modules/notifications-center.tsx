'use client';

import { RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { SectionHeader } from './section-header';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  notificationType: string;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
  meta?: { route?: string } | null;
};

type NotificationPreference = {
  notificationType: string;
  label: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  document_expired: 'Documento vencido',
  document_expiring_soon: 'Documento por vencer',
  approval_assigned: 'Aprobación',
  approval_stalled: 'Seguimiento',
  contract_expired: 'Contrato vencido',
  contract_expiring_soon: 'Contrato por vencer',
};

function getNotificationTypeLabel(type: string) {
  return NOTIFICATION_TYPE_LABELS[type] ?? type.replaceAll('_', ' ');
}

export function NotificationsCenter() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const token = window.localStorage.getItem('holocron_token') ?? undefined;
    try {
      const [notifications, prefs] = await Promise.all([
        apiGet<NotificationItem[]>('/notifications', token),
        apiGet<NotificationPreference[]>('/notifications/preferences', token),
      ]);
      setItems(
        notifications.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setPreferences(prefs);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const unreadCount = items.filter((n) => !n.readAt).length;

  const markAllRead = async () => {
    const token = window.localStorage.getItem('holocron_token') ?? undefined;
    try {
      await apiPatch('/notifications/read-all', undefined, token);
      await load();
    } catch {
      // Silently fail
    }
  };

  const togglePreference = async (
    type: string,
    channel: 'inAppEnabled' | 'emailEnabled',
    current: boolean
  ) => {
    setSaving(true);
    const token = window.localStorage.getItem('holocron_token') ?? undefined;
    try {
      await apiPost(
        '/notifications/preferences',
        { notificationType: type, [channel]: !current },
        token
      );
      await load();
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  return (
    <section>
      <SectionHeader
        title="Notificaciones"
        description={`${unreadCount} sin leer`}
        action="Marcar todas como leídas"
        onAction={markAllRead}
      />

      <div className="notifications-grid grid">
        <div className="card notifications-feed span-8">
          <div className="notifications-list-shell" style={{ padding: 'var(--space-2)' }}>
            <div
              className="notifications-page-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.125rem', margin: 0 }}>Bandeja de entrada</h2>
                <Badge variant={unreadCount > 0 ? 'primary' : 'default'}>
                  {unreadCount} sin leer
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={load}>
                <RefreshCcw size={16} />
              </Button>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '1rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <Skeleton variant="title" width="40%" />
                    <Skeleton variant="text" count={2} />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>No hay notificaciones.</p>
              </div>
            ) : (
              <div className="notifications-feed">
                {items.map((item) => (
                  <div key={item.id} className={`notification-card${item.readAt ? '' : ' unread'}`}>
                    <div className="notification-card-top">
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="notification-type-pill">
                          {getNotificationTypeLabel(item.notificationType)}
                        </span>
                        <span
                          className={`notification-state-dot ${item.readAt ? 'read' : 'unread'}`}
                        />
                      </div>
                      <small style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(item.createdAt)}
                      </small>
                    </div>
                    <div className="notification-card-body">
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                    {item.meta?.route && (
                      <Link
                        href={item.meta.route}
                        style={{
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        Ver detalle →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="card notifications-sidebar-card span-4">
          <h2 style={{ fontSize: '1.125rem', margin: '0 0 var(--space-4)' }}>Preferencias</h2>
          {loading ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : (
            <div className="notification-preferences" style={{ display: 'grid', gap: '0.75rem' }}>
              {preferences.map((pref) => (
                <div key={pref.notificationType} className="notification-preference-card">
                  <div className="notification-preference-copy">
                    <strong style={{ fontSize: '0.875rem' }}>{pref.label}</strong>
                  </div>
                  <div
                    className="notification-channel-grid"
                    style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}
                  >
                    <label className="notification-toggle">
                      <input
                        type="checkbox"
                        checked={pref.inAppEnabled}
                        disabled={saving}
                        onChange={() =>
                          togglePreference(pref.notificationType, 'inAppEnabled', pref.inAppEnabled)
                        }
                      />
                      En la app
                    </label>
                    <label className="notification-toggle">
                      <input
                        type="checkbox"
                        checked={pref.emailEnabled}
                        disabled={saving}
                        onChange={() =>
                          togglePreference(pref.notificationType, 'emailEnabled', pref.emailEnabled)
                        }
                      />
                      Correo
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
