'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';
import { formatCurrency, formatDate } from './utils';

type ContractRequestDetail = {
  id: string;
  contractType: string;
  project?: { id: string; name: string; code: string } | null;
  counterpartyName?: string;
  counterpartyRfc?: string;
  estimatedAmount?: string;
  currency: string;
  startDate?: string;
  endDate?: string;
  requestingArea?: string;
  responsibleUser?: { id: string; name: string } | null;
  urgencyLevel: string;
  riskLevel: string;
  description?: string;
  justification?: string;
  status: string;
  reviewComments?: string;
  reviewedBy?: { id: string; name: string } | null;
  reviewedAt?: string;
  convertedContractId?: string;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
};

export function ContractRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiGet<ContractRequestDetail>(`/clm/requests/${id}`)
      .then(setDetail)
      .catch(() => setError('No se pudo cargar la solicitud.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReview(status: 'approved' | 'rejected') {
    if (!id) return;
    const comments = prompt(
      `Comentarios para ${status === 'approved' ? 'aprobar' : 'rechazar'} la solicitud:`
    );
    if (comments === null) return;
    try {
      const updated = await apiPatch<ContractRequestDetail>(`/clm/requests/${id}/review`, {
        status,
        reviewComments: comments,
      });
      setDetail(updated);
    } catch {
      setError('No se pudo actualizar la solicitud.');
    }
  }

  async function handleConvert() {
    if (!id) return;
    try {
      const result = await apiPost<{ id: string }>(`/clm/requests/${id}/convert`, {});
      router.push(`/clm/${result.id}`);
    } catch {
      setError('No se pudo convertir la solicitud en contrato.');
    }
  }

  if (loading)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando...</p>
        </article>
      </section>
    );
  if (!detail)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">{error || 'Solicitud no encontrada.'}</p>
        </article>
      </section>
    );

  const canReview = detail.status === 'submitted' || detail.status === 'under_review';
  const canConvert = detail.status === 'approved';

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{detail.contractType}</h1>
          <p className="muted">Solicitud de contrato</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/clm/requests">
            Volver
          </Link>
          {canReview && (
            <button
              className="button secondary"
              type="button"
              onClick={() => handleReview('approved')}
            >
              Aprobar
            </button>
          )}
          {canReview && (
            <button
              className="button secondary"
              type="button"
              onClick={() => handleReview('rejected')}
            >
              Rechazar
            </button>
          )}
          {canConvert && (
            <button className="button" type="button" onClick={handleConvert}>
              Convertir en contrato
            </button>
          )}
        </div>
      </div>
      {error ? (
        <article className="card muted" style={{ marginBottom: 16 }}>
          {error}
        </article>
      ) : null}
      <article className="card">
        <div className="project-hero">
          <div>
            <span
              className={`pill ${detail.status === 'approved' || detail.status === 'converted' ? 'success' : detail.status === 'rejected' ? 'danger' : 'warning'}`}
            >
              {normalizeLabel(detail.status)}
            </span>
            <p className="muted">
              {detail.project?.name ?? 'Sin centro de costos'} ·{' '}
              {detail.requestingArea ?? 'Sin área'}
            </p>
          </div>
        </div>
        <div className="project-state-grid">
          <div className="state-card">
            <span>Contraparte</span>
            <strong>{detail.counterpartyName ?? 'Sin dato'}</strong>
          </div>
          <div className="state-card">
            <span>RFC</span>
            <strong>{detail.counterpartyRfc ?? 'Sin dato'}</strong>
          </div>
          <div className="state-card">
            <span>Monto</span>
            <strong>{formatCurrency(detail.estimatedAmount, detail.currency)}</strong>
          </div>
          <div className="state-card">
            <span>Vigencia</span>
            <strong>
              {formatDate(detail.startDate)} - {formatDate(detail.endDate)}
            </strong>
          </div>
          <div className="state-card">
            <span>Urgencia</span>
            <strong>{normalizeLabel(detail.urgencyLevel)}</strong>
          </div>
          <div className="state-card">
            <span>Riesgo</span>
            <strong>{normalizeLabel(detail.riskLevel)}</strong>
          </div>
        </div>
        {detail.description ? <p style={{ marginTop: 12 }}>{detail.description}</p> : null}
        {detail.reviewComments ? (
          <article className="card" style={{ marginTop: 12, background: 'var(--accent-bg)' }}>
            <strong>Comentarios de revisión:</strong>
            <p>{detail.reviewComments}</p>
          </article>
        ) : null}
        <small className="muted" style={{ display: 'block', marginTop: 12 }}>
          Creado por {detail.createdBy?.name ?? 'Usuario'} ·{' '}
          {new Date(detail.createdAt).toLocaleDateString()}
        </small>
      </article>
    </section>
  );
}
