'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { TextField } from './utils';

export function ClmTemplateCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId');
  const [clauses, setClauses] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: parentId ? '' : '',
    description: '',
    contractType: '',
    content: '',
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const c = await apiGet<any[]>('/clm/clauses');
        setClauses(c);
      } catch {
        setClauses([]);
      }
    }
    void load();
  }, []);

  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form, clauseIds: selected };
      if (parentId) payload.parentTemplateId = parentId;
      const t = await apiPost<{ id: string }>('/clm/templates', payload);
      router.push(`/clm/templates/${t.id}`);
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{parentId ? 'Nueva versión de plantilla' : 'Nueva plantilla'}</h1>
          {parentId ? (
            <p className="muted">Creando una nueva versión a partir de una existente.</p>
          ) : null}
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/clm/templates">
            Cancelar
          </Link>
        </div>
      </div>
      <article className="card">
        <TextField
          label="Nombre"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <TextField
          label="Descripción"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <TextField
          label="Tipo de contrato"
          value={form.contractType}
          onChange={(v) => setForm({ ...form, contractType: v })}
        />
        <div className="field" style={{ marginTop: 12 }}>
          <label>Contenido</label>
          <textarea
            rows={10}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Usa {{variable}} para insertar valores dinámicos en el contrato."
          />
        </div>
        {clauses.length ? (
          <div className="field" style={{ marginTop: 12 }}>
            <label>Cláusulas</label>
            <div className="simple-document-list">
              {clauses.map((c) => (
                <div
                  key={c.id}
                  className="simple-document-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setSelected((p) =>
                      p.includes(c.id) ? p.filter((id) => id !== c.id) : [...p, c.id]
                    )
                  }
                >
                  <strong>{c.title}</strong>
                  <small>{selected.includes(c.id) ? 'Seleccionada' : 'Click para agregar'}</small>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear plantilla'}
          </button>
        </div>
      </article>
    </section>
  );
}
