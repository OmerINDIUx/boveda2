'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../../../lib/api';
import { TextField } from './utils';

export function ContractObligationCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({ description: '', commitmentDate: '', comments: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (!contractId || !form.description.trim()) {
      setError('Escribe la obligación.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/obligations`, form);
      router.push(`/clm/${contractId}`);
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nueva obligación</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="field">
          <label>Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <TextField
          label="Fecha compromiso"
          type="date"
          value={form.commitmentDate}
          onChange={(v) => setForm({ ...form, commitmentDate: v })}
        />
        <TextField
          label="Comentarios"
          value={form.comments}
          onChange={(v) => setForm({ ...form, comments: v })}
        />
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </article>
    </section>
  );
}
