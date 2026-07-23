'use client';

import {
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  FilePlus2,
  FileSignature,
  FileText,
  History,
  LoaderCircle,
  Paperclip,
  Plus,
  Sparkles,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { buildBrowserApiUrl } from '../../../lib/api-base';
import { getSessionToken } from '../../../lib/auth';
import { SectionLoadWarning } from './section-load-warning';
import type { ContractDetail, FilePayload } from './types';
import { fileToPayload, friendlyFileName, formatDate, getErrorMessage } from './utils';
import aux from './attachments-workspace.module.css';
import styles from './versions-manage.module.css';

type Attachment = ContractDetail['attachments'][number];
type AttachmentGroup = { id: string; name: string; versions: Attachment[]; current: Attachment };

function formatFileSize(value: number | string) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Tamaño no disponible';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function fetchAttachmentFile(
  contractId: string,
  attachmentId: string,
  action: 'content' | 'download'
) {
  const token = getSessionToken();
  const response = await fetch(
    buildBrowserApiUrl(`/clm/contracts/${contractId}/attachments/${attachmentId}/${action}`),
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!response.ok) throw new Error('No fue posible recuperar el archivo de este anexo.');
  return response.blob();
}

function groupAttachments(attachments: Attachment[]): AttachmentGroup[] {
  const groups = new Map<string, Attachment[]>();
  attachments.forEach((attachment) => {
    const id = attachment.attachmentGroupId || attachment.id;
    groups.set(id, [...(groups.get(id) ?? []), attachment]);
  });
  return [...groups.entries()]
    .map(([id, items]) => {
      const versions = [...items].sort((left, right) => {
        if (left.isCurrent !== right.isCurrent) return left.isCurrent ? -1 : 1;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
      return { id, name: versions[0].name, versions, current: versions[0] };
    })
    .sort(
      (left, right) =>
        new Date(right.current.createdAt).getTime() - new Date(left.current.createdAt).getTime()
    );
}

export function AttachmentsWorkspace({
  initialUploadOpen = false,
}: {
  initialUploadOpen?: boolean;
}) {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMime, setPreviewMime] = useState('');
  const [previewVersionId, setPreviewVersionId] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [formMode, setFormMode] = useState<'new' | 'version' | null>(
    initialUploadOpen ? 'new' : null
  );

  const load = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    try {
      const result = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`);
      const groups = groupAttachments(result.attachments);
      setDetail(result);
      setSelectedGroupId((previous) =>
        groups.some((group) => group.id === previous) ? previous : groups[0]?.id
      );
      setMessage('');
    } catch (error) {
      setMessage(getErrorMessage(error, 'No se pudieron cargar los anexos.'));
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => void load(), [load]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const groups = useMemo(() => groupAttachments(detail?.attachments ?? []), [detail]);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  const currentAttachment = selectedGroup?.current ?? null;
  const selectedVersion =
    selectedGroup?.versions.find((version) => version.id === selectedVersionId) ??
    currentAttachment;

  useEffect(() => {
    setSelectedVersionId(selectedGroup?.current.id);
    setPreviewVersionId('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  }, [selectedGroup?.id]);

  async function preview(attachment: Attachment) {
    if (!contractId) return;
    setSelectedVersionId(attachment.id);
    setBusyAction(`preview-${attachment.id}`);
    setMessage('');
    try {
      const blob = await fetchAttachmentFile(contractId, attachment.id, 'content');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewMime(blob.type || attachment.mimeType);
      setPreviewVersionId(attachment.id);
    } catch (error) {
      setMessage(getErrorMessage(error, 'No fue posible abrir este anexo.'));
    } finally {
      setBusyAction('');
    }
  }

  async function download(attachment: Attachment) {
    if (!contractId) return;
    setBusyAction(`download-${attachment.id}`);
    setMessage('');
    try {
      const blob = await fetchAttachmentFile(contractId, attachment.id, 'download');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = friendlyFileName(attachment.fileName, attachment.name);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(getErrorMessage(error, 'No fue posible descargar este anexo.'));
    } finally {
      setBusyAction('');
    }
  }

  if (loading) {
    return (
      <article className={`card ${styles.loadingCard}`}>
        <LoaderCircle className={styles.spinner} size={22} />
        <div>
          <strong>Cargando anexos</strong>
          <p className="muted">Estamos preparando el historial documental.</p>
        </div>
      </article>
    );
  }

  if (!detail)
    return (
      <article className="card">
        <p className="muted">{message || 'No se encontró el contrato.'}</p>
      </article>
    );

  return (
    <section className={`projects-workspace ${styles.page}`}>
      <SectionLoadWarning detail={detail} section="attachments" label="los anexos" />
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Control documental</span>
          <h1>Anexos del contrato</h1>
          <p className="muted">{detail.name}</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${detail.id}`}>
            Volver al contrato
          </Link>
        </div>
      </header>

      <nav className={styles.documentTabs} aria-label="Documentos del contrato">
        <Link href={`/clm/${detail.id}/versions`}>
          <History size={18} />
          <span>
            <strong>Versiones del contrato</strong>
            <small>Consulta la vigente y su historial</small>
          </span>
        </Link>
        <Link
          className={styles.documentTabActive}
          href={`/clm/${detail.id}/attachments`}
          aria-current="page"
        >
          <Paperclip size={18} />
          <span>
            <strong>Anexos y sus versiones</strong>
            <small>Cambia de anexo y revisa cada versión</small>
          </span>
        </Link>
        <Link href={`/clm/${detail.id}/original`}>
          <FileText size={18} />
          <span>
            <strong>Contrato original</strong>
            <small>Consulta el documento base</small>
          </span>
        </Link>
        {selectedGroup ? (
          <button type="button" onClick={() => setFormMode('version')}>
            <Upload size={18} />
            <span>
              <strong>Subir nueva versión</strong>
              <small>Actualiza el anexo seleccionado</small>
            </span>
          </button>
        ) : (
          <button type="button" onClick={() => setFormMode('new')}>
            <Plus size={18} />
            <span>
              <strong>Subir primer anexo</strong>
              <small>Inicia el expediente de anexos</small>
            </span>
          </button>
        )}
        <button type="button" onClick={() => setFormMode('new')}>
          <FilePlus2 size={18} />
          <span>
            <strong>Nuevo anexo</strong>
            <small>Agrega otro documento anexo</small>
          </span>
        </button>
      </nav>

      {message ? (
        <div className={styles.inlineAlert} role="alert">
          {message}
        </div>
      ) : null}
      {formMode ? (
        <AttachmentUploadForm
          contractId={detail.id}
          mode={formMode}
          attachment={currentAttachment}
          onCancel={() => setFormMode(null)}
          onSaved={async () => {
            setFormMode(null);
            await load();
          }}
        />
      ) : null}

      {groups.length > 1 ? (
        <div className={aux.attachmentPicker}>
          <div>
            <Paperclip size={20} />
            <span>
              <strong>Selecciona el anexo</strong>
              <small>{groups.length} anexos registrados en este contrato</small>
            </span>
          </div>
          <select
            value={selectedGroup?.id ?? ''}
            onChange={(event) => setSelectedGroupId(event.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} · versión {group.current.versionLabel}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!selectedGroup || !currentAttachment ? (
        <article className={`card ${styles.emptyState}`}>
          <Paperclip size={36} />
          <h2>El contrato todavía no tiene anexos</h2>
          <p className="muted">Sube el primer anexo para comenzar su historial documental.</p>
          <button className="button" type="button" onClick={() => setFormMode('new')}>
            <FilePlus2 size={16} /> Subir primer anexo
          </button>
        </article>
      ) : (
        <>
          <article className={styles.currentCard} aria-label="Anexo vigente">
            <div className={styles.currentIcon}>
              <CheckCircle2 size={28} />
            </div>
            <div className={styles.currentMain}>
              <div className={styles.currentTitleRow}>
                <span className={styles.currentBadge}>Anexo vigente</span>
                <span className={styles.versionLabel}>
                  Versión {currentAttachment.versionLabel}
                </span>
              </div>
              <h2>{selectedGroup.name}</h2>
              <p>
                {currentAttachment.notes ||
                  friendlyFileName(currentAttachment.fileName, 'Anexo vigente')}
              </p>
              <div className={styles.metadata}>
                <span>
                  <CalendarClock size={15} /> Actualizado {formatDate(currentAttachment.createdAt)}
                </span>
                <span>
                  <UserRound size={15} />{' '}
                  {currentAttachment.uploadedBy?.name ?? 'Usuario no disponible'}
                </span>
                <span>
                  <FileText size={15} /> {formatFileSize(currentAttachment.sizeBytes)}
                </span>
              </div>
            </div>
            <div className={styles.currentActions}>
              <button
                className="button"
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => void preview(currentAttachment)}
              >
                <Eye size={16} />{' '}
                {busyAction === `preview-${currentAttachment.id}` ? 'Abriendo...' : 'Abrir vigente'}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => void download(currentAttachment)}
              >
                <Download size={16} /> Descargar
              </button>
              <Link
                className="button secondary"
                href={`/clm/${detail.id}/signatures/new?attachmentId=${currentAttachment.id}`}
              >
                <FileSignature size={16} /> Mandar a firma
              </Link>
              <Link
                className={styles.aiAction}
                href={`/clm/gota?contractId=${detail.id}&documentId=${currentAttachment.id}`}
              >
                <Sparkles size={16} /> Consulta con G.OTA
              </Link>
              <Link
                className={styles.reviewAction}
                href={`/clm/${detail.id}/attachments/${currentAttachment.id}/review`}
              >
                <CheckCircle2 size={16} /> Revisar extracción
              </Link>
            </div>
          </article>

          <div className={styles.summaryStrip} aria-label="Resumen del anexo">
            <div>
              <strong>{selectedGroup.versions.length}</strong>
              <span>versiones registradas</span>
            </div>
            <div>
              <strong>{formatDate(currentAttachment.createdAt)}</strong>
              <span>última actualización vigente</span>
            </div>
            <div>
              <strong>{friendlyFileName(currentAttachment.fileName, selectedGroup.name)}</strong>
              <span>archivo de trabajo actual</span>
            </div>
          </div>

          <div className={styles.workspace}>
            <aside className={styles.historyCard} aria-label="Historial de versiones del anexo">
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.eyebrow}>Cronología</span>
                  <h2>Historial</h2>
                </div>
                <History size={20} />
              </div>
              <p className={styles.sectionHelp}>La vigente siempre aparece primero.</p>
              <div className={styles.versionList}>
                {selectedGroup.versions.map((version) => {
                  const isSelected = version.id === selectedVersion?.id;
                  return (
                    <article
                      key={version.id}
                      className={`${styles.versionItem} ${isSelected ? styles.selected : ''}`}
                    >
                      <button
                        className={styles.versionSelector}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedVersionId(version.id)}
                      >
                        <span className={styles.versionItemTopline}>
                          <strong>Versión {version.versionLabel}</strong>
                          {version.isCurrent ? (
                            <span className={styles.smallCurrentBadge}>Vigente</span>
                          ) : null}
                        </span>
                        <span className={styles.fileName}>
                          {friendlyFileName(version.fileName, selectedGroup.name)}
                        </span>
                        <span className={styles.itemSummary}>
                          {version.notes || 'Sin notas de cambios.'}
                        </span>
                        <span className={styles.itemDate}>{formatDate(version.createdAt)}</span>
                      </button>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          disabled={Boolean(busyAction)}
                          onClick={() => void preview(version)}
                        >
                          <Eye size={14} /> Ver
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busyAction)}
                          onClick={() => void download(version)}
                        >
                          <Download size={14} /> Descargar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </aside>

            <article className={styles.viewerCard}>
              <div className={styles.viewerHeader}>
                <div className={styles.viewerTabs}>
                  <strong>
                    <Eye size={16} /> Vista previa
                  </strong>
                </div>
                {selectedVersion ? (
                  <div className={styles.selectedDocument}>
                    <span>Revisando</span>
                    <strong>Versión {selectedVersion.versionLabel}</strong>
                  </div>
                ) : null}
              </div>
              <div className={styles.previewPanel}>
                <div className={styles.documentHeading}>
                  <div>
                    <h2>
                      {selectedVersion
                        ? friendlyFileName(selectedVersion.fileName, selectedGroup.name)
                        : 'Selecciona una versión'}
                    </h2>
                    {selectedVersion ? (
                      <p>
                        {selectedVersion.notes || 'Sin notas de cambios.'} ·{' '}
                        {formatFileSize(selectedVersion.sizeBytes)}
                      </p>
                    ) : null}
                  </div>
                  {selectedVersion ? (
                    <div className="projects-actions">
                      <button
                        className="button secondary"
                        type="button"
                        disabled={Boolean(busyAction)}
                        onClick={() => void download(selectedVersion)}
                      >
                        <Download size={15} /> Descargar
                      </button>
                      <Link
                        className="button secondary"
                        href={`/clm/${detail.id}/attachments/${selectedVersion.id}/review`}
                      >
                        <Sparkles size={15} /> Extraer o revisar datos
                      </Link>
                      <Link
                        className="button secondary"
                        href={`/clm/${detail.id}/signatures/new?attachmentId=${selectedVersion.id}`}
                      >
                        <FileSignature size={15} /> Mandar a firma
                      </Link>
                    </div>
                  ) : null}
                </div>
                {previewUrl && previewVersionId === selectedVersion?.id ? (
                  previewMime.startsWith('image/') ? (
                    <div className={styles.previewSurface}>
                      <Image
                        src={previewUrl}
                        alt={selectedVersion?.fileName ?? 'Vista del anexo'}
                        width={1200}
                        height={760}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <iframe
                      className={styles.previewFrame}
                      title="Vista previa del anexo"
                      src={previewUrl}
                    />
                  )
                ) : (
                  <div className={styles.previewEmpty}>
                    <div className={styles.previewEmptyIcon}>
                      <Eye size={28} />
                    </div>
                    <h3>Vista previa lista para abrir</h3>
                    <p>Carga el documento seleccionado aquí sin salir del historial del anexo.</p>
                    {selectedVersion ? (
                      <button
                        className="button"
                        type="button"
                        disabled={Boolean(busyAction)}
                        onClick={() => void preview(selectedVersion)}
                      >
                        <Eye size={16} />{' '}
                        {busyAction === `preview-${selectedVersion.id}`
                          ? 'Abriendo documento...'
                          : 'Abrir documento'}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

function AttachmentUploadForm({
  contractId,
  mode,
  attachment,
  onCancel,
  onSaved,
}: {
  contractId: string;
  mode: 'new' | 'version';
  attachment: Attachment | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(mode === 'version' ? (attachment?.name ?? '') : '');
  const [versionLabel, setVersionLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<FilePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!file || (mode === 'new' && !name.trim()) || (mode === 'version' && !versionLabel.trim())) {
      setError(
        mode === 'new'
          ? 'Indica el nombre y selecciona un archivo.'
          : 'Indica la versión y selecciona un archivo.'
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      const path =
        mode === 'new'
          ? `/clm/contracts/${contractId}/attachments`
          : `/clm/contracts/${contractId}/attachments/${attachment?.id}/versions`;
      await apiPost(path, {
        ...(mode === 'new' ? { name: name.trim() } : { versionLabel: versionLabel.trim() }),
        notes,
        ...file,
        sizeBytes: String(file.sizeBytes),
      });
      await onSaved();
    } catch (caught) {
      setError(getErrorMessage(caught, 'No fue posible guardar el anexo.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={`card ${aux.uploadPanel}`}>
      <div className={aux.uploadHeading}>
        <div>
          <span className={styles.eyebrow}>
            {mode === 'new' ? 'Nuevo documento' : attachment?.name}
          </span>
          <h2>{mode === 'new' ? 'Subir anexo' : 'Subir nueva versión'}</h2>
        </div>
        <button type="button" aria-label="Cerrar formulario" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>
      {error ? <div className={styles.inlineAlert}>{error}</div> : null}
      <div className={aux.uploadFields}>
        {mode === 'new' ? (
          <label>
            <span>Nombre del anexo</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Anexo técnico"
            />
          </label>
        ) : (
          <label>
            <span>Etiqueta de versión</span>
            <input
              value={versionLabel}
              onChange={(event) => setVersionLabel(event.target.value)}
              placeholder="Ej. 2 o Final"
            />
          </label>
        )}
        <label>
          <span>Notas de cambios</span>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Describe brevemente este archivo"
          />
        </label>
        <label className={aux.fileField}>
          <span>Archivo</span>
          <input
            type="file"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) void fileToPayload(selected).then(setFile);
            }}
          />
          {file ? (
            <small>
              {friendlyFileName(file.fileName)} · {formatFileSize(file.sizeBytes)}
            </small>
          ) : null}
        </label>
      </div>
      <div className="projects-actions">
        <button className="button secondary" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button" type="button" disabled={saving} onClick={() => void submit()}>
          <Upload size={16} />{' '}
          {saving ? 'Subiendo...' : mode === 'new' ? 'Guardar anexo' : 'Guardar versión'}
        </button>
      </div>
    </article>
  );
}
