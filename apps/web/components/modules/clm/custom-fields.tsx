'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet, apiPost } from '../../../lib/api';
import { TextField } from './utils';

type CustomField = {
  id: string;
  contractType: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
};

export function ClmCustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    contractType: '',
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'string',
  });
  const [saving, setSaving] = useState(false);
  async function load() {
    try {
      const f = await apiGet<CustomField[]>('/clm/custom-fields');
      setFields(f);
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function createField() {
    if (!form.contractType || !form.fieldKey || !form.fieldLabel) return;
    setSaving(true);
    try {
      await apiPost('/clm/custom-fields', form);
      setForm({ contractType: '', fieldKey: '', fieldLabel: '', fieldType: 'string' });
      void load();
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Campos personalizados"
        description="Define campos adicionales por tipo de contrato."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <h2>Nuevo campo</h2>
        </div>
        <div className="quick-filters-grid">
          <TextField
            label="Tipo de contrato"
            value={form.contractType}
            onChange={(v) => setForm({ ...form, contractType: v })}
          />
          <TextField
            label="Key (interno)"
            value={form.fieldKey}
            onChange={(v) => setForm({ ...form, fieldKey: v })}
          />
          <TextField
            label="Etiqueta"
            value={form.fieldLabel}
            onChange={(v) => setForm({ ...form, fieldLabel: v })}
          />
          <div className="field">
            <label>Tipo</label>
            <select
              value={form.fieldType}
              onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
            >
              <option value="string">Texto</option>
              <option value="number">Número</option>
              <option value="date">Fecha</option>
              <option value="boolean">Sí/No</option>
            </select>
          </div>
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={createField} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear campo'}
          </button>
        </div>
      </article>
      <article className="card">
        <div className="panel-header">
          <h2>Campos existentes</h2>
        </div>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <div className="simple-document-list">
            {fields.map((f) => (
              <div key={f.id} className="simple-document-item">
                <strong>{f.fieldLabel}</strong>
                <small>
                  {f.contractType} · {f.fieldType} · {f.fieldKey}
                </small>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
