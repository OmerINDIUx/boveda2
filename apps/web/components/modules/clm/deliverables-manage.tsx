'use client';

import { CheckCircle2, Clock3, PackageCheck, RotateCcw, Truck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch } from '../../../lib/api';
import type { ContractDetail } from './types';
import { formatDate } from './utils';

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En preparación',
  delivered: 'Entregado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  overdue: 'Retrasado',
};

export function ContractDeliverablesPage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!contractId) return;
    apiGet<ContractDetail>(`/clm/contracts/${contractId}`)
      .then(setDetail)
      .catch((error: unknown) =>
        setMessage(
          error instanceof Error ? error.message : 'No se pudieron cargar los entregables.'
        )
      );
  }, [contractId]);

  const stats = useMemo(() => {
    const items = detail?.deliverables ?? [];
    return {
      total: items.length,
      delivered: items.filter((item) => item.status === 'delivered').length,
      accepted: items.filter((item) => item.status === 'accepted').length,
      pending: items.filter((item) => !['delivered', 'accepted'].includes(item.status)).length,
    };
  }, [detail]);

  async function updateStatus(id: string, status: string) {
    if (!contractId) return;
    setBusy(`${id}-${status}`);
    setMessage('');
    try {
      setDetail(
        await apiPatch<ContractDetail>(`/clm/contracts/${contractId}/deliverables/${id}`, {
          status,
        })
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el entregable.');
    } finally {
      setBusy('');
    }
  }

  if (!detail) return <article className="card">{message || 'Cargando entregables...'}</article>;

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Entregables</h1>
          <p className="muted">Control final de preparación, entrega y aceptación.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${detail.id}`}>
            Volver al contrato
          </Link>
          <Link className="button" href={`/clm/${detail.id}/deliverables/new`}>
            Nuevo entregable
          </Link>
        </div>
      </div>
      {message ? <article className="card">{message}</article> : null}
      <div className="grid" style={{ marginBottom: 16 }}>
        {[
          ['Total', stats.total],
          ['Pendientes', stats.pending],
          ['Entregados', stats.delivered],
          ['Aceptados', stats.accepted],
        ].map(([label, value]) => (
          <article className="card span-3 project-metric" key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <article className="card">
        <div className="simple-document-list">
          {!detail.deliverables.length ? (
            <div className="simple-document-item">Aún no hay entregables registrados.</div>
          ) : null}
          {detail.deliverables.map((item) => (
            <div className="simple-document-item" key={item.id}>
              <div className="projects-actions" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.name}</strong>
                  <small style={{ display: 'block', marginTop: 4 }}>
                    {item.responsibleUser?.name ?? 'Sin responsable'} · Fecha límite:{' '}
                    {formatDate(item.dueDate)}
                  </small>
                </div>
                <span className="pill">{statusLabels[item.status] ?? item.status}</span>
              </div>
              <span>{item.description || 'Sin descripción.'}</span>
              {item.acceptanceCriteria ? (
                <small>Criterios de aceptación: {item.acceptanceCriteria}</small>
              ) : null}
              <div className="projects-actions" style={{ marginTop: 10 }}>
                {['pending', 'rejected', 'overdue'].includes(item.status) ? (
                  <button
                    className="button secondary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void updateStatus(item.id, 'in_progress')}
                  >
                    <Clock3 size={15} /> Preparar
                  </button>
                ) : null}
                {['pending', 'in_progress', 'overdue'].includes(item.status) ? (
                  <button
                    className="button"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void updateStatus(item.id, 'delivered')}
                  >
                    <Truck size={15} /> Confirmar entrega
                  </button>
                ) : null}
                {item.status === 'delivered' ? (
                  <button
                    className="button"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void updateStatus(item.id, 'accepted')}
                  >
                    <PackageCheck size={15} /> Aceptar entregable
                  </button>
                ) : null}
                {item.status === 'accepted' ? (
                  <button
                    className="button secondary"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void updateStatus(item.id, 'pending')}
                  >
                    <RotateCcw size={15} /> Reabrir
                  </button>
                ) : null}
                {item.status === 'accepted' ? <CheckCircle2 size={18} /> : null}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
