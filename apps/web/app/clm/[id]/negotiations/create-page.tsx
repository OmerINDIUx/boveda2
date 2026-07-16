'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { apiPost } from '../../../../lib/api';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

export default function NegotiationCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({ partyName: '', proposedText: '', originalText: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!contractId || !form.partyName.trim()) {
      setError('Indica la parte negociadora.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/negotiations`, form, getToken());
      router.push(`/clm/${contractId}/negotiations`);
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
          <h1>Nueva ronda de negociación</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}/negotiations`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="field">
          <label>Parte negociadora</label>
          <input
            value={form.partyName}
            onChange={(e) => setForm({ ...form, partyName: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Texto original</label>
          <textarea
            value={form.originalText}
            onChange={(e) => setForm({ ...form, originalText: e.target.value })}
            rows={5}
          />
        </div>
        <div className="field">
          <label>Texto propuesto</label>
          <textarea
            value={form.proposedText}
            onChange={(e) => setForm({ ...form, proposedText: e.target.value })}
            rows={5}
          />
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar negociación'}
          </button>
        </div>
      </article>
    </section>
  );
}
