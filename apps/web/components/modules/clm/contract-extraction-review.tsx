'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  FileSearch,
  KeyRound,
  LoaderCircle,
  RefreshCcw,
  Save,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { ContractExtractionFact, ContractExtractionRun } from './types';
import styles from './contract-extraction-review.module.css';

const categoryOrder: ContractExtractionFact['category'][] = [
  'general',
  'dates',
  'parties',
  'penalties',
  'guarantees',
  'deliverables',
  'obligations',
  'payments',
  'milestones',
  'risks',
];

const categoryLabels: Record<ContractExtractionFact['category'], string> = {
  general: 'Datos generales',
  dates: 'Fechas',
  parties: 'Partes',
  penalties: 'Penalizaciones',
  guarantees: 'Garantías',
  deliverables: 'Entregables',
  obligations: 'Obligaciones',
  payments: 'Pagos',
  milestones: 'Hitos',
  risks: 'Riesgos',
};

const propertyLabels: Record<string, string> = {
  description: 'Descripción',
  commitmentDate: 'Fecha compromiso',
  periodicity: 'Periodicidad',
  priority: 'Prioridad',
  consequence: 'Consecuencia',
  concept: 'Concepto',
  amount: 'Importe',
  currency: 'Moneda',
  paymentDate: 'Fecha de pago',
  dueDate: 'Fecha límite',
  notes: 'Notas',
  name: 'Nombre',
  milestoneDate: 'Fecha del hito',
  severity: 'Severidad',
  recommendation: 'Recomendación',
  title: 'Título',
  basisClause: 'Cláusula de fundamento',
  calculation: 'Cálculo',
  percentage: 'Porcentaje',
  capPercentage: 'Tope máximo (%)',
  trigger: 'Supuesto de aplicación',
  frequency: 'Frecuencia',
  issuer: 'Emisor',
  beneficiary: 'Beneficiario',
  validFrom: 'Vigente desde',
  validUntil: 'Vigente hasta',
  acceptanceCriteria: 'Criterios de aceptación',
  durationMonths: 'Duración (meses)',
  startCondition: 'Inicio de vigencia',
  coverage: 'Cobertura',
  condition: 'Condición de pago',
  comments: 'Seguimiento',
};

const multilineFields = new Set([
  'description',
  'calculation',
  'acceptanceCriteria',
  'condition',
  'startCondition',
  'coverage',
]);

const propertySelectOptions: Partial<Record<string, Array<{ value: string; label: string }>>> = {
  comments: [
    { value: 'Responsable: EL CONTRATISTA', label: 'Responsable: El contratista' },
    { value: 'Responsable: EL CLIENTE', label: 'Responsable: El cliente' },
    { value: 'Responsable: AMBAS PARTES', label: 'Responsable: Ambas partes' },
    { value: 'Responsable: POR ASIGNAR', label: 'Responsable: Por asignar' },
  ],
  priority: [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' },
  ],
  periodicity: [
    { value: 'once', label: 'Una sola vez' },
    { value: 'daily', label: 'Diaria' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'bimonthly', label: 'Bimestral' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'semiannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' },
    { value: 'as_needed', label: 'Cuando se requiera' },
  ],
};

const processingStageLabels: Record<string, string> = {
  queued: 'Esperando turno para comenzar',
  resuming: 'Retomando desde el último avance guardado',
  reading_file: 'Leyendo el archivo almacenado',
  extracting_text: 'Extrayendo el texto y sus páginas',
  normalizing_text: 'Reconstruyendo espacios, listas y tablas con Ollama',
  restoring_text: 'Restaurando el contrato en lotes paralelos',
  restored_text_ready: 'Texto restaurado; preparando la enumeración',
  creating_chunks: 'Organizando cláusulas y fragmentos',
  creating_embeddings: 'Creando la copia consultable',
  indexing_restored_text: 'Creando la copia consultable por fragmentos',
  extracting_facts: 'Detectando fechas, obligaciones, pagos y riesgos',
  enumerating_items: 'Analizando lotes y enumerando cada elemento gestionable',
  draft_ready: 'Borrador listo para revisión',
};

function isRecord(value: ContractExtractionFact['value']): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function confidenceLabel(confidence: number) {
  if (confidence >= 0.85) return 'Alta';
  if (confidence >= 0.65) return 'Media';
  return 'Revisar';
}

export function ContractExtractionReviewPage() {
  const params = useParams<{ id: string; versionId?: string; attachmentId?: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const versionId = Array.isArray(params?.versionId) ? params.versionId[0] : params?.versionId;
  const attachmentId = Array.isArray(params?.attachmentId)
    ? params.attachmentId[0]
    : params?.attachmentId;
  const isAttachment = Boolean(attachmentId);
  const documentId = attachmentId ?? versionId;
  const resource = isAttachment ? 'attachments' : 'versions';
  const backHref = `/clm/${contractId}/${resource}`;
  const extractionUrl = `/clm/contracts/${contractId}/${resource}/${documentId}/extraction`;
  const [run, setRun] = useState<ContractExtractionRun | null>(null);
  const [facts, setFacts] = useState<ContractExtractionFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const validDocumentId = Boolean(
    documentId && documentId !== 'undefined' && documentId !== 'null'
  );

  useEffect(() => {
    if (!contractId || !validDocumentId || !documentId) {
      setLoading(false);
      setError('No se recibió un identificador válido para el documento.');
      return;
    }
    let active = true;
    let timer: number | undefined;
    async function load() {
      try {
        const response = await apiGet<ContractExtractionRun>(extractionUrl);
        if (!active) return;
        setRun(response);
        setFacts(response.facts);
        setError('');
        if (response.status === 'queued' || response.status === 'processing') {
          timer = window.setTimeout(load, 2000);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : 'No fue posible cargar el análisis.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [contractId, documentId, extractionUrl, reloadKey, validDocumentId]);

  const groupedFacts = useMemo(
    () =>
      categoryOrder
        .map((category) => ({
          category,
          facts: facts.filter((fact) => fact.category === category),
        }))
        .filter((group) => group.facts.length),
    [facts]
  );
  const accepted = facts.filter((fact) => fact.decision === 'accepted').length;
  const rejected = facts.filter((fact) => fact.decision === 'rejected').length;
  const pending = facts.length - accepted - rejected;

  function updateFact(id: string, changes: Partial<ContractExtractionFact>) {
    setFacts((current) => current.map((fact) => (fact.id === id ? { ...fact, ...changes } : fact)));
  }

  function updateObjectValue(id: string, key: string, value: string) {
    setFacts((current) =>
      current.map((fact) =>
        fact.id === id && isRecord(fact.value)
          ? { ...fact, value: { ...fact.value, [key]: value }, decision: 'accepted' }
          : fact
      )
    );
  }

  function decideCategory(
    category: ContractExtractionFact['category'],
    decision: 'accepted' | 'rejected'
  ) {
    setFacts((current) =>
      current.map((fact) => (fact.category === category ? { ...fact, decision } : fact))
    );
  }

  async function saveDraft() {
    if (!contractId || !documentId) return;
    setSaving(true);
    setError('');
    try {
      const response = await apiPatch<ContractExtractionRun>(extractionUrl, { facts });
      setRun(response);
      setFacts(response.facts);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'No fue posible guardar el borrador.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    if (!contractId || !documentId || !password || pending) return;
    setApproving(true);
    setError('');
    try {
      const response = await apiPost<ContractExtractionRun>(`${extractionUrl}/approve`, {
        password,
        facts,
      });
      setPassword('');
      setRun(response);
      setFacts(response.facts);
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : 'No fue posible aprobar el borrador.'
      );
    } finally {
      setApproving(false);
    }
  }

  async function retry() {
    if (!contractId || !documentId) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiPost<ContractExtractionRun>(`${extractionUrl}/retry`, {});
      setRun(response);
      setReloadKey((value) => value + 1);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'No fue posible reintentar.');
      setLoading(false);
    }
  }

  async function startAnalysis() {
    if (!contractId || !documentId || !validDocumentId) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiPost<ContractExtractionRun>(`${extractionUrl}/start`, {});
      setRun(response);
      setReloadKey((value) => value + 1);
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : 'No fue posible iniciar el análisis.'
      );
      setLoading(false);
    }
  }

  if (!loading && !run) {
    return (
      <section className={styles.centerState}>
        <div className={`${styles.processingOrb} ${styles.failed}`}>
          <AlertTriangle size={34} />
        </div>
        <span className={styles.eyebrow}>Análisis no iniciado</span>
        <h1>No encontramos el procesamiento de este documento</h1>
        <p>
          {validDocumentId
            ? 'El documento puede haberse cargado antes de activar el nuevo flujo. Puedes iniciar su análisis ahora.'
            : 'La dirección no contiene un documento válido. Regresa al historial y vuelve a seleccionarlo.'}
        </p>
        {error ? <div className={styles.error}>{error}</div> : null}
        <div className={styles.actions}>
          <Link className="button secondary" href={backHref}>
            Volver a {isAttachment ? 'anexos' : 'versiones'}
          </Link>
          {validDocumentId ? (
            <button className="button" type="button" onClick={() => void startAnalysis()}>
              <Sparkles size={16} /> Iniciar análisis
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (loading || !run || run.status === 'queued' || run.status === 'processing') {
    const progress = Math.max(0, Math.min(100, run?.progressPercent ?? 0));
    return (
      <section className={styles.centerState}>
        <div className={styles.processingOrb}>
          <LoaderCircle size={34} />
        </div>
        <span className={styles.eyebrow}>Análisis contractual</span>
        <h1>Ollama está leyendo {isAttachment ? 'el anexo' : 'el contrato'}</h1>
        <p>
          Estamos extrayendo texto, fechas, obligaciones, pagos, hitos y riesgos. Puedes dejar esta
          pantalla abierta.
        </p>
        <div className={styles.processingProgress} aria-label={`Procesamiento ${progress}%`}>
          <div>
            <strong>{progress}%</strong>
            <span>
              {processingStageLabels[run?.processingStage ?? 'queued'] ?? 'Procesando documento'}
            </span>
            <small>{progress < 100 ? `Falta ${100 - progress}%` : 'Completado'}</small>
          </div>
          <div className={styles.processingTrack}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className={styles.processingSteps}>
          <span className={progress >= 10 ? styles.done : styles.active}>
            <Check size={15} /> Archivo almacenado
          </span>
          <span className={progress >= 60 ? styles.done : progress >= 20 ? styles.active : ''}>
            <LoaderCircle size={15} /> Creando copia consultable
          </span>
          <span className={progress >= 100 ? styles.done : progress >= 60 ? styles.active : ''}>
            Preparando borrador
          </span>
        </div>
        {run?.checkpoint?.totalBatches ? (
          <p className="muted">
            Avance protegido: {run.checkpoint.completedBatches} de {run.checkpoint.totalBatches}{' '}
            lotes guardados.
          </p>
        ) : null}
        {error ? <div className={styles.error}>{error}</div> : null}
      </section>
    );
  }

  if (run.status === 'failed') {
    return (
      <section className={styles.centerState}>
        <div className={`${styles.processingOrb} ${styles.failed}`}>
          <AlertTriangle size={34} />
        </div>
        <span className={styles.eyebrow}>Procesamiento detenido</span>
        <h1>No fue posible preparar el borrador</h1>
        <p>
          {run.error || 'Revisa que Ollama esté disponible y que el PDF contenga texto legible.'}
        </p>
        {run.checkpoint?.completedBatches ? (
          <p className="muted">
            Se conservaron {run.checkpoint.completedBatches} de {run.checkpoint.totalBatches} lotes.
            Al reintentar se continuará desde ese punto.
          </p>
        ) : null}
        <div className={styles.actions}>
          <Link className="button secondary" href={backHref}>
            Volver a {isAttachment ? 'anexos' : 'versiones'}
          </Link>
          <button className="button" type="button" onClick={() => void retry()}>
            <RefreshCcw size={16} /> Reintentar
          </button>
        </div>
      </section>
    );
  }

  if (run.status === 'approved') {
    return (
      <section className={styles.centerState}>
        <div className={`${styles.processingOrb} ${styles.approved}`}>
          <CheckCircle2 size={36} />
        </div>
        <span className={styles.eyebrow}>Aprobación completada</span>
        <h1>El contrato ya fue actualizado</h1>
        <p>
          Los datos aceptados se escribieron en el contrato y quedaron registrados en la auditoría.
        </p>
        <Link className="button" href={backHref}>
          Ver {isAttachment ? 'anexo vigente' : 'versión vigente'}
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href={backHref}>
            <ArrowLeft size={15} /> {isAttachment ? 'Anexos' : 'Versiones'}
          </Link>
          <span className={styles.eyebrow}>Borrador generado por IA</span>
          <h1>Revisa antes de actualizar el contrato</h1>
          <p>Ollama autocompletó estas propuestas. Confirma, corrige o rechaza cada una.</p>
        </div>
        <div className="projects-actions">
          <button className="button secondary" type="button" onClick={() => void retry()}>
            <RefreshCcw size={16} /> Volver a extraer
          </button>
          <div className={styles.modelBadge}>
            <Bot size={17} />
            <span>
              Procesado con<strong>{run.modelName ?? 'Ollama'}</strong>
            </span>
          </div>
        </div>
      </header>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <div className={styles.progressCard}>
        <div>
          <strong>{facts.length}</strong>
          <span>hallazgos</span>
        </div>
        <div className={styles.acceptedStat}>
          <strong>{accepted}</strong>
          <span>aceptados</span>
        </div>
        <div className={styles.rejectedStat}>
          <strong>{rejected}</strong>
          <span>rechazados</span>
        </div>
        <div className={pending ? styles.pendingStat : styles.completeStat}>
          <strong>{pending}</strong>
          <span>pendientes</span>
        </div>
        <div className={styles.progressTrack}>
          <span
            style={{
              width: `${facts.length ? ((accepted + rejected) / facts.length) * 100 : 100}%`,
            }}
          />
        </div>
      </div>

      {!facts.length ? (
        <article className={styles.noFacts}>
          <FileSearch size={32} />
          <h2>No se detectaron datos estructurados</h2>
          <p>
            El texto quedó indexado para consultas, pero Ollama no encontró datos para
            autocompletar.
          </p>
        </article>
      ) : null}

      <div className={styles.reviewLayout}>
        <main className={styles.sections}>
          {groupedFacts.map((group) => (
            <section className={styles.category} key={group.category}>
              <div className={styles.categoryHeader}>
                <div>
                  <h2>{categoryLabels[group.category]}</h2>
                  <span>{group.facts.length} propuestas</span>
                </div>
                <div className={styles.categoryActions}>
                  <button type="button" onClick={() => decideCategory(group.category, 'accepted')}>
                    <Check size={14} /> Aceptar sección
                  </button>
                  <button type="button" onClick={() => decideCategory(group.category, 'rejected')}>
                    <X size={14} /> Rechazar sección
                  </button>
                </div>
              </div>
              <div className={styles.factList}>
                {group.facts.map((fact, factIndex) => (
                  <article className={`${styles.factCard} ${styles[fact.decision]}`} key={fact.id}>
                    <div className={styles.factTopline}>
                      <div>
                        <strong>
                          {factIndex + 1}. {fact.label}
                        </strong>
                        <span className={styles.confidence}>
                          Confianza {confidenceLabel(fact.confidence)} ·{' '}
                          {Math.round(fact.confidence * 100)}%
                        </span>
                      </div>
                      <div className={styles.decisionButtons}>
                        <button
                          className={fact.decision === 'accepted' ? styles.selectedAccept : ''}
                          type="button"
                          aria-label={`Aceptar ${fact.label}`}
                          onClick={() => updateFact(fact.id, { decision: 'accepted' })}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className={fact.decision === 'rejected' ? styles.selectedReject : ''}
                          type="button"
                          aria-label={`Rechazar ${fact.label}`}
                          onClick={() => updateFact(fact.id, { decision: 'rejected' })}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    {isRecord(fact.value) ? (
                      <div className={styles.objectEditor}>
                        {Object.entries(fact.value)
                          .filter(([, value]) => value !== null && value !== undefined)
                          .map(([key, value]) => {
                            const selectOptions = propertySelectOptions[key];
                            const currentValue = String(value);
                            const options =
                              selectOptions &&
                              !selectOptions.some((option) => option.value === currentValue)
                                ? [
                                    {
                                      value: currentValue,
                                      label: currentValue,
                                    },
                                    ...selectOptions,
                                  ]
                                : selectOptions;
                            return (
                              <label
                                className={multilineFields.has(key) ? styles.wideField : ''}
                                key={key}
                              >
                                <span>{propertyLabels[key] ?? key}</span>
                                {options ? (
                                  <select
                                    value={currentValue}
                                    onChange={(event) =>
                                      updateObjectValue(fact.id, key, event.target.value)
                                    }
                                  >
                                    {options.map((option) => (
                                      <option value={option.value} key={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : multilineFields.has(key) ? (
                                  <textarea
                                    rows={3}
                                    value={currentValue}
                                    onChange={(event) =>
                                      updateObjectValue(fact.id, key, event.target.value)
                                    }
                                  />
                                ) : (
                                  <input
                                    value={currentValue}
                                    onChange={(event) =>
                                      updateObjectValue(fact.id, key, event.target.value)
                                    }
                                  />
                                )}
                              </label>
                            );
                          })}
                      </div>
                    ) : typeof fact.value === 'boolean' ? (
                      <select
                        value={String(fact.value)}
                        onChange={(event) =>
                          updateFact(fact.id, {
                            value: event.target.value === 'true',
                            decision: 'accepted',
                          })
                        }
                      >
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        className={styles.scalarInput}
                        value={String(fact.value)}
                        onChange={(event) =>
                          updateFact(fact.id, { value: event.target.value, decision: 'accepted' })
                        }
                      />
                    )}
                    <div className={styles.evidence}>
                      <Sparkles size={14} />
                      <p>{fact.evidence || 'Sin fragmento de evidencia.'}</p>
                      {fact.pageNumber ? <span>Página {fact.pageNumber}</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>

        <aside className={styles.approvalCard}>
          <div className={styles.approvalIcon}>
            <ShieldCheck size={24} />
          </div>
          <h2>Aprobación final</h2>
          <p>
            Al confirmar, cada elemento aceptado se guardará como un registro independiente para
            poder darle seguimiento y marcarlo como cumplido.
          </p>
          <div className={styles.approvalSummary}>
            <span>
              <CheckCircle2 size={15} /> {accepted} se aplicarán
            </span>
            <span>
              <X size={15} /> {rejected} se descartarán
            </span>
            <span>
              <Clock3 size={15} /> {pending} pendientes
            </span>
          </div>
          <button
            className="button secondary"
            type="button"
            disabled={saving}
            onClick={() => void saveDraft()}
          >
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <label className={styles.passwordField}>
            <span>Confirma tu contraseña</span>
            <div>
              <KeyRound size={17} />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña actual"
              />
            </div>
          </label>
          <button
            className="button"
            type="button"
            disabled={approving || pending > 0 || !password}
            onClick={() => void approve()}
          >
            <ShieldCheck size={16} /> {approving ? 'Verificando...' : 'Aprobar y actualizar'}
          </button>
          {pending ? (
            <small>Revisa las {pending} propuestas pendientes para habilitar la aprobación.</small>
          ) : (
            <small>La contraseña no se almacenará ni aparecerá en la auditoría.</small>
          )}
        </aside>
      </div>
    </section>
  );
}
