'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Clock3,
  Download,
  FileText,
  FolderKanban,
  GitBranchPlus,
  Hourglass,
  MessageSquareMore,
  Search,
  ShieldAlert,
  Tag,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { buildBrowserApiUrl } from '../../lib/api-base';
import { normalizeLabel } from '../../lib/labels';

type ProjectOption = { id: string; name: string; code: string };
type DocumentOption = {
  id: string;
  documentNumber: string;
  name: string;
  projectId: string;
  status: string;
};
type WorkflowStep = {
  id?: string;
  stepOrder: number;
  name: string;
  approverUserIds: string[];
  approverRoleId?: string;
  required?: boolean;
  dueDays?: number;
};

type Workflow = {
  id: string;
  projectId: string;
  name: string;
  entityType: string;
  scopeType: 'global' | 'document_specific';
  targetDocumentId?: string;
  requireForPublication: boolean;
  active: boolean;
  steps: WorkflowStep[];
  createdAt?: string;
  updatedAt?: string;
};

type ApprovalRequest = {
  id: string;
  projectId: string;
  status: string;
  requestedAt: string;
  lastActionAt?: string;
  currentStep: { id: string; name: string; stepOrder: number; dueDays?: number } | null;
  document: {
    id: string;
    documentNumber: string;
    name: string;
    status: string;
    discipline?: { id: string; code: string; name: string } | null;
  } | null;
  project?: { id: string; name: string; code: string } | null;
};

type ApprovalRequestDetail = {
  id: string;
  status: string;
  requestedAt: string;
  lastActionAt?: string;
  completedAt?: string;
  workflow: Workflow;
  currentStepId?: string;
  currentStep: { id: string; name: string; stepOrder: number } | null;
  document: { id: string; documentNumber: string; name: string; status: string } | null;
  actions: Array<{
    id: string;
    action: string;
    comment?: string;
    stepOrder?: number;
    createdAt: string;
    actor: { id: string; name: string; email: string } | null;
    step: { id: string; name: string; stepOrder: number } | null;
  }>;
};

type ApprovalDocumentDetail = {
  id: string;
  name: string;
  documentNumber: string;
  status: string;
  confidentialityLevel: string;
  renewable: boolean;
  dueDate?: string;
  fileExtension?: string;
  sizeBytes?: number;
  project?: { id: string; name: string; code: string } | null;
  folder?: { id: string; name: string } | null;
  discipline?: { id: string; code: string; name: string } | null;
  responsibleUser?: { id: string; name: string; email: string } | null;
  currentVersion: {
    id: string;
    revision: string;
    fileName: string;
    fileExtension?: string;
    mimeType: string;
    sizeBytes: number;
    notes?: string;
    createdAt: string;
    uploadedBy?: { id: string; name: string; email: string } | null;
  } | null;
  preview: { available: boolean; mimeType: string | null; url: string | null };
  metadata: Array<{ id: string; metaKey: string; metaValue?: string; valueType: string }>;
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string; email: string } | null;
  }>;
};

type ReviewAnnotation = {
  id: string;
  kind: 'comment' | 'text' | 'draw' | 'highlight' | 'stamp';
  pageIndex: number;
  text?: string;
  stamp?: string;
  replies?: Array<{ id: string; text: string; createdAt: string }>;
};

type SavedReviewPayload = {
  versionId: string | null;
  annotations: ReviewAnnotation[];
};

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('holocron_token');
}

function formatSize(size?: number) {
  if (!size) return 'Sin tamaño';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function parseAnnotationComment(body: string) {
  if (!body.startsWith('[ANNOTATION_SET]')) return null;

  try {
    return JSON.parse(body.slice('[ANNOTATION_SET]\n'.length)) as SavedReviewPayload;
  } catch {
    return null;
  }
}

function describeAnnotationKind(kind: ReviewAnnotation['kind']) {
  switch (kind) {
    case 'comment':
      return 'Comentario';
    case 'text':
      return 'Nota';
    case 'draw':
      return 'Trazo';
    case 'highlight':
      return 'Resaltado';
    case 'stamp':
      return 'Sello';
    default:
      return 'Anotación';
  }
}

async function fetchProtectedBlob(path: string) {
  const response = await fetch(buildBrowserApiUrl(path), {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  });

  if (!response.ok) {
    throw new Error('No fue posible descargar el archivo');
  }

  return response.blob();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

type ApprovalInboxFilter = 'all' | 'active' | 'stopped';

function normalizeApprovalInboxFilter(value: string | null): ApprovalInboxFilter {
  if (value === 'active' || value === 'stopped') return value;
  return 'all';
}

function daysRemaining(requestedAt: string, dueDays?: number): number | null {
  if (!dueDays) return null;
  const requested = new Date(requestedAt);
  const due = new Date(requested.getTime() + dueDays * 86400000);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

function timeAgoShort(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export function ApprovalsInboxPage() {
  const searchParams = useSearchParams();
  const queryFilter = normalizeApprovalInboxFilter(searchParams.get('status'));
  const queryProjectId = searchParams.get('projectId') ?? '';
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [pending, setPending] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxFilter, setInboxFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('');
  const [stepFilter, setStepFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    let active = true;

    async function loadPending() {
      setLoading(true);
      setError('');
      try {
        const [projectsResponse, pendingResponse] = await Promise.all([
          apiGet<ProjectOption[]>('/projects', getToken() ?? undefined),
          apiGet<ApprovalRequest[]>('/approvals/requests/pending', getToken() ?? undefined),
        ]);
        if (!active) return;
        setProjects(projectsResponse);
        setPending(pendingResponse);
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar la bandeja de aprobaciones.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPending();
    return () => {
      active = false;
    };
  }, []);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const disciplineOptions = useMemo(() => {
    const set = new Set<string>();
    pending.forEach((item) => {
      const d = item.document?.discipline;
      if (d) set.add(`${d.id}|${d.code}|${d.name}`);
    });
    return Array.from(set)
      .map((entry) => {
        const [id, code, name] = entry.split('|');
        return { id, code, name, label: `${code} - ${name}` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [pending]);

  const stepOptions = useMemo(() => {
    const set = new Set<string>();
    pending.forEach((item) => {
      if (item.currentStep?.name) set.add(item.currentStep.name);
    });
    return Array.from(set).sort();
  }, [pending]);

  const queryFiltered = useMemo(
    () =>
      pending.filter((item) => {
        if (queryProjectId && item.projectId !== queryProjectId) return false;
        if (queryFilter === 'active') {
          return item.status === 'pending' || item.status === 'in_process';
        }
        if (queryFilter === 'stopped') {
          return item.status === 'stopped';
        }
        return true;
      }),
    [pending, queryFilter, queryProjectId]
  );

  const blockedCount = useMemo(
    () => queryFiltered.filter((item) => item.status === 'stopped').length,
    [queryFiltered]
  );

  const metrics = useMemo(
    () => [
      {
        label: 'Pendientes',
        value: queryFiltered.filter(
          (item) => item.status === 'pending' || item.status === 'in_process'
        ).length,
        sub: `${queryFiltered.length} solicitudes en total`,
        icon: Clock3,
        variant: 'pending' as const,
      },
      {
        label: 'Por vencer',
        value: queryFiltered.filter((item) => item.status === 'pending').length,
        sub: 'Esperando aprobación inicial',
        icon: AlertTriangle,
        variant: 'expiring' as const,
      },
      {
        label: 'Aprobados',
        value: queryFiltered.filter((item) => item.status === 'approved').length,
        sub: 'Completados exitosamente',
        icon: CheckCircle2,
        variant: 'approved' as const,
      },
      {
        label: 'Por falta de aprobación',
        value: blockedCount,
        sub: blockedCount > 0 ? 'Requieren intervención' : 'Sin bloqueos',
        icon: ShieldAlert,
        variant: 'blocked' as const,
      },
    ],
    [queryFiltered, blockedCount]
  );

  const filteredPending = useMemo(() => {
    let result = queryFiltered;

    if (inboxFilter !== 'all') {
      result = result.filter((item) => item.status === inboxFilter);
    }

    if (projectFilter) {
      result = result.filter((item) => item.projectId === projectFilter);
    }

    if (disciplineFilter) {
      result = result.filter((item) => item.document?.discipline?.id === disciplineFilter);
    }

    if (stepFilter) {
      result = result.filter((item) => item.currentStep?.name === stepFilter);
    }

    if (inboxSearch.trim()) {
      const q = inboxSearch.toLowerCase();
      result = result.filter((item) => {
        const doc = item.document;
        return (
          doc?.documentNumber?.toLowerCase().includes(q) ||
          doc?.name?.toLowerCase().includes(q) ||
          doc?.discipline?.name?.toLowerCase().includes(q) ||
          doc?.discipline?.code?.toLowerCase().includes(q) ||
          item.currentStep?.name?.toLowerCase().includes(q) ||
          item.project?.name?.toLowerCase().includes(q) ||
          item.project?.code?.toLowerCase().includes(q)
        );
      });
    }

    result = [...result].sort((a, b) => {
      const aDays = daysRemaining(a.requestedAt, a.currentStep?.dueDays) ?? 999;
      const bDays = daysRemaining(b.requestedAt, b.currentStep?.dueDays) ?? 999;
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
        case 'due_asc':
          return aDays - bDays;
        case 'due_desc':
          return bDays - aDays;
        case 'newest':
        default:
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      }
    });

    return result;
  }, [
    queryFiltered,
    inboxFilter,
    inboxSearch,
    projectFilter,
    disciplineFilter,
    stepFilter,
    sortOrder,
  ]);

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Aprobaciones</h1>
          <p className="muted">Bandeja de solicitudes y accesos a flujos y envíos a aprobación.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/approvals/flows">
            Flujos
          </Link>
          <Link className="button" href="/approvals/requests/new">
            Enviar documento
          </Link>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <div className="status-metric-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className={`status-metric-card ${metric.variant}`} key={metric.label}>
              <div className="status-metric-head">
                <div className="status-metric-icon">
                  <Icon size={22} />
                </div>
              </div>
              <div className="status-metric-body">
                <div className="status-metric-value">{metric.value}</div>
                <div className="status-metric-label">{metric.label}</div>
                <div className="status-metric-sub">{metric.sub}</div>
              </div>
            </article>
          );
        })}
      </div>

      <article className="card" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Solicitudes activas</h2>
          <span className="pill">
            {loading ? 'Cargando' : `${filteredPending.length} registros`}
          </span>
        </div>
        <div className="filter-bar" style={{ marginBottom: 14 }}>
          <div className="search-input" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} />
            <input
              value={inboxSearch}
              onChange={(e) => setInboxSearch(e.target.value)}
              placeholder="Buscar doc, nombre, disciplina, proyecto..."
            />
          </div>

          <select
            className="select-filter"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>

          <select
            className="select-filter"
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
          >
            <option value="">Todas las disciplinas</option>
            {disciplineOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            className="select-filter"
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value)}
          >
            <option value="">Todos los pasos</option>
            {stepOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="select-filter"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="due_asc">Por vencer primero</option>
            <option value="due_desc">Por vencer último</option>
          </select>
        </div>
        <div className="filter-bar" style={{ marginBottom: 14 }}>
          <div className="filter-pills">
            {[
              { value: 'all', label: 'Todos', cls: 'all' },
              { value: 'pending', label: 'Pendiente', cls: 'pending' },
              { value: 'in_process', label: 'En proceso', cls: 'in_process' },
              { value: 'approved', label: 'Aprobado', cls: 'approved' },
              { value: 'stopped', label: 'Detenido', cls: 'stopped' },
            ].map((p) => (
              <button
                key={p.value}
                className={`filter-pill ${p.cls}${inboxFilter === p.value ? ' active' : ''}`}
                onClick={() => setInboxFilter(p.value)}
              >
                <span className="pill-dot" />
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="active-request-list">
          {filteredPending.map((item) => {
            const statusClass =
              item.status === 'approved'
                ? 'approved'
                : item.status === 'rejected'
                  ? 'rejected'
                  : item.status === 'stopped' || item.status === 'expired'
                    ? 'stopped'
                    : item.status === 'pending'
                      ? 'pending'
                      : 'in_process';
            const stepOrder = item.currentStep?.stepOrder ?? 0;
            const progressPct = stepOrder > 0 ? Math.min((stepOrder / 3) * 100, 100) : 0;
            const remaining = daysRemaining(item.requestedAt, item.currentStep?.dueDays);
            return (
              <div className="active-request-card" key={item.id}>
                <div className="active-request-top">
                  <div className="active-request-icon">
                    <FileText />
                  </div>
                  <div className="active-request-sku">
                    {item.document?.documentNumber ?? 'Documento'}
                  </div>
                  {item.document?.discipline ? (
                    <span className="discipline-badge">
                      <Tag size={10} />
                      {item.document.discipline.code}
                    </span>
                  ) : null}
                  <div className="active-request-name" style={{ flex: 1 }}>
                    {item.document?.name ?? 'Sin documento'}
                  </div>
                  <span className={`active-request-pill ${statusClass}`}>
                    <span className="pill-dot" />
                    {normalizeLabel(item.status)}
                  </span>
                </div>
                <div className="active-request-meta-row">
                  <span className="active-request-meta-item">
                    <FolderKanban />
                    {item.project?.name ?? projectMap.get(item.projectId)?.name ?? 'Sin proyecto'}
                    {item.project?.code ? (
                      <span className="muted" style={{ marginLeft: 4 }}>
                        ({item.project.code})
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="active-request-meta-row">
                  <span className="active-request-meta-item">
                    <Clock />
                    Solicitado {timeAgoShort(item.requestedAt)}
                  </span>
                  {remaining !== null ? (
                    <span
                      className={`active-request-meta-item ${remaining < 0 ? 'text-danger' : ''}`}
                    >
                      <Hourglass />
                      {remaining < 0
                        ? `Vencido hace ${Math.abs(remaining)}d`
                        : `Faltan ${remaining}d`}
                    </span>
                  ) : null}
                  <span className="active-request-meta-item">
                    <GitBranchPlus />
                    Paso: {item.currentStep?.name ?? 'Finalizado'}
                  </span>
                  <span className="active-request-progress">
                    <span className="compact-progress-bar">
                      <span
                        className="compact-progress-fill"
                        style={{ width: `${progressPct}%` }}
                      />
                    </span>
                    <span className="compact-progress-text">{progressPct.toFixed(0)}%</span>
                  </span>
                </div>
                <div className="active-request-footer">
                  <Link className="button secondary" href={`/approvals/requests/${item.id}`}>
                    Abrir solicitud
                  </Link>
                </div>
              </div>
            );
          })}
          {!loading && !filteredPending.length ? (
            <p className="muted">No hay solicitudes pendientes con este enfoque.</p>
          ) : null}
        </div>
      </article>
    </section>
  );
}

export function ApprovalFlowsListPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [flows, setFlows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const response = await apiGet<ProjectOption[]>('/projects', getToken() ?? undefined);
        if (!active) return;
        setProjects(response);
        setSelectedProjectId((current) => current || response[0]?.id || '');
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar los proyectos.'));
      }
    }
    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    let active = true;
    async function loadFlows() {
      setLoading(true);
      try {
        const response = await apiGet<Workflow[]>(
          `/approvals/flows?projectId=${encodeURIComponent(selectedProjectId)}`,
          getToken() ?? undefined
        );
        if (!active) return;
        setFlows(response);
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar los flujos.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadFlows();
    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  async function deactivateFlow(flowId: string) {
    try {
      await apiPatch(`/approvals/flows/${flowId}/deactivate`, {}, getToken() ?? undefined);
      setFlows((current) => current.filter((flow) => flow.id !== flowId));
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible desactivar el flujo.'));
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Flujos de aprobación</h1>
          <p className="muted">CRUD independiente para crear, editar y desactivar workflows.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/approvals">
            Volver
          </Link>
          <Link className="button" href="/approvals/flows/new">
            Nuevo flujo
          </Link>
        </div>
      </div>
      {error ? <div className="card muted">{error}</div> : null}
      <article className="card">
        <div className="quick-filters-grid">
          <SelectField
            label="Proyecto"
            value={selectedProjectId}
            onChange={setSelectedProjectId}
            options={projects.map((project) => ({
              value: project.id,
              label: `${project.code} · ${project.name}`,
            }))}
          />
        </div>
      </article>
      <div className="grid" style={{ marginTop: 16 }}>
        {flows.map((flow) => (
          <article className="card span-6" key={flow.id}>
            <div className="panel-header">
              <h2>{flow.name}</h2>
              <span className="pill">{flow.steps.length} pasos</span>
            </div>
            <p className="muted">
              {normalizeLabel(flow.scopeType)} ·{' '}
              {flow.requireForPublication ? 'Requerido para publicar' : 'No bloquea publicación'}
            </p>
            <div className="simple-document-list">
              {flow.steps.map((step) => (
                <div
                  className="simple-document-item"
                  key={step.id ?? `${flow.id}-${step.stepOrder}`}
                >
                  <strong>Paso {step.stepOrder}</strong>
                  <span>{step.name}</span>
                </div>
              ))}
            </div>
            <div className="projects-actions" style={{ marginTop: 12 }}>
              <Link className="button secondary" href={`/approvals/flows/${flow.id}/edit`}>
                Editar
              </Link>
              <button
                className="button danger-button"
                type="button"
                onClick={() => void deactivateFlow(flow.id)}
              >
                Desactivar
              </button>
            </div>
          </article>
        ))}
        {!loading && !flows.length ? (
          <article className="card span-12">
            <p className="muted">No hay flujos para este proyecto.</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}

export function ApprovalRequestCreatePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [flows, setFlows] = useState<Workflow[]>([]);
  const [projectId, setProjectId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [workflowId, setWorkflowId] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadBase() {
      try {
        const [projectsResponse, documentsResponse] = await Promise.all([
          apiGet<ProjectOption[]>('/projects', getToken() ?? undefined),
          apiGet<DocumentOption[]>('/documents', getToken() ?? undefined),
        ]);
        if (!active) return;
        setProjects(projectsResponse);
        setDocuments(documentsResponse);
        setProjectId((current) => current || projectsResponse[0]?.id || '');
      } catch (nextError) {
        if (!active) return;
        setError(
          getErrorMessage(nextError, 'No fue posible cargar los documentos para aprobación.')
        );
      }
    }
    void loadBase();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    async function loadFlows() {
      try {
        const response = await apiGet<Workflow[]>(
          `/approvals/flows?projectId=${encodeURIComponent(projectId)}`,
          getToken() ?? undefined
        );
        if (!active) return;
        setFlows(response);
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar los flujos del proyecto.'));
      }
    }
    void loadFlows();
    return () => {
      active = false;
    };
  }, [projectId]);

  const filteredDocuments = useMemo(
    () => documents.filter((document) => document.projectId === projectId),
    [documents, projectId]
  );

  async function submit() {
    if (!documentId) {
      setError('Selecciona un documento para enviar a aprobación.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await apiPost<ApprovalRequestDetail>(
        '/approvals/requests',
        { documentId, workflowId: workflowId || undefined, comment: comment || undefined },
        getToken() ?? undefined
      );
      router.push(`/approvals/requests/${created.id}`);
      router.refresh();
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible iniciar la aprobación.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Enviar documento a aprobación</h1>
          <p className="muted">Selecciona el proyecto, el archivo y el flujo que mejor aplique.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/approvals">
            Volver
          </Link>
        </div>
      </div>
      {error ? <div className="card muted">{error}</div> : null}
      <article className="card">
        <div className="quick-filters-grid">
          <SelectField
            label="Proyecto"
            value={projectId}
            onChange={setProjectId}
            options={projects.map((project) => ({
              value: project.id,
              label: `${project.code} · ${project.name}`,
            }))}
          />
          <SelectField
            label="Documento"
            value={documentId}
            onChange={setDocumentId}
            options={filteredDocuments.map((document) => ({
              value: document.id,
              label: `${document.documentNumber} · ${document.name}`,
            }))}
          />
          <SelectField
            label="Flujo"
            value={workflowId}
            onChange={setWorkflowId}
            options={flows.map((flow) => ({
              value: flow.id,
              label: `${flow.name} · ${flow.steps.length} pasos`,
            }))}
          />
          <div className="field span-2">
            <label>Comentario inicial</label>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
          </div>
        </div>
        <div className="projects-actions">
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Enviando...' : 'Iniciar aprobación'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function ApprovalRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ApprovalRequestDetail | null>(null);
  const [documentDetail, setDocumentDetail] = useState<ApprovalDocumentDetail | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [reviewMode, setReviewMode] = useState<'original' | 'comments'>('original');
  const [loading, setLoading] = useState(true);
  const [actionComment, setActionComment] = useState('');
  const [error, setError] = useState('');

  const documentComments = useMemo(() => {
    const comments = documentDetail?.comments ?? [];
    const plain: ApprovalDocumentDetail['comments'] = [];
    const annotationSets: Array<
      ApprovalDocumentDetail['comments'][number] & { annotationSet: SavedReviewPayload }
    > = [];

    comments.forEach((comment) => {
      const annotationSet = parseAnnotationComment(comment.body);
      if (annotationSet) {
        annotationSets.push({ ...comment, annotationSet });
        return;
      }
      plain.push(comment);
    });

    return { plain, annotationSets };
  }, [documentDetail?.comments]);

  useEffect(() => {
    if (!requestId) return;
    let active = true;
    async function loadDetail() {
      setLoading(true);
      try {
        const response = await apiGet<ApprovalRequestDetail>(
          `/approvals/requests/${requestId}`,
          getToken() ?? undefined
        );
        if (!active) return;
        setDetail(response);
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar la solicitud.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDetail();
    return () => {
      active = false;
    };
  }, [requestId]);

  useEffect(() => {
    const documentId = detail?.document?.id;
    if (!documentId) {
      setDocumentDetail(null);
      setDocumentError('');
      return;
    }

    let active = true;
    async function loadDocumentDetail() {
      setDocumentLoading(true);
      setDocumentError('');
      try {
        const response = await apiGet<ApprovalDocumentDetail>(
          `/documents/${documentId}`,
          getToken() ?? undefined
        );
        if (!active) return;
        setDocumentDetail(response);
      } catch (nextError) {
        if (!active) return;
        setDocumentDetail(null);
        setDocumentError(
          getErrorMessage(nextError, 'No fue posible cargar la vista del documento para revisión.')
        );
      } finally {
        if (active) setDocumentLoading(false);
      }
    }

    void loadDocumentDetail();
    return () => {
      active = false;
    };
  }, [detail?.document?.id]);

  useEffect(() => {
    setReviewMode('original');
  }, [detail?.document?.id]);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    async function loadPreview() {
      if (!documentDetail?.preview.available) {
        setPreviewUrl('');
        return;
      }

      try {
        const blob = await fetchProtectedBlob(`/documents/${documentDetail.id}/content`);
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch {
        if (!active) return;
        setPreviewUrl('');
      }
    }

    void loadPreview();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentDetail?.id, documentDetail?.preview.available]);

  async function submitAction(action: 'approve' | 'reject' | 'request-changes' | 'comment') {
    if (!requestId) return;
    try {
      const updated = await apiPost<ApprovalRequestDetail>(
        `/approvals/requests/${requestId}/${action}`,
        { comment: actionComment || undefined },
        getToken() ?? undefined
      );
      setDetail(updated);
      setActionComment('');
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible registrar la acción.'));
    }
  }

  async function downloadCurrentFile() {
    if (!documentDetail) return;
    try {
      const blob = await fetchProtectedBlob(`/documents/${documentDetail.id}/download`);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download =
        documentDetail.currentVersion?.fileName ??
        `${documentDetail.documentNumber}.${documentDetail.fileExtension ?? 'bin'}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible descargar el archivo actual.'));
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Solicitud de aprobación</h1>
          <p className="muted">Revisión por etapas, acciones y trazabilidad completa del flujo.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/approvals">
            Volver
          </Link>
        </div>
      </div>
      {error ? <div className="card muted">{error}</div> : null}
      <article className="card">
        {loading ? (
          <p className="muted">Cargando solicitud...</p>
        ) : detail ? (
          <>
            <div className="project-state-grid">
              <div className="state-card">
                <span>Documento</span>
                <strong>{detail.document?.documentNumber ?? 'Sin documento'}</strong>
              </div>
              <div className="state-card">
                <span>Estado</span>
                <strong>{normalizeLabel(detail.status)}</strong>
              </div>
              <div className="state-card">
                <span>Paso actual</span>
                <strong>{detail.currentStep?.name ?? 'Finalizado'}</strong>
              </div>
              <div className="state-card">
                <span>Workflow</span>
                <strong>{detail.workflow.name}</strong>
              </div>
            </div>

            <div
              className="document-drive-preview"
              style={{
                marginTop: 20,
                position: 'static',
                maxHeight: 'none',
                overflow: 'visible',
                paddingRight: 0,
              }}
            >
              <div className="document-preview-hero">
                <span className="document-preview-badge">Documento para revisar</span>
                <h2>{detail.document?.name ?? 'Sin nombre disponible'}</h2>
                <p className="muted">
                  {detail.document?.documentNumber ?? 'Sin folio'} ·{' '}
                  {normalizeLabel(documentDetail?.status ?? detail.document?.status)}
                </p>
              </div>

              <div className="document-preview-summary">
                <div className="state-card">
                  <span>Versión</span>
                  <strong>{documentDetail?.currentVersion?.revision ?? 'Sin versión'}</strong>
                </div>
                <div className="state-card">
                  <span>Archivo</span>
                  <strong>{documentDetail?.currentVersion?.fileName ?? 'Sin archivo'}</strong>
                </div>
                <div className="state-card">
                  <span>Tamaño</span>
                  <strong>
                    {formatSize(
                      documentDetail?.currentVersion?.sizeBytes ?? documentDetail?.sizeBytes
                    )}
                  </strong>
                </div>
                <div className="state-card">
                  <span>Formato</span>
                  <strong>{documentDetail?.currentVersion?.mimeType ?? 'Sin formato'}</strong>
                </div>
              </div>

              <div className="document-preview-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => void downloadCurrentFile()}
                  disabled={!documentDetail}
                >
                  <Download size={18} />
                  Descargar archivo
                </button>
                {detail.document?.id ? (
                  <Link className="button secondary" href={`/documents/${detail.document.id}`}>
                    <FileText size={18} />
                    Abrir ficha del documento
                  </Link>
                ) : null}
                {detail.document?.id ? (
                  <Link
                    className="button secondary"
                    href={`/documents/${detail.document.id}/review`}
                  >
                    <MessageSquareMore size={18} />
                    Ver comentarios en visor
                  </Link>
                ) : null}
              </div>

              <div className="review-scope-switch" style={{ marginTop: 16, marginBottom: 16 }}>
                <button
                  className={`review-scope-button ${reviewMode === 'original' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setReviewMode('original')}
                >
                  Ver original
                </button>
                <button
                  className={`review-scope-button ${reviewMode === 'comments' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setReviewMode('comments')}
                  disabled={
                    !documentComments.plain.length && !documentComments.annotationSets.length
                  }
                >
                  Ver comentarios
                </button>
              </div>

              {documentError ? <div className="card muted">{documentError}</div> : null}

              {reviewMode === 'comments' ? (
                <div className="grid" style={{ marginTop: 4 }}>
                  <article className="card span-6">
                    <div className="panel-header">
                      <h2>Anotaciones guardadas</h2>
                      <span className="pill">{documentComments.annotationSets.length}</span>
                    </div>
                    <div className="simple-document-list">
                      {documentComments.annotationSets.length ? (
                        documentComments.annotationSets.map((entry) => {
                          const annotationCount = entry.annotationSet.annotations.length;
                          const pages = Array.from(
                            new Set(
                              entry.annotationSet.annotations.map((item) => item.pageIndex + 1)
                            )
                          ).sort((left, right) => left - right);
                          const kindSummary = Array.from(
                            entry.annotationSet.annotations.reduce((summary, item) => {
                              summary.set(item.kind, (summary.get(item.kind) ?? 0) + 1);
                              return summary;
                            }, new Map<ReviewAnnotation['kind'], number>())
                          );

                          return (
                            <div className="simple-document-item" key={entry.id}>
                              <strong>{entry.author?.name ?? 'Usuario'}</strong>
                              <span>
                                {annotationCount} anotaciones ·{' '}
                                {pages.length
                                  ? `Páginas ${pages.join(', ')}`
                                  : 'Sin página definida'}
                              </span>
                              <small>
                                {kindSummary.length
                                  ? kindSummary
                                      .map(
                                        ([kind, count]) =>
                                          `${describeAnnotationKind(kind)}: ${count}`
                                      )
                                      .join(' · ')
                                  : 'Sin detalle de anotaciones'}
                              </small>
                              <small>
                                {entry.annotationSet.versionId
                                  ? `Versión anotada: ${entry.annotationSet.versionId}`
                                  : 'Sin versión asociada'}{' '}
                                · {new Date(entry.createdAt).toLocaleString()}
                              </small>
                            </div>
                          );
                        })
                      ) : (
                        <p className="muted">No hay anotaciones guardadas para este documento.</p>
                      )}
                    </div>
                  </article>

                  <article className="card span-6">
                    <div className="panel-header">
                      <h2>Comentarios del documento</h2>
                      <span className="pill">{documentComments.plain.length}</span>
                    </div>
                    <div className="simple-document-list">
                      {documentComments.plain.length ? (
                        documentComments.plain.map((comment) => (
                          <div className="simple-document-item" key={comment.id}>
                            <strong>{comment.author?.name ?? 'Usuario'}</strong>
                            <span>{comment.body}</span>
                            <small>{new Date(comment.createdAt).toLocaleString()}</small>
                          </div>
                        ))
                      ) : (
                        <p className="muted">
                          No hay comentarios escritos aparte de las anotaciones del visor.
                        </p>
                      )}
                    </div>
                    {detail.document?.id ? (
                      <div className="projects-actions" style={{ marginTop: 16 }}>
                        <Link
                          className="button secondary"
                          href={`/documents/${detail.document.id}/review`}
                        >
                          <MessageSquareMore size={18} />
                          Abrir visor con anotaciones
                        </Link>
                      </div>
                    ) : null}
                  </article>
                </div>
              ) : documentLoading ? (
                <div className="preview-empty">
                  <p className="muted">Cargando contenido del documento...</p>
                </div>
              ) : documentDetail?.preview.available && previewUrl ? (
                documentDetail.preview.mimeType?.startsWith('image/') ? (
                  <img
                    alt={documentDetail.name}
                    className="document-preview-image"
                    src={previewUrl}
                  />
                ) : (
                  <iframe
                    className="document-preview-frame"
                    src={previewUrl}
                    title={documentDetail.name}
                  />
                )
              ) : (
                <div className="preview-empty">
                  <div>
                    <p className="muted" style={{ marginBottom: 8 }}>
                      {documentDetail
                        ? 'Este archivo no tiene vista previa embebida, pero puedes descargarlo para revisarlo.'
                        : 'Todavía no hay contenido disponible para vista previa.'}
                    </p>
                    <small>
                      {documentDetail?.currentVersion?.notes
                        ? `Notas de versión: ${documentDetail.currentVersion.notes}`
                        : 'Sin notas de versión registradas.'}
                    </small>
                  </div>
                </div>
              )}

              <div className="grid" style={{ marginTop: 4 }}>
                <article className="card span-6">
                  <div className="panel-header">
                    <h2>Contexto del documento</h2>
                  </div>
                  <div className="simple-document-list">
                    <div className="simple-document-item">
                      <strong>Proyecto</strong>
                      <span>
                        {documentDetail?.project
                          ? `${documentDetail.project.code} · ${documentDetail.project.name}`
                          : 'Sin proyecto'}
                      </span>
                    </div>
                    <div className="simple-document-item">
                      <strong>Disciplina</strong>
                      <span>
                        {documentDetail?.discipline
                          ? `${documentDetail.discipline.code} · ${documentDetail.discipline.name}`
                          : 'Sin disciplina'}
                      </span>
                    </div>
                    <div className="simple-document-item">
                      <strong>Carpeta</strong>
                      <span>{documentDetail?.folder?.name ?? 'Sin carpeta'}</span>
                    </div>
                    <div className="simple-document-item">
                      <strong>Responsable</strong>
                      <span>{documentDetail?.responsibleUser?.name ?? 'Sin responsable'}</span>
                    </div>
                    <div className="simple-document-item">
                      <strong>Confidencialidad</strong>
                      <span>{normalizeLabel(documentDetail?.confidentialityLevel)}</span>
                    </div>
                    <div className="simple-document-item">
                      <strong>Vencimiento</strong>
                      <span>
                        {documentDetail?.dueDate
                          ? new Date(`${documentDetail.dueDate}T00:00:00`).toLocaleDateString()
                          : 'Sin vencimiento'}
                      </span>
                    </div>
                  </div>
                </article>

                <article className="card span-6">
                  <div className="panel-header">
                    <h2>Comentarios del documento</h2>
                    <span className="pill">{documentComments.plain.length}</span>
                  </div>
                  <div className="simple-document-list">
                    {documentComments.plain.length ? (
                      documentComments.plain.map((comment) => (
                        <div className="simple-document-item" key={comment.id}>
                          <strong>{comment.author?.name ?? 'Usuario'}</strong>
                          <span>{comment.body}</span>
                          <small>{new Date(comment.createdAt).toLocaleString()}</small>
                        </div>
                      ))
                    ) : (
                      <p className="muted">No hay comentarios documentales registrados.</p>
                    )}
                  </div>
                  {documentComments.annotationSets.length ? (
                    <div className="simple-document-list" style={{ marginTop: 16 }}>
                      <div className="simple-document-item">
                        <strong>Anotaciones del visor</strong>
                        <span>
                          {documentComments.annotationSets.length} paquete(s) de anotaciones
                          guardados
                        </span>
                        <small>
                          Usa “Ver comentarios” o “Ver comentarios en visor” para revisarlos sin ver
                          el contenido técnico interno.
                        </small>
                      </div>
                    </div>
                  ) : null}
                </article>
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label>Comentario / decisión</label>
              <textarea
                value={actionComment}
                onChange={(event) => setActionComment(event.target.value)}
              />
            </div>

            <div className="projects-actions">
              <button className="button" type="button" onClick={() => void submitAction('approve')}>
                <CheckCircle2 size={18} />
                Aprobar
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => void submitAction('request-changes')}
              >
                <MessageSquareMore size={18} />
                Solicitar cambios
              </button>
              <button
                className="button danger-button"
                type="button"
                onClick={() => void submitAction('reject')}
              >
                <XCircle size={18} />
                Rechazar
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => void submitAction('comment')}
              >
                Comentar
              </button>
            </div>

            <div className="simple-document-list" style={{ marginTop: 20 }}>
              {detail.actions.map((action) => (
                <div className="simple-document-item" key={action.id}>
                  <strong>{normalizeLabel(action.action)}</strong>
                  <span>
                    {action.step
                      ? `Paso ${action.step.stepOrder}: ${action.step.name}`
                      : 'Sin paso asociado'}{' '}
                    · {action.actor?.name ?? 'Usuario'}
                  </span>
                  <small>
                    {action.comment || 'Sin comentario'} ·{' '}
                    {new Date(action.createdAt).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">No fue posible abrir esta solicitud.</p>
        )}
      </article>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Selecciona</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
