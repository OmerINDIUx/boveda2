'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { SectionHeader } from '../section-header';

type ClauseRef = {
  id: string;
  title: string;
  content: string;
  clauseType?: string;
  riskLevel?: string;
};

type TemplateDetail = {
  id: string;
  name: string;
  description?: string;
  contractType?: string;
  content?: string;
  version: string;
  versionNumber: number;
  isActive: boolean;
  parentTemplateId?: string;
  clauses: ClauseRef[];
};

export function ClmTemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<string>('');
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiGet<TemplateDetail>(`/clm/templates/${id}`)
      .then(setTemplate)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando...</p>
        </article>
      </section>
    );
  if (!template)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Plantilla no encontrada.</p>
        </article>
      </section>
    );

  // Extract variables from content
  const varMatches = template.content?.match(/\{\{(\w+)\}\}/g) ?? [];
  const varNames = [...new Set(varMatches.map((m) => m.replace(/\{\{|\}\}/g, '')))];

  async function handleGenerate() {
    try {
      const result = await apiPost<{ content: string }>(`/clm/templates/${id}/generate`, variables);
      setGenerated(result.content);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="projects-workspace">
      <SectionHeader
        title={template.name}
        description={`Versión ${template.version} · ${template.contractType ?? 'Sin tipo'} · ${template.isActive ? 'Vigente' : 'Inactiva'}`}
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm/templates">
          Volver
        </Link>
        <Link className="button secondary" href={`/clm/templates/new?parentId=${id}`}>
          Nueva versión
        </Link>
        <button className="button" type="button" onClick={() => setShowGenerator(!showGenerator)}>
          Generar contrato
        </button>
      </div>
      {template.description ? (
        <article className="card" style={{ marginBottom: 16 }}>
          <p>{template.description}</p>
        </article>
      ) : null}
      {showGenerator && varNames.length > 0 ? (
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <h2>Variables de la plantilla</h2>
          </div>
          <div className="quick-filters-grid">
            {varNames.map((v) => (
              <div className="field" key={v}>
                <label>{v.replace(/_/g, ' ')}</label>
                <input
                  value={variables[v] ?? ''}
                  onChange={(e) => setVariables((p) => ({ ...p, [v]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <button
            className="button"
            type="button"
            onClick={handleGenerate}
            style={{ marginTop: 12 }}
          >
            Generar
          </button>
        </article>
      ) : null}
      {generated ? (
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <h2>Contrato generado</h2>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.875rem' }}>
            {generated}
          </pre>
        </article>
      ) : null}
      <article className="card">
        <div className="panel-header">
          <h2>Cláusulas ({template.clauses?.length ?? 0})</h2>
        </div>
        <div className="simple-document-list">
          {(template.clauses ?? []).map((c) => (
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
              </div>
              <small>{c.content?.slice(0, 200)}...</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
