'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet } from '../../../lib/api';

type TemplateItem = {
  id: string;
  name: string;
  description?: string;
  contractType?: string;
  version: string;
  isActive: boolean;
};

export function ClmTemplatesListPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<TemplateItem[]>('/clm/templates')
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Plantillas"
        description="Gestiona las plantillas de contratos autorizadas."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/clm/templates/new">
          Nueva plantilla
        </Link>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      {loading ? (
        <article className="card">
          <p className="muted">Cargando...</p>
        </article>
      ) : (
        <div className="simple-document-list">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/clm/templates/${t.id}`}
              className="simple-document-item"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <strong>{t.name}</strong>
              <div style={{ display: 'flex', gap: 4 }}>
                <span className="pill">v{t.version}</span>
                {t.isActive ? (
                  <span className="pill success">Vigente</span>
                ) : (
                  <span className="pill danger">Inactiva</span>
                )}
              </div>
              <small>
                {t.contractType ?? 'Sin tipo'} · {t.description ?? ''}
              </small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
