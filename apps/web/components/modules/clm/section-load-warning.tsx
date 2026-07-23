'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import type { ContractDetail } from './types';

export function SectionLoadWarning({
  detail,
  section,
  label,
}: {
  detail: ContractDetail;
  section: string;
  label: string;
}) {
  const error = detail.sectionErrors?.[section];
  if (!error) return null;

  return (
    <article className="card" role="alert" style={{ borderColor: 'var(--warning)' }}>
      <div className="panel-header">
        <div>
          <strong>
            <AlertTriangle size={17} /> No se pudo cargar {label}
          </strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            {error}
          </p>
        </div>
        <button className="button secondary" type="button" onClick={() => window.location.reload()}>
          <RefreshCcw size={16} /> Reintentar
        </button>
      </div>
    </article>
  );
}
