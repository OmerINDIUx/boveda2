'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FilePlus2,
  MessageSquare,
  Plus,
  Search,
  Send,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

type ProjectOption = { id: string; name: string; code: string };
type ProjectMemberOption = { id: string; name: string; email: string; role: string };
type DocumentOption = { id: string; name: string; documentNumber: string };

type RfiListItem = {
  id: string;
  projectId: string;
  documentId?: string;
  title: string;
  description: string;
  answer?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate?: string;
  status: 'open' | 'in_progress' | 'answered' | 'closed' | 'overdue';
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string; email: string } | null;
  assignedTo: { id: string; name: string; email: string } | null;
  project: { id: string; name: string; code: string } | null;
  document: { id: string; name: string; documentNumber: string } | null;
  commentsCount: number;
  attachmentsCount: number;
};

type RfiAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string } | null;
};

type RfiDetail = RfiListItem & {
  comments: Array<{
    id: string;
    body: string;
    type: 'comment' | 'response' | 'system';
    createdAt: string;
    author: { id: string; name: string; email: string } | null;
    attachments: RfiAttachment[];
  }>;
  attachments: RfiAttachment[];
  history: Array<{
    id: string;
    action: string;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
    createdAt: string;
    actor: { id: string; name: string; email: string } | null;
  }>;
};

type FormOptionsResponse = {
  projects: ProjectOption[];
  projectMembers: ProjectMemberOption[];
  documents: DocumentOption[];
};

type Filters = {
  projectId: string;
  status: string;
  priority: string;
  assignedToId: string;
  search: string;
};

type CreateRfiForm = {
  projectId: string;
  documentId: string;
  title: string;
  description: string;
  assignedToId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate: string;
};

type FilePayload = {
  fileName: string;
  mimeType: string;
  base64Content: string;
};

const emptyFilters: Filters = {
  projectId: '',
  status: '',
  priority: '',
  assignedToId: '',
  search: '',
};

const emptyCreateForm: CreateRfiForm = {
  projectId: '',
  documentId: '',
  title: '',
  description: '',
  assignedToId: '',
  priority: 'normal',
  dueDate: '',
};

const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const;

const statusOptions = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_progress', label: 'En atención' },
  { value: 'answered', label: 'Respondido' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'overdue', label: 'Vencido' },
] as const;

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

function normalizeLabel(value?: string | null) {
  if (!value) return 'Sin definir';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getRfiTone(status: RfiListItem['status']) {
  if (status === 'closed') return 'success';
  if (status === 'overdue') return 'danger';
  return 'warning';
}

async function fileToPayload(file: File): Promise<FilePayload> {
  const base64Content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No fue posible leer el archivo'));
    reader.readAsDataURL(file);
  });

  return {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64Content,
  };
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  return params.toString();
}

function buildFiltersFromSearchParams(searchParams: {
  get: (key: string) => string | null;
}): Filters {
  return {
    projectId: searchParams.get('projectId') ?? '',
    status: searchParams.get('status') ?? '',
    priority: searchParams.get('priority') ?? '',
    assignedToId: searchParams.get('assignedToId') ?? '',
    search: searchParams.get('search') ?? '',
  };
}

async function handleFiles(fileList: FileList | null, setter: (files: FilePayload[]) => void) {
  const files = fileList ? Array.from(fileList) : [];
  const payloads = await Promise.all(files.map((file) => fileToPayload(file)));
  setter(payloads);
}

async function loadRfiDetail(id: string) {
  return apiGet<RfiDetail>(`/rfis/${id}`, getToken());
}

function RfiSummaryCard({ detail }: { detail: RfiDetail }) {
  return (
    <article className="card">
      <div className="project-hero">
        <div>
          <div className="project-code">{detail.project?.code ?? 'RFI'}</div>
          <h2>{detail.title}</h2>
          <p className="muted">{detail.description}</p>
        </div>
        <div className="projects-actions">
          <span className={`pill ${getRfiTone(detail.status)}`}>
            {normalizeLabel(detail.status)}
          </span>
        </div>
      </div>

      <div className="project-state-grid">
        <div className="state-card">
          <span>Proyecto</span>
          <strong>{detail.project?.name ?? detail.projectId}</strong>
        </div>
        <div className="state-card">
          <span>Solicitante</span>
          <strong>{detail.requester?.name ?? 'Sin dato'}</strong>
        </div>
        <div className="state-card">
          <span>Responsable</span>
          <strong>{detail.assignedTo?.name ?? 'Sin asignar'}</strong>
        </div>
        <div className="state-card">
          <span>Fecha límite</span>
          <strong>{formatDate(detail.dueDate)}</strong>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card span-6 status-card neutral">
          <span>Documento relacionado</span>
          <strong>
            {detail.document
              ? `${detail.document.documentNumber} · ${detail.document.name}`
              : 'Sin documento relacionado'}
          </strong>
        </div>
        <div className="card span-6 status-card warning">
          <span>Respuesta actual</span>
          <strong>{detail.answer ?? 'Aún sin respuesta formal'}</strong>
        </div>
      </div>
    </article>
  );
}

function RfiFormFields({
  form,
  projects,
  projectMembers,
  documents,
  onChange,
}: {
  form: CreateRfiForm;
  projects: ProjectOption[];
  projectMembers: ProjectMemberOption[];
  documents: DocumentOption[];
  onChange: (key: keyof CreateRfiForm, value: string) => void;
}) {
  return (
    <div className="quick-filters-grid rfi-filters-grid">
      <SelectField
        label="Proyecto"
        value={form.projectId}
        onChange={(value) => onChange('projectId', value)}
        options={projects.map((project) => ({
          value: project.id,
          label: `${project.code} · ${project.name}`,
        }))}
      />
      <SelectField
        label="Documento relacionado"
        value={form.documentId}
        onChange={(value) => onChange('documentId', value)}
        options={documents.map((document) => ({
          value: document.id,
          label: `${document.documentNumber} · ${document.name}`,
        }))}
      />
      <SelectField
        label="Responsable de respuesta"
        value={form.assignedToId}
        onChange={(value) => onChange('assignedToId', value)}
        options={projectMembers.map((member) => ({
          value: member.id,
          label: `${member.name} · ${member.role}`,
        }))}
      />
      <SelectField
        label="Prioridad"
        value={form.priority}
        onChange={(value) => onChange('priority', value)}
        options={priorityOptions.map((option) => ({ value: option.value, label: option.label }))}
      />
      <TextField label="Título" value={form.title} onChange={(value) => onChange('title', value)} />
      <TextField
        label="Fecha límite"
        type="date"
        value={form.dueDate}
        onChange={(value) => onChange('dueDate', value)}
      />
      <div className="field span-2">
        <label>Descripción</label>
        <textarea
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
        />
      </div>
    </div>
  );
}

export function RfisWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => buildFiltersFromSearchParams(searchParams));
  const [rfis, setRfis] = useState<RfiListItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextFilters = buildFiltersFromSearchParams(searchParams);
    setFilters((current) =>
      current.projectId === nextFilters.projectId &&
      current.status === nextFilters.status &&
      current.priority === nextFilters.priority &&
      current.assignedToId === nextFilters.assignedToId &&
      current.search === nextFilters.search
        ? current
        : nextFilters
    );
  }, [searchParams]);

  useEffect(() => {
    const query = buildQuery(filters);
    router.replace(`/rfis${query ? `?${query}` : ''}`);
  }, [filters, router]);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await apiGet<FormOptionsResponse>('/rfis/form-options', getToken());
        if (!active) return;
        setProjects(response.projects);
      } catch {
        if (!active) return;
        setError('No fue posible cargar las opciones base del módulo de RFIs.');
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRfis() {
      setLoading(true);
      setError('');
      try {
        const query = buildQuery(filters);
        const response = await apiGet<RfiListItem[]>(
          `/rfis${query ? `?${query}` : ''}`,
          getToken()
        );
        if (!active) return;
        setRfis(response);
      } catch {
        if (!active) return;
        setRfis([]);
        setError('No fue posible cargar el listado de RFIs.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadRfis();
    return () => {
      active = false;
    };
  }, [filters]);

  const metrics = useMemo(() => {
    const open = rfis.filter((item) => item.status === 'open').length;
    const inProgress = rfis.filter((item) => item.status === 'in_progress').length;
    const overdue = rfis.filter((item) => item.status === 'overdue').length;
    const answered = rfis.filter((item) => item.status === 'answered').length;
    return [
      { label: 'Abiertos', value: open, icon: MessageSquare, tone: 'info' },
      { label: 'En atención', value: inProgress, icon: Clock3, tone: 'warn' },
      { label: 'Vencidos', value: overdue, icon: AlertTriangle, tone: 'danger' },
      { label: 'Respondidos', value: answered, icon: CheckCircle2, tone: 'ok' },
    ];
  }, [rfis]);

  const assigneeOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const item of rfis) {
      if (item.assignedTo) {
        map.set(item.assignedTo.id, { id: item.assignedTo.id, name: item.assignedTo.name });
      }
    }
    return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [rfis]);

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>RFIs y consultas formales</h1>
          <p className="muted">
            Listado ejecutivo con accesos directos a detalle, respuesta, comentarios y cierre.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button" href="/rfis/new">
            <Plus size={18} />
            Nuevo RFI
          </Link>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <div className="grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className={`card span-3 project-metric ${metric.tone}`} key={metric.label}>
              <Icon size={20} />
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          );
        })}
      </div>

      <article className="card" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Filtros</h2>
          <button
            className="button secondary"
            type="button"
            onClick={() => setFilters(emptyFilters)}
          >
            Limpiar
          </button>
        </div>
        <div className="quick-filters-grid rfi-filters-grid">
          <SelectField
            label="Proyecto"
            value={filters.projectId}
            onChange={(value) => setFilters((current) => ({ ...current, projectId: value }))}
            options={projects.map((project) => ({
              value: project.id,
              label: `${project.code} · ${project.name}`,
            }))}
          />
          <SelectField
            label="Estado"
            value={filters.status}
            onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
            options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
          />
          <SelectField
            label="Prioridad"
            value={filters.priority}
            onChange={(value) => setFilters((current) => ({ ...current, priority: value }))}
            options={priorityOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
          <SelectField
            label="Responsable"
            value={filters.assignedToId}
            onChange={(value) => setFilters((current) => ({ ...current, assignedToId: value }))}
            options={assigneeOptions.map((item) => ({ value: item.id, label: item.name }))}
          />
          <div className="field">
            <label>Buscar</label>
            <div className="search-input">
              <Search size={16} />
              <input
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Título, descripción, proyecto o documento"
              />
            </div>
          </div>
        </div>
      </article>

      <section className="grid" style={{ marginTop: 16 }}>
        <article className="card span-7">
          <div className="panel-header">
            <h2>Listado de RFIs</h2>
            <span className="pill">{loading ? 'Cargando' : `${rfis.length} registros`}</span>
          </div>
          <div className="project-list">
            {rfis.map((rfi) => (
              <div className="project-list-item" key={rfi.id}>
                <div className="project-list-head">
                  <strong>{rfi.title}</strong>
                  <span className={`pill ${getRfiTone(rfi.status)}`}>
                    {normalizeLabel(rfi.status)}
                  </span>
                </div>
                <span className="muted">{rfi.project?.code ?? rfi.projectId}</span>
                <p>{rfi.assignedTo?.name ?? 'Sin responsable'}</p>
                <div className="project-list-meta">
                  <span>{normalizeLabel(rfi.priority)}</span>
                  <span>{formatDate(rfi.dueDate)}</span>
                </div>
                <div className="projects-actions" style={{ marginTop: 12 }}>
                  <Link className="button secondary" href={`/rfis/${rfi.id}`}>
                    Abrir
                  </Link>
                  <Link className="button secondary" href={`/rfis/${rfi.id}/comments/new`}>
                    Comentar
                  </Link>
                  <Link className="button secondary" href={`/rfis/${rfi.id}/respond`}>
                    Responder
                  </Link>
                </div>
              </div>
            ))}
            {!rfis.length ? (
              <div className="simple-document-item">No hay RFIs con esos filtros.</div>
            ) : null}
          </div>
        </article>

        <article className="card span-5">
          <div className="panel-header">
            <h2>Próximos pasos</h2>
            <FilePlus2 size={18} color="var(--primary)" />
          </div>
          <div className="simple-document-list">
            <div className="simple-document-item">
              <strong>Alta dedicada</strong>
              <span>
                La creación de RFIs ya vive en una pantalla independiente para capturar mejor el
                contexto.
              </span>
            </div>
            <div className="simple-document-item">
              <strong>Expediente por RFI</strong>
              <span>
                Cada consulta tiene su propia vista con historial, respuesta, comentarios y
                adjuntos.
              </span>
            </div>
            <div className="simple-document-item">
              <strong>Acciones aisladas</strong>
              <span>
                Comentar y responder ahora se hacen desde pantallas enfocadas, sin mezclar estados
                en el tablero.
              </span>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}

export function RfiCreatePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [formOptions, setFormOptions] = useState<FormOptionsResponse>({
    projects: [],
    projectMembers: [],
    documents: [],
  });
  const [form, setForm] = useState<CreateRfiForm>(emptyCreateForm);
  const [files, setFiles] = useState<FilePayload[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await apiGet<FormOptionsResponse>('/rfis/form-options', getToken());
        if (!active) return;
        setProjects(response.projects);
        setFormOptions(response);
      } catch {
        if (!active) return;
        setError('No fue posible cargar las opciones base del módulo de RFIs.');
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!form.projectId) {
      setFormOptions((current) => ({ ...current, projectMembers: [], documents: [] }));
      return;
    }

    async function loadProjectOptions() {
      try {
        const response = await apiGet<FormOptionsResponse>(
          `/rfis/form-options?projectId=${form.projectId}`,
          getToken()
        );
        if (!active) return;
        setFormOptions(response);
      } catch {
        if (!active) return;
        setError('No fue posible cargar miembros y documentos del proyecto.');
      }
    }

    void loadProjectOptions();
    return () => {
      active = false;
    };
  }, [form.projectId]);

  async function submit() {
    if (!form.projectId || !form.title.trim() || !form.description.trim()) {
      setError('Completa al menos proyecto, título y descripción del RFI.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await apiPost<RfiDetail>(
        '/rfis',
        {
          ...form,
          documentId: form.documentId || undefined,
          assignedToId: form.assignedToId || undefined,
          dueDate: form.dueDate || undefined,
          attachments: files,
        },
        getToken()
      );
      router.push(`/rfis/${created.id}`);
      router.refresh();
    } catch {
      setError('No fue posible crear el RFI.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo RFI</h1>
          <p className="muted">
            Pantalla dedicada para registrar consultas formales por proyecto, documento y
            responsable.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/rfis">
            Cancelar
          </Link>
        </div>
      </div>

      {error ? <article className="card muted">{error}</article> : null}

      <article className="card">
        <div className="panel-header">
          <h2>Crear RFI</h2>
          <Plus size={18} color="var(--primary)" />
        </div>
        <RfiFormFields
          form={form}
          projects={projects}
          projectMembers={formOptions.projectMembers}
          documents={formOptions.documents}
          onChange={(key, value) =>
            setForm((current) => {
              if (key === 'projectId') {
                return { ...current, projectId: value, documentId: '', assignedToId: '' };
              }
              return { ...current, [key]: value };
            })
          }
        />
        <div className="field">
          <label>Adjuntos</label>
          <input
            type="file"
            multiple
            onChange={(event) => void handleFiles(event.target.files, setFiles)}
          />
        </div>
        {files.length ? (
          <p className="muted">Adjuntos: {files.map((file) => file.fileName).join(', ')}</p>
        ) : null}
        <div className="projects-actions" style={{ marginTop: 16 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar RFI'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function RfiDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rfiId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<RfiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rfiId) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await loadRfiDetail(rfiId);
        if (!active) return;
        setDetail(response);
      } catch {
        if (!active) return;
        setError('No fue posible cargar el detalle del RFI.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [rfiId]);

  async function updateStatus(status: 'in_progress' | 'answered' | 'closed' | 'open') {
    if (!detail) return;
    try {
      const path = status === 'closed' ? `/rfis/${detail.id}/close` : `/rfis/${detail.id}/status`;
      const updated = await apiPatch<RfiDetail>(
        path,
        status === 'closed'
          ? { note: 'RFI cerrado desde el expediente.' }
          : { status, note: `Estado actualizado a ${status}.` },
        getToken()
      );
      setDetail(updated);
      router.refresh();
    } catch {
      setError('No fue posible actualizar el estado del RFI.');
    }
  }

  if (loading) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando RFI...</p>
        </article>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">{error || 'No fue posible abrir este RFI.'}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{detail.title}</h1>
          <p className="muted">
            Expediente del RFI con trazabilidad completa, acciones y seguimiento operativo.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/rfis">
            Volver al listado
          </Link>
          <Link className="button secondary" href={`/rfis/${detail.id}/comments/new`}>
            Comentar
          </Link>
          <Link className="button secondary" href={`/rfis/${detail.id}/respond`}>
            Responder
          </Link>
          <button
            className="button secondary"
            type="button"
            onClick={() => updateStatus('in_progress')}
          >
            En atención
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => updateStatus('answered')}
          >
            Marcar respondido
          </button>
          <button
            className="button danger-button"
            type="button"
            onClick={() => updateStatus('closed')}
          >
            Cerrar RFI
          </button>
        </div>
      </div>

      {error ? <article className="card muted">{error}</article> : null}

      <RfiSummaryCard detail={detail} />

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-6">
          <div className="panel-header">
            <h2>Comentarios y respuestas</h2>
            <span className="pill">{detail.comments.length}</span>
          </div>
          <div className="simple-document-list">
            {detail.comments.map((comment) => (
              <div className="simple-document-item" key={comment.id}>
                <strong>
                  {comment.author?.name ?? 'Usuario'} · {normalizeLabel(comment.type)}
                </strong>
                <span>{comment.body}</span>
                <small>{formatDateTime(comment.createdAt)}</small>
                {comment.attachments.length ? (
                  <small>
                    Adjuntos:{' '}
                    {comment.attachments
                      .map((item) => `${item.fileName} (${formatSize(item.sizeBytes)})`)
                      .join(', ')}
                  </small>
                ) : null}
              </div>
            ))}
            {!detail.comments.length ? (
              <div className="simple-document-item">Aún no hay comentarios ni respuestas.</div>
            ) : null}
          </div>
        </article>

        <article className="card span-6">
          <div className="panel-header">
            <h2>Contexto del expediente</h2>
            <Send size={18} color="var(--primary)" />
          </div>
          <div className="simple-document-list">
            <div className="simple-document-item">
              <strong>Adjuntos del RFI</strong>
              <small>
                {detail.attachments.length
                  ? detail.attachments
                      .map((item) => `${item.fileName} (${formatSize(item.sizeBytes)})`)
                      .join(', ')
                  : 'Sin adjuntos iniciales'}
              </small>
            </div>
            <div className="simple-document-item">
              <strong>Creado</strong>
              <small>{formatDateTime(detail.createdAt)}</small>
            </div>
            <div className="simple-document-item">
              <strong>Última actualización</strong>
              <small>{formatDateTime(detail.updatedAt)}</small>
            </div>
            <div className="simple-document-item">
              <strong>Cierre</strong>
              <small>{formatDateTime(detail.closedAt)}</small>
            </div>
          </div>
        </article>
      </div>

      <article className="card" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Historial</h2>
          <span className="pill">{detail.history.length} eventos</span>
        </div>
        <div className="simple-document-list">
          {detail.history.map((entry) => (
            <div className="simple-document-item" key={entry.id}>
              <strong>{normalizeLabel(entry.action)}</strong>
              <span>{entry.actor?.name ?? 'Sistema'}</span>
              <small>{formatDateTime(entry.createdAt)}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export function RfiCommentCreatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rfiId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<RfiDetail | null>(null);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<FilePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rfiId) return;
    let active = true;

    async function load() {
      try {
        const response = await loadRfiDetail(rfiId);
        if (!active) return;
        setDetail(response);
      } catch {
        if (!active) return;
        setError('No fue posible cargar el RFI.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [rfiId]);

  async function submit() {
    if (!rfiId || !body.trim()) {
      setError('Escribe el comentario que quieres registrar.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiPost<RfiDetail>(`/rfis/${rfiId}/comments`, { body, attachments: files }, getToken());
      router.push(`/rfis/${rfiId}`);
      router.refresh();
    } catch {
      setError('No fue posible agregar el comentario.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo comentario</h1>
          <p className="muted">
            Pantalla dedicada para registrar aclaraciones, seguimiento y evidencia del RFI.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={rfiId ? `/rfis/${rfiId}` : '/rfis'}>
            Cancelar
          </Link>
        </div>
      </div>

      {error ? <article className="card muted">{error}</article> : null}

      <article className="card">
        <div className="panel-header">
          <h2>{detail?.title ?? 'Comentario del RFI'}</h2>
          <MessageSquare size={18} color="var(--primary)" />
        </div>
        {loading ? (
          <p className="muted">Cargando RFI...</p>
        ) : (
          <>
            <div className="field">
              <label>Comentario</label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Agrega un comentario o aclaración."
              />
            </div>
            <div className="field">
              <label>Adjuntos del comentario</label>
              <input
                type="file"
                multiple
                onChange={(event) => void handleFiles(event.target.files, setFiles)}
              />
            </div>
            {files.length ? (
              <p className="muted">Adjuntos: {files.map((file) => file.fileName).join(', ')}</p>
            ) : null}
            <div className="projects-actions">
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar comentario'}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export function RfiRespondPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rfiId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<RfiDetail | null>(null);
  const [answer, setAnswer] = useState('');
  const [files, setFiles] = useState<FilePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rfiId) return;
    let active = true;

    async function load() {
      try {
        const response = await loadRfiDetail(rfiId);
        if (!active) return;
        setDetail(response);
        setAnswer(response.answer ?? '');
      } catch {
        if (!active) return;
        setError('No fue posible cargar el RFI.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [rfiId]);

  async function submit() {
    if (!rfiId || !answer.trim()) {
      setError('Escribe la respuesta formal del RFI.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiPost<RfiDetail>(
        `/rfis/${rfiId}/respond`,
        { answer, attachments: files },
        getToken()
      );
      router.push(`/rfis/${rfiId}`);
      router.refresh();
    } catch {
      setError('No fue posible registrar la respuesta del RFI.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Responder RFI</h1>
          <p className="muted">
            Pantalla dedicada para registrar la respuesta oficial y su evidencia adjunta.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={rfiId ? `/rfis/${rfiId}` : '/rfis'}>
            Cancelar
          </Link>
        </div>
      </div>

      {error ? <article className="card muted">{error}</article> : null}

      <article className="card">
        <div className="panel-header">
          <h2>{detail?.title ?? 'Respuesta del RFI'}</h2>
          <Send size={18} color="var(--primary)" />
        </div>
        {loading ? (
          <p className="muted">Cargando RFI...</p>
        ) : (
          <>
            <div className="field">
              <label>Respuesta formal</label>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Registra la respuesta oficial del responsable."
              />
            </div>
            <div className="field">
              <label>Adjuntos de respuesta</label>
              <input
                type="file"
                multiple
                onChange={(event) => void handleFiles(event.target.files, setFiles)}
              />
            </div>
            {files.length ? (
              <p className="muted">Adjuntos: {files.map((file) => file.fileName).join(', ')}</p>
            ) : null}
            <div className="projects-actions">
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Enviando...' : 'Enviar respuesta'}
              </button>
            </div>
          </>
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
