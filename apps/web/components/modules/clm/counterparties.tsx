'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';

type CounterpartyItem = {
  id: string;
  businessName: string;
  commercialName?: string;
  rfc: string;
  counterpartyType?: string;
  status: string;
  riskLevel?: string;
  isValidated: boolean;
};

export function CounterpartiesPage() {
  const [items, setItems] = useState<CounterpartyItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<CounterpartyItem[]>('/clm/counterparties')
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(
    (c) =>
      !search ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.rfc.includes(search)
  );

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Contrapartes"
        description="Catálogo central de proveedores, clientes y contrapartes."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          Volver a contratos
        </Link>
      </div>
      <div className="field" style={{ marginBottom: 16 }}>
        <label>Buscar por nombre o RFC</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ej. Proveedor XYZ, XXXX000101XXX"
        />
      </div>
      {loading ? (
        <article className="card">
          <p className="muted">Cargando...</p>
        </article>
      ) : filtered.length === 0 ? (
        <article className="card">
          <p className="muted">No hay contrapartes registradas.</p>
        </article>
      ) : (
        <div className="simple-document-list">
          {filtered.map((c) => (
            <div key={c.id} className="simple-document-item">
              <strong>{c.businessName}</strong>
              <small>
                {c.rfc} · {c.counterpartyType ? normalizeLabel(c.counterpartyType) : 'Sin tipo'} ·{' '}
                {normalizeLabel(c.riskLevel ?? 'Sin riesgo')}
              </small>
              <div style={{ display: 'flex', gap: 4 }}>
                <span className={`pill ${c.status === 'active' ? 'success' : 'danger'}`}>
                  {normalizeLabel(c.status)}
                </span>
                {c.isValidated ? (
                  <span className="pill success">Validado</span>
                ) : (
                  <span className="pill warning">Sin validar</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
