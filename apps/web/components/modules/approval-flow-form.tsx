'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Check, ChevronDown, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

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

type FlowForm = {
  projectId: string;
  name: string;
  scopeType: 'global' | 'document_specific';
  targetDocumentId: string;
  requireForPublication: boolean;
};

type ProjectAssignmentMode = 'all_projects' | 'selected_projects';
type FormOptionsResponse = { users: UserOption[] };

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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function buildEmptyStep(stepOrder: number): WorkflowStep {
  return { stepOrder, name: '', approverUserIds: [], required: true };
}

const STEP_LABELS: Record<number, string> = {
  1: 'Información general',
  2: 'Proyectos',
  3: 'Pasos del flujo',
  4: 'Resumen',
};

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

function MultiUserSelectField({
  label,
  users,
  selectedIds = [],
  onChange,
}: {
  label: string;
  users: UserOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized)
    );
  }, [search, users]);

  function toggle(userId: string) {
    onChange(
      selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId]
    );
  }

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));
  const previewUsers = selectedUsers.slice(0, 2);

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
  }

  return (
    <div className="field multi-select-field">
      <label>{label}</label>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="multi-select-trigger-copy">
          {selectedIds.length === 0 ? (
            <>
              <span className="multi-select-placeholder">Selecciona aprobadores</span>
              <small className="muted">Puedes elegir uno o varios responsables</small>
            </>
          ) : (
            <>
              <div className="multi-select-chip-row">
                {previewUsers.map((user) => (
                  <span className="multi-select-chip" key={user.id}>
                    <span className="multi-select-chip-avatar">{getInitials(user.name)}</span>
                    <span>{user.name}</span>
                  </span>
                ))}
                {selectedUsers.length > previewUsers.length ? (
                  <span className="multi-select-chip more">
                    +{selectedUsers.length - previewUsers.length} más
                  </span>
                ) : null}
              </div>
              <small className="muted">
                {selectedUsers.length} aprobador
                {selectedUsers.length === 1 ? '' : 'es'} seleccionado
                {selectedUsers.length === 1 ? '' : 's'}
              </small>
            </>
          )}
        </div>
        <div className="multi-select-trigger-meta">
          <span className="multi-select-count">{selectedIds.length}</span>
          <ChevronDown className={open ? 'is-open' : ''} size={18} />
        </div>
      </button>
      {open ? (
        <div className="multi-select-popover">
          <div className="multi-select-toolbar">
            <div className="multi-select-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Buscar usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selectedIds.length ? (
              <button className="multi-select-clear" type="button" onClick={() => onChange([])}>
                <X size={14} />
                Limpiar
              </button>
            ) : null}
          </div>

          {selectedUsers.length ? (
            <div className="multi-select-selected-summary">
              <span>Seleccionados</span>
              <strong>{selectedUsers.map((user) => user.name).join(', ')}</strong>
            </div>
          ) : null}

          <div className="multi-select-options">
            {filtered.map((user) => {
              const checked = selectedIds.includes(user.id);
              return (
                <label className={`multi-select-option ${checked ? 'selected' : ''}`} key={user.id}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(user.id)} />
                  <span className="multi-select-option-check">
                    {checked ? <Check size={14} /> : null}
                  </span>
                  <span className="multi-select-option-avatar">{getInitials(user.name)}</span>
                  <span className="multi-select-option-copy">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </span>
                </label>
              );
            })}
          </div>
          {!filtered.length ? (
            <p className="muted multi-select-empty">No hay usuarios que coincidan.</p>
          ) : null}
        </div>
      ) : null}
      {open ? <div className="multi-select-overlay" onClick={() => setOpen(false)} /> : null}
    </div>
  );
}

export function ApprovalFlowFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const flowId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [wizardStep, setWizardStep] = useState(1);
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

  const totalWizardSteps = mode === 'edit' ? 3 : 4;

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

  const canUseDocumentSpecificScope = mode === 'edit' || selectedProjectIds.length === 1;
  const activeProjectId = mode === 'edit' ? form.projectId : (selectedProjectIds[0] ?? '');
  const filteredDocuments = useMemo(
    () => documents.filter((document) => document.projectId === activeProjectId),
    [activeProjectId, documents]
  );

  const filteredProjects = useMemo(() => {
    const normalized = projectSearch.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) =>
      `${project.code} ${project.name}`.toLowerCase().includes(normalized)
    );
  }, [projectSearch, projects]);

  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedProjectIds.includes(project.id)),
    [projects, selectedProjectIds]
  );

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

  function toggleProjectSelection(projectId: string) {
    setSelectedProjectIds((current) => {
      if (current.includes(projectId)) {
        return current.filter((id) => id !== projectId);
      }
      return [...current, projectId];
    });
  }

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (!form.name.trim()) return 'Completa el nombre del flujo.';
      if (form.scopeType === 'document_specific' && !canUseDocumentSpecificScope) {
        return 'El alcance por documento solo está disponible cuando seleccionas un solo proyecto.';
      }
      if (form.scopeType === 'document_specific' && !form.targetDocumentId) {
        return 'Selecciona el documento objetivo para este flujo.';
      }
      return null;
    }
    if (step === 2) {
      if (mode === 'create' && !selectedProjectIds.length) {
        return 'Selecciona al menos un proyecto o usa la opción de todos los proyectos.';
      }
      return null;
    }
    if (step === 3) {
      if (!steps.length || steps.some((s) => !s.name.trim() || !(s.approverUserIds ?? []).length)) {
        return 'Cada paso debe tener nombre y al menos un aprobador.';
      }
      return null;
    }
    return null;
  }

  function goNext() {
    const validationError = validateStep(wizardStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setWizardStep((s) => Math.min(s + 1, totalWizardSteps));
  }

  function goBack() {
    setError('');
    setWizardStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    const validationError = validateStep(wizardStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    const targetProjectIds = mode === 'edit' ? [form.projectId] : selectedProjectIds;
    const payloadBase = {
      name: form.name,
      entityType: 'document' as const,
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

  const displayStep = mode === 'edit' && wizardStep >= 2 ? wizardStep + 1 : wizardStep;

  function renderProgressBar() {
    return (
      <div className="wizard-progress-bar">
        {Array.from({ length: totalWizardSteps }, (_, i) => i + 1).map((step) => {
          const display = mode === 'edit' && step >= 2 ? step + 1 : step;
          const isCompleted = step < wizardStep;
          const isCurrent = step === wizardStep;
          return (
            <div
              key={step}
              className={`wizard-progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="wizard-progress-dot">{isCompleted ? <Check size={12} /> : step}</div>
              <span className="wizard-progress-label">{STEP_LABELS[display]}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="quick-filters-grid">
        {mode === 'edit' ? (
          <SelectField
            label="Proyecto"
            value={form.projectId}
            onChange={(value) => setForm((current) => ({ ...current, projectId: value }))}
            options={projects.map((project) => ({
              value: project.id,
              label: `${project.code} · ${project.name}`,
            }))}
          />
        ) : (
          <SelectField
            label="Cobertura"
            value={projectAssignmentMode}
            onChange={(value) => setProjectAssignmentMode(value as ProjectAssignmentMode)}
            options={[
              { value: 'all_projects', label: 'Todos los proyectos' },
              { value: 'selected_projects', label: 'Seleccionar proyectos' },
            ]}
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
            setForm((current) => ({
              ...current,
              scopeType: value as FlowForm['scopeType'],
            }))
          }
          options={[
            { value: 'global', label: 'Todo el proyecto' },
            { value: 'document_specific', label: 'Documento específico' },
          ]}
          disabled={!canUseDocumentSpecificScope}
        />
        <SelectField
          label="Bloquea publicación"
          value={form.requireForPublication ? 'yes' : 'no'}
          onChange={(value) =>
            setForm((current) => ({ ...current, requireForPublication: value === 'yes' }))
          }
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'no', label: 'No' },
          ]}
        />
        {form.scopeType === 'document_specific' && canUseDocumentSpecificScope ? (
          <SelectField
            label="Documento objetivo"
            value={form.targetDocumentId}
            onChange={(value) => setForm((current) => ({ ...current, targetDocumentId: value }))}
            options={filteredDocuments.map((document) => ({
              value: document.id,
              label: `${document.documentNumber} · ${document.name}`,
            }))}
          />
        ) : null}
        {!canUseDocumentSpecificScope ? (
          <div className="approval-inline-note">
            El alcance por documento se habilita cuando el flujo aplica a un solo proyecto.
          </div>
        ) : null}
      </div>
    );
  }

  function renderStep2() {
    if (mode === 'edit') {
      const project = projects.find((p) => p.id === form.projectId);
      return (
        <div className="wizard-readonly-section">
          <div className="selection-summary-card approval-selection-highlight">
            <strong>Proyecto asignado</strong>
            <span className="muted">
              {project ? `${project.code} · ${project.name}` : 'Sin proyecto'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <section>
        {projectAssignmentMode === 'all_projects' ? (
          <div className="selection-summary-card approval-selection-highlight">
            <strong>{projects.length} proyectos seleccionados</strong>
            <span className="muted">
              El flujo se creará en todos los proyectos visibles para tu usuario.
            </span>
          </div>
        ) : (
          <div className="project-picker-card approval-project-picker">
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
      </section>
    );
  }

  function renderStep3() {
    return (
      <div className="approval-step-list">
        <div className="wizard-step-actions">
          <button className="button secondary" type="button" onClick={addStep}>
            <Plus size={16} />
            Agregar paso
          </button>
        </div>
        {steps.map((step, index) => (
          <div
            className="approval-step-card"
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
            <div className="approval-step-card-head">
              <div>
                <span className="approval-step-index">Paso {index + 1}</span>
                <strong>{step.name.trim() || 'Define el nombre de este paso'}</strong>
              </div>
              <span className={`pill ${step.required === false ? '' : 'success'}`}>
                {step.required === false ? 'Opcional' : 'Obligatorio'}
              </span>
            </div>

            <div className="quick-filters-grid">
              <TextField
                label="Nombre del paso"
                value={step.name}
                onChange={(value) => setStep(index, { name: value })}
              />
              <MultiUserSelectField
                label="Aprobadores"
                users={users}
                selectedIds={step.approverUserIds}
                onChange={(ids) => setStep(index, { approverUserIds: ids })}
              />
              <TextField
                label="Días para responder"
                value={step.dueDays !== undefined ? String(step.dueDays) : ''}
                onChange={(value) =>
                  setStep(index, {
                    dueDays: value.trim() ? Number(value) : undefined,
                  })
                }
                type="number"
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
    );
  }

  function renderStep4() {
    const projectSummary =
      mode === 'edit' ? projects.filter((p) => p.id === form.projectId) : selectedProjects;

    return (
      <div className="wizard-summary">
        <div className="wizard-summary-grid">
          <div className="wizard-summary-card">
            <h3>Información general</h3>
            <dl>
              <dt>Nombre</dt>
              <dd>{form.name.trim() || '—'}</dd>
              <dt>Alcance</dt>
              <dd>
                {form.scopeType === 'document_specific'
                  ? 'Documento específico'
                  : 'Todo el proyecto'}
              </dd>
              <dt>Bloquea publicación</dt>
              <dd>{form.requireForPublication ? 'Sí, requiere aprobación' : 'No bloquea'}</dd>
              {form.scopeType === 'document_specific' && form.targetDocumentId ? (
                <>
                  <dt>Documento objetivo</dt>
                  <dd>{documents.find((d) => d.id === form.targetDocumentId)?.name || '—'}</dd>
                </>
              ) : null}
            </dl>
          </div>

          <div className="wizard-summary-card">
            <h3>Proyectos</h3>
            {projectSummary.length > 0 ? (
              <div className="simple-document-list">
                {projectSummary.slice(0, 10).map((project) => (
                  <div className="simple-document-item" key={project.id}>
                    <strong>{project.code}</strong>
                    <span>{project.name}</span>
                  </div>
                ))}
                {projectSummary.length > 10 ? (
                  <small className="muted">
                    +{projectSummary.length - 10} proyecto
                    {projectSummary.length - 10 === 1 ? '' : 's'} adicional
                    {projectSummary.length - 10 === 1 ? '' : 'es'}.
                  </small>
                ) : null}
              </div>
            ) : (
              <p className="muted">Sin proyectos seleccionados.</p>
            )}
          </div>

          <div className="wizard-summary-card wizard-summary-card-wide">
            <h3>Pasos del flujo ({steps.length})</h3>
            {steps.length > 0 ? (
              <div className="simple-document-list">
                {steps.map((step) => (
                  <div className="simple-document-item" key={step.id ?? `step-${step.stepOrder}`}>
                    <strong>
                      Paso {step.stepOrder}: {step.name || '—'}
                    </strong>
                    <span>
                      {step.approverUserIds?.length ?? 0} aprobador(es)
                      {step.dueDays ? ` · ${step.dueDays} días` : ''}
                      {step.required === false ? ' · Opcional' : ' · Obligatorio'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Sin pasos definidos.</p>
            )}
          </div>
        </div>

        <div className="projects-actions" style={{ marginTop: 20, justifyContent: 'center' }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving
              ? 'Guardando...'
              : `Guardar flujo${mode === 'create' && selectedProjectIds.length > 1 ? ` en ${selectedProjectIds.length} proyectos` : ''}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{mode === 'create' ? 'Nuevo flujo de aprobación' : 'Editar flujo de aprobación'}</h1>
          <p className="muted">
            Paso {wizardStep} de {totalWizardSteps} · {STEP_LABELS[displayStep]}
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/approvals/flows">
            Volver
          </Link>
        </div>
      </div>

      {renderProgressBar()}

      {error ? <div className="card muted">{error}</div> : null}

      <article className="card approval-form-shell">
        {loading ? (
          <p className="muted">Cargando formulario...</p>
        ) : (
          <div className="wizard-step-content">
            {wizardStep === 1 && renderStep1()}
            {wizardStep === 2 && renderStep2()}
            {wizardStep === 3 && renderStep3()}
            {wizardStep === 4 && renderStep4()}

            {wizardStep < totalWizardSteps ? (
              <div className="wizard-nav">
                <div>
                  {wizardStep > 1 ? (
                    <button className="button secondary" type="button" onClick={goBack}>
                      Anterior
                    </button>
                  ) : null}
                </div>
                <button className="button" type="button" onClick={goNext}>
                  Siguiente
                </button>
              </div>
            ) : null}
          </div>
        )}
      </article>
    </section>
  );
}
