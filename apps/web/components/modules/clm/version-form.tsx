'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../../../lib/api';
import { getSessionToken } from '../../../lib/auth';
import { uploadFile } from '../../../lib/upload';
import { ContractDetail } from './types';
import { friendlyFileName, getErrorMessage, TextField } from './utils';

function formatUploadSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Tamaño no disponible';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function ContractVersionUploadPanel({
  contractId,
  original = false,
  onCancel,
}: {
  contractId: string;
  original?: boolean;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    versionLabel: original ? 'Original' : '',
    changeSummary: original ? 'Contrato original' : '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!contractId || !file) {
      setError('Selecciona el archivo del contrato.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const uploaded = await uploadFile(file, () => getSessionToken() ?? null);
      const response = await apiPost<ContractDetail & { createdVersionId?: string }>(
        `/clm/contracts/${contractId}/versions`,
        {
          versionLabel: form.versionLabel.trim() || `Rev-${Date.now()}`,
          changeSummary: form.changeSummary,
          fileKey: uploaded.fileKey,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          sizeBytes: String(uploaded.sizeBytes),
        }
      );
      const createdVersionId =
        response.createdVersionId ??
        response.currentVersionId ??
        response.currentVersion?.id ??
        response.versions?.[0]?.id;
      if (!createdVersionId) {
        throw new Error(
          'La versión se guardó, pero la API no devolvió su identificador. Reinicia la API y abre la versión desde el historial.'
        );
      }
      router.push(`/clm/${contractId}/versions/${createdVersionId}/review`);
    } catch (e) {
      setError(getErrorMessage(e, 'Error al subir.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="card">
      <div className="panel-header">
        <div>
          <small className="muted">{original ? 'Documento base' : 'Control de versiones'}</small>
          <h2>{original ? 'Subir contrato original' : 'Subir nueva versión'}</h2>
          <p className="muted">
            El archivo se cargará de forma segura y después iniciará la extracción con IA.
          </p>
        </div>
      </div>
      {error ? (
        <div className="card muted" role="alert">
          {error}
        </div>
      ) : null}
      <div className="quick-filters-grid">
        <TextField
          label="Etiqueta de versión"
          value={form.versionLabel}
          onChange={(value) => setForm({ ...form, versionLabel: value })}
        />
        <TextField
          label={original ? 'Descripción' : 'Resumen de cambios'}
          value={form.changeSummary}
          onChange={(value) => setForm({ ...form, changeSummary: value })}
        />
        <div className="field">
          <label>Archivo del contrato</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            disabled={saving}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          {file ? (
            <small className="muted">
              {friendlyFileName(file.name)} · {formatUploadSize(file.size)}
            </small>
          ) : (
            <small className="muted">PDF, Word o texto.</small>
          )}
        </div>
      </div>
      <div className="projects-actions" style={{ marginTop: 16 }}>
        {onCancel ? (
          <button className="button secondary" type="button" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        ) : null}
        <button className="button" type="button" onClick={() => void submit()} disabled={saving}>
          {saving
            ? 'Subiendo e iniciando análisis...'
            : original
              ? 'Subir contrato original y analizar con IA'
              : 'Subir y analizar con IA'}
        </button>
      </div>
    </article>
  );
}

export function ContractVersionCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;

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
      {contractId ? <ContractVersionUploadPanel contractId={contractId} /> : null}
    </section>
  );
}

export function ContractAttachmentCreatePage() {
  return <ContractVersionCreatePage />;
}
