'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../../../lib/api';
import { SectionHeader } from '../section-header';
import { TextField } from './utils';

export function ClmClauseCreatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: '',
    content: '',
    clauseType: 'standard',
    riskLevel: 'low',
    jurisdiction: '',
    applicableContractType: '',
    alternativeText: '',
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Título y contenido son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost('/clm/clauses', form);
      router.push('/clm/clauses');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Nueva cláusula"
        description="Agrega una cláusula autorizada a la biblioteca."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm/clauses">
          Volver
        </Link>
      </div>
      {error ? (
        <article className="card muted" style={{ marginBottom: 16 }}>
          {error}
        </article>
      ) : null}
      <form onSubmit={handleSubmit}>
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="quick-filters-grid">
            <TextField label="Título *" value={form.title} onChange={(v) => set('title', v)} />
            <TextField
              label="Categoría"
              value={form.category}
              onChange={(v) => set('category', v)}
            />
          </div>
          <div className="quick-filters-grid">
            <div className="field">
              <label>Tipo</label>
              <select value={form.clauseType} onChange={(e) => set('clauseType', e.target.value)}>
                <option value="standard">Estándar</option>
                <option value="alternative">Alternativa</option>
                <option value="prohibited">Prohibida</option>
                <option value="mandatory">Obligatoria</option>
                <option value="requires_authorization">Requiere autorización</option>
              </select>
            </div>
            <div className="field">
              <label>Riesgo</label>
              <select value={form.riskLevel} onChange={(e) => set('riskLevel', e.target.value)}>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
              </select>
            </div>
            <TextField
              label="Jurisdicción"
              value={form.jurisdiction}
              onChange={(v) => set('jurisdiction', v)}
            />
            <TextField
              label="Tipo de contrato aplicable"
              value={form.applicableContractType}
              onChange={(v) => set('applicableContractType', v)}
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Contenido *</label>
            <textarea
              rows={8}
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Texto alternativo</label>
            <textarea
              rows={4}
              value={form.alternativeText}
              onChange={(e) => set('alternativeText', e.target.value)}
            />
          </div>
        </article>
        <button className="button" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Crear cláusula'}
        </button>
      </form>
    </section>
  );
}
