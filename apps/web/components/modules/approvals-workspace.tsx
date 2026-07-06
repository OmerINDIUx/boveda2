'use client';

import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  GitBranchPlus,
  MessageSquareMore,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';

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
};

type ApprovalRequest = {
  id: string;
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

type FlowForm = {
  projectId: string;
  name: string;
  scopeType: 'global' | 'document_specific';
  targetDocumentId: string;
  requireForPublication: boolean;
};

const emptyFlowForm: FlowForm = {
  projectId: '',
  name: '',
  scopeType: 'global',
  targetDocumentId: '',
  requireForPublication: true,
};

const fallbackProjects: ProjectOption[] = [
  { id: 'mock-project-1', name: 'Torre Ejecutiva Norte', code: 'HOL-PRJ-001' },
];

const fallbackDocuments: DocumentOption[] = [
  {
    id: 'mock-doc-1',
    documentNumber: 'ARC-IFC-012',
    name: 'Plano de fachada nivel 12',
    projectId: 'mock-project-1',
    status: 'pending_approval',
  },
  {
    id: 'mock-doc-2',
    documentNumber: 'MEC-SUB-021',
    name: 'Ficha de equipos HVAC',
    projectId: 'mock-project-1',
    status: 'in_review',
  },
];

const fallbackUsers: UserOption[] = [
  { id: 'u-1', name: 'Laura Méndez', email: 'laura@holocron.local' },
  { id: 'u-2', name: 'José Ramírez', email: 'jose@holocron.local' },
];

const fallbackFlows: Workflow[] = [
  {
    id: 'wf-1',
    projectId: 'mock-project-1',
    name: 'Aprobación técnica general',
    entityType: 'document',
    scopeType: 'global',
    requireForPublication: true,
    active: true,
    steps: [
      { id: 'st-1', stepOrder: 1, name: 'Revisión técnica', approverUserId: 'u-1', required: true },
      {
        id: 'st-2',
        stepOrder: 2,
        name: 'Liberación de coordinación',
        approverUserId: 'u-2',
        required: true,
      },
    ],
  },
];

const fallbackPending: ApprovalRequest[] = [
  {
    id: 'req-1',
    status: 'in_process',
    requestedAt: '2026-07-02T09:00:00.000Z',
    lastActionAt: '2026-07-02T09:00:00.000Z',
    currentStep: { id: 'st-1', name: 'Revisión técnica', stepOrder: 1 },
    document: {
      id: 'mock-doc-1',
      documentNumber: 'ARC-IFC-012',
      name: 'Plano de fachada nivel 12',
      status: 'pending_approval',
    },
  },
];

const fallbackRequestDetail: Record<string, ApprovalRequestDetail> = {
  'req-1': {
    id: 'req-1',
    status: 'in_process',
    requestedAt: '2026-07-02T09:00:00.000Z',
    lastActionAt: '2026-07-02T09:00:00.000Z',
    workflow: fallbackFlows[0],
    currentStepId: 'st-1',
    currentStep: { id: 'st-1', name: 'Revisión técnica', stepOrder: 1 },
    document: {
      id: 'mock-doc-1',
      documentNumber: 'ARC-IFC-012',
      name: 'Plano de fachada nivel 12',
      status: 'pending_approval',
    },
    actions: [
      {
        id: 'act-1',
        action: 'submitted',
        comment: 'Solicitud inicial desde control documental.',
        stepOrder: 1,
        createdAt: '2026-07-02T09:00:00.000Z',
        actor: fallbackUsers[0],
        step: { id: 'st-1', name: 'Revisión técnica', stepOrder: 1 },
      },
    ],
  },
};

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('holocron_token');
}

function normalizeLabel(value?: string | null) {
  if (!value) return 'Sin definir';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ApprovalsWorkspace() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [flows, setFlows] = useState<Workflow[]>([]);
  const [pending, setPending] = useState<ApprovalRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [requestDetail, setRequestDetail] = useState<ApprovalRequestDetail | null>(null);
  const [flowForm, setFlowForm] = useState<FlowForm>(emptyFlowForm);
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { stepOrder: 1, name: '', approverUserId: '', required: true },
    { stepOrder: 2, name: '', approverUserId: '', required: true },
  ]);
  const [newRequestDocumentId, setNewRequestDocumentId] = useState('');
  const [newRequestWorkflowId, setNewRequestWorkflowId] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [projectsResponse, documentsResponse, usersResponse, pendingResponse] =
          await Promise.all([
            apiGet<ProjectOption[]>('/projects', getToken() ?? undefined),
            apiGet<DocumentOption[]>(
              `/documents${search ? `?search=${encodeURIComponent(search)}` : ''}`,
              getToken() ?? undefined
            ),
            apiGet<UserOption[]>('/users', getToken() ?? undefined),
            apiGet<ApprovalRequest[]>('/approvals/requests/pending', getToken() ?? undefined),
          ]);

        if (!active) return;
        setProjects(projectsResponse.length ? projectsResponse : fallbackProjects);
        setDocuments(documentsResponse.length ? documentsResponse : fallbackDocuments);
        setUsers(usersResponse.length ? usersResponse : fallbackUsers);
        setPending(pendingResponse.length ? pendingResponse : fallbackPending);
        setSelectedRequestId(
          (current) => current || pendingResponse[0]?.id || fallbackPending[0]?.id || ''
        );
        setFlowForm((current) => ({
          ...current,
          projectId: current.projectId || projectsResponse[0]?.id || fallbackProjects[0].id,
        }));
        setNewRequestDocumentId(
          (current) => current || documentsResponse[0]?.id || fallbackDocuments[0].id
        );
      } catch {
        if (!active) return;
        setProjects(fallbackProjects);
        setDocuments(fallbackDocuments);
        setUsers(fallbackUsers);
        setPending(fallbackPending);
        setSelectedRequestId((current) => current || fallbackPending[0]?.id || '');
        setFlowForm((current) => ({
          ...current,
          projectId: current.projectId || fallbackProjects[0].id,
        }));
        setNewRequestDocumentId((current) => current || fallbackDocuments[0].id);
        setError('Se cargó una vista de ejemplo porque la API de aprobaciones aún no respondió.');
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [search]);

  useEffect(() => {
    if (!flowForm.projectId) return;
    let active = true;
    apiGet<Workflow[]>(
      `/approvals/flows?projectId=${encodeURIComponent(flowForm.projectId)}`,
      getToken() ?? undefined
    )
      .then((response) => {
        if (!active) return;
        setFlows(
          response.length
            ? response
            : fallbackFlows.filter((flow) => flow.projectId === flowForm.projectId)
        );
      })
      .catch(() => {
        if (!active) return;
        setFlows(fallbackFlows.filter((flow) => flow.projectId === flowForm.projectId));
      });

    return () => {
      active = false;
    };
  }, [flowForm.projectId]);

  useEffect(() => {
    if (!selectedRequestId) return;
    let active = true;
    apiGet<ApprovalRequestDetail>(
      `/approvals/requests/${selectedRequestId}`,
      getToken() ?? undefined
    )
      .then((response) => {
        if (active) setRequestDetail(response);
      })
      .catch(() => {
        if (active)
          setRequestDetail(
            fallbackRequestDetail[selectedRequestId] ?? fallbackRequestDetail['req-1']
          );
      });

    return () => {
      active = false;
    };
  }, [selectedRequestId]);

  const metrics = useMemo(() => {
    return [
      { label: 'Solicitudes pendientes', value: pending.length, icon: Clock3 },
      { label: 'Flujos activos', value: flows.length, icon: GitBranchPlus },
      {
        label: 'Aprobados hoy',
        value: pending.filter((item) => item.status === 'approved').length,
        icon: CheckCircle2,
      },
      {
        label: 'Detenidos o vencidos',
        value: pending.filter((item) => ['stopped', 'expired'].includes(item.status)).length,
        icon: ShieldAlert,
      },
    ];
  }, [pending, flows]);

  function setStep(index: number, patch: Partial<WorkflowStep>) {
    setSteps((current) =>
      current.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step))
    );
  }

  function addStep() {
    setSteps((current) => [
      ...current,
      { stepOrder: current.length + 1, name: '', approverUserId: '', required: true },
    ]);
  }

  async function createFlow() {
    try {
      const created = await apiPost<Workflow>(
        '/approvals/flows',
        {
          projectId: flowForm.projectId,
          name: flowForm.name,
          entityType: 'document',
          scopeType: flowForm.scopeType,
          targetDocumentId:
            flowForm.scopeType === 'document_specific' ? flowForm.targetDocumentId : undefined,
          requireForPublication: flowForm.requireForPublication,
          steps: steps.map((step, index) => ({ ...step, stepOrder: index + 1 })),
        },
        getToken() ?? undefined
      );
      setFlows((current) => [created, ...current]);
      setFlowForm((current) => ({ ...emptyFlowForm, projectId: current.projectId }));
      setSteps([
        { stepOrder: 1, name: '', approverUserId: '', required: true },
        { stepOrder: 2, name: '', approverUserId: '', required: true },
      ]);
    } catch {
      setError('No fue posible crear el workflow.');
    }
  }

  async function startRequest() {
    if (!newRequestDocumentId) return;
    try {
      const created = await apiPost<ApprovalRequestDetail>(
        '/approvals/requests',
        { documentId: newRequestDocumentId, workflowId: newRequestWorkflowId || undefined },
        getToken() ?? undefined
      );
      setPending((current) => [
        {
          id: created.id,
          status: created.status,
          requestedAt: created.requestedAt,
          lastActionAt: created.lastActionAt,
          currentStep: created.currentStep,
          document: created.document,
        },
        ...current,
      ]);
      setSelectedRequestId(created.id);
      setRequestDetail(created);
    } catch {
      setError('No fue posible iniciar la solicitud de aprobación.');
    }
  }

  async function submitAction(action: 'approve' | 'reject' | 'request-changes' | 'comment') {
    if (!selectedRequestId) return;
    try {
      const updated = await apiPost<ApprovalRequestDetail>(
        `/approvals/requests/${selectedRequestId}/${action}`,
        { comment: actionComment || undefined },
        getToken() ?? undefined
      );
      setRequestDetail(updated);
      setPending((current) =>
        current.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                status: updated.status,
                lastActionAt: updated.lastActionAt,
                currentStep: updated.currentStep,
                document: updated.document,
              }
            : item
        )
      );
      setActionComment('');
    } catch {
      setError('No fue posible registrar la acción del flujo.');
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Aprobaciones</h1>
          <p className="muted">
            Configura workflows, inicia solicitudes y resuelve documentos pendientes con
            trazabilidad por paso.
          </p>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <div className="grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="card span-3 project-metric info" key={metric.label}>
              <Icon size={20} />
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          );
        })}
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-5">
          <div className="panel-header">
            <h2>Configurar workflow</h2>
            <GitBranchPlus size={18} color="var(--primary)" />
          </div>
          <div className="quick-filters-grid">
            <SelectField
              label="Proyecto"
              value={flowForm.projectId}
              onChange={(value) => setFlowForm((current) => ({ ...current, projectId: value }))}
              options={projects.map((project) => ({
                value: project.id,
                label: `${project.code} · ${project.name}`,
              }))}
            />
            <TextField
              label="Nombre del flujo"
              value={flowForm.name}
              onChange={(value) => setFlowForm((current) => ({ ...current, name: value }))}
            />
            <SelectField
              label="Alcance"
              value={flowForm.scopeType}
              onChange={(value) =>
                setFlowForm((current) => ({
                  ...current,
                  scopeType: value as FlowForm['scopeType'],
                }))
              }
              options={[
                { value: 'global', label: 'Global' },
                { value: 'document_specific', label: 'Específico por documento' },
              ]}
            />
            {flowForm.scopeType === 'document_specific' ? (
              <SelectField
                label="Documento objetivo"
                value={flowForm.targetDocumentId}
                onChange={(value) =>
                  setFlowForm((current) => ({ ...current, targetDocumentId: value }))
                }
                options={documents
                  .filter((document) => document.projectId === flowForm.projectId)
                  .map((document) => ({
                    value: document.id,
                    label: `${document.documentNumber} · ${document.name}`,
                  }))}
              />
            ) : null}
            <SelectField
              label="Requiere aprobación para publicar"
              value={flowForm.requireForPublication ? 'yes' : 'no'}
              onChange={(value) =>
                setFlowForm((current) => ({ ...current, requireForPublication: value === 'yes' }))
              }
              options={[
                { value: 'yes', label: 'Sí' },
                { value: 'no', label: 'No' },
              ]}
            />
          </div>

          <div className="simple-document-list" style={{ marginTop: 16 }}>
            {steps.map((step, index) => (
              <div className="simple-document-item" key={index}>
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
              </div>
            ))}
          </div>

          <div className="projects-actions" style={{ marginTop: 16 }}>
            <button className="button secondary" type="button" onClick={addStep}>
              Agregar paso
            </button>
            <button className="button" type="button" onClick={createFlow}>
              Guardar workflow
            </button>
          </div>
        </article>

        <article className="card span-3">
          <div className="panel-header">
            <h2>Solicitudes pendientes</h2>
            <Clock3 size={18} color="var(--accent)" />
          </div>
          <div className="field">
            <label>Buscar documento</label>
            <div className="search-input">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Documento o código"
              />
            </div>
          </div>
          <div className="project-list">
            {pending.map((item) => (
              <button
                className={`project-list-item ${item.id === selectedRequestId ? 'active' : ''}`}
                key={item.id}
                type="button"
                onClick={() => setSelectedRequestId(item.id)}
              >
                <div className="project-list-head">
                  <strong>{item.document?.documentNumber ?? 'Documento'}</strong>
                  <span
                    className={`pill ${item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}`}
                  >
                    {normalizeLabel(item.status)}
                  </span>
                </div>
                <span>{item.document?.name ?? 'Sin documento'}</span>
                <small className="muted">{item.currentStep?.name ?? 'Sin paso actual'}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="card span-4">
          <div className="panel-header">
            <h2>Crear solicitud</h2>
            <FileCheck2 size={18} color="var(--primary)" />
          </div>
          <SelectField
            label="Documento"
            value={newRequestDocumentId}
            onChange={setNewRequestDocumentId}
            options={documents.map((document) => ({
              value: document.id,
              label: `${document.documentNumber} · ${document.name}`,
            }))}
          />
          <SelectField
            label="Workflow"
            value={newRequestWorkflowId}
            onChange={setNewRequestWorkflowId}
            options={flows.map((flow) => ({ value: flow.id, label: flow.name }))}
          />
          <button className="button" type="button" onClick={startRequest}>
            Iniciar aprobación
          </button>

          <div className="panel-header" style={{ marginTop: 20 }}>
            <h2>Flujos disponibles</h2>
          </div>
          <div className="simple-document-list">
            {flows.map((flow) => (
              <div className="simple-document-item" key={flow.id}>
                <strong>{flow.name}</strong>
                <span>
                  {normalizeLabel(flow.scopeType)} · {flow.steps.length} pasos
                </span>
                <small>
                  {flow.requireForPublication
                    ? 'Bloquea publicación sin aprobación'
                    : 'Publicación libre'}
                </small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-12">
          <div className="panel-header">
            <h2>Historial del flujo</h2>
            <MessageSquareMore size={18} color="var(--primary)" />
          </div>

          {requestDetail ? (
            <>
              <div className="project-state-grid">
                <div className="state-card">
                  <span>Documento</span>
                  <strong>{requestDetail.document?.documentNumber ?? 'Sin documento'}</strong>
                </div>
                <div className="state-card">
                  <span>Estado</span>
                  <strong>{normalizeLabel(requestDetail.status)}</strong>
                </div>
                <div className="state-card">
                  <span>Paso actual</span>
                  <strong>{requestDetail.currentStep?.name ?? 'Finalizado'}</strong>
                </div>
                <div className="state-card">
                  <span>Workflow</span>
                  <strong>{requestDetail.workflow.name}</strong>
                </div>
              </div>

              <div className="field" style={{ marginTop: 16 }}>
                <label>Comentario / decisión</label>
                <textarea
                  value={actionComment}
                  onChange={(event) => setActionComment(event.target.value)}
                  placeholder="Escribe una observación para aprobar, rechazar o pedir cambios."
                />
              </div>

              <div className="projects-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => void submitAction('approve')}
                >
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
                {requestDetail.actions.map((action) => (
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
            <p className="muted">Selecciona una solicitud para revisar su historial.</p>
          )}
        </article>
      </div>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
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
