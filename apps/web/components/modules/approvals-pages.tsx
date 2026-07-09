'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  MessageSquareMore,
  Plus,
  ShieldAlert,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { normalizeLabel } from '../../lib/labels';

type ProjectOption = { id: string; name: string; code: string };
type DocumentOption = {
  id: string;
  documentNumber: string;
  name: string;
  projectId: string;
  status: string;
};
type UserOption = { id: string; name: string; email: string };

type WorkflowStep = {
  id?: string;
  stepOrder: number;
  name: string;
  approverUserId?: string;
  approverRoleId?: string;
  required?: boolean;
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
  currentStep: { id: string; name: string; stepOrder: number } | null;
  document: { id: string; documentNumber: string; name: string; status: string } | null;
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

type FlowForm = {
  projectId: string;
  name: string;
  scopeType: 'global' | 'document_specific';
  targetDocumentId: string;
  requireForPublication: boolean;
};

type ProjectAssignmentMode = 'all_projects' | 'selected_projects';

type FormOptionsResponse = {
  users: UserOption[];
};

const emptyFlowForm: FlowForm = {
  projectId: '',
  name: '',
  scopeType: 'global',
  targetDocumentId: '',
  requireForPublication: true,
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
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}${path}`,
    {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    }
  );

  if (!response.ok) {
    throw new Error('No fue posible descargar el archivo');
  }

  return response.blob();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function buildEmptyStep(stepOrder: number): WorkflowStep {
  return { stepOrder, name: '', approverUserId: '', required: true };
}

type ApprovalInboxFilter = 'all' | 'active' | 'stopped';

function normalizeApprovalInboxFilter(value: string | null): ApprovalInboxFilter {
  if (value === 'active' || value === 'stopped') return value;
  return 'all';
}

export function ApprovalsInboxPage() {
  const searchParams = useSearchParams();
  const queryFilter = normalizeApprovalInboxFilter(searchParams.get('status'));
  const queryProjectId = searchParams.get('projectId') ?? '';
  const [pending, setPending] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPending() {
      setLoading(true);
      setError('');
      try {
        const response = await apiGet<ApprovalRequest[]>(
          '/approvals/requests/pending',
          getToken() ?? undefined
        );
        if (!active) return;
        setPending(response);
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

  const filteredPending = useMemo(
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

  const metrics = useMemo(
    () => [
      { label: 'Solicitudes visibles', value: filteredPending.length, icon: Clock3 },
      {
        label: 'En proceso',
        value: filteredPending.filter((item) => item.status === 'in_process').length,
        icon: FileCheck2,
      },
      {
        label: 'Detenidas',
        value: filteredPending.filter((item) => item.status === 'stopped').length,
        icon: ShieldAlert,
      },
    ],
    [filteredPending]
  );

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

      <div className="grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="card span-4 project-metric info" key={metric.label}>
              <Icon size={20} />
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
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
        <div className="simple-document-list">
          {filteredPending.map((item) => (
            <div className="simple-document-item" key={item.id}>
              <strong>{item.document?.documentNumber ?? 'Documento'}</strong>
              <span>{item.document?.name ?? 'Sin documento'}</span>
              <small>
                {item.currentStep?.name ?? 'Sin paso actual'} · {normalizeLabel(item.status)}
              </small>
              <div className="projects-actions" style={{ marginTop: 8 }}>
                <Link className="button secondary" href={`/approvals/requests/${item.id}`}>
                  Abrir solicitud
                </Link>
              </div>
            </div>
          ))}
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

export function ApprovalFlowFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const flowId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState<FlowForm>(emptyFlowForm);
  const [steps, setSteps] = useState<WorkflowStep[]>([buildEmptyStep(1)]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [projectAssignmentMode, setProjectAssignmentMode] =
    useState<ProjectAssignmentMode>('all_projects');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadBase() {
      try {
        const [projectsResponse, documentsResponse, formOptionsResponse] = await Promise.all([
          apiGet<ProjectOption[]>('/projects', getToken() ?? undefined),
          apiGet<DocumentOption[]>('/documents', getToken() ?? undefined),
          apiGet<FormOptionsResponse>('/projects/form-options', getToken() ?? undefined),
        ]);
        if (!active) return;
        setProjects(projectsResponse);
        setDocuments(documentsResponse);
        setUsers(formOptionsResponse.users);
        setSelectedProjectIds((current) =>
          current.length ? current : projectsResponse[0] ? [projectsResponse[0].id] : []
        );
        setForm((current) => ({
          ...current,
          projectId: current.projectId || projectsResponse[0]?.id || '',
        }));
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar datos para el flujo.'));
      }
    }
    void loadBase();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !flowId) return;
    let active = true;
    async function loadFlow() {
      setLoading(true);
      try {
        const response = await apiGet<Workflow>(
          `/approvals/flows/${flowId}`,
          getToken() ?? undefined
        );
        if (!active) return;
        setForm({
          projectId: response.projectId,
          name: response.name,
          scopeType: response.scopeType,
          targetDocumentId: response.targetDocumentId ?? '',
          requireForPublication: response.requireForPublication,
        });
        setProjectAssignmentMode('selected_projects');
        setSelectedProjectIds([response.projectId]);
        setSteps(
          response.steps.length
            ? response.steps.sort((a, b) => a.stepOrder - b.stepOrder)
            : [buildEmptyStep(1)]
        );
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar el flujo.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadFlow();
    return () => {
      active = false;
    };
  }, [flowId, mode]);

  function syncStepOrders(nextSteps: WorkflowStep[]) {
    return nextSteps.map((step, index) => ({ ...step, stepOrder: index + 1 }));
  }

  function setStep(index: number, patch: Partial<WorkflowStep>) {
    setSteps((current) =>
      current.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step))
    );
  }

  function addStep() {
    setSteps((current) => [...current, buildEmptyStep(current.length + 1)]);
  }

  function removeStep(index: number) {
    setSteps((current) => syncStepOrders(current.filter((_, stepIndex) => stepIndex !== index)));
  }

  function moveStep(fromIndex: number, toIndex: number) {
    setSteps((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return syncStepOrders(next);
    });
  }

  const filteredProjects = useMemo(() => {
    const normalized = projectSearch.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) =>
      `${project.code} ${project.name}`.toLowerCase().includes(normalized)
    );
  }, [projectSearch, projects]);

  const canUseDocumentSpecificScope = mode === 'edit' || selectedProjectIds.length === 1;
  const activeProjectId = mode === 'edit' ? form.projectId : (selectedProjectIds[0] ?? '');
  const filteredDocuments = useMemo(
    () => documents.filter((document) => document.projectId === activeProjectId),
    [activeProjectId, documents]
  );

  function toggleProjectSelection(projectId: string) {
    setSelectedProjectIds((current) => {
      if (current.includes(projectId)) {
        return current.filter((id) => id !== projectId);
      }
      return [...current, projectId];
    });
  }

  useEffect(() => {
    if (mode === 'edit') return;
    if (projectAssignmentMode === 'all_projects') {
      const nextProjectIds = projects.map((project) => project.id);
      setSelectedProjectIds(nextProjectIds);
      setForm((current) => ({
        ...current,
        projectId: nextProjectIds[0] ?? '',
        scopeType: 'global',
        targetDocumentId: '',
      }));
      return;
    }

    setSelectedProjectIds((current) => {
      if (current.length) return current;
      return projects[0] ? [projects[0].id] : [];
    });
  }, [mode, projectAssignmentMode, projects]);

  useEffect(() => {
    if (mode === 'edit') return;
    if (!canUseDocumentSpecificScope && form.scopeType === 'document_specific') {
      setForm((current) => ({ ...current, scopeType: 'global', targetDocumentId: '' }));
    }
  }, [canUseDocumentSpecificScope, form.scopeType, mode]);

  useEffect(() => {
    if (mode === 'edit') return;
    const nextProjectId = selectedProjectIds[0] ?? '';
    setForm((current) => {
      if (current.projectId === nextProjectId) return current;
      return { ...current, projectId: nextProjectId, targetDocumentId: '' };
    });
  }, [mode, selectedProjectIds]);

  async function submit() {
    if (!form.name.trim()) {
      setError('Completa el nombre del flujo.');
      return;
    }
    if (mode === 'create' && !selectedProjectIds.length) {
      setError('Selecciona al menos un proyecto o usa la opción de todos los proyectos.');
      return;
    }
    if (!steps.length || steps.some((step) => !step.name.trim() || !step.approverUserId)) {
      setError('Cada paso debe tener nombre y aprobador.');
      return;
    }
    if (form.scopeType === 'document_specific' && !canUseDocumentSpecificScope) {
      setError(
        'El alcance por documento solo está disponible cuando seleccionas un solo proyecto.'
      );
      return;
    }
    if (form.scopeType === 'document_specific' && !form.targetDocumentId) {
      setError('Selecciona el documento objetivo para este flujo.');
      return;
    }

    setSaving(true);
    setError('');

    const targetProjectIds = mode === 'edit' ? [form.projectId] : selectedProjectIds;
    const payloadBase = {
      name: form.name,
      entityType: 'document',
      scopeType: form.scopeType,
      requireForPublication: form.requireForPublication,
      steps: syncStepOrders(steps),
    };

    try {
      if (mode === 'create') {
        await Promise.all(
          targetProjectIds.map((projectId) =>
            apiPost(
              '/approvals/flows',
              {
                ...payloadBase,
                projectId,
                targetDocumentId:
                  form.scopeType === 'document_specific' && projectId === targetProjectIds[0]
                    ? form.targetDocumentId || undefined
                    : undefined,
              },
              getToken() ?? undefined
            )
          )
        );
      } else if (flowId) {
        await apiPatch(
          `/approvals/flows/${flowId}`,
          {
            ...payloadBase,
            projectId: form.projectId,
            targetDocumentId:
              form.scopeType === 'document_specific'
                ? form.targetDocumentId || undefined
                : undefined,
          },
          getToken() ?? undefined
        );
      }
      router.push('/approvals/flows');
      router.refresh();
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible guardar el flujo.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{mode === 'create' ? 'Nuevo flujo de aprobación' : 'Editar flujo de aprobación'}</h1>
          <p className="muted">
            Pasos dinámicos, aprobadores variables y reordenamiento sin rigidez.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/approvals/flows">
            Volver
          </Link>
        </div>
      </div>
      {error ? <div className="card muted">{error}</div> : null}
      <article className="card">
        {loading ? (
          <p className="muted">Cargando formulario...</p>
        ) : (
          <>
            <div className="quick-filters-grid">
              {mode === 'create' ? (
                <SelectField
                  label="Alcance"
                  value={projectAssignmentMode}
                  onChange={(value) => setProjectAssignmentMode(value as ProjectAssignmentMode)}
                  options={[
                    { value: 'all_projects', label: 'Todos los proyectos' },
                    { value: 'selected_projects', label: 'Seleccionar proyectos' },
                  ]}
                />
              ) : (
                <SelectField
                  label="Proyecto"
                  value={form.projectId}
                  onChange={(value) => setForm((current) => ({ ...current, projectId: value }))}
                  options={projects.map((project) => ({
                    value: project.id,
                    label: `${project.code} · ${project.name}`,
                  }))}
                />
              )}
              <TextField
                label="Nombre del flujo"
                value={form.name}
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              />
              <SelectField
                label="Aplica a"
                value={form.scopeType}
                onChange={(value) =>
                  setForm((current) => ({ ...current, scopeType: value as FlowForm['scopeType'] }))
                }
                options={[
                  { value: 'global', label: 'Todo el proyecto' },
                  { value: 'document_specific', label: 'Documento específico' },
                ]}
                disabled={!canUseDocumentSpecificScope}
              />
              {form.scopeType === 'document_specific' && canUseDocumentSpecificScope ? (
                <SelectField
                  label="Documento objetivo"
                  value={form.targetDocumentId}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, targetDocumentId: value }))
                  }
                  options={filteredDocuments.map((document) => ({
                    value: document.id,
                    label: `${document.documentNumber} · ${document.name}`,
                  }))}
                />
              ) : null}
              <SelectField
                label="Requiere aprobación para publicar"
                value={form.requireForPublication ? 'yes' : 'no'}
                onChange={(value) =>
                  setForm((current) => ({ ...current, requireForPublication: value === 'yes' }))
                }
                options={[
                  { value: 'yes', label: 'Sí' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </div>

            {mode === 'create' ? (
              <div className="field" style={{ marginTop: 16 }}>
                <label>Proyectos incluidos</label>
                {projectAssignmentMode === 'all_projects' ? (
                  <div className="selection-summary-card">
                    <strong>{projects.length} proyectos seleccionados</strong>
                    <span className="muted">
                      El flujo se creará en todos los proyectos visibles para tu usuario.
                    </span>
                  </div>
                ) : (
                  <div className="project-picker-card">
                    <input
                      type="search"
                      placeholder="Buscar proyecto por clave o nombre"
                      value={projectSearch}
                      onChange={(event) => setProjectSearch(event.target.value)}
                    />
                    <div className="project-picker-list">
                      {filteredProjects.map((project) => {
                        const checked = selectedProjectIds.includes(project.id);
                        return (
                          <label className="project-picker-item" key={project.id}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProjectSelection(project.id)}
                            />
                            <span>
                              <strong>{project.code}</strong> · {project.name}
                            </span>
                          </label>
                        );
                      })}
                      {!filteredProjects.length ? (
                        <p className="muted">No hay proyectos que coincidan con la búsqueda.</p>
                      ) : null}
                    </div>
                    <span className="muted">
                      {selectedProjectIds.length} proyecto
                      {selectedProjectIds.length === 1 ? '' : 's'} seleccionado
                      {selectedProjectIds.length === 1 ? '' : 's'}.
                    </span>
                  </div>
                )}
                {!canUseDocumentSpecificScope ? (
                  <span className="muted">
                    Si eliges varios proyectos, el flujo solo puede aplicarse a todo el proyecto.
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="panel-header" style={{ marginTop: 20 }}>
              <h2>Pasos del flujo</h2>
              <button className="button secondary" type="button" onClick={addStep}>
                <Plus size={16} />
                Agregar paso
              </button>
            </div>

            <div className="simple-document-list">
              {steps.map((step, index) => (
                <div
                  className="simple-document-item"
                  key={step.id ?? `step-${index}`}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index) return;
                    moveStep(dragIndex, index);
                    setDragIndex(null);
                  }}
                >
                  <strong>Paso {index + 1}</strong>
                  <div className="quick-filters-grid">
                    <TextField
                      label="Nombre del paso"
                      value={step.name}
                      onChange={(value) => setStep(index, { name: value })}
                    />
                    <SelectField
                      label="Aprobador"
                      value={step.approverUserId ?? ''}
                      onChange={(value) => setStep(index, { approverUserId: value })}
                      options={users.map((user) => ({
                        value: user.id,
                        label: `${user.name} · ${user.email}`,
                      }))}
                    />
                    <SelectField
                      label="Requerido"
                      value={step.required === false ? 'no' : 'yes'}
                      onChange={(value) => setStep(index, { required: value === 'yes' })}
                      options={[
                        { value: 'yes', label: 'Sí' },
                        { value: 'no', label: 'No' },
                      ]}
                    />
                  </div>
                  <div className="projects-actions" style={{ marginTop: 8 }}>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => index > 0 && moveStep(index, index - 1)}
                      disabled={index === 0}
                    >
                      <ArrowUp size={16} />
                      Subir
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => index < steps.length - 1 && moveStep(index, index + 1)}
                      disabled={index === steps.length - 1}
                    >
                      <ArrowDown size={16} />
                      Bajar
                    </button>
                    <button
                      className="button danger-button"
                      type="button"
                      onClick={() => removeStep(index)}
                      disabled={steps.length === 1}
                    >
                      <Trash2 size={16} />
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="projects-actions" style={{ marginTop: 16 }}>
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar flujo'}
              </button>
            </div>
          </>
        )}
      </article>
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
    if (!documentDetail?.preview.available) {
      setPreviewUrl('');
      return;
    }

    setPreviewUrl(`/api/documents/${documentDetail.id}/content`);
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

function TextField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
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
