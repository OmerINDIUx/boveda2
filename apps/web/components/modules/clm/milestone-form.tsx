'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../../../lib/api';
import { getErrorMessage, TextField } from './utils';

export function ContractMilestoneCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({ name: '', milestoneDate: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (!contractId || !form.name.trim()) {
      setError('Escribe el hito.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/milestones`, form);
      router.push(`/clm/${contractId}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar.'));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo hito</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <TextField
          label="Nombre"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <TextField
          label="Fecha"
          type="date"
          value={form.milestoneDate}
          onChange={(v) => setForm({ ...form, milestoneDate: v })}
        />
        <TextField
          label="Notas"
          value={form.notes}
          onChange={(v) => setForm({ ...form, notes: v })}
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
