'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../../../lib/api';
import { FilePayload } from './types';
import { fileToPayload, getErrorMessage, TextField } from './utils';

export function ContractVersionCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({ versionLabel: '', changeSummary: '' });
  const [file, setFile] = useState<FilePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function onSelectFile(fileList: FileList | null) {
    const next = fileList?.[0];
    if (!next) return;
    setFile(await fileToPayload(next));
  }
  async function submit() {
    if (!contractId || !file) {
      setError('Selecciona el archivo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/versions`, {
        versionLabel: form.versionLabel || `Rev-${Date.now()}`,
        changeSummary: form.changeSummary,
        ...file,
        sizeBytes: String(file.sizeBytes),
      });
      router.push(`/clm/${contractId}`);
    } catch (e) {
      setError(getErrorMessage(e, 'Error al subir.'));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Subir versión</h1>
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
          label="Etiqueta"
          value={form.versionLabel}
          onChange={(v) => setForm({ ...form, versionLabel: v })}
        />
        <TextField
          label="Resumen de cambios"
          value={form.changeSummary}
          onChange={(v) => setForm({ ...form, changeSummary: v })}
        />
        <div className="field">
          <label>Archivo</label>
          <input type="file" onChange={(e) => void onSelectFile(e.target.files)} />
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Subiendo...' : 'Subir versión'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function ContractAttachmentCreatePage() {
  return <ContractVersionCreatePage />;
}
