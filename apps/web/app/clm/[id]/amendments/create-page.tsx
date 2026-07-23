'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { apiPost } from '../../../../lib/api';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

export default function AmendmentCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({
    amendmentNumber: '',
    title: '',
    description: '',
    amendmentDate: '',
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!contractId || !form.amendmentNumber.trim() || !form.title.trim() || !form.amendmentDate) {
      setError('Completa los campos obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/amendments`, form, getToken());
      router.push(`/clm/${contractId}/amendments`);
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo convenio modificatorio</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}/amendments`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="field">
          <label>Número de convenio</label>
          <input
            value={form.amendmentNumber}
            onChange={(e) => setForm({ ...form, amendmentNumber: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Título</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Fecha</label>
          <input
            type="date"
            value={form.amendmentDate}
            onChange={(e) => setForm({ ...form, amendmentDate: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Estado</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="draft">Borrador</option>
            <option value="active">Vigente</option>
            <option value="closed">Cerrada</option>
          </select>
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear convenio'}
          </button>
        </div>
      </article>
    </section>
  );
}
