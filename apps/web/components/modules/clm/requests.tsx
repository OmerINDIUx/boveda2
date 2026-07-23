'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';

type ContractRequestItem = {
  id: string;
  contractType: string;
  counterpartyName?: string;
  estimatedAmount?: string;
  currency: string;
  status: string;
  urgencyLevel: string;
  riskLevel: string;
  createdAt: string;
  requestingArea?: string;
  project?: { id: string; name: string; code: string } | null;
};

export function ContractRequestsPage() {
  const [requests, setRequests] = useState<ContractRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await apiGet<ContractRequestItem[]>('/clm/requests');
        if (active) setRequests(data);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  function statusTone(status: string) {
    if (status === 'approved' || status === 'converted') return 'success';
    if (status === 'rejected') return 'danger';
    if (status === 'under_review') return 'warning';
    return '';
  }

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Solicitudes de contrato"
        description="Gestiona las solicitudes de contratos antes de su creación formal."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/clm/requests/new">
          Nueva solicitud
        </Link>
        <Link className="button secondary" href="/clm">
          Volver a contratos
        </Link>
      </div>
      {loading ? (
        <article className="card">
          <p className="muted">Cargando...</p>
        </article>
      ) : requests.length === 0 ? (
        <article className="card">
          <p className="muted">No hay solicitudes registradas.</p>
        </article>
      ) : (
        <div className="simple-document-list">
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/clm/requests/${r.id}`}
              className="simple-document-item"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <strong>{r.contractType}</strong>
                <span className={`pill ${statusTone(r.status)}`}>{normalizeLabel(r.status)}</span>
              </div>
              <small>
                {r.counterpartyName ?? 'Sin contraparte'} · {r.requestingArea ?? 'Sin área'} ·{' '}
                {r.urgencyLevel === 'critical' || r.urgencyLevel === 'high' ? '⚠ ' : ''}
                {normalizeLabel(r.urgencyLevel)}
              </small>
              <small className="muted">
                {r.project?.name ?? 'Sin centro de costos'} ·{' '}
                {new Date(r.createdAt).toLocaleDateString()}
              </small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
