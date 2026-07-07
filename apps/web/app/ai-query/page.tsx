'use client';

import {
  Bot,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RequirePermission } from '../../components/auth/require-permission';
import { SectionHeader } from '../../components/modules/section-header';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { PermissionKey } from '../../lib/permissions';

type ProjectOption = { id: string; name: string; code: string };
type DocumentOption = { id: string; name: string; documentNumber: string };
type Citation = {
  documentId: string;
  documentName: string;
  versionLabel: string;
  pageNumber?: number;
  sectionLabel?: string;
  fragment: string;
  score: number;
};
type QueryResponse = {
  id: string;
  question: string;
  answer: string;
  status: 'answered' | 'insufficient_information' | 'error';
  scopedDocumentCount: number;
  citations: Citation[];
};
type SessionItem = {
  id: string;
  name?: string;
  projectId?: string;
  documentId?: string;
  createdAt: string;
};
type HistoryMessage = {
  id: string;
  question: string;
  answer: string;
  status: 'answered' | 'insufficient_information' | 'error';
  citationsJson?: Citation[];
  createdAt: string;
};

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

function formatStatus(status: QueryResponse['status']) {
  if (status === 'answered') return 'Respondida';
  if (status === 'insufficient_information') return 'Sin evidencia suficiente';
  return 'Error';
}

export default function AiQueryPage() {
  const [question, setQuestion] = useState('');
  const [projectId, setProjectId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialDocumentId = params.get('documentId') ?? '';

    async function loadBase() {
      const token = getToken();
      if (!token) return;

      const [projectsRes, documentsRes, sessionsRes] = await Promise.allSettled([
        apiGet<ProjectOption[]>('/projects', token),
        apiGet<DocumentOption[]>('/documents', token),
        apiGet<SessionItem[]>('/ai-query/sessions', token),
      ]);

      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value);
      if (documentsRes.status === 'fulfilled') setDocuments(documentsRes.value);
      if (sessionsRes.status === 'fulfilled') setSessions(sessionsRes.value);

      if (initialDocumentId) {
        setDocumentId(initialDocumentId);
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.length > 0) {
        const lastSession = sessionsRes.value[0];
        setActiveSessionId(lastSession.id);
        try {
          const history = await apiGet<HistoryMessage[]>(
            `/ai-query/sessions/${lastSession.id}/history`,
            token
          );
          setMessages(history.reverse());
        } catch {
          // History not critical
        }
      }
    }

    void loadBase();
  }, []);

  async function loadSessionMessages(sessionId: string) {
    try {
      const history = await apiGet<HistoryMessage[]>(
        `/ai-query/sessions/${sessionId}/history`,
        getToken()
      );
      setMessages(history.reverse());
    } catch {
      setMessages([]);
    }
  }

  async function createNewSession(docId?: string) {
    try {
      const session = await apiPost<SessionItem>(
        '/ai-query/sessions',
        { projectId: projectId || undefined, documentId: docId || documentId || undefined },
        getToken()
      );
      setActiveSessionId(session.id);
      setDocumentId(docId || documentId);
      setMessages([]);
      setSessions((prev) => [session, ...prev]);
    } catch {
      // Silently fail, user can retry
    }
  }

  async function startConversationAboutDocument(docId: string) {
    await createNewSession(docId);
  }

  async function deleteSession(sessionId: string) {
    await apiDelete(`/ai-query/sessions/${sessionId}`, getToken());
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const next = sessions.find((s) => s.id !== sessionId);
      if (next) {
        setActiveSessionId(next.id);
        loadSessionMessages(next.id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  }

  function selectSession(sessionId: string) {
    setActiveSessionId(sessionId);
    loadSessionMessages(sessionId);
  }

  async function ensureSession() {
    if (activeSessionId) return activeSessionId;
    try {
      const session = await apiPost<SessionItem>('/ai-query/sessions', {}, getToken());
      setActiveSessionId(session.id);
      setSessions((prev) => [session, ...prev]);
      return session.id;
    } catch {
      return null;
    }
  }

  async function askQuestion() {
    if (!question.trim()) return;

    const sessionId = await ensureSession();
    if (!sessionId) return;

    const userQuestion = question;
    setQuestion('');

    setMessages((prev) => [
      ...prev,
      {
        id: 'temp-' + Date.now(),
        question: userQuestion,
        answer: '',
        status: 'answered',
        citationsJson: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(true);

    try {
      const response = await apiPost<QueryResponse>(
        '/ai-query/ask',
        {
          question: userQuestion,
          sessionId,
          projectId: projectId || undefined,
          documentId: documentId || undefined,
        },
        getToken()
      );

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          id: response.id,
          question: response.question,
          answer: response.answer,
          status: response.status,
          citationsJson: response.citations,
          createdAt: new Date().toISOString(),
        };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          id: 'error-' + Date.now(),
          question: userQuestion,
          answer: 'Error al obtener respuesta. Intenta de nuevo.',
          status: 'error',
          citationsJson: [],
          createdAt: new Date().toISOString(),
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleSources(messageId: string) {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }

  const chatBodyStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const msgUserStyle: React.CSSProperties = {
    alignSelf: 'flex-end',
    maxWidth: '70%',
    background: 'var(--color-primary)',
    color: '#fff',
    borderRadius: '16px 16px 4px 16px',
    padding: '12px 16px',
    fontSize: 'var(--font-base)',
    lineHeight: 1.5,
  };

  const msgAiStyle: React.CSSProperties = {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px 16px 16px 4px',
    padding: '12px 16px',
    fontSize: 'var(--font-base)',
    lineHeight: 1.5,
  };

  return (
    <RequirePermission permission={PermissionKey.AiQuery}>
      <SectionHeader
        title="Consulta IA"
        description="Conversa con tus documentos. Pregunta solo sobre contenido autorizado."
      />

      <div
        style={{
          display: 'flex',
          gap: 16,
          height: 'calc(100vh - 200px)',
          minHeight: 480,
        }}
      >
        {sidebarOpen && (
          <div
            style={{
              width: 280,
              minWidth: 280,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              className="card"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <div className="panel-header">
                <h2 style={{ fontSize: 15 }}>Sesiones</h2>
                <button
                  className="button-icon"
                  type="button"
                  onClick={() => createNewSession()}
                  title="Nueva sesion"
                  style={{
                    width: 28,
                    height: 28,
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="field">
                <label style={{ fontSize: 12 }}>Proyecto</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  style={{ minHeight: 34, fontSize: 13 }}
                >
                  <option value="">Todos</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label style={{ fontSize: 12 }}>Documento</label>
                <select
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  style={{ minHeight: 34, fontSize: 13 }}
                >
                  <option value="">Todos</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.documentNumber} · {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', marginTop: 4 }}>
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSession(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: 6,
                      background:
                        activeSessionId === s.id ? 'var(--color-primary-light)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    <MessageSquare size={14} style={{ minWidth: 14 }} />
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.name ?? `Sesion ${new Date(s.createdAt).toLocaleDateString()}`}
                    </span>
                    {activeSessionId === s.id && (
                      <Trash2
                        size={12}
                        style={{ minWidth: 12, color: 'var(--muted)', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          className="card"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <button
              className="button-icon"
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={{
                width: 28,
                height: 28,
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={14} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {activeSessionId
                ? (sessions.find((s) => s.id === activeSessionId)?.name ??
                  `Sesion ${new Date(
                    sessions.find((s) => s.id === activeSessionId)?.createdAt ?? Date.now()
                  ).toLocaleDateString()}`)
                : 'Nueva consulta'}
            </span>
          </div>

          {messages.length === 0 && !loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)',
                fontSize: 14,
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <Bot size={40} strokeWidth={1} />
              <span>Escribe tu primera pregunta para empezar</span>
            </div>
          ) : (
            <div style={chatBodyStyle}>
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div style={msgUserStyle}>{msg.question}</div>
                  {msg.answer ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={msgAiStyle}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 6,
                          }}
                        >
                          <Bot size={14} />
                          <span
                            className={`pill ${msg.status === 'answered' ? 'success' : 'warning'}`}
                            style={{ fontSize: 11, minHeight: 20 }}
                          >
                            {formatStatus(msg.status)}
                          </span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.answer}</div>

                        {msg.citationsJson && msg.citationsJson.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleSources(msg.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                padding: '4px 0',
                                marginTop: 8,
                                fontSize: 12,
                                color: 'var(--color-primary)',
                              }}
                            >
                              {expandedSources.has(msg.id) ? (
                                <ChevronDown size={12} />
                              ) : (
                                <ChevronRight size={12} />
                              )}
                              <FileText size={12} />
                              {msg.citationsJson.length} fuente
                              {msg.citationsJson.length !== 1 ? 's' : ''}
                            </button>

                            {expandedSources.has(msg.id) && (
                              <div
                                style={{
                                  marginTop: 8,
                                  display: 'grid',
                                  gap: 8,
                                }}
                              >
                                {msg.citationsJson.map((cite, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      padding: '8px 10px',
                                      background: 'var(--surface-strong)',
                                      borderRadius: 8,
                                      fontSize: 12,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 4,
                                      }}
                                    >
                                      <span style={{ fontWeight: 600 }}>{cite.documentName}</span>
                                      <span style={{ color: 'var(--muted)' }}>
                                        v{cite.versionLabel}
                                        {cite.pageNumber ? ` · Pag ${cite.pageNumber}` : ''}
                                        {cite.sectionLabel ? ` · ${cite.sectionLabel}` : ''}
                                      </span>
                                    </div>
                                    <p
                                      style={{
                                        margin: '0 0 6px',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {cite.fragment}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startConversationAboutDocument(cite.documentId)
                                      }
                                      title="Abrir nueva conversación sobre este documento"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '4px 10px',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: 6,
                                        background: 'transparent',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        fontSize: 11,
                                        fontWeight: 600,
                                      }}
                                    >
                                      <MessageSquare size={11} />
                                      Consultar este documento
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, ...msgAiStyle }}>
                      <Bot size={14} />
                      <span style={{ marginLeft: 6, color: 'var(--muted)' }}>Pensando...</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  askQuestion();
                }
              }}
              placeholder="Escribe tu pregunta aqui..."
              disabled={loading}
              style={{
                flex: 1,
                minHeight: 40,
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '0 12px',
                fontSize: 14,
                background: '#fff',
              }}
            />
            <button
              className="button"
              type="button"
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              style={{
                opacity: loading || !question.trim() ? 0.5 : 1,
              }}
            >
              <Send size={16} />
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </RequirePermission>
  );
}
