'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet, apiPost } from '../../../lib/api';
import { Project, FilePayload } from './types';
import { fileToPayload, getErrorMessage } from './utils';

type ImportResult = { total: number; success: number; errors?: unknown[] };

export function ClmImportPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [file, setFile] = useState<FilePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    async function load() {
      try {
        const p = await apiGet<Project[]>('/projects');
        setProjects(p);
      } catch (projectError) {
        setProjects([]);
        setError(getErrorMessage(projectError, 'No se pudieron cargar los centros de costos.'));
      }
    }
    void load();
  }, []);
  async function submit() {
    if (!projectId || !file) {
      setError('Selecciona centro de costos y archivo CSV.');
      return;
    }
    setSaving(true);
    setError('');
    setResult(null);
    try {
      const r = await apiPost<ImportResult>('/clm/contracts/import', {
        projectId,
        fileName: file.fileName,
        base64Content: file.base64Content,
      });
      setResult(r);
    } catch (e) {
      setError(getErrorMessage(e, 'Error al importar.'));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <SectionHeader title="Importar contratos" description="Carga masiva desde archivo CSV." />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="field">
          <label>Centro de costos</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Selecciona</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Archivo CSV</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setFile(await fileToPayload(f));
            }}
          />
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Importando...' : 'Importar'}
          </button>
        </div>
        {result ? (
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            <div className="simple-document-item">
              <strong>Resultado</strong>
              <span>
                Total: {result.total} · Correctos: {result.success} · Errores:{' '}
                {result.errors?.length ?? 0}
              </span>
            </div>
          </div>
        ) : null}
      </article>
    </section>
  );
}
