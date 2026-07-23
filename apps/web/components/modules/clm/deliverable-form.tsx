'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../../../lib/api';
import { getErrorMessage, TextField } from './utils';

export function ContractDeliverableCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    acceptanceCriteria: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!contractId || !form.name.trim()) return setError('Escribe el nombre del entregable.');
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/deliverables`, form);
      router.push(`/clm/${contractId}/deliverables`);
    } catch (caught) {
      setError(getErrorMessage(caught, 'No fue posible guardar el entregable.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <h1>Nuevo entregable</h1>
        <Link className="button secondary" href={`/clm/${contractId}/deliverables`}>
          Cancelar
        </Link>
      </div>
      {error ? <article className="card">{error}</article> : null}
      <article className="card">
        <TextField
          label="Nombre"
          value={form.name}
          onChange={(name) => setForm({ ...form, name })}
        />
        <TextField
          label="Descripción"
          value={form.description}
          onChange={(description) => setForm({ ...form, description })}
        />
        <TextField
          label="Fecha límite"
          type="date"
          value={form.dueDate}
          onChange={(dueDate) => setForm({ ...form, dueDate })}
        />
        <TextField
          label="Criterios de aceptación"
          value={form.acceptanceCriteria}
          onChange={(acceptanceCriteria) => setForm({ ...form, acceptanceCriteria })}
        />
        <button className="button" type="button" disabled={saving} onClick={() => void submit()}>
          {saving ? 'Guardando...' : 'Registrar entregable'}
        </button>
      </article>
    </section>
  );
}
