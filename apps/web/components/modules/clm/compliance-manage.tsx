'use client';

import { AlertTriangle, CheckCircle2, Clock3, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch } from '../../../lib/api';
import type { ContractDetail } from './types';
import { SectionLoadWarning } from './section-load-warning';
import { formatDate } from './utils';

type ComplianceKind = 'obligations' | 'milestones';
type Obligation = ContractDetail['obligations'][number];
type Milestone = ContractDetail['milestones'][number];

function isPast(date?: string) {
  if (!date) return false;
  return new Date(`${date}T23:59:59`).getTime() < Date.now();
}

function statusText(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En curso',
    completed: 'Cumplido',
    waived: 'Exento',
    overdue: 'Retrasada',
    delayed: 'Retrasado',
    cancelled: 'Cancelado',
  };
  return labels[status] ?? status.replaceAll('_', ' ');
}

function effectiveStatus(status: string, date?: string) {
  if (!isPast(date) || status === 'completed' || status === 'waived' || status === 'cancelled') {
    return status;
  }
  return status === 'pending' || status === 'in_progress' ? 'overdue' : status;
}

export function ContractCompliancePage({ kind }: { kind: ComplianceKind }) {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    setLoading(true);
    apiGet<ContractDetail>(`/clm/contracts/${contractId}`)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch(() => {
        if (active)
          setMessage(
            'No se pudo cargar la información. Verifica tu sesión y el acceso al contrato.'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contractId]);

  const isObligation = kind === 'obligations';
  const title = isObligation ? 'Obligaciones y cumplimiento' : 'Hitos y cumplimiento';
  const singular = isObligation ? 'obligación' : 'hito';
  const newLabel = isObligation ? 'Nueva obligación' : 'Nuevo hito';
  const items = useMemo(() => {
    if (!detail) return [] as Array<Obligation | Milestone>;
    return isObligation ? detail.obligations : detail.milestones;
  }, [detail, isObligation]);
  const dateFor = (item: Obligation | Milestone) =>
    isObligation ? (item as Obligation).commitmentDate : (item as Milestone).milestoneDate;
  const statusFor = (item: Obligation | Milestone) => effectiveStatus(item.status, dateFor(item));
  const completedCount = items.filter((item) =>
    ['completed', 'waived'].includes(statusFor(item))
  ).length;
  const delayedCount = items.filter((item) =>
    ['overdue', 'delayed'].includes(statusFor(item))
  ).length;
  const openCount = items.length - completedCount - delayedCount;

  async function updateStatus(item: Obligation | Milestone, status: string) {
    if (!contractId) return;
    const resource = isObligation ? 'obligations' : 'milestones';
    const idKey = isObligation ? 'obligationId' : 'milestoneId';
    setBusy(`${item.id}-${status}`);
    setMessage('');
    try {
      const updated = await apiPatch<ContractDetail>(
        `/clm/contracts/${contractId}/${resource}/${item.id}`,
        { status, [idKey]: item.id }
      );
      setDetail(updated);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el cumplimiento.');
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return (
      <article className="card">
        <p className="muted">Cargando seguimiento...</p>
      </article>
    );
  }
  if (!detail) {
    return (
      <article className="card">
        <p className="muted">{message || 'No se encontró el contrato.'}</p>
      </article>
    );
  }

  return (
    <section className="projects-workspace">
      <SectionLoadWarning
        detail={detail}
        section={kind}
        label={isObligation ? 'las obligaciones' : 'los hitos'}
      />
      <div className="topbar">
        <div>
          <h1>{title}</h1>
          <p className="muted">
            Confirma cada cumplimiento y detecta de inmediato lo que va retrasado en {detail.name}.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${detail.id}`}>
            Volver al contrato
          </Link>
          <Link className="button" href={`/clm/${detail.id}/${kind}/new`}>
            {newLabel}
          </Link>
        </div>
      </div>
      {message ? (
        <article className="card" style={{ borderColor: 'var(--warning)' }}>
          {message}
        </article>
      ) : null}

      <div className="grid" style={{ marginBottom: 16 }}>
        <article className="card span-4 project-metric info">
          <span className="muted">Total</span>
          <strong>{items.length}</strong>
        </article>
        <article className="card span-4 project-metric">
          <span className="muted">Pendientes / en curso</span>
          <strong>{openCount}</strong>
        </article>
        <article className="card span-4 project-metric">
          <span className="muted">Cumplidos</span>
          <strong>{completedCount}</strong>
        </article>
      </div>

      <article
        className="card"
        style={{ marginBottom: 16, borderColor: delayedCount ? 'var(--warning)' : undefined }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {delayedCount ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          <div>
            <strong>
              {delayedCount
                ? `${delayedCount} ${singular}${delayedCount === 1 ? '' : 's'} con retraso`
                : 'Sin retrasos detectados'}
            </strong>
            <p className="muted" style={{ margin: '3px 0 0' }}>
              {delayedCount
                ? 'Confirma el retraso o registra el cumplimiento para actualizar el seguimiento.'
                : 'Las fechas registradas están al día.'}
            </p>
          </div>
        </div>
      </article>

      <article className="card">
        <div className="simple-document-list">
          {!items.length ? (
            <div className="simple-document-item">
              Aún no hay {kind === 'obligations' ? 'obligaciones' : 'hitos'} registrados.
            </div>
          ) : null}
          {items.map((item) => {
            const status = statusFor(item);
            const date = dateFor(item);
            const responsible = item.responsibleUser?.name ?? 'Sin responsable';
            const isDone = status === 'completed' || status === 'waived';
            const isLate = status === 'overdue' || status === 'delayed';
            return (
              <div
                key={item.id}
                className="simple-document-item"
                style={{ borderColor: isLate ? 'var(--warning)' : undefined }}
              >
                <div
                  className="projects-actions"
                  style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <div>
                    <strong>
                      {isObligation ? (item as Obligation).description : (item as Milestone).name}
                    </strong>
                    <small style={{ display: 'block', marginTop: 4 }}>
                      {responsible} · Fecha: {formatDate(date)}
                    </small>
                  </div>
                  <span className="pill">{statusText(status)}</span>
                </div>
                <span>
                  {isObligation
                    ? (item as Obligation).comments || 'Sin comentarios.'
                    : (item as Milestone).notes || 'Sin notas.'}
                </span>
                <div className="projects-actions" style={{ marginTop: 10 }}>
                  {!isDone ? (
                    <button
                      className="button"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void updateStatus(item, 'completed')}
                    >
                      <CheckCircle2 size={15} /> Confirmar cumplimiento
                    </button>
                  ) : (
                    <button
                      className="button secondary"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void updateStatus(item, 'pending')}
                    >
                      <RotateCcw size={15} /> Reabrir
                    </button>
                  )}
                  {!isDone && !isLate ? (
                    <button
                      className="button secondary"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void updateStatus(item, 'in_progress')}
                    >
                      <Clock3 size={15} /> Marcar en curso
                    </button>
                  ) : null}
                  {!isDone && isLate ? (
                    <button
                      className="button secondary"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void updateStatus(item, isObligation ? 'overdue' : 'delayed')}
                    >
                      <AlertTriangle size={15} /> Confirmar retraso
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}
