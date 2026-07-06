'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  FileClock,
  FileText,
  FolderTree,
  PencilLine,
  Plus,
  Search,
  ShieldBan,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getSessionUser } from '../../lib/auth';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { PermissionKey } from '../../lib/permissions';

type ProjectSummary = {
  id: string;
  name: string;
  code: string;
  description?: string;
  workType?: string;
  currentStage?: string;
  priority: string;
  targetDate?: string;
  status: string;
  isActive: boolean;
  responsible: { id: string; name: string; email: string } | null;
  assignedUsers: Array<{ id: string; name: string; email: string; role: string }>;
  disciplines: Array<{ id: string; code: string; name: string }>;
  metrics: { documents: number; approved: number; critical: number; progress: number };
};

type FolderNode = {
  id: string;
  name: string;
  path?: string;
  discipline?: { id: string; code: string; name: string } | null;
  children: FolderNode[];
};

type ProjectDocument = {
  id: string;
  name: string;
  documentNumber: string;
  status: string;
  dueDate?: string;
  updatedAt: string;
  folder?: { id: string; name: string } | null;
  discipline?: { id: string; code: string; name: string } | null;
  responsibleUser?: { id: string; name: string; email: string } | null;
};

type ProjectDetail = {
  project: ProjectSummary;
  folders: FolderNode[];
  recentDocuments: ProjectDocument[];
  criticalDocuments: ProjectDocument[];
  documentsSummary: {
    total: number;
    approved: number;
    inReview: number;
    overdue: number;
    critical: number;
  };
  availableDisciplines: Array<{ id: string; code: string; name: string }>;
};

type ProjectDocumentsResponse = {
  items: ProjectDocument[];
  summary: { total: number; approved: number; inReview: number; overdue: number; critical: number };
  recent: ProjectDocument[];
  critical: ProjectDocument[];
};

type ProjectForm = {
  name: string;
  code: string;
  description: string;
  workType: string;
  currentStage: string;
  priority: string;
  responsibleUserId: string;
  targetDate: string;
  status: string;
  assignedUserIds: string[];
  disciplineIds: string[];
};

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type DisciplineOption = {
  id: string;
  code: string;
  name: string;
  description?: string;
};

type ProjectCatalogCategory = 'workType' | 'currentStage' | 'priority' | 'status';

type CatalogOption = {
  id: string;
  category: ProjectCatalogCategory;
  value: string;
  label: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

type FormOptionsResponse = {
  users: UserOption[];
  disciplines: DisciplineOption[];
  catalogs: Record<ProjectCatalogCategory, CatalogOption[]>;
};

type Filters = {
  search: string;
  disciplineId: string;
  folderId: string;
  status: string;
  responsibleId: string;
  dateFrom: string;
  dateTo: string;
};

const emptyForm: ProjectForm = {
  name: '',
  code: '',
  description: '',
  workType: '',
  currentStage: '',
  priority: 'media',
  responsibleUserId: '',
  targetDate: '',
  status: 'planificacion',
  assignedUserIds: [],
  disciplineIds: [],
};

const emptyFilters: Filters = {
  search: '',
  disciplineId: '',
  folderId: '',
  status: '',
  responsibleId: '',
  dateFrom: '',
  dateTo: '',
};

const fallbackProjects: ProjectSummary[] = [
  {
    id: 'mock-1',
    name: 'Torre Ejecutiva Norte',
    code: 'HOL-PRJ-001',
    description:
      'Gestión integral de ingeniería, submittals y control documental para edificio corporativo.',
    workType: 'Edificación vertical',
    currentStage: 'Coordinación IFC',
    priority: 'alta',
    targetDate: '2026-08-18',
    status: 'en_ejecucion',
    isActive: true,
    responsible: { id: 'u1', name: 'Laura Méndez', email: 'laura@holocron.local' },
    assignedUsers: [
      { id: 'u1', name: 'Laura Méndez', email: 'laura@holocron.local', role: 'owner' },
      { id: 'u2', name: 'José Ramírez', email: 'jose@holocron.local', role: 'manager' },
    ],
    disciplines: [
      { id: 'd1', code: 'ARC', name: 'Arquitectura' },
      { id: 'd2', code: 'MEC', name: 'Mecánica' },
    ],
    metrics: { documents: 48, approved: 31, critical: 5, progress: 65 },
  },
  {
    id: 'mock-2',
    name: 'Planta de Tratamiento Oriente',
    code: 'HOL-PRJ-014',
    description: 'Repositorio técnico y contractual para la etapa de construcción electromecánica.',
    workType: 'Infraestructura hidráulica',
    currentStage: 'Construcción',
    priority: 'critica',
    targetDate: '2026-07-25',
    status: 'en_riesgo',
    isActive: true,
    responsible: { id: 'u3', name: 'Paola Cruz', email: 'paola@holocron.local' },
    assignedUsers: [{ id: 'u3', name: 'Paola Cruz', email: 'paola@holocron.local', role: 'owner' }],
    disciplines: [
      { id: 'd3', code: 'CIV', name: 'Civil' },
      { id: 'd4', code: 'ELE', name: 'Eléctrica' },
    ],
    metrics: { documents: 76, approved: 39, critical: 11, progress: 51 },
  },
];

const fallbackDetail: Record<string, ProjectDetail> = {
  'mock-1': {
    project: fallbackProjects[0],
    folders: [
      { id: 'f-1', name: '01_Administrativo', path: '01_Administrativo', children: [] },
      {
        id: 'f-2',
        name: '02_Tecnico',
        path: '02_Tecnico',
        children: [
          {
            id: 'f-2a',
            name: 'ARC_Arquitectura',
            path: '02_Tecnico/ARC_Arquitectura',
            children: [],
          },
          { id: 'f-2b', name: 'MEC_Mecánica', path: '02_Tecnico/MEC_Mecánica', children: [] },
        ],
      },
      { id: 'f-3', name: '03_Obra', path: '03_Obra', children: [] },
    ],
    recentDocuments: [],
    criticalDocuments: [],
    documentsSummary: { total: 48, approved: 31, inReview: 9, overdue: 3, critical: 5 },
    availableDisciplines: fallbackProjects[0].disciplines,
  },
  'mock-2': {
    project: fallbackProjects[1],
    folders: [
      { id: 'f-4', name: '01_Administrativo', path: '01_Administrativo', children: [] },
      {
        id: 'f-5',
        name: '02_Tecnico',
        path: '02_Tecnico',
        children: [
          { id: 'f-5a', name: 'CIV_Civil', path: '02_Tecnico/CIV_Civil', children: [] },
          { id: 'f-5b', name: 'ELE_Eléctrica', path: '02_Tecnico/ELE_Eléctrica', children: [] },
        ],
      },
    ],
    recentDocuments: [],
    criticalDocuments: [],
    documentsSummary: { total: 76, approved: 39, inReview: 19, overdue: 6, critical: 11 },
    availableDisciplines: fallbackProjects[1].disciplines,
  },
};

const fallbackDocuments: Record<string, ProjectDocumentsResponse> = {
  'mock-1': {
    items: [
      {
        id: 'doc-1',
        name: 'Plano de fachada nivel 12',
        documentNumber: 'ARC-IFC-012',
        status: 'in_review',
        dueDate: '2026-07-04',
        updatedAt: '2026-07-01T16:20:00.000Z',
        folder: { id: 'f-2a', name: 'ARC_Arquitectura' },
        discipline: { id: 'd1', code: 'ARC', name: 'Arquitectura' },
        responsibleUser: { id: 'u1', name: 'Laura Méndez', email: 'laura@holocron.local' },
      },
      {
        id: 'doc-2',
        name: 'Ficha de equipos HVAC',
        documentNumber: 'MEC-SUB-021',
        status: 'draft',
        dueDate: '2026-07-02',
        updatedAt: '2026-07-01T10:05:00.000Z',
        folder: { id: 'f-2b', name: 'MEC_Mecánica' },
        discipline: { id: 'd2', code: 'MEC', name: 'Mecánica' },
        responsibleUser: { id: 'u2', name: 'José Ramírez', email: 'jose@holocron.local' },
      },
      {
        id: 'doc-3',
        name: 'Procedimiento de montaje',
        documentNumber: 'GEN-PRO-008',
        status: 'approved',
        dueDate: '2026-07-15',
        updatedAt: '2026-06-30T08:40:00.000Z',
        folder: { id: 'f-3', name: '03_Obra' },
        discipline: null,
        responsibleUser: { id: 'u1', name: 'Laura Méndez', email: 'laura@holocron.local' },
      },
    ],
    summary: { total: 48, approved: 31, inReview: 9, overdue: 3, critical: 5 },
    recent: [],
    critical: [],
  },
  'mock-2': {
    items: [
      {
        id: 'doc-4',
        name: 'Memoria de cálculo de cimentación',
        documentNumber: 'CIV-CAL-003',
        status: 'in_review',
        dueDate: '2026-07-03',
        updatedAt: '2026-07-02T07:30:00.000Z',
        folder: { id: 'f-5a', name: 'CIV_Civil' },
        discipline: { id: 'd3', code: 'CIV', name: 'Civil' },
        responsibleUser: { id: 'u3', name: 'Paola Cruz', email: 'paola@holocron.local' },
      },
      {
        id: 'doc-5',
        name: 'Tablero general de media tensión',
        documentNumber: 'ELE-IFC-019',
        status: 'draft',
        dueDate: '2026-06-29',
        updatedAt: '2026-07-01T18:15:00.000Z',
        folder: { id: 'f-5b', name: 'ELE_Eléctrica' },
        discipline: { id: 'd4', code: 'ELE', name: 'Eléctrica' },
        responsibleUser: { id: 'u3', name: 'Paola Cruz', email: 'paola@holocron.local' },
      },
    ],
    summary: { total: 76, approved: 39, inReview: 19, overdue: 6, critical: 11 },
    recent: [],
    critical: [],
  },
};

for (const key of Object.keys(fallbackDetail)) {
  fallbackDetail[key].recentDocuments = [...fallbackDocuments[key].items].slice(0, 3);
  fallbackDetail[key].criticalDocuments = fallbackDocuments[key].items.filter(
    (item) => item.status !== 'approved'
  );
  fallbackDocuments[key].recent = fallbackDetail[key].recentDocuments;
  fallbackDocuments[key].critical = fallbackDetail[key].criticalDocuments;
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('holocron_token');
}

function normalizeLabel(value?: string | null) {
  if (!value) return 'Sin definir';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function slugifyProjectSegment(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function generateProjectCode(name: string) {
  const segment = slugifyProjectSegment(name);
  return segment ? `PRJ-${segment}` : '';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function useProjectPermissions() {
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    setCanManage(Boolean(user?.permissions.includes(PermissionKey.ProjectsManage)));
  }, []);

  return canManage;
}

function useProjectsList() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setLoading(true);
      setError('');
      try {
        const result = await apiGet<ProjectSummary[]>('/projects', getToken() ?? undefined);
        if (!active) return;
        setProjects(result.length ? result : fallbackProjects);
      } catch {
        if (!active) return;
        setProjects(fallbackProjects);
        setError('Se cargó una vista de ejemplo porque la API todavía no respondió.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  return { projects, setProjects, loading, error };
}

export function ProjectsListPage() {
  const { projects, loading, error } = useProjectsList();
  const [search, setSearch] = useState('');
  const canManage = useProjectPermissions();

  const quickMetrics = useMemo(() => {
    const activeProjects = projects.filter((project) => project.isActive).length;
    const criticalProjects = projects.filter((project) => project.metrics.critical > 0).length;
    const totalDocuments = projects.reduce((sum, project) => sum + project.metrics.documents, 0);
    const overdueDocuments = projects.reduce((sum, project) => sum + project.metrics.critical, 0);

    return [
      { label: 'Proyectos activos', value: activeProjects, tone: 'ok', icon: FolderTree },
      { label: 'Con alertas críticas', value: criticalProjects, tone: 'warn', icon: AlertTriangle },
      { label: 'Documentos trazados', value: totalDocuments, tone: 'info', icon: FileText },
      { label: 'Críticos o vencidos', value: overdueDocuments, tone: 'danger', icon: FileClock },
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) => {
      const haystack =
        `${project.code} ${project.name} ${project.currentStage ?? ''} ${project.responsible?.name ?? ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [projects, search]);

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Proyectos</h1>
          <p className="muted">
            Cada proyecto concentra sus documentos, carpetas, responsables y trazabilidad.
          </p>
        </div>
        <div className="projects-actions">
          {canManage ? (
            <Link className="button" href="/projects/new">
              <Plus size={18} />
              Nuevo proyecto
            </Link>
          ) : null}
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <div className="grid">
        {quickMetrics.map((metric) => {
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
          <h2>Listado de proyectos</h2>
          <span className="pill">
            {loading ? 'Cargando' : `${filteredProjects.length} registros`}
          </span>
        </div>
        <div className="field">
          <label>Búsqueda rápida</label>
          <div className="search-input">
            <Search size={16} />
            <input
              placeholder="Código, nombre, etapa o responsable"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="grid" style={{ marginTop: 16 }}>
          {filteredProjects.map((project) => (
            <article className="card span-6" key={project.id}>
              <div className="project-hero" style={{ gap: 16 }}>
                <div>
                  <div className="project-code">{project.code}</div>
                  <h2 style={{ marginBottom: 6 }}>{project.name}</h2>
                  <p className="muted">{project.description || 'Sin descripción ejecutiva.'}</p>
                </div>
                <div className="project-hero-actions">
                  <Link className="button secondary" href={`/projects/${project.id}`}>
                    Ver detalle
                  </Link>
                  {canManage ? (
                    <Link className="button secondary" href={`/projects/${project.id}/edit`}>
                      <PencilLine size={18} />
                      Editar
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="project-state-grid">
                <div className="state-card">
                  <span>Estado</span>
                  <strong>{normalizeLabel(project.status)}</strong>
                </div>
                <div className="state-card">
                  <span>Etapa</span>
                  <strong>{project.currentStage || 'Sin definir'}</strong>
                </div>
                <div className="state-card">
                  <span>Responsable</span>
                  <strong>{project.responsible?.name ?? 'Sin responsable'}</strong>
                </div>
                <div className="state-card">
                  <span>Fecha objetivo</span>
                  <strong>{project.targetDate || 'Sin fecha'}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const canManage = useProjectPermissions();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [documents, setDocuments] = useState<ProjectDocumentsResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    let active = true;

    async function loadDetail() {
      setLoading(true);
      setError('');
      try {
        const query = buildQuery(filters);
        const [detailResponse, documentsResponse] = await Promise.all([
          apiGet<ProjectDetail>(`/projects/${projectId}`, getToken() ?? undefined),
          apiGet<ProjectDocumentsResponse>(
            `/projects/${projectId}/documents${query ? `?${query}` : ''}`,
            getToken() ?? undefined
          ),
        ]);

        if (!active) return;
        setDetail(detailResponse);
        setDocuments(documentsResponse);
      } catch {
        if (!active) return;
        setDetail(fallbackDetail[projectId] ?? fallbackDetail['mock-1']);
        setDocuments(fallbackDocuments[projectId] ?? fallbackDocuments['mock-1']);
        setError('Se muestra un respaldo local porque no fue posible cargar el detalle completo.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDetail();
    return () => {
      active = false;
    };
  }, [filters, projectId]);

  async function deactivateProject() {
    if (!projectId || !detail) return;
    try {
      await apiPatch(`/projects/${projectId}/deactivate`, {}, getToken() ?? undefined);
      setDetail((current) =>
        current ? { ...current, project: { ...current.project, isActive: false } } : current
      );
    } catch (error) {
      setError(getErrorMessage(error, 'No fue posible desactivar el proyecto en este momento.'));
    }
  }

  if (!detail && loading) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando detalle del proyecto...</p>
        </article>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">No fue posible abrir este proyecto.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{detail.project.name}</h1>
          <p className="muted">
            Aquí vive la estructura completa del proyecto: carpetas, documentos y seguimiento.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/projects">
            Volver al listado
          </Link>
          <Link className="button secondary" href={`/documents?projectId=${detail.project.id}`}>
            Ver documentos
          </Link>
          <Link className="button secondary" href={`/documents/new?projectId=${detail.project.id}`}>
            Nuevo documento
          </Link>
          {canManage ? (
            <Link className="button secondary" href="/admin/project-users">
              Agregar usuarios
            </Link>
          ) : null}
          {canManage ? (
            <Link className="button secondary" href={`/projects/${detail.project.id}/edit`}>
              <PencilLine size={18} />
              Editar
            </Link>
          ) : null}
          {canManage ? (
            <button className="button danger-button" type="button" onClick={deactivateProject}>
              <ShieldBan size={18} />
              Desactivar
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <article className="card">
        <div className="project-hero">
          <div>
            <div className="project-code">{detail.project.code}</div>
            <h2>{detail.project.name}</h2>
            <p className="muted">{detail.project.description || 'Sin descripción ejecutiva.'}</p>
          </div>
          <div className="project-hero-actions">
            <span className={`pill ${detail.project.isActive ? '' : 'danger'}`}>
              {detail.project.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="project-state-grid">
          <div className="state-card">
            <span>Tipo de obra</span>
            <strong>{detail.project.workType || 'Sin definir'}</strong>
          </div>
          <div className="state-card">
            <span>Etapa actual</span>
            <strong>{detail.project.currentStage || 'Sin definir'}</strong>
          </div>
          <div className="state-card">
            <span>Estado</span>
            <strong>{normalizeLabel(detail.project.status)}</strong>
          </div>
          <div className="state-card">
            <span>Fecha objetivo</span>
            <strong>{detail.project.targetDate || 'Sin fecha'}</strong>
          </div>
        </div>
      </article>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-4">
          <div className="panel-header">
            <h2>Tarjetas de estado</h2>
            <CalendarDays size={18} color="var(--primary)" />
          </div>
          <div className="status-card-list">
            <div className="status-card">
              <span>Avance documental</span>
              <strong>{detail.project.metrics.progress}%</strong>
            </div>
            <div className="status-card">
              <span>Documentos aprobados</span>
              <strong>{detail.documentsSummary.approved}</strong>
            </div>
            <div className="status-card warning">
              <span>Críticos o vencidos</span>
              <strong>{detail.documentsSummary.critical}</strong>
            </div>
            <div className="status-card neutral">
              <span>Usuarios asignados</span>
              <strong>{detail.project.assignedUsers.length}</strong>
            </div>
          </div>
        </article>

        <article className="card span-4">
          <div className="panel-header">
            <h2>Carpetas del proyecto</h2>
            <FolderTree size={18} color="var(--primary)" />
          </div>
          <p className="muted">
            Cada documento del proyecto debe vivir dentro de una de estas carpetas.
          </p>
          <FolderTreeView
            nodes={detail.folders}
            onSelectFolder={(folderId) => setFilters((current) => ({ ...current, folderId }))}
          />
        </article>

        <article className="card span-4">
          <div className="panel-header">
            <h2>Alertas documentales</h2>
            <AlertTriangle size={18} color="var(--accent)" />
          </div>
          <div className="document-alert-list">
            {detail.criticalDocuments.map((document) => (
              <button
                className="document-alert-item"
                key={document.id}
                type="button"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    status: document.status,
                    disciplineId: document.discipline?.id ?? current.disciplineId,
                  }))
                }
              >
                <strong>{document.documentNumber}</strong>
                <span>{document.name}</span>
                <small>
                  {document.dueDate || 'Sin fecha'} · {normalizeLabel(document.status)}
                </small>
              </button>
            ))}
          </div>
        </article>
      </div>

      <article className="card" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Filtros rápidos</h2>
          <button
            className="button secondary"
            type="button"
            onClick={() => setFilters(emptyFilters)}
          >
            Limpiar
          </button>
        </div>
        <div className="quick-filters-grid">
          <div className="field">
            <label>Disciplina</label>
            <select
              value={filters.disciplineId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, disciplineId: event.target.value }))
              }
            >
              <option value="">Todas</option>
              {detail.availableDisciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.code} · {discipline.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Carpeta</label>
            <input
              placeholder="Id de carpeta"
              value={filters.folderId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, folderId: event.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Estado documental</label>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="in_review">En revisión</option>
              <option value="approved">Aprobado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div className="field">
            <label>Responsable</label>
            <input
              placeholder="Id de usuario"
              value={filters.responsibleId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, responsibleId: event.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Fecha desde</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters((current) => ({ ...current, dateFrom: event.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Fecha hasta</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters((current) => ({ ...current, dateTo: event.target.value }))
              }
            />
          </div>
        </div>
      </article>

      <article className="card" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Tabla de documentos</h2>
          <span className="pill">
            {loading ? 'Actualizando' : `${documents?.items.length ?? 0} documentos`}
          </span>
        </div>
        <div className="projects-actions" style={{ marginBottom: 12 }}>
          <Link className="button secondary" href={`/documents?projectId=${detail.project.id}`}>
            Abrir vista documental del proyecto
          </Link>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Documento</th>
                <th>Disciplina</th>
                <th>Carpeta</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th>Fecha objetivo</th>
              </tr>
            </thead>
            <tbody>
              {documents?.items.map((document) => (
                <tr key={document.id}>
                  <td>{document.documentNumber}</td>
                  <td>{document.name}</td>
                  <td>
                    {document.discipline
                      ? `${document.discipline.code} · ${document.discipline.name}`
                      : 'General'}
                  </td>
                  <td>{document.folder?.name ?? 'Sin carpeta'}</td>
                  <td>{document.responsibleUser?.name ?? 'Sin responsable'}</td>
                  <td>
                    <span
                      className={`pill ${document.status === 'approved' ? 'success' : document.status === 'draft' ? 'warning' : ''}`}
                    >
                      {normalizeLabel(document.status)}
                    </span>
                  </td>
                  <td>{document.dueDate ?? 'Sin fecha'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-6">
          <div className="panel-header">
            <h2>Documentos recientes</h2>
            <span className="pill">{detail.recentDocuments.length}</span>
          </div>
          <SimpleDocumentList items={detail.recentDocuments} />
        </article>
        <article className="card span-6">
          <div className="panel-header">
            <h2>Críticos o vencidos</h2>
            <span className="pill danger">{detail.criticalDocuments.length}</span>
          </div>
          <SimpleDocumentList items={detail.criticalDocuments} />
        </article>
      </div>
    </section>
  );
}

export function ProjectFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [formOptions, setFormOptions] = useState<FormOptionsResponse>({
    users: [],
    disciplines: [],
    catalogs: { workType: [], currentStage: [], priority: [], status: [] },
  });
  const [responsibleSearch, setResponsibleSearch] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadFormOptions() {
      try {
        const response = await apiGet<FormOptionsResponse>(
          '/projects/form-options',
          getToken() ?? undefined
        );
        if (!active) return;
        setFormOptions(response);
      } catch {
        if (!active) return;
        const fallbackUsers = fallbackProjects.flatMap((project) => [
          ...(project.responsible ? [project.responsible] : []),
          ...project.assignedUsers,
        ]);
        const uniqueUsers = Array.from(
          new Map(fallbackUsers.map((user) => [user.id, user])).values()
        );
        const fallbackDisciplines = Array.from(
          new Map(
            fallbackProjects
              .flatMap((project) => project.disciplines)
              .map((discipline) => [discipline.id, discipline])
          ).values()
        );

        setFormOptions({
          users: uniqueUsers.map((user) => ({ id: user.id, name: user.name, email: user.email })),
          disciplines: fallbackDisciplines.map((discipline) => ({
            id: discipline.id,
            code: discipline.code,
            name: discipline.name,
          })),
          catalogs: {
            workType: [
              {
                id: 'work-1',
                category: 'workType',
                value: 'edificacion_vertical',
                label: 'Edificación vertical',
                sortOrder: 10,
                isActive: true,
              },
              {
                id: 'work-2',
                category: 'workType',
                value: 'infraestructura_hidraulica',
                label: 'Infraestructura hidráulica',
                sortOrder: 20,
                isActive: true,
              },
            ],
            currentStage: [
              {
                id: 'stage-1',
                category: 'currentStage',
                value: 'planificacion',
                label: 'Planificación',
                sortOrder: 10,
                isActive: true,
              },
              {
                id: 'stage-2',
                category: 'currentStage',
                value: 'coordinacion_ifc',
                label: 'Coordinación IFC',
                sortOrder: 20,
                isActive: true,
              },
              {
                id: 'stage-3',
                category: 'currentStage',
                value: 'construccion',
                label: 'Construcción',
                sortOrder: 30,
                isActive: true,
              },
            ],
            priority: [
              {
                id: 'priority-1',
                category: 'priority',
                value: 'baja',
                label: 'Baja',
                sortOrder: 10,
                isActive: true,
              },
              {
                id: 'priority-2',
                category: 'priority',
                value: 'media',
                label: 'Media',
                sortOrder: 20,
                isActive: true,
              },
              {
                id: 'priority-3',
                category: 'priority',
                value: 'alta',
                label: 'Alta',
                sortOrder: 30,
                isActive: true,
              },
              {
                id: 'priority-4',
                category: 'priority',
                value: 'critica',
                label: 'Crítica',
                sortOrder: 40,
                isActive: true,
              },
            ],
            status: [
              {
                id: 'status-1',
                category: 'status',
                value: 'planificacion',
                label: 'Planificación',
                sortOrder: 10,
                isActive: true,
              },
              {
                id: 'status-2',
                category: 'status',
                value: 'en_ejecucion',
                label: 'En ejecución',
                sortOrder: 20,
                isActive: true,
              },
              {
                id: 'status-3',
                category: 'status',
                value: 'en_riesgo',
                label: 'En riesgo',
                sortOrder: 30,
                isActive: true,
              },
            ],
          },
        });
      }
    }

    void loadFormOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !projectId) return;
    let active = true;

    async function loadProject() {
      setLoading(true);
      setError('');
      try {
        const response = await apiGet<ProjectDetail>(
          `/projects/${projectId}`,
          getToken() ?? undefined
        );
        if (!active) return;
        setForm({
          name: response.project.name,
          code: response.project.code,
          description: response.project.description ?? '',
          workType: response.project.workType ?? '',
          currentStage: response.project.currentStage ?? '',
          priority: response.project.priority ?? 'media',
          responsibleUserId: response.project.responsible?.id ?? '',
          targetDate: response.project.targetDate ?? '',
          status: response.project.status ?? 'planificacion',
          assignedUserIds: response.project.assignedUsers.map((user) => user.id),
          disciplineIds: response.project.disciplines.map((discipline) => discipline.id),
        });
        setCodeTouched(true);
      } catch {
        const fallback = fallbackDetail[projectId];
        if (active && fallback) {
          setForm({
            name: fallback.project.name,
            code: fallback.project.code,
            description: fallback.project.description ?? '',
            workType: fallback.project.workType ?? '',
            currentStage: fallback.project.currentStage ?? '',
            priority: fallback.project.priority ?? 'media',
            responsibleUserId: fallback.project.responsible?.id ?? '',
            targetDate: fallback.project.targetDate ?? '',
            status: fallback.project.status ?? 'planificacion',
            assignedUserIds: fallback.project.assignedUsers.map((user) => user.id),
            disciplineIds: fallback.project.disciplines.map((discipline) => discipline.id),
          });
          setCodeTouched(true);
          setError('No fue posible cargar la API; se habilitó el formulario con datos locales.');
        } else if (active) {
          setError('No fue posible cargar el proyecto para editar.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProject();
    return () => {
      active = false;
    };
  }, [mode, projectId]);

  useEffect(() => {
    if (mode !== 'create' || codeTouched) return;
    setForm((current) => {
      const nextCode = generateProjectCode(current.name);
      return current.code === nextCode ? current : { ...current, code: nextCode };
    });
  }, [codeTouched, form.name, mode]);

  const filteredUsers = useMemo(() => {
    const needle = responsibleSearch.trim().toLowerCase();
    if (!needle) return formOptions.users;
    return formOptions.users.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(needle)
    );
  }, [formOptions.users, responsibleSearch]);

  async function submit() {
    if (!form.name.trim() || !form.code.trim()) {
      setError('Completa al menos el nombre y el código del proyecto.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      assignedUserIds: mode === 'create' ? [] : form.assignedUserIds,
      disciplineIds: form.disciplineIds,
    };

    try {
      if (mode === 'create') {
        const created = await apiPost<ProjectDetail>('/projects', payload, getToken() ?? undefined);
        router.push(`/projects/${created.project.id}`);
        router.refresh();
        return;
      }

      if (!projectId) {
        setError('Falta el identificador del proyecto.');
        return;
      }

      const updated = await apiPatch<ProjectDetail>(
        `/projects/${projectId}`,
        payload,
        getToken() ?? undefined
      );
      router.push(`/projects/${updated.project.id}`);
      router.refresh();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          mode === 'create'
            ? 'No fue posible crear el proyecto.'
            : 'No fue posible actualizar el proyecto.'
        )
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleDiscipline(disciplineId: string) {
    setForm((current) => ({
      ...current,
      disciplineIds: current.disciplineIds.includes(disciplineId)
        ? current.disciplineIds.filter((id) => id !== disciplineId)
        : [...current.disciplineIds, disciplineId],
    }));
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{mode === 'create' ? 'Nuevo proyecto' : 'Editar proyecto'}</h1>
          <p className="muted">
            {mode === 'create'
              ? 'Formulario independiente para alta de proyectos.'
              : 'Formulario independiente para edición, sin compartir estado con el listado.'}
          </p>
        </div>
        <div className="projects-actions">
          <Link
            className="button secondary"
            href={mode === 'create' ? '/projects' : `/projects/${projectId}`}
          >
            Cancelar
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
              <FormField
                label="Nombre"
                value={form.name}
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              />
              <FormField
                label="Código interno"
                value={form.code}
                onChange={(value) => {
                  setCodeTouched(true);
                  setForm((current) => ({ ...current, code: value.toUpperCase() }));
                }}
              />
              <SelectField
                label="Tipo de obra"
                value={form.workType}
                onChange={(value) => setForm((current) => ({ ...current, workType: value }))}
                options={formOptions.catalogs.workType.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <SelectField
                label="Etapa actual"
                value={form.currentStage}
                onChange={(value) => setForm((current) => ({ ...current, currentStage: value }))}
                options={formOptions.catalogs.currentStage.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <SelectField
                label="Prioridad"
                value={form.priority}
                onChange={(value) => setForm((current) => ({ ...current, priority: value }))}
                options={formOptions.catalogs.priority.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <SelectField
                label="Estado"
                value={form.status}
                onChange={(value) => setForm((current) => ({ ...current, status: value }))}
                options={formOptions.catalogs.status.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <div className="field">
                <label>Catálogos del proyecto</label>
                <div className="projects-actions">
                  <Link className="button secondary" href="/admin/project-catalogs">
                    Administrar catálogos
                  </Link>
                </div>
              </div>
              <SearchableUserField
                users={filteredUsers}
                value={form.responsibleUserId}
                search={responsibleSearch}
                onSearchChange={setResponsibleSearch}
                onChange={(value) =>
                  setForm((current) => ({ ...current, responsibleUserId: value }))
                }
              />
              <FormField
                label="Fecha objetivo"
                type="date"
                value={form.targetDate}
                onChange={(value) => setForm((current) => ({ ...current, targetDate: value }))}
              />
              <div className="field span-2">
                <label>Disciplinas del proyecto</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 10,
                  }}
                >
                  {formOptions.disciplines.map((discipline) => (
                    <label
                      key={discipline.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        padding: '10px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.disciplineIds.includes(discipline.id)}
                        onChange={() => toggleDiscipline(discipline.id)}
                      />
                      <span>
                        {discipline.code} · {discipline.name}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="projects-actions" style={{ marginTop: 12 }}>
                  <Link className="button secondary" href="/admin/project-disciplines">
                    Administrar disciplinas
                  </Link>
                  {mode === 'edit' ? (
                    <Link className="button secondary" href="/admin/project-users">
                      Administrar usuarios del proyecto
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="field span-2">
                <label>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="projects-actions">
              <Link
                className="button secondary"
                href={mode === 'create' ? '/projects' : `/projects/${projectId}`}
              >
                Volver
              </Link>
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

function FolderTreeView({
  nodes,
  onSelectFolder,
}: {
  nodes: FolderNode[];
  onSelectFolder: (folderId: string) => void;
}) {
  return (
    <div className="folder-tree">
      {nodes.map((node) => (
        <FolderTreeNode key={node.id} node={node} depth={0} onSelectFolder={onSelectFolder} />
      ))}
    </div>
  );
}

function FolderTreeNode({
  node,
  depth,
  onSelectFolder,
}: {
  node: FolderNode;
  depth: number;
  onSelectFolder: (folderId: string) => void;
}) {
  return (
    <>
      <button
        className="folder-tree-node"
        style={{ paddingLeft: 12 + depth * 18 }}
        type="button"
        onClick={() => onSelectFolder(node.id)}
      >
        <span>{node.name}</span>
      </button>
      {node.children.map((child) => (
        <FolderTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          onSelectFolder={onSelectFolder}
        />
      ))}
    </>
  );
}

function SimpleDocumentList({ items }: { items: ProjectDocument[] }) {
  return (
    <div className="simple-document-list">
      {items.map((document) => (
        <div className="simple-document-item" key={document.id}>
          <strong>{document.documentNumber}</strong>
          <span>{document.name}</span>
          <small>
            {normalizeLabel(document.status)} · {document.dueDate ?? 'Sin fecha'}
          </small>
        </div>
      ))}
    </div>
  );
}

function FormField({
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
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SearchableUserField({
  users,
  value,
  search,
  onSearchChange,
  onChange,
}: {
  users: UserOption[];
  value: string;
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>Responsable</label>
      <input
        placeholder="Buscar usuario por nombre o correo"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ marginTop: 8 }}
      >
        <option value="">Selecciona un responsable</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} · {user.email}
          </option>
        ))}
      </select>
    </div>
  );
}
