'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../../../lib/api';

export function ContractCommentCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (!contractId || !body.trim()) {
      setError('Escribe el comentario.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/comments`, { body });
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
          <h1>Nuevo comentario</h1>
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
          <label>Comentario</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </article>
    </section>
  );
}
