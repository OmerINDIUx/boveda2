'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileText,
  MessageSquare,
  Scale,
  Send,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';
import type { ContractDetail } from './types';
import { buildFallbackDetail, formatDate, getLifecycleLabel } from './utils';

function getBlockers(detail: ContractDetail) {
  const blockers: string[] = [];
  if (!detail.supplierName || !detail.clientName)
    blockers.push('Definir claramente las partes del contrato.');
  if (!detail.amount || !detail.endDate) blockers.push('Completar monto y vigencia del acuerdo.');
  if (!detail.versions.length)
    blockers.push('Subir una version base para empezar la colaboracion.');
  if (!detail.negotiations.length)
    blockers.push('Abrir al menos una ronda de negociacion o acuerdos.');
  if (!detail.signatures.length) blockers.push('Preparar la ruta de firma del documento final.');
  if (!detail.obligations.length && !detail.milestones.length) {
    blockers.push('Traducir el contrato a obligaciones e hitos medibles.');
  }
  return blockers;
}

function getParticipants(detail: ContractDetail) {
  const seen = new Map<string, { label: string; role: string }>();
  if (detail.clientName)
    seen.set(`client:${detail.clientName}`, { label: detail.clientName, role: 'Cliente' });
  if (detail.supplierName)
    seen.set(`supplier:${detail.supplierName}`, { label: detail.supplierName, role: 'Proveedor' });
  for (const item of detail.comments) {
    if (item.author?.name)
      seen.set(`comment:${item.author.name}`, { label: item.author.name, role: 'Colaborador' });
  }
  for (const item of detail.lifecycleHistory) {
    if (item.changedBy?.name)
      seen.set(`life:${item.changedBy.name}`, { label: item.changedBy.name, role: 'Decision' });
  }
  return [...seen.values()].slice(0, 8);
}

export function ContractCollaborationWorkspacePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const result = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`);
        if (!active) return;
        setDetail(result);
      } catch (error: any) {
        if (!active) return;
        const fallback = buildFallbackDetail(contractId);
        if (fallback) {
          setDetail(fallback);
          setMessage('Vista de respaldo del workspace.');
          return;
        }
        setMessage(error?.message ?? 'No se pudo cargar el workspace.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  async function addComment() {
    if (!detail || !commentBody.trim()) return;
    setSavingComment(true);
    setMessage('');
    try {
      const updated = await apiPost<ContractDetail>(`/clm/contracts/${detail.id}/comments`, {
        body: commentBody.trim(),
      });
      setDetail(updated);
      setCommentBody('');
    } catch (error: any) {
      setMessage(error?.message ?? 'No se pudo registrar el comentario.');
    } finally {
      setSavingComment(false);
    }
  }

  const blockers = useMemo(() => (detail ? getBlockers(detail) : []), [detail]);
  const participants = useMemo(() => (detail ? getParticipants(detail) : []), [detail]);
  const latestVersion = detail?.versions?.[0] ?? null;
  const latestNegotiation = detail?.negotiations?.[0] ?? null;
  const latestSignature = detail?.signatures?.[0] ?? null;
  const pendingItems = [
    ...blockers.map((item, index) => ({
      id: `blocker-${index}`,
      label: item,
      type: 'blocker' as const,
    })),
    ...(detail?.obligations ?? [])
      .filter((item) => ['pending', 'overdue'].includes(String(item.status).toLowerCase()))
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        label: `Obligacion: ${item.description}`,
        type: 'obligation' as const,
      })),
  ];

  if (!detail && loading) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando workspace...</p>
        </article>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">{message || 'No se encontro el contrato.'}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Workspace colaborativo</h1>
          <p className="muted">
            Espacio de trabajo para construir el contrato con acuerdos, decisiones y pendientes
            visibles.
          </p>
        </div>
      </div>
      {message ? <article className="card muted">{message}</article> : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(0, 1.45fr) minmax(280px, 1fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <article className="card" style={{ display: 'grid', gap: 14 }}>
          <div>
            <small className="muted">Participantes</small>
            <h2 style={{ marginBottom: 8 }}>{participants.length} involucrados</h2>
            <div className="simple-document-list">
              {participants.map((item) => (
                <div key={`${item.role}-${item.label}`} className="simple-document-item">
                  <strong>{item.label}</strong>
                  <small>{item.role}</small>
                </div>
              ))}
              {!participants.length ? (
                <div className="simple-document-item">Aun no hay participantes detectados.</div>
              ) : null}
            </div>
          </div>
          <div>
            <small className="muted">Ruta actual</small>
            <div className="simple-document-list" style={{ marginTop: 8 }}>
              <div className="simple-document-item">
                <strong>{getLifecycleLabel(detail.lifecycleStage)}</strong>
                <small>Etapa activa desde {formatDate(detail.lifecycleChangedAt)}</small>
              </div>
              {detail.lifecycleHistory.slice(0, 3).map((item) => (
                <div key={item.id} className="simple-document-item">
                  <strong>{getLifecycleLabel(item.stage)}</strong>
                  <small>
                    {item.decision ? `${item.decision} · ` : ''}
                    {formatDate(item.createdAt)}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card" style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: 18,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.06))',
            }}
          >
            <small className="muted">Mesa de trabajo</small>
            <h2 style={{ marginBottom: 8 }}>{detail.name}</h2>
            <p className="muted" style={{ marginBottom: 12 }}>
              {detail.contractType ?? 'Sin tipo'} · {detail.supplierName ?? 'Sin proveedor'} ·{' '}
              {detail.clientName ?? 'Sin cliente'}
            </p>
            <div className="projects-actions">
              <span className="pill info">{normalizeLabel(detail.status)}</span>
              <span className="pill info">{getLifecycleLabel(detail.lifecycleStage)}</span>
            </div>
          </div>

          <div className="grid">
            <article className="card span-6" style={{ padding: 16 }}>
              <div className="panel-header">
                <h2>Documento vivo</h2>
                <FileText size={18} />
              </div>
              {latestVersion ? (
                <div className="simple-document-item">
                  <strong>{latestVersion.versionLabel}</strong>
                  <small>{latestVersion.fileName}</small>
                  <span>{latestVersion.changeSummary ?? 'Sin resumen de cambios.'}</span>
                </div>
              ) : (
                <div className="simple-document-item">No hay version base todavia.</div>
              )}
              <div className="projects-actions" style={{ marginTop: 12 }}>
                <Link className="button secondary" href={`/clm/${detail.id}/versions`}>
                  Gestionar versiones
                </Link>
              </div>
            </article>

            <article className="card span-6" style={{ padding: 16 }}>
              <div className="panel-header">
                <h2>Acuerdos y negociacion</h2>
                <Scale size={18} />
              </div>
              {latestNegotiation ? (
                <div className="simple-document-item">
                  <strong>{latestNegotiation.partyName}</strong>
                  <small>{normalizeLabel(latestNegotiation.status)}</small>
                  <span>
                    {latestNegotiation.proposedText?.slice(0, 220) ?? 'Sin texto propuesto.'}
                  </span>
                </div>
              ) : (
                <div className="simple-document-item">
                  Aun no hay rondas de negociacion registradas.
                </div>
              )}
              <div className="projects-actions" style={{ marginTop: 12 }}>
                <Link className="button secondary" href={`/clm/${detail.id}/negotiations`}>
                  Gestionar negociacion
                </Link>
              </div>
            </article>
          </div>

          <article className="card" style={{ padding: 16 }}>
            <div className="panel-header">
              <h2>Conversacion del contrato</h2>
              <MessageSquare size={18} />
            </div>
            <div className="field">
              <label>Nuevo comentario de trabajo</label>
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                rows={4}
                placeholder="Deja acuerdos, decisiones, dudas o instrucciones para el equipo..."
              />
            </div>
            <div className="projects-actions">
              <button
                className="button"
                type="button"
                onClick={addComment}
                disabled={savingComment}
              >
                <Send size={16} /> {savingComment ? 'Guardando...' : 'Publicar comentario'}
              </button>
              <Link className="button secondary" href={`/clm/${detail.id}/comments`}>
                Ver hilo completo
              </Link>
            </div>
            <div className="simple-document-list" style={{ marginTop: 12 }}>
              {detail.comments.slice(0, 6).map((item) => (
                <div key={item.id} className="simple-document-item">
                  <strong>{item.author?.name ?? 'Usuario'}</strong>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                  <span>{item.body}</span>
                </div>
              ))}
              {!detail.comments.length ? (
                <div className="simple-document-item">Todavia no hay conversacion registrada.</div>
              ) : null}
            </div>
          </article>
        </article>

        <article className="card" style={{ display: 'grid', gap: 14 }}>
          <div>
            <small className="muted">Pendientes de cierre</small>
            <h2 style={{ marginBottom: 8 }}>{pendingItems.length} elementos</h2>
            <div className="simple-document-list">
              {pendingItems.slice(0, 8).map((item) => (
                <div key={item.id} className="simple-document-item">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.type === 'blocker' ? (
                      <CircleDashed size={16} color="var(--warning)" />
                    ) : (
                      <ArrowRight size={16} color="var(--danger)" />
                    )}
                    {item.label}
                  </strong>
                </div>
              ))}
              {!pendingItems.length ? (
                <div className="simple-document-item">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    Sin bloqueos relevantes en este momento.
                  </strong>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <small className="muted">Firma y formalizacion</small>
            <div className="simple-document-list" style={{ marginTop: 8 }}>
              {latestSignature ? (
                <div className="simple-document-item">
                  <strong>{normalizeLabel(latestSignature.status)}</strong>
                  <small>{normalizeLabel(latestSignature.provider)}</small>
                  <span>
                    {latestSignature.signedAt
                      ? `Firmado el ${formatDate(latestSignature.signedAt)}`
                      : 'Aun no concluye la firma.'}
                  </span>
                </div>
              ) : (
                <div className="simple-document-item">
                  No se ha iniciado la formalizacion por firma.
                </div>
              )}
            </div>
          </div>

          <div>
            <small className="muted">Modulos clave</small>
            <div className="projects-actions" style={{ marginTop: 8, gap: 8 }}>
              <Link className="button secondary" href={`/clm/${detail.id}/edit`}>
                Editar contrato
              </Link>
              <Link className="button secondary" href={`/clm/${detail.id}/obligations`}>
                Gestionar obligaciones
              </Link>
              <Link className="button secondary" href={`/clm/${detail.id}/milestones`}>
                Gestionar hitos
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
