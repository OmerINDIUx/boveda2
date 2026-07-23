'use client';

import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  LoaderCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import type { AskResponse } from './types';
import styles from './gota-contract-chat.module.css';

type ScopeMode = 'all' | 'contracts' | 'attachments' | 'single' | 'selected';
type DocumentSource = {
  id: string;
  sourceType: 'version' | 'attachment';
  contractId: string;
  contractName: string;
  versionLabel: string;
  attachmentGroupId?: string;
  documentName?: string;
  fileName: string;
  createdAt: string;
  isCurrent: boolean;
};
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AskResponse;
  pending?: boolean;
};
type KnowledgeResponse = {
  version: {
    id: string;
    versionLabel: string;
    fileName: string;
    createdAt: string;
    sourceType?: 'version' | 'attachment';
  };
  extractionStatus: string;
  approvedAt?: string;
  facts: Array<{
    id: string;
    category: string;
    label: string;
    value: unknown;
    displayValue: string;
    displayFields: Array<{ key: string; label: string; value: string }>;
    evidence?: string;
    pageNumber?: number;
    decision: 'pending' | 'accepted' | 'rejected';
  }>;
  transcription: Array<{ pageNumber?: number; text: string }>;
  rawTranscription: Array<{ pageNumber?: number; text: string }>;
  stats: {
    storedChunks: number;
    visibleChunks: number;
    characters: number;
    normalizationMethod: 'ollama' | 'deterministic' | 'legacy';
  };
};

export function GotaContractChatPage() {
  const searchParams = useSearchParams();
  const initialContractId = searchParams.get('contractId') ?? '';
  const initialDocumentId = searchParams.get('documentId') ?? '';
  const [sources, setSources] = useState<DocumentSource[]>([]);
  const [scope, setScope] = useState<ScopeMode>(
    initialContractId || initialDocumentId ? 'single' : 'all'
  );
  const [singleId, setSingleId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [knowledge, setKnowledge] = useState<KnowledgeResponse | null>(null);
  const [knowledgeTab, setKnowledgeTab] = useState<'facts' | 'transcription'>('facts');
  const [transcriptionView, setTranscriptionView] = useState<'normalized' | 'raw'>('normalized');
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [normalizingKnowledge, setNormalizingKnowledge] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGet<DocumentSource[]>('/clm/gota/sources')
      .then((result) => {
        setSources(result);
        if (initialDocumentId) {
          const initial = result.find((item) => item.id === initialDocumentId);
          if (initial) {
            setSingleId(initial.id);
            setSelectedIds([initial.id]);
          } else {
            setScope('all');
          }
        } else if (initialContractId) {
          const initial =
            result.find(
              (item) =>
                item.contractId === initialContractId &&
                item.sourceType === 'version' &&
                item.isCurrent
            ) ??
            result.find(
              (item) => item.contractId === initialContractId && item.sourceType === 'version'
            ) ??
            result.find((item) => item.contractId === initialContractId);
          if (initial) {
            setSingleId(initial.id);
            setSelectedIds([initial.id]);
          } else {
            setScope('all');
          }
        }
      })
      .catch(() => setError('No fue posible cargar las versiones contractuales disponibles.'))
      .finally(() => setLoadingSources(false));
  }, [initialContractId, initialDocumentId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeIds = useMemo(() => {
    if (scope === 'all') return undefined;
    if (scope === 'contracts') {
      return sources.filter((source) => source.sourceType === 'version').map((source) => source.id);
    }
    if (scope === 'attachments') {
      return sources
        .filter((source) => source.sourceType === 'attachment')
        .map((source) => source.id);
    }
    if (scope === 'single') return singleId ? [singleId] : [];
    return selectedIds;
  }, [scope, selectedIds, singleId, sources]);

  const scopeLabel =
    scope === 'all'
      ? `${sources.length} documentos`
      : scope === 'contracts'
        ? `${activeIds?.length ?? 0} versiones de contrato`
        : scope === 'attachments'
          ? `${activeIds?.length ?? 0} versiones de anexos`
          : scope === 'single'
            ? '1 documento'
            : `${selectedIds.length} seleccionados`;
  const inspectVersionId =
    scope === 'single'
      ? singleId
      : scope === 'selected' && selectedIds.length === 1
        ? selectedIds[0]
        : '';

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function openKnowledge() {
    if (!inspectVersionId || loadingKnowledge) return;
    setLoadingKnowledge(true);
    setError('');
    try {
      const response = await apiGet<KnowledgeResponse>(
        `/clm/gota/sources/${inspectVersionId}/knowledge`
      );
      setKnowledge(response);
      setKnowledgeTab(response.version.sourceType === 'attachment' ? 'transcription' : 'facts');
      setTranscriptionView('normalized');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible recuperar el conocimiento de esta versión.'
      );
    } finally {
      setLoadingKnowledge(false);
    }
  }

  async function normalizeKnowledge() {
    if (!inspectVersionId || normalizingKnowledge) return;
    setNormalizingKnowledge(true);
    setError('');
    try {
      const response = await apiPost<KnowledgeResponse>(
        `/clm/gota/sources/${inspectVersionId}/normalize-transcription`,
        {},
        undefined,
        undefined,
        180_000
      );
      setKnowledge(response);
      setKnowledgeTab('transcription');
      setTranscriptionView('normalized');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible mejorar la transcripción con Ollama.'
      );
    } finally {
      setNormalizingKnowledge(false);
    }
  }

  async function sendQuestion() {
    const clean = question.trim();
    if (!clean || sending || (scope !== 'all' && !activeIds?.length)) return;
    const requestId = `request-${Date.now()}`;
    setQuestion('');
    setError('');
    setSending(true);
    setMessages((current) => [
      ...current,
      { id: `${requestId}-user`, role: 'user', text: clean },
      { id: requestId, role: 'assistant', text: '', pending: true },
    ]);
    try {
      const response = await apiPost<AskResponse>(
        '/clm/gota/ask',
        {
          question: clean,
          documentIds: activeIds,
        },
        undefined,
        undefined,
        180_000
      );
      setMessages((current) =>
        current.map((message) =>
          message.id === requestId
            ? { ...message, text: response.answer, response, pending: false }
            : message
        )
      );
    } catch (requestError) {
      const text =
        requestError instanceof Error ? requestError.message : 'No fue posible consultar G.OTA.';
      setMessages((current) =>
        current.map((message) =>
          message.id === requestId ? { ...message, text, pending: false } : message
        )
      );
    } finally {
      setSending(false);
    }
  }

  function toggleSources(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Asistente contractual</span>
          <h1>Consulta con G.OTA</h1>
          <p>
            Conversa con datos aprobados y transcripciones almacenadas, sin releer los archivos.
          </p>
        </div>
        <Link className="button secondary" href="/clm">
          Volver a contratos
        </Link>
      </header>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <div className={styles.workspace}>
        <aside className={styles.scopePanel}>
          <div className={styles.scopeHeading}>
            <Sparkles size={18} />
            <div>
              <strong>Alcance de la conversación</strong>
              <span>{scopeLabel}</span>
            </div>
          </div>
          <div className={styles.scopeTabs}>
            <button
              className={scope === 'all' ? styles.active : ''}
              onClick={() => setScope('all')}
            >
              Todos
            </button>
            <button
              className={scope === 'contracts' ? styles.active : ''}
              onClick={() => setScope('contracts')}
            >
              Contratos
            </button>
            <button
              className={scope === 'attachments' ? styles.active : ''}
              onClick={() => setScope('attachments')}
            >
              Anexos
            </button>
            <button
              className={scope === 'single' ? styles.active : ''}
              onClick={() => setScope('single')}
            >
              Un documento
            </button>
            <button
              className={scope === 'selected' ? styles.active : ''}
              onClick={() => setScope('selected')}
            >
              Seleccionados
            </button>
          </div>

          {loadingSources ? (
            <div className={styles.loadingSources}>
              <LoaderCircle className={styles.spinner} size={18} /> Preparando documentos
            </div>
          ) : scope === 'all' || scope === 'contracts' || scope === 'attachments' ? (
            <div className={styles.allScope}>
              <FileText size={28} />
              <strong>
                {scope === 'all'
                  ? 'Contrato y anexos'
                  : scope === 'contracts'
                    ? 'Solo documentos del contrato'
                    : 'Solo anexos'}
              </strong>
              <p>
                G.OTA buscará evidencia en {activeIds?.length ?? sources.length} documentos
                disponibles.
              </p>
            </div>
          ) : scope === 'single' ? (
            <label className={styles.singlePicker}>
              Documento contractual
              <select value={singleId} onChange={(event) => setSingleId(event.target.value)}>
                <option value="">Selecciona un documento</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.contractName} ·{' '}
                    {source.sourceType === 'attachment'
                      ? `Anexo: ${source.documentName ?? source.fileName} · Versión ${source.versionLabel}${source.isCurrent ? ' (vigente)' : ''}`
                      : `Versión ${source.versionLabel}`}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className={styles.sourceList}>
              {sources.map((source) => {
                const selected = selectedIds.includes(source.id);
                return (
                  <button
                    key={source.id}
                    className={selected ? styles.sourceSelected : ''}
                    onClick={() => toggleSelected(source.id)}
                  >
                    <span className={styles.checkbox}>{selected ? <Check size={13} /> : null}</span>
                    <span>
                      <strong>
                        {source.contractName} ·{' '}
                        {source.sourceType === 'attachment'
                          ? `Anexo: ${source.documentName ?? source.fileName} · Versión ${source.versionLabel}`
                          : `Versión ${source.versionLabel}`}
                        {source.isCurrent ? ' · Vigente' : ''}
                      </strong>
                      <small>{source.fileName}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <button
            className={styles.knowledgeButton}
            type="button"
            disabled={!inspectVersionId || loadingKnowledge}
            onClick={() => void openKnowledge()}
          >
            {loadingKnowledge ? (
              <LoaderCircle className={styles.spinner} size={16} />
            ) : (
              <FileText size={16} />
            )}
            Ver conocimiento del documento
          </button>
          {!inspectVersionId && (scope === 'single' || scope === 'selected') ? (
            <small className={styles.knowledgeHelp}>
              Selecciona exactamente un documento para revisar su memoria.
            </small>
          ) : null}
        </aside>

        <article className={styles.chat}>
          <div className={styles.chatTopbar}>
            <span className={styles.gotaAvatar}>G</span>
            <div>
              <strong>G.OTA</strong>
              <span>Consultando {scopeLabel}</span>
            </div>
          </div>

          <div className={styles.messages}>
            {!messages.length ? (
              <div className={styles.emptyChat}>
                <Bot size={42} />
                <h2>¿Qué necesitas encontrar?</h2>
                <p>Puedes comparar obligaciones, pagos, fechas, riesgos o diferencias.</p>
              </div>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'user' ? styles.userMessage : styles.assistantMessage}
              >
                {message.pending ? (
                  <span className={styles.thinking}>
                    <LoaderCircle className={styles.spinner} size={16} /> Buscando en el índice...
                  </span>
                ) : (
                  <p>{message.text}</p>
                )}
                {message.response?.context ? (
                  <small className={styles.contextInfo}>
                    {message.response.context.documentsSearched ?? 1} documentos ·{' '}
                    {message.response.context.approvedFactsUsed} datos aprobados ·{' '}
                    {message.response.context.transcriptionChunksUsed} fragmentos
                    {message.response.context.searchLanguages?.length ? ' · búsqueda ES + EN' : ''}
                  </small>
                ) : null}
                {message.response?.citations.length ? (
                  <div className={styles.citations}>
                    <button onClick={() => toggleSources(message.id)}>
                      {expanded.has(message.id) ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      {message.response.citations.length} fuentes consultadas
                    </button>
                    {expanded.has(message.id) ? (
                      <div>
                        {message.response.citations.map((citation, index) => (
                          <article key={`${message.id}-${index}`}>
                            <strong>{citation.label}</strong>
                            <p>{citation.fragment}</p>
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className={styles.composer}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendQuestion();
                }
              }}
              placeholder="Pregunta a G.OTA sobre los documentos seleccionados..."
              rows={2}
              disabled={sending}
            />
            <button
              className="button"
              onClick={() => void sendQuestion()}
              disabled={sending || !question.trim() || (scope !== 'all' && !activeIds?.length)}
            >
              <Send size={17} /> Enviar
            </button>
            <small>Enter para enviar · Shift + Enter para una nueva línea</small>
          </div>
        </article>
      </div>

      {knowledge ? (
        <div className={styles.knowledgeBackdrop} role="presentation">
          <section className={styles.knowledgeModal} role="dialog" aria-modal="true">
            <header>
              <div>
                <span className={styles.eyebrow}>Memoria utilizada por G.OTA</span>
                <h2>
                  {knowledge.version.sourceType === 'attachment'
                    ? `Anexo · Versión ${knowledge.version.versionLabel} · ${knowledge.version.fileName}`
                    : `Versión ${knowledge.version.versionLabel} · ${knowledge.version.fileName}`}
                </h2>
                <p>
                  Estado: {knowledge.extractionStatus} · {knowledge.stats.visibleChunks} fragmentos
                  útiles de {knowledge.stats.storedChunks} almacenados
                </p>
                <p>
                  Transcripción:{' '}
                  {knowledge.stats.normalizationMethod === 'ollama'
                    ? 'restaurada con Ollama'
                    : knowledge.stats.normalizationMethod === 'deterministic'
                      ? 'limpieza automática básica'
                      : 'extracción original sin restaurar'}
                </p>
              </div>
              <button aria-label="Cerrar" onClick={() => setKnowledge(null)}>
                <X size={20} />
              </button>
            </header>
            <div className={styles.knowledgeTabs}>
              <button
                className={knowledgeTab === 'facts' ? styles.active : ''}
                onClick={() => setKnowledgeTab('facts')}
              >
                Información revisada ({knowledge.facts.length})
              </button>
              <button
                className={knowledgeTab === 'transcription' ? styles.active : ''}
                onClick={() => setKnowledgeTab('transcription')}
              >
                Transcripción ({knowledge.transcription.length} páginas)
              </button>
            </div>
            <div className={styles.knowledgeBody}>
              {knowledgeTab === 'facts' ? (
                <div className={styles.factList}>
                  {knowledge.facts.map((fact) => (
                    <article key={fact.id}>
                      <div>
                        <span className={`${styles.decision} ${styles[fact.decision]}`}>
                          {fact.decision === 'accepted'
                            ? 'Aceptado'
                            : fact.decision === 'rejected'
                              ? 'Rechazado'
                              : 'Pendiente'}
                        </span>
                        <small>
                          {fact.category}
                          {fact.pageNumber ? ` · Página ${fact.pageNumber}` : ''}
                        </small>
                      </div>
                      <h3>{fact.label}</h3>
                      {fact.displayFields.length ? (
                        <dl className={styles.factFields}>
                          {fact.displayFields.map((field) => (
                            <div key={field.key}>
                              <dt>{field.label}</dt>
                              <dd>{field.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className={styles.factValue}>{fact.displayValue}</p>
                      )}
                      {fact.evidence ? <blockquote>{fact.evidence}</blockquote> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <>
                  <div className={styles.transcriptionTools}>
                    <div>
                      <button
                        className={transcriptionView === 'normalized' ? styles.active : ''}
                        onClick={() => setTranscriptionView('normalized')}
                      >
                        Texto restaurado
                      </button>
                      <button
                        className={transcriptionView === 'raw' ? styles.active : ''}
                        disabled={!knowledge.rawTranscription.length}
                        onClick={() => setTranscriptionView('raw')}
                      >
                        Texto original
                      </button>
                    </div>
                    <button onClick={normalizeKnowledge} disabled={normalizingKnowledge}>
                      {normalizingKnowledge ? (
                        <LoaderCircle className={styles.spinner} size={15} />
                      ) : (
                        <Sparkles size={15} />
                      )}
                      {normalizingKnowledge ? 'Restaurando páginas...' : 'Mejorar con Ollama'}
                    </button>
                  </div>
                  <div className={styles.transcription}>
                    {(transcriptionView === 'raw'
                      ? knowledge.rawTranscription
                      : knowledge.transcription
                    ).map((page, index) => (
                      <article key={`${page.pageNumber ?? 'unknown'}-${index}`}>
                        <strong>Página {page.pageNumber ?? 'sin identificar'}</strong>
                        <p>{page.text}</p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
