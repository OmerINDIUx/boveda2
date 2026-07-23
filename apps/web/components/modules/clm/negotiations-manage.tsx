'use client';

import { Check, MessageSquare, Plus, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { ContractDetail } from './types';
import { SectionLoadWarning } from './section-load-warning';
import { formatDate } from './utils';

type Negotiation = ContractDetail['negotiations'][number];

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    proposed: 'Propuesta abierta',
    in_review: 'En revisión',
    accepted: 'Acuerdo aceptado',
    rejected: 'Rechazada',
  };
  return labels[status] ?? status.replaceAll('_', ' ');
}

function isClosed(status: string) {
  return status === 'accepted' || status === 'rejected';
}

export function ContractNegotiationsPage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState('');

  async function load(signal?: AbortSignal) {
    if (!contractId) return;
    const result = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`, undefined, signal);
    setDetail(result);
  }

  useEffect(() => {
    if (!contractId) return;
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal)
      .catch((reason: unknown) => {
        if ((reason as { name?: string })?.name !== 'AbortError') {
          setError('No se pudo cargar el convenio. Verifica tu sesión y el acceso al contrato.');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [contractId]);

  const negotiations = useMemo(
    () => [...(detail?.negotiations ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [detail]
  );
  const openCount = negotiations.filter((item) => !isClosed(item.status)).length;
  const acceptedCount = negotiations.filter((item) => item.status === 'accepted').length;

  async function updateStatus(item: Negotiation, status: string) {
    if (!contractId) return;
    setBusy(`${item.id}-${status}`);
    setError('');
    try {
      const updated = await apiPatch<ContractDetail>(
        `/clm/contracts/${contractId}/negotiations/${item.id}`,
        { status }
      );
      setDetail(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la negociación.');
    } finally {
      setBusy('');
    }
  }

  async function addComment() {
    if (!contractId || !comment.trim()) return;
    setBusy('comment');
    setError('');
    try {
      const updated = await apiPost<ContractDetail>(`/clm/contracts/${contractId}/comments`, {
        body: comment.trim(),
      });
      setDetail(updated);
      setComment('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el comentario.');
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return (
      <article className="card">
        <p className="muted">Cargando convenio y negociaciones...</p>
      </article>
    );
  }

  if (!detail) {
    return (
      <article className="card">
        <p className="muted">{error || 'No se encontró el contrato.'}</p>
      </article>
    );
  }

  return (
    <section className="projects-workspace">
      <SectionLoadWarning detail={detail} section="negotiations" label="las negociaciones" />
      <div className="topbar">
        <div>
          <h1>Convenio y negociaciones</h1>
          <p className="muted">
            Acuerdo bilateral entre tu organización y las partes de {detail.name}.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${detail.id}`}>
            Volver al contrato
          </Link>
          <Link className="button" href={`/clm/${detail.id}/negotiations/new`}>
            <Plus size={16} /> Nueva ronda
          </Link>
        </div>
      </div>

      {error ? (
        <article className="card" style={{ borderColor: 'var(--warning)' }}>
          {error}
        </article>
      ) : null}

      <article className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <small className="muted">Parte interna</small>
            <strong style={{ display: 'block', marginTop: 4 }}>Tu organización</strong>
            <span className="muted">Propone, revisa y documenta el acuerdo</span>
          </div>
          <div
            style={{ display: 'grid', placeItems: 'center', gap: 4, color: 'var(--accent-strong)' }}
          >
            <MessageSquare size={24} />
            <small>CONVENIO</small>
          </div>
          <div style={{ textAlign: 'right' }}>
            <small className="muted">Parte contraparte</small>
            <strong style={{ display: 'block', marginTop: 4 }}>
              {negotiations[0]?.partyName || 'Aún no definida'}
            </strong>
            <span className="muted">Responde y acuerda los términos</span>
          </div>
        </div>
      </article>

      <div className="grid" style={{ marginBottom: 16 }}>
        <article className="card span-4 project-metric info">
          <span className="muted">Rondas registradas</span>
          <strong>{negotiations.length}</strong>
        </article>
        <article className="card span-4 project-metric">
          <span className="muted">Conversaciones abiertas</span>
          <strong>{openCount}</strong>
        </article>
        <article className="card span-4 project-metric">
          <span className="muted">Acuerdos aceptados</span>
          <strong>{acceptedCount}</strong>
        </article>
      </div>

      <div className="grid">
        <article className="card span-8">
          <div
            className="projects-actions"
            style={{ justifyContent: 'space-between', marginBottom: 12 }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Rondas del convenio</h2>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Cada ronda conserva lo solicitado, la propuesta y su resolución.
              </p>
            </div>
            <Link className="button secondary" href={`/clm/${detail.id}/negotiations/new`}>
              <Plus size={15} /> Registrar ronda
            </Link>
          </div>
          {!negotiations.length ? (
            <div className="simple-document-item" style={{ textAlign: 'center', padding: 28 }}>
              <MessageSquare size={30} style={{ margin: '0 auto 8px' }} />
              <strong>El convenio aún no tiene rondas</strong>
              <span>
                Registra la primera propuesta de la contraparte para iniciar la conversación.
              </span>
            </div>
          ) : (
            <div className="simple-document-list">
              {negotiations.map((item, index) => {
                const closed = isClosed(item.status);
                return (
                  <div key={item.id} className="simple-document-item">
                    <div
                      className="projects-actions"
                      style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                    >
                      <div>
                        <small className="muted">
                          Ronda {negotiations.length - index} · {formatDate(item.createdAt)}
                        </small>
                        <strong style={{ display: 'block', marginTop: 3 }}>
                          Conversación con {item.partyName}
                        </strong>
                      </div>
                      <span className="pill">{statusLabel(item.status)}</span>
                    </div>
                    {item.version ? (
                      <small>
                        Sobre {item.version.versionLabel} · {item.version.fileName}
                      </small>
                    ) : null}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 12,
                        marginTop: 10,
                      }}
                    >
                      <div>
                        <small className="muted">Texto original</small>
                        <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>
                          {item.originalText || 'No se registró el texto original.'}
                        </p>
                      </div>
                      <div>
                        <small className="muted">Propuesta / respuesta</small>
                        <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>
                          {item.proposedText || 'Aún no hay una propuesta.'}
                        </p>
                      </div>
                    </div>
                    <div className="projects-actions" style={{ marginTop: 12 }}>
                      {!closed ? (
                        <button
                          className="button secondary"
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => void updateStatus(item, 'in_review')}
                        >
                          <RefreshCw size={14} /> En revisión
                        </button>
                      ) : null}
                      {!closed ? (
                        <button
                          className="button secondary"
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => void updateStatus(item, 'accepted')}
                        >
                          <Check size={14} /> Aceptar acuerdo
                        </button>
                      ) : null}
                      {!closed ? (
                        <button
                          className="button secondary"
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => void updateStatus(item, 'rejected')}
                        >
                          <X size={14} /> Rechazar
                        </button>
                      ) : null}
                      {item.resolvedAt ? (
                        <small className="muted">Resuelta el {formatDate(item.resolvedAt)}</small>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="card span-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} />
            <h2 style={{ margin: 0 }}>Comentarios del convenio</h2>
          </div>
          <p className="muted">
            Usa este hilo para dejar constancia de aclaraciones, contrapropuestas y decisiones entre
            las partes.
          </p>
          <div className="field">
            <label htmlFor="negotiation-comment">Nuevo comentario</label>
            <textarea
              id="negotiation-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Escribe una aclaración o respuesta..."
              rows={4}
            />
          </div>
          <button
            className="button"
            type="button"
            disabled={busy === 'comment' || !comment.trim()}
            onClick={() => void addComment()}
          >
            {busy === 'comment' ? 'Guardando...' : 'Añadir comentario'}
          </button>
          <div className="simple-document-list" style={{ marginTop: 14 }}>
            {(detail.comments ?? []).map((item) => (
              <div key={item.id} className="simple-document-item">
                <strong>{item.author?.name ?? 'Usuario'}</strong>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
                <span style={{ whiteSpace: 'pre-wrap' }}>{item.body}</span>
              </div>
            ))}
            {!detail.comments?.length ? (
              <div className="simple-document-item">Aún no hay comentarios en este convenio.</div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
