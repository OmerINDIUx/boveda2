'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { apiPost } from '../../../../lib/api';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [signers, setSigners] = useState<Array<{ name: string; email: string }>>([
    { name: '', email: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addSigner() {
    setSigners([...signers, { name: '', email: '' }]);
  }
  function updateSigner(i: number, key: string, value: string) {
    const next = [...signers];
    next[i] = { ...next[i], [key]: value };
    setSigners(next);
  }
  function removeSigner(i: number) {
    setSigners(signers.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!contractId || !signers.length || !signers[0].name) {
      setError('Agrega al menos un firmante.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/signatures`, { signers }, getToken());
      router.push(`/clm/${contractId}`);
    } catch {
      setError('Error al enviar a firma.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Enviar a firma</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="panel-header">
          <h2>Firmantes</h2>
          <button className="button secondary" type="button" onClick={addSigner}>
            Agregar firmante
          </button>
        </div>
        {signers.map((s, i) => (
          <div key={i} className="quick-filters-grid" style={{ marginTop: 8 }}>
            <div className="field">
              <label>Nombre</label>
              <input value={s.name} onChange={(e) => updateSigner(i, 'name', e.target.value)} />
            </div>
            <div className="field">
              <label>Correo electrónico</label>
              <input value={s.email} onChange={(e) => updateSigner(i, 'email', e.target.value)} />
            </div>
            {signers.length > 1 ? (
              <button
                className="button secondary"
                type="button"
                onClick={() => removeSigner(i)}
                style={{ alignSelf: 'flex-end' }}
              >
                Eliminar
              </button>
            ) : null}
          </div>
        ))}
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Enviando...' : 'Enviar a firma'}
          </button>
        </div>
      </article>
    </section>
  );
}
