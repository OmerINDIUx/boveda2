'use client';

import { CheckCheck, Mail, Monitor, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { SectionHeader } from './section-header';

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
  approval_assigned: 'Aprobacion',
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
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const token = window.localStorage.getItem('holocron_token') ?? undefined;
    if (!token) return;
    setLoading(true);
    try {
      const [notifications, prefs] = await Promise.all([
        apiGet<NotificationItem[]>('/notifications', token),
        apiGet<NotificationPreference[]>('/notifications/preferences', token),
      ]);
      setItems(notifications);
      setPreferences(prefs);
      setMessage(null);
    } catch {
      setMessage('No fue posible cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const markAsRead = async (id: string) => {
    const token = window.localStorage.getItem('holocron_token') ?? undefined;
    if (!token) return;
    await apiPatch(`/notifications/${id}/read`, {}, token);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item
      )
    );
  };

  const markAllAsRead = async () => {
    const token = window.localStorage.getItem('holocron_token') ?? undefined;
    if (!token) return;
    await apiPatch('/notifications/read-all', {}, token);
    setItems((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))
    );
  };

  const savePreferences = async () => {
    const token = window.localStorage.getItem('holocron_token') ?? undefined;
    if (!token) return;
    setSaving(true);
    try {
      const result = await apiPost<NotificationPreference[]>(
        '/notifications/preferences',
        { items: preferences },
        token
      );
      setPreferences(result);
      setMessage('Preferencias guardadas.');
    } catch {
      setMessage('No fue posible guardar las preferencias.');
    } finally {
      setSaving(false);
    }
  };

  const unread = items.filter((item) => !item.readAt).length;
  const read = items.length - unread;

  return (
    <>
      <SectionHeader
        title="Notificaciones"
        description="Vista completa para revisar alertas, abrir el detalle y mantener tus avisos realmente legibles."
      />
      {message ? (
        <div className="card">
          <span>{message}</span>
        </div>
      ) : null}

      <div className="notifications-summary-grid">
        <div className="card notification-summary-card">
          <span>Total</span>
          <strong>{items.length}</strong>
          <small className="muted">Alertas registradas en tu centro.</small>
        </div>
        <div className="card notification-summary-card attention">
          <span>Sin leer</span>
          <strong>{unread}</strong>
          <small className="muted">
            {unread ? 'Requieren tu atencion.' : 'No tienes pendientes.'}
          </small>
        </div>
        <div className="card notification-summary-card">
          <span>Leidas</span>
          <strong>{read}</strong>
          <small className="muted">Ya revisadas en la plataforma.</small>
        </div>
      </div>

      <div className="grid notifications-page-grid">
        <section className="span-8 notifications-feed">
          <div className="card notifications-list-shell">
            <div className="panel-header notifications-page-header">
              <div>
                <h2>Bandeja</h2>
                <small className="muted">{unread ? `${unread} sin leer` : 'Todo al dia'}</small>
              </div>
              <div className="notifications-actions">
                <button className="button secondary" type="button" onClick={() => load()}>
                  <RefreshCcw size={16} />
                  Actualizar
                </button>
                <button className="button" type="button" onClick={() => markAllAsRead()}>
                  <CheckCheck size={16} />
                  Marcar todas
                </button>
              </div>
            </div>

            <div className="notifications-list">
              {loading ? (
                <div className="preview-empty">
                  <p>Cargando notificaciones...</p>
                </div>
              ) : items.length ? (
                items.map((item) => (
                  <article
                    className={`notification-card ${item.readAt ? '' : 'unread'}`}
                    key={item.id}
                  >
                    <div className="notification-card-top">
                      <span className="notification-type-pill">
                        {getNotificationTypeLabel(item.notificationType)}
                      </span>
                      <small>{new Date(item.createdAt).toLocaleString('es-MX')}</small>
                    </div>

                    <div className="notification-card-body">
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>

                    <div className="notification-card-footer">
                      <div className="notification-card-state">
                        <span
                          className={`notification-state-dot ${item.readAt ? 'read' : 'unread'}`}
                        />
                        <small>{item.readAt ? 'Leida' : 'Pendiente de lectura'}</small>
                      </div>

                      <div className="notifications-actions">
                        {item.meta?.route ? (
                          <Link className="button secondary" href={item.meta.route}>
                            Ver detalle
                          </Link>
                        ) : null}
                        <button
                          className="button"
                          type="button"
                          disabled={Boolean(item.readAt)}
                          onClick={() => markAsRead(item.id)}
                        >
                          {item.readAt ? 'Leida' : 'Marcar como leida'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="preview-empty">
                  <p>No hay notificaciones registradas todavia.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="card span-4 notifications-sidebar-card">
          <div className="panel-header notifications-page-header">
            <div>
              <h2>Preferencias</h2>
              <small className="muted">Activa o desactiva avisos por canal.</small>
            </div>
          </div>
          <div className="notification-preferences">
            {preferences.map((item, index) => (
              <div className="notification-preference-card" key={item.notificationType}>
                <div className="notification-preference-copy">
                  <strong>{item.label}</strong>
                  <small className="muted">Configura como quieres recibir esta alerta.</small>
                </div>
                <div className="notification-channel-grid">
                  <label className="notification-toggle">
                    <Monitor size={16} />
                    <span>Plataforma</span>
                    <input
                      checked={item.inAppEnabled}
                      onChange={(event) =>
                        setPreferences((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index
                              ? { ...row, inAppEnabled: event.target.checked }
                              : row
                          )
                        )
                      }
                      type="checkbox"
                    />
                  </label>
                  <label className="notification-toggle">
                    <Mail size={16} />
                    <span>Correo</span>
                    <input
                      checked={item.emailEnabled}
                      onChange={(event) =>
                        setPreferences((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index
                              ? { ...row, emailEnabled: event.target.checked }
                              : row
                          )
                        )
                      }
                      type="checkbox"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              className="button"
              disabled={saving}
              type="button"
              onClick={() => savePreferences()}
            >
              {saving ? 'Guardando...' : 'Guardar preferencias'}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
