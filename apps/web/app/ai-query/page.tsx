'use client';

import { Bot, FileText, FolderClock, Send, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RequirePermission } from '../../components/auth/require-permission';
import { SectionHeader } from '../../components/modules/section-header';
import { apiGet, apiPost } from '../../lib/api';
import { PermissionKey } from '../../lib/permissions';

type ProjectOption = { id: string; name: string; code: string };
type DocumentOption = { id: string; name: string; documentNumber: string };
type QueryHistoryItem = {
  id: string;
  question: string;
  answer: string;
  status: 'answered' | 'insufficient_information' | 'error';
  citationsJson?: Citation[];
  createdAt: string;
};
type Citation = {
  documentId: string;
  documentName: string;
  versionLabel: string;
  pageNumber?: number;
  sectionLabel?: string;
  fragment: string;
  score: number;
};
type QueryResponse = {
  id: string;
  question: string;
  answer: string;
  status: 'answered' | 'insufficient_information' | 'error';
  scopedDocumentCount: number;
  citations: Citation[];
};

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

function formatStatus(status: QueryResponse['status']) {
  if (status === 'answered') return 'Respondida';
  if (status === 'insufficient_information') return 'Sin evidencia suficiente';
  return 'Error';
}

export default function AiQueryPage() {
  const [question, setQuestion] = useState('');
  const [projectId, setProjectId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialDocumentId = params.get('documentId') ?? '';
    if (initialDocumentId) {
      setDocumentId(initialDocumentId);
    }

    async function loadBase() {
      try {
        const [projectsResponse, documentsResponse, historyResponse] = await Promise.all([
          apiGet<ProjectOption[]>('/projects', getToken()),
          apiGet<DocumentOption[]>('/documents', getToken()),
          apiGet<QueryHistoryItem[]>('/ai-query/history', getToken()),
        ]);
        setProjects(projectsResponse);
        setDocuments(documentsResponse);
        setHistory(historyResponse);
      } catch {
        setMessage(
          'La consulta inteligente quedo lista en API, pero esta vista no pudo cargar catalogos iniciales.'
        );
      }
    }

    void loadBase();
  }, []);

  async function askQuestion() {
    if (!question.trim()) {
      setMessage('Escribe una pregunta antes de consultar.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await apiPost<QueryResponse>(
        '/ai-query/ask',
        {
          question,
          projectId: projectId || undefined,
          documentId: documentId || undefined,
        },
        getToken()
      );
      setResult(response);
      const refreshedHistory = await apiGet<QueryHistoryItem[]>('/ai-query/history', getToken());
      setHistory(refreshedHistory);
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      setMessage(
        detail
          ? `No fue posible completar la consulta. ${detail}`
          : 'No fue posible completar la consulta. Verifica permisos, alcance o disponibilidad del extractor.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequirePermission permission={PermissionKey.AiQuery}>
      <SectionHeader
        title="Consulta IA"
        description="Pregunta solo sobre documentos autorizados, con respuesta acotada a evidencia encontrada y fuentes visibles."
      />

      {message ? <article className="card muted">{message}</article> : null}

      <section className="grid">
        <article className="card span-8">
          <div className="panel-header">
            <h2>Consulta documental</h2>
            <span className="pill">
              <ShieldCheck size={14} />
              Respeta permisos
            </span>
          </div>

          <div className="quick-filters-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label>Proyecto</label>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                <option value="">Todos los proyectos autorizados</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field span-2">
              <label>Documento</label>
              <select value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
                <option value="">Todos los documentos autorizados</option>
                {documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.documentNumber} · {document.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Pregunta</label>
            <textarea
              rows={6}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ejemplo: Resume este contrato o que documentos mencionan penalizacion por atraso."
            />
          </div>

          <div className="projects-actions">
            <button className="button" disabled={loading} type="button" onClick={askQuestion}>
              <Send size={18} />
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>

          {result ? (
            <div style={{ marginTop: 20 }}>
              <div className="panel-header">
                <h2>Respuesta</h2>
                <span className={`pill ${result.status === 'answered' ? 'success' : 'warning'}`}>
                  {formatStatus(result.status)}
                </span>
              </div>
              <article className="state-card">
                <span>Documentos dentro del alcance</span>
                <strong>{result.scopedDocumentCount}</strong>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.answer}</p>
              </article>
            </div>
          ) : null}
        </article>

        <aside className="card span-4">
          <div className="panel-header">
            <h2>Fuentes</h2>
            <FileText size={18} color="var(--primary)" />
          </div>
          <div className="simple-document-list">
            {(result?.citations ?? []).length ? (
              result?.citations.map((citation, index) => (
                <div className="simple-document-item" key={`${citation.documentId}-${index}`}>
                  <strong>{citation.documentName}</strong>
                  <small>
                    Version {citation.versionLabel}
                    {citation.pageNumber ? ` · Pagina ${citation.pageNumber}` : ''}
                    {citation.sectionLabel ? ` · ${citation.sectionLabel}` : ''}
                  </small>
                  <span>{citation.fragment}</span>
                </div>
              ))
            ) : (
              <div className="simple-document-item">
                <strong>Sin fuentes todavia</strong>
                <small>
                  Cuando haya evidencia, veras documento, version, pagina o seccion y el fragmento
                  utilizado.
                </small>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="grid" style={{ marginTop: 16 }}>
        <article className="card span-12">
          <div className="panel-header">
            <h2>Historial personal</h2>
            <FolderClock size={18} color="var(--accent)" />
          </div>
          <div className="simple-document-list">
            {history.length ? (
              history.map((item) => (
                <button
                  className="project-list-item"
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setResult({
                      id: item.id,
                      question: item.question,
                      answer: item.answer,
                      status: item.status,
                      scopedDocumentCount: 0,
                      citations: item.citationsJson ?? [],
                    })
                  }
                >
                  <div className="project-list-head">
                    <strong>{item.question}</strong>
                    <span className={`pill ${item.status === 'answered' ? 'success' : 'warning'}`}>
                      {formatStatus(item.status)}
                    </span>
                  </div>
                  <span>{item.answer}</span>
                  <small className="muted">{new Date(item.createdAt).toLocaleString()}</small>
                </button>
              ))
            ) : (
              <div className="simple-document-item">
                <strong>Aun no hay consultas</strong>
                <small>Cada pregunta respondida se registra en historial y auditoria.</small>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid" style={{ marginTop: 16 }}>
        <article className="card span-4 project-metric info">
          <Bot size={20} />
          <strong>PDF, Word y Excel</strong>
          <span>Extraccion textual por version para indexar contenido autorizable.</span>
        </article>
        <article className="card span-4 project-metric warn">
          <ShieldCheck size={20} />
          <strong>Sin invenciones</strong>
          <span>
            Si no hay evidencia suficiente, la respuesta lo indica en lugar de completar huecos.
          </span>
        </article>
        <article className="card span-4 project-metric ok">
          <FileText size={20} />
          <strong>Respuesta con trazabilidad</strong>
          <span>Cada salida muestra la fuente usada y queda registrada para seguimiento.</span>
        </article>
      </section>
    </RequirePermission>
  );
}
