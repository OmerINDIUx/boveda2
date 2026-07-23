'use client';

import {
  Activity,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  FileSignature,
  FileText,
  History,
  LoaderCircle,
  Paperclip,
  PackageCheck,
  ReceiptText,
  Scale,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  WalletCards,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../../../lib/api';
import { buildBrowserApiUrl } from '../../../lib/api-base';
import { getSessionToken } from '../../../lib/auth';
import { SectionLoadWarning } from './section-load-warning';
import { ContractVersionUploadPanel } from './version-form';
import styles from './versions-manage.module.css';
import type { ContractDetail } from './types';
import { friendlyFileName, formatDate } from './utils';

type ContractVersion = ContractDetail['versions'][number];
function formatFileSize(value: number | string) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Tamaño no disponible';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function fetchVersionFile(
  contractId: string,
  versionId: string,
  action: 'content' | 'download'
) {
  const token = getSessionToken();
  const response = await fetch(
    buildBrowserApiUrl(`/clm/contracts/${contractId}/versions/${versionId}/${action}`),
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!response.ok) throw new Error('No fue posible recuperar el archivo de esta versión.');
  return response.blob();
}

export function ContractVersionsPage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMime, setPreviewMime] = useState('');
  const [previewVersionId, setPreviewVersionId] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    if (!contractId) return;
    const controller = new AbortController();
    setLoading(true);
    apiGet<ContractDetail>(`/clm/contracts/${contractId}`, undefined, controller.signal)
      .then((result) => {
        setDetail(result);
        setSelectedId(
          result.currentVersionId ?? result.currentVersion?.id ?? result.versions[0]?.id
        );
        setMessage('');
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== 'AbortError') {
          setMessage(
            'No se pudieron cargar las versiones. Verifica tu sesión y acceso al contrato.'
          );
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [contractId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const currentId =
    detail?.currentVersionId ?? detail?.currentVersion?.id ?? detail?.versions[0]?.id;
  const orderedVersions = useMemo(() => {
    if (!detail) return [];
    return [...detail.versions].sort((left, right) => {
      if (left.id === currentId) return -1;
      if (right.id === currentId) return 1;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [currentId, detail]);
  const currentVersion = useMemo(
    () => orderedVersions.find((version) => version.id === currentId) ?? orderedVersions[0] ?? null,
    [currentId, orderedVersions]
  );
  const selectedVersion = useMemo(
    () => orderedVersions.find((version) => version.id === selectedId) ?? currentVersion,
    [currentVersion, orderedVersions, selectedId]
  );

  async function preview(version: ContractVersion) {
    if (!contractId) return;
    setSelectedId(version.id);
    setBusyAction(`preview-${version.id}`);
    setMessage('');
    try {
      const blob = await fetchVersionFile(contractId, version.id, 'content');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewMime(blob.type || version.mimeType);
      setPreviewVersionId(version.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible abrir esta versión.');
    } finally {
      setBusyAction('');
    }
  }

  async function download(version: ContractVersion) {
    if (!contractId) return;
    setBusyAction(`download-${version.id}`);
    setMessage('');
    try {
      const blob = await fetchVersionFile(contractId, version.id, 'download');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = version.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible descargar esta versión.');
    } finally {
      setBusyAction('');
    }
  }

  if (loading) {
    return (
      <article className={`card ${styles.loadingCard}`}>
        <LoaderCircle className={styles.spinner} size={22} />
        <div>
          <strong>Cargando versiones</strong>
          <p className="muted">Estamos preparando el historial documental.</p>
        </div>
      </article>
    );
  }

  if (!detail) {
    return (
      <article className="card">
        <p className="muted">{message || 'No se encontró el contrato.'}</p>
      </article>
    );
  }

  return (
    <section className={`projects-workspace ${styles.page}`}>
      <SectionLoadWarning detail={detail} section="versions" label="las versiones" />
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Control documental</span>
          <h1>Contratos</h1>
          <p className="muted">{detail.name}</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${detail.id}`}>
            Volver al contrato
          </Link>
        </div>
      </header>

      <nav className={styles.documentTabs} aria-label="Documentos del contrato">
        <Link
          className={styles.documentTabActive}
          href={`/clm/${detail.id}/versions`}
          aria-current="page"
        >
          <History size={18} />
          <span>
            <strong>Versiones del contrato</strong>
            <small>Consulta la vigente y su historial</small>
          </span>
        </Link>
        <Link href={`/clm/${detail.id}/attachments`}>
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
        <button type="button" onClick={() => setShowUploader(true)}>
          <Upload size={18} />
          <span>
            <strong>Subir nueva versión</strong>
            <small>Agrega una actualización del contrato</small>
          </span>
        </button>
      </nav>

      <nav className={styles.contractActions} aria-label="Gestión del contrato">
        <div className={styles.contractActionsHeading}>
          <div>
            <span className={styles.eyebrow}>Gestión contractual</span>
            <h2>Operaciones del contrato</h2>
          </div>
          <p>Administra los documentos, cambios, obligaciones y efectos económicos.</p>
        </div>
        <div className={styles.contractActionsGrid}>
          <Link href={`/clm/${detail.id}/amendments`}>
            <FileSignature size={20} />
            <span>
              <strong>Convenios modificatorios</strong>
              <small>Registra modificaciones al contrato</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/records/change_orders`}>
            <Activity size={20} />
            <span>
              <strong>Órdenes de cambio</strong>
              <small>Controla ajustes de alcance, costo o plazo</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/negotiations`}>
            <Scale size={20} />
            <span>
              <strong>Negociación</strong>
              <small>Gestiona rondas, acuerdos y pendientes</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/records/penalties`}>
            <BadgeDollarSign size={20} />
            <span>
              <strong>Penalizaciones</strong>
              <small>Controla incumplimientos y cálculos</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/records/guarantees`}>
            <ShieldCheck size={20} />
            <span>
              <strong>Garantías</strong>
              <small>Administra instrumentos y vigencias</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/records/retentions`}>
            <WalletCards size={20} />
            <span>
              <strong>Retenciones</strong>
              <small>Consulta saldos y condiciones</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/records/releases`}>
            <CheckCircle2 size={20} />
            <span>
              <strong>Liberaciones</strong>
              <small>Controla liberaciones parciales o totales</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/obligations`}>
            <ReceiptText size={20} />
            <span>
              <strong>Obligaciones</strong>
              <small>Da seguimiento a compromisos contractuales</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/deliverables`}>
            <PackageCheck size={20} />
            <span>
              <strong>Entregables</strong>
              <small>Controla entregas y aceptación</small>
            </span>
          </Link>
          <Link href={`/clm/${detail.id}/payments`}>
            <WalletCards size={20} />
            <span>
              <strong>Pagos</strong>
              <small>Programa y confirma pagos del contrato</small>
            </span>
          </Link>
        </div>
      </nav>

      {message ? (
        <div className={styles.inlineAlert} role="alert">
          {message}
        </div>
      ) : null}

      {!orderedVersions.length || !currentVersion ? (
        <>
          <article className={`card ${styles.emptyState}`}>
            <FileText size={36} />
            <h2>El contrato todavía no tiene documento original</h2>
            <p className="muted">
              Sube el contrato firmado o documento base para comenzar el expediente y su análisis.
            </p>
          </article>
          <ContractVersionUploadPanel contractId={detail.id} original />
        </>
      ) : (
        <>
          {showUploader ? (
            <ContractVersionUploadPanel
              contractId={detail.id}
              onCancel={() => setShowUploader(false)}
            />
          ) : null}
          <article className={styles.currentCard} aria-label="Versión vigente">
            <div className={styles.currentIcon}>
              <CheckCircle2 size={28} />
            </div>
            <div className={styles.currentMain}>
              <div className={styles.currentTitleRow}>
                <span className={styles.currentBadge}>Versión vigente</span>
                <span className={styles.versionLabel}>Versión {currentVersion.versionLabel}</span>
              </div>
              <h2>{friendlyFileName(currentVersion.fileName, 'Documento contractual vigente')}</h2>
              <p>{currentVersion.changeSummary || 'Versión contractual actualmente en vigor.'}</p>
              <div className={styles.metadata}>
                <span>
                  <CalendarClock size={15} /> Actualizada {formatDate(currentVersion.createdAt)}
                </span>
                <span>
                  <UserRound size={15} />{' '}
                  {currentVersion.uploadedBy?.name ?? 'Usuario no disponible'}
                </span>
                <span>
                  <FileText size={15} /> {formatFileSize(currentVersion.sizeBytes)}
                </span>
              </div>
            </div>
            <div className={styles.currentActions}>
              <button
                className="button"
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => void preview(currentVersion)}
              >
                <Eye size={16} />{' '}
                {busyAction === `preview-${currentVersion.id}` ? 'Abriendo...' : 'Abrir vigente'}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => void download(currentVersion)}
              >
                <Download size={16} /> Descargar
              </button>
              <Link
                className="button secondary"
                href={`/clm/${detail.id}/signatures/new?versionId=${currentVersion.id}`}
              >
                <FileSignature size={16} /> Mandar a firma
              </Link>
              <Link className={styles.aiAction} href={`/clm/gota?contractId=${detail.id}`}>
                <Sparkles size={16} /> Consulta con G.OTA
              </Link>
              <Link
                className={styles.reviewAction}
                href={`/clm/${detail.id}/versions/${currentVersion.id}/review`}
              >
                <CheckCircle2 size={16} /> Revisar extracción
              </Link>
            </div>
          </article>

          <div className={styles.summaryStrip} aria-label="Resumen de versiones">
            <div>
              <strong>{orderedVersions.length}</strong>
              <span>versiones registradas</span>
            </div>
            <div>
              <strong>{formatDate(currentVersion.createdAt)}</strong>
              <span>última actualización vigente</span>
            </div>
            <div>
              <strong>{friendlyFileName(currentVersion.fileName, 'Documento vigente')}</strong>
              <span>archivo de trabajo actual</span>
            </div>
          </div>

          <div className={styles.workspace}>
            <aside className={styles.historyCard} aria-label="Historial de versiones">
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.eyebrow}>Cronología</span>
                  <h2>Historial</h2>
                </div>
                <History size={20} />
              </div>
              <p className={styles.sectionHelp}>La vigente siempre aparece primero.</p>
              <div className={styles.versionList}>
                {orderedVersions.map((version) => {
                  const isCurrent = version.id === currentId;
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
                        onClick={() => setSelectedId(version.id)}
                      >
                        <span className={styles.versionItemTopline}>
                          <strong>Versión {version.versionLabel}</strong>
                          {isCurrent ? (
                            <span className={styles.smallCurrentBadge}>Vigente</span>
                          ) : null}
                        </span>
                        <span className={styles.fileName}>
                          {friendlyFileName(version.fileName, 'Versión contractual')}
                        </span>
                        <span className={styles.itemSummary}>
                          {version.changeSummary || 'Sin resumen de cambios.'}
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
                        ? friendlyFileName(selectedVersion.fileName, 'Versión contractual')
                        : 'Selecciona una versión'}
                    </h2>
                    {selectedVersion ? (
                      <p>
                        {selectedVersion.changeSummary || 'Sin resumen de cambios.'} ·{' '}
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
                        href={`/clm/${detail.id}/signatures/new?versionId=${selectedVersion.id}`}
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
                        alt={selectedVersion?.fileName ?? 'Vista de la versión'}
                        width={1200}
                        height={760}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <iframe
                      className={styles.previewFrame}
                      title="Vista previa de la versión"
                      src={previewUrl}
                    />
                  )
                ) : (
                  <div className={styles.previewEmpty}>
                    <div className={styles.previewEmptyIcon}>
                      <Eye size={28} />
                    </div>
                    <h3>Vista previa lista para abrir</h3>
                    <p>
                      Carga el documento seleccionado aquí sin salir del historial de versiones.
                    </p>
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
