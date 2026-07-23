'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../../../lib/api';
import type { ContractDetail } from '../../../../components/modules/clm/types';
import { friendlyFileName } from '../../../../components/modules/clm/utils';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

export default function SignatureCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const versionId = searchParams.get('versionId') ?? undefined;
  const attachmentId = searchParams.get('attachmentId') ?? undefined;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [signers, setSigners] = useState<Array<{ name: string; email: string }>>([
    { name: '', email: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contractId) return;
    void apiGet<ContractDetail>(`/clm/contracts/${contractId}`)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [contractId]);

  const sourceDocument = useMemo(() => {
    if (attachmentId) {
      const attachment = detail?.attachments.find((item) => item.id === attachmentId);
      return attachment
        ? {
            type: 'Anexo',
            name: friendlyFileName(attachment.fileName, attachment.name),
            version: attachment.versionLabel,
          }
        : { type: 'Anexo', name: 'Anexo seleccionado', version: '' };
    }
    const version =
      detail?.versions.find((item) => item.id === versionId) ??
      detail?.currentVersion ??
      detail?.versions[0];
    return version
      ? {
          type: 'Contrato',
          name: friendlyFileName(version.fileName, 'Documento contractual'),
          version: version.versionLabel,
        }
      : { type: 'Contrato', name: 'Versión vigente', version: '' };
  }, [attachmentId, detail, versionId]);

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
      await apiPost(
        `/clm/contracts/${contractId}/signatures`,
        { signers, versionId, attachmentId },
        getToken()
      );
      router.push(`/clm/${contractId}/signatures`);
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
          <Link className="button secondary" href={`/clm/${contractId}/signatures`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <small className="muted">Documento seleccionado</small>
        <h2 style={{ margin: '6px 0' }}>{sourceDocument.name}</h2>
        <span className="pill info">
          {sourceDocument.type}
          {sourceDocument.version ? ` · Versión ${sourceDocument.version}` : ''}
        </span>
      </article>
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
