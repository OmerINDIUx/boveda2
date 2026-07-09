'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Mail,
  MailOpen,
  Send,
  Paperclip,
  Archive,
  Plus,
  RotateCw,
  ChevronLeft,
  Clock,
  User,
} from 'lucide-react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { getSessionToken } from '../../lib/auth';
import { useTranslation } from 'react-i18next';

type Thread = {
  id: string;
  subjectClean: string;
  lastEmailAt: string;
  emailCount: number;
  isArchived: boolean;
  emails: Email[];
};

type Email = {
  id: string;
  fromAddress: string;
  fromName?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  isRead: boolean;
  receivedAt: string;
  attachments: Array<{ id: string; fileName: string; mimeType?: string; sizeBytes: number }>;
};

type ProjectOption = { id: string; name: string; code: string };

export function EmailsWorkspace() {
  const { t } = useTranslation();
  const token = getSessionToken();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [composing, setComposing] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiGet<ProjectOption[]>('/projects', token);
      setProjects(data);
      if (data.length && !selectedProject) setSelectedProject(data[0].id);
    } catch {
      // Ignore transient load errors in the workspace shell.
    }
  }, [token, selectedProject]);

  const loadThreads = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const data = await apiGet<Thread[]>(`/project-emails/threads/${selectedProject}`, token);
      setThreads(data);
    } catch {
      // Keep the current inbox view when refresh fails.
    }
    setLoading(false);
  }, [selectedProject, token]);

  useEffect(() => {
    loadProjects();
  }, []);
  useEffect(() => {
    loadThreads();
  }, [selectedProject]);

  const openThread = async (threadId: string) => {
    try {
      const data = await apiGet<Thread>(`/project-emails/thread/${threadId}`, token);
      setActiveThread(data);
      for (const email of data.emails.filter((e) => !e.isRead)) {
        apiPatch(`/project-emails/${email.id}/read`, {}, token).catch(() => {
          // Ignore read-sync failures so the thread can still open.
        });
      }
    } catch {
      // Ignore thread open failures and keep the previous panel state.
    }
  };

  const archiveThread = async (threadId: string) => {
    try {
      await apiPatch(`/project-emails/threads/${threadId}/archive`, {}, token);
      setThreads(threads.filter((t) => t.id !== threadId));
      if (activeThread?.id === threadId) setActiveThread(null);
    } catch {
      // Ignore archive failures until the next refresh.
    }
  };

  const sendEmail = async () => {
    if (!to || !subject || !body || !selectedProject) return;
    setSending(true);
    try {
      await apiPost(
        '/project-emails/send',
        { projectId: selectedProject, to, subject, body },
        token
      );
      setComposing(false);
      setTo('');
      setSubject('');
      setBody('');
      loadThreads();
    } catch {
      // Ignore send failures; the draft stays in place.
    }
    setSending(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000)
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString('es-MX', { weekday: 'short' });
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('emails.title')}</h1>
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setActiveThread(null);
            }}
            style={{
              padding: '0.375rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              fontSize: '0.875rem',
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={loadThreads}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
            }}
          >
            <RotateCw size={14} /> Actualizar
          </button>
          <button
            onClick={() => {
              setComposing(true);
              setActiveThread(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            <Plus size={16} /> {t('emails.compose')}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: activeThread || composing ? '1fr 2fr' : '1fr',
          gap: '1rem',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <div className="card" style={{ overflow: 'auto', padding: '0.5rem' }}>
          <div
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
            }}
          >
            {t('emails.inbox')} ({threads.length})
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              {t('common.loading')}
            </div>
          ) : threads.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              {t('emails.no_threads')}
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  setComposing(false);
                  openThread(thread.id);
                }}
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background:
                    activeThread?.id === thread.id ? 'var(--color-primary-light)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '2px',
                }}
                onMouseEnter={(e) => {
                  if (activeThread?.id !== thread.id)
                    e.currentTarget.style.background = 'var(--surface-strong)';
                }}
                onMouseLeave={(e) => {
                  if (activeThread?.id !== thread.id)
                    e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    {thread.emails[0]?.isRead ? (
                      <MailOpen size={14} style={{ color: 'var(--text-tertiary)' }} />
                    ) : (
                      <Mail size={14} style={{ color: 'var(--color-primary)' }} />
                    )}
                    {thread.emails[0]?.fromName ?? thread.emails[0]?.fromAddress ?? 'Desconocido'}
                    {thread.emailCount > 1 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        ({thread.emailCount})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {formatDate(thread.lastEmailAt)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {thread.subjectClean}
                </div>
              </div>
            ))
          )}
        </div>

        {composing && (
          <div className="card" style={{ padding: '1.25rem', overflow: 'auto' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              {t('emails.compose')}
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                  }}
                >
                  {t('emails.to')}
                </label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                  }}
                >
                  {t('emails.subject')}
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                  }}
                >
                  Mensaje
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setComposing(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={sendEmail}
                  disabled={sending || !to || !subject || !body}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    opacity: sending || !to || !subject || !body ? 0.6 : 1,
                  }}
                >
                  <Send size={14} /> {sending ? 'Enviando...' : t('emails.send')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeThread && !composing && (
          <div className="card" style={{ overflow: 'auto', padding: '0' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setActiveThread(null)}
                  style={{
                    padding: '0.375rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  {activeThread.subjectClean}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Clock size={12} /> {activeThread.emailCount} mensajes
                </span>
                <button
                  onClick={() => archiveThread(activeThread.id)}
                  style={{
                    padding: '0.375rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                  }}
                >
                  <Archive size={12} /> Archivar
                </button>
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              {activeThread.emails.map((email) => (
                <div
                  key={email.id}
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: email.isRead ? 'var(--surface)' : 'var(--color-primary-light)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '999px',
                          background: 'var(--surface-strong)',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <User size={12} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {email.fromName ?? email.fromAddress}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {new Date(email.receivedAt).toLocaleString('es-MX')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {email.bodyText ?? email.bodyHtml ?? '(Sin contenido)'}
                  </div>
                  {email.attachments.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        background: 'var(--surface-strong)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-tertiary)',
                          marginBottom: '0.375rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Paperclip size={12} /> {email.attachments.length} adjunto(s)
                      </div>
                      {email.attachments.map((att) => (
                        <div
                          key={att.id}
                          style={{ fontSize: '0.8125rem', color: 'var(--color-primary)' }}
                        >
                          {att.fileName} ({(att.sizeBytes / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
