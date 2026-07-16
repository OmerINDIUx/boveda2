'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet, apiPost } from '../../../lib/api';
import { Tag } from './types';
import { TextField } from './utils';

export function ClmTagsSettingsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  async function load() {
    try {
      const t = await apiGet<Tag[]>('/clm/tags');
      setTags(t);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function createTag() {
    if (!name.trim()) return;
    try {
      await apiPost('/clm/tags', { name: name.trim(), color });
      setName('');
      void load();
    } catch {
      setName(name.trim());
    }
  }
  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Administrar tags"
        description="Gestiona las etiquetas para clasificar contratos."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <h2>Nuevo tag</h2>
        </div>
        <div className="quick-filters-grid">
          <TextField label="Nombre" value={name} onChange={setName} />
          <TextField label="Color" value={color} onChange={setColor} />
        </div>
        <button className="button" type="button" onClick={createTag} style={{ marginTop: 12 }}>
          Crear tag
        </button>
      </article>
      <article className="card">
        <div className="panel-header">
          <h2>Tags existentes</h2>
        </div>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <div className="simple-document-list">
            {tags.map((t) => (
              <div
                key={t.id}
                className="simple-document-item"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: t.color ?? '#3b82f6',
                    display: 'inline-block',
                  }}
                />
                <strong>{t.name}</strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
