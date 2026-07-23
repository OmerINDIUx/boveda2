'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';
import type { ContractDetail } from './types';
import { formatCurrency, formatDate, getErrorMessage } from './utils';

export function ContractOriginalPage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!contractId) return;
    apiGet<ContractDetail>(`/clm/contracts/${contractId}`)
      .then(setDetail)
      .catch((error) =>
        setMessage(getErrorMessage(error, 'No se pudo cargar el contrato original.'))
      );
  }, [contractId]);

  if (!detail)
    return (
      <article className="card">
        <p className="muted">{message || 'Cargando contrato original...'}</p>
      </article>
    );
  const baseline = detail.currentVersion ?? detail.versions[0] ?? null;
  const locked = ['active', 'expiring_soon', 'expired', 'renewed', 'closed'].includes(
    detail.status
  );

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Contrato original</h1>
          <p className="muted">Línea base del expediente contractual.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${detail.id}/versions`}>
            Ver todas las versiones
          </Link>
          <Link className="button" href={`/clm/${detail.id}/signatures`}>
            Firmas
          </Link>
        </div>
      </div>
      <div className="quick-filters-grid" style={{ marginBottom: 16 }}>
        <article className="card">
          <small className="muted">Estado contractual</small>
          <h2>{normalizeLabel(detail.status)}</h2>
        </article>
        <article className="card">
          <small className="muted">Monto original</small>
          <h2>{formatCurrency(detail.amount ?? '0', detail.currency)}</h2>
        </article>
        <article className="card">
          <small className="muted">Vigencia</small>
          <h2>
            {formatDate(detail.startDate)} — {formatDate(detail.endDate)}
          </h2>
        </article>
      </div>
      <article className="card">
        <div className="panel-header">
          <div>
            <h2>{detail.name}</h2>
            <p className="muted">
              {detail.contractType ?? 'Contrato'} · {detail.project?.name ?? 'Centro de costos'}
            </p>
          </div>
          <span className={`pill ${locked ? 'success' : 'warning'}`}>
            {locked ? 'Línea base protegida' : 'En preparación'}
          </span>
        </div>
        <div className="quick-filters-grid">
          <div className="field">
            <label>Proveedor / contratista</label>
            <strong>{detail.supplierName ?? 'Sin registrar'}</strong>
          </div>
          <div className="field">
            <label>Cliente / contratante</label>
            <strong>{detail.clientName ?? 'Sin registrar'}</strong>
          </div>
          <div className="field">
            <label>Área responsable</label>
            <strong>{detail.responsibleArea ?? 'Sin registrar'}</strong>
          </div>
          <div className="field">
            <label>Versión vigente</label>
            <strong>{baseline?.versionLabel ?? 'Sin documento base'}</strong>
          </div>
        </div>
        {baseline ? (
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            <div className="simple-document-item">
              <strong>{baseline.fileName}</strong>
              <small>
                Versión {baseline.versionLabel} · {formatDate(baseline.createdAt)}
              </small>
              <span>
                {baseline.changeSummary ?? 'Documento designado como versión vigente del contrato.'}
              </span>
            </div>
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 16 }}>
            Todavía no se ha cargado el documento original.
          </p>
        )}
        <p className="muted" style={{ marginTop: 16 }}>
          Los cambios posteriores deben registrarse como convenios modificatorios u órdenes de
          cambio; no alteran esta línea base.
        </p>
      </article>
    </section>
  );
}
