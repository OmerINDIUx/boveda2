'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet } from '../../../lib/api';

type ClauseItem = {
  id: string;
  title: string;
  content: string;
  category?: string;
  clauseType?: string;
  riskLevel?: string;
  isActive: boolean;
};

export function ClmClausesListPage() {
  const [clauses, setClauses] = useState<ClauseItem[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<ClauseItem[]>(`/clm/clauses${category ? `?category=${category}` : ''}`)
      .then(setClauses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  const categories = [...new Set(clauses.map((c) => c.category).filter(Boolean))] as string[];

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Biblioteca de cláusulas"
        description="Cláusulas autorizadas para la generación de contratos."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/clm/clauses/new">
          Nueva cláusula
        </Link>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      <div className="field" style={{ marginBottom: 16 }}>
        <label>Filtrar por categoría</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <article className="card">
          <p className="muted">Cargando...</p>
        </article>
      ) : (
        <div className="simple-document-list">
          {clauses.map((c) => (
            <div key={c.id} className="simple-document-item">
              <strong>{c.title}</strong>
              <div style={{ display: 'flex', gap: 4 }}>
                {c.clauseType ? <span className="pill">{c.clauseType}</span> : null}
                {c.riskLevel ? (
                  <span
                    className={`pill ${c.riskLevel === 'high' ? 'danger' : c.riskLevel === 'medium' ? 'warning' : 'info'}`}
                  >
                    {c.riskLevel}
                  </span>
                ) : null}
                {!c.isActive ? <span className="pill danger">Inactiva</span> : null}
              </div>
              <small>
                {c.category ? `${c.category} · ` : ''}
                {c.content?.slice(0, 200)}
              </small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
