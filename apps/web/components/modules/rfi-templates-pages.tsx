'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FilePlus2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import { normalizeLabel } from '../../lib/labels';

type RfiTemplate = {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  titleTemplate: string;
  descriptionTemplate: string;
  defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
  defaultDueDays?: number;
  autoAssignRule?: {
    type: string;
    projectRole?: string;
    userId?: string;
    disciplineId?: string;
    fallbackUserId?: string;
  };
  isActive: boolean;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
};

type ProjectOption = { id: string; name: string; code: string };

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

const assignRuleTypes = [
  { value: 'project_role', label: 'Rol en el centro de costos' },
  { value: 'specific_user', label: 'Usuario específico' },
  { value: 'discipline_lead', label: 'Responsable del centro de costos' },
  { value: 'document_uploader', label: 'Último subidor de documento' },
];

const projectRoles = [
  { value: 'owner', label: 'Dueño' },
  { value: 'manager', label: 'Gerente' },
  { value: 'contributor', label: 'Colaborador' },
  { value: 'viewer', label: 'Espectador' },
];

const emptyForm = {
  name: '',
  description: '',
  projectId: '',
  titleTemplate: '',
  descriptionTemplate: '',
  defaultPriority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  defaultDueDays: '',
  autoAssignType: '',
  autoAssignProjectRole: '',
  autoAssignUserId: '',
  autoAssignFallbackUserId: '',
  isActive: true,
};

export function RfiTemplatesListPage() {
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<RfiTemplate[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [filterProjectId, setFilterProjectId] = useState(searchParams.get('projectId') ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const query = filterProjectId ? `?projectId=${filterProjectId}` : '';
        const [templatesData, projectsData] = await Promise.all([
          apiGet<RfiTemplate[]>(`/rfis/templates${query}`, getToken()),
          apiGet<{ projects: ProjectOption[] }>('/rfis/form-options', getToken()),
        ]);
        if (!active) return;
        setTemplates(templatesData);
        setProjects(projectsData.projects);
      } catch {
        if (!active) return;
        setError('No fue posible cargar las plantillas.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [filterProjectId]);

  async function deleteTemplate(id: string, name: string) {
    if (!confirm(`¿Eliminar la plantilla "${name}"?`)) return;
    try {
      await apiDelete(`/rfis/templates/${id}`, getToken());
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('No fue posible eliminar la plantilla.');
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Plantillas de RFI</h1>
          <p className="muted">
            Crea y gestiona plantillas para acelerar la creación de RFIs con el flujo rápido.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button" href="/rfi-templates/new">
            <Plus size={18} />
            Nueva plantilla
          </Link>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <article className="card" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Filtros</h2>
        </div>
        <div className="quick-filters-grid rfi-filters-grid">
          <div className="field">
            <label>Centro de costos</label>
            <select value={filterProjectId} onChange={(e) => setFilterProjectId(e.target.value)}>
              <option value="">Todos (globales + específicas)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </article>

      <div className="grid" style={{ marginTop: 16 }}>
        {loading ? (
          <article className="card span-12">
            <p className="muted">Cargando plantillas...</p>
          </article>
        ) : !templates.length ? (
          <article className="card span-12">
            <p className="muted">No hay plantillas. Crea la primera para usar el flujo rápido.</p>
          </article>
        ) : (
          templates.map((template) => (
            <article className="card span-4" key={template.id}>
              <div className="panel-header">
                <h2>{template.name}</h2>
                <span className={`pill ${template.isActive ? 'success' : 'warning'}`}>
                  {template.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              {template.description ? <p className="muted">{template.description}</p> : null}
              <div className="simple-document-list" style={{ marginTop: 8 }}>
                <div className="simple-document-item">
                  <strong>Prioridad</strong>
                  <small>{normalizeLabel(template.defaultPriority)}</small>
                </div>
                {template.defaultDueDays ? (
                  <div className="simple-document-item">
                    <strong>Plazo</strong>
                    <small>{template.defaultDueDays} días</small>
                  </div>
                ) : null}
                {template.autoAssignRule ? (
                  <div className="simple-document-item">
                    <strong>Asignación</strong>
                    <small>
                      {normalizeLabel(template.autoAssignRule.type)}
                      {template.autoAssignRule.projectRole
                        ? ` · ${normalizeLabel(template.autoAssignRule.projectRole)}`
                        : ''}
                    </small>
                  </div>
                ) : null}
                {template.projectId ? (
                  <div className="simple-document-item">
                    <strong>Centro de costos</strong>
                    <small>Específica</small>
                  </div>
                ) : (
                  <div className="simple-document-item">
                    <strong>Ámbito</strong>
                    <small>Global</small>
                  </div>
                )}
              </div>
              <div className="projects-actions" style={{ marginTop: 12 }}>
                <Link className="button secondary" href={`/rfi-templates/${template.id}`}>
                  Editar
                </Link>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => deleteTemplate(template.id, template.name)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function RfiTemplateFormPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(params?.id);
  const templateId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [form, setForm] = useState({
    ...emptyForm,
    projectId: searchParams.get('projectId') ?? '',
  });
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await apiGet<{ projects: ProjectOption[] }>(
          '/rfis/form-options',
          getToken()
        );
        setProjects(response.projects);
      } catch {
        setError('No fue posible cargar centros de costos.');
      }
    }

    async function loadTemplate() {
      if (!templateId) return;
      try {
        const template = await apiGet<RfiTemplate>(`/rfis/templates/${templateId}`, getToken());
        setForm({
          name: template.name,
          description: template.description ?? '',
          projectId: template.projectId ?? '',
          titleTemplate: template.titleTemplate,
          descriptionTemplate: template.descriptionTemplate,
          defaultPriority: template.defaultPriority,
          defaultDueDays: template.defaultDueDays?.toString() ?? '',
          autoAssignType: template.autoAssignRule?.type ?? '',
          autoAssignProjectRole: template.autoAssignRule?.projectRole ?? '',
          autoAssignUserId: template.autoAssignRule?.userId ?? '',
          autoAssignFallbackUserId: template.autoAssignRule?.fallbackUserId ?? '',
          isActive: template.isActive,
        });
      } catch {
        setError('No fue posible cargar la plantilla.');
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
    if (isEdit) void loadTemplate();
    else setLoading(false);
  }, [templateId, isEdit]);

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim() || !form.titleTemplate.trim() || !form.descriptionTemplate.trim()) {
      setError('Completa nombre, título y descripción de la plantilla.');
      return;
    }

    setSaving(true);
    setError('');

    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      projectId: form.projectId || undefined,
      titleTemplate: form.titleTemplate,
      descriptionTemplate: form.descriptionTemplate,
      defaultPriority: form.defaultPriority,
      defaultDueDays: form.defaultDueDays ? Number(form.defaultDueDays) : undefined,
      isActive: form.isActive,
    };

    if (form.autoAssignType) {
      body.autoAssignRule = {
        type: form.autoAssignType,
        projectRole: form.autoAssignProjectRole || undefined,
        userId: form.autoAssignUserId || undefined,
        fallbackUserId: form.autoAssignFallbackUserId || undefined,
      };
    }

    try {
      if (isEdit && templateId) {
        await apiPatch(`/rfis/templates/${templateId}`, body, getToken());
      } else {
        await apiPost('/rfis/templates', body, getToken());
      }
      router.push('/rfi-templates');
      router.refresh();
    } catch {
      setError(
        isEdit ? 'No fue posible actualizar la plantilla.' : 'No fue posible crear la plantilla.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando plantilla...</p>
        </article>
      </section>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{isEdit ? 'Editar plantilla' : 'Nueva plantilla'}</h1>
          <p className="muted">
            Define los valores por defecto y reglas de asignación automática para el flujo rápido.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/rfi-templates">
            Cancelar
          </Link>
        </div>
      </div>

      {error ? <article className="card muted">{error}</article> : null}

      <article className="card">
        <div className="panel-header">
          <h2>Datos de la plantilla</h2>
          <FilePlus2 size={18} color="var(--primary)" />
        </div>

        <div className="quick-filters-grid rfi-filters-grid">
          <div className="field span-2">
            <label>Nombre de la plantilla</label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Ej: Consulta técnica estándar"
            />
          </div>
          <div className="field">
            <label>Centro de costos (opcional)</label>
            <select value={form.projectId} onChange={(e) => update('projectId', e.target.value)}>
              <option value="">Global (todos los centros de costos)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Prioridad por defecto</label>
            <select
              value={form.defaultPriority}
              onChange={(e) => update('defaultPriority', e.target.value)}
            >
              <option value="low">Baja</option>
              <option value="normal">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div className="field">
            <label>Días para fecha límite</label>
            <input
              type="number"
              min="0"
              value={form.defaultDueDays}
              onChange={(e) => update('defaultDueDays', e.target.value)}
              placeholder="Ej: 7"
            />
          </div>
          <div className="field span-2">
            <label>Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="¿Cuándo usar esta plantilla?"
            />
          </div>
          <div className="field span-2">
            <label>Título predefinido</label>
            <input
              value={form.titleTemplate}
              onChange={(e) => update('titleTemplate', e.target.value)}
              placeholder="Ej: Consulta sobre {document}"
            />
          </div>
          <div className="field span-2">
            <label>Descripción predefinida</label>
            <textarea
              value={form.descriptionTemplate}
              onChange={(e) => update('descriptionTemplate', e.target.value)}
              placeholder="Ej: Solicitamos información técnica sobre..."
            />
          </div>
        </div>

        <div className="panel-header" style={{ marginTop: 24 }}>
          <h2>Regla de asignación automática (rápida)</h2>
        </div>

        <div className="quick-filters-grid rfi-filters-grid">
          <div className="field">
            <label>Tipo de asignación</label>
            <select
              value={form.autoAssignType}
              onChange={(e) => update('autoAssignType', e.target.value)}
            >
              <option value="">Sin asignación automática</option>
              {assignRuleTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {form.autoAssignType === 'project_role' ? (
            <div className="field">
              <label>Rol en el centro de costos</label>
              <select
                value={form.autoAssignProjectRole}
                onChange={(e) => update('autoAssignProjectRole', e.target.value)}
              >
                <option value="">Selecciona un rol</option>
                {projectRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="field">
            <label>Usuario fallback (si no aplica la regla)</label>
            <input
              value={form.autoAssignFallbackUserId}
              onChange={(e) => update('autoAssignFallbackUserId', e.target.value)}
              placeholder="ID de usuario"
            />
          </div>
          <div className="field">
            <label>Estado</label>
            <select
              value={form.isActive ? 'true' : 'false'}
              onChange={(e) => update('isActive', e.target.value === 'true')}
            >
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </div>
        </div>

        <div className="projects-actions" style={{ marginTop: 16 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Actualizar plantilla' : 'Crear plantilla'}
          </button>
        </div>
      </article>
    </section>
  );
}
