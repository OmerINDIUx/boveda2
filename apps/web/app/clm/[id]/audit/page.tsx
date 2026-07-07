'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '../../../../lib/api';
import { ContractAuditSection } from '../../../../components/modules/clm-pages';

type ContractDetail = {
  id: string;
  name: string;
  projectId?: string;
  status: string;
  contractType?: string;
  supplierName?: string;
  clientName?: string;
  audit: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor?: { id: string; name: string } | null;
  }>;
  [key: string]: unknown;
};

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

export default function ClmAuditRoute() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`, getToken());
        if (active) setDetail(response);
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
  }, [contractId]);

  if (loading)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando auditoría...</p>
        </article>
      </section>
    );
  if (!detail)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">No se pudo cargar el contrato.</p>
        </article>
      </section>
    );

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Auditoría: {detail.name}</h1>
          <p className="muted">
            {detail.contractType ?? 'Sin tipo'} &middot;{' '}
            {detail.supplierName ?? detail.clientName ?? 'Sin parte'}
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Volver al contrato
          </Link>
        </div>
      </div>
      <ContractAuditSection detail={detail as never} />
    </section>
  );
}
