'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FilePlus2,
  FileCheck2,
  FileText,
  FolderOpen,
  FolderPlus,
  FolderTree,
  History,
  Highlighter,
  Layers3,
  MessageSquareMore,
  MousePointerClick,
  Paintbrush,
  Palette,
  PanelRightOpen,
  PenLine,
  Stamp,
  Search,
  Send,
  Sparkles,
  StickyNote,
  Type,
  ZoomIn,
  ZoomOut,
  Trash2,
  Undo2,
  Upload,
  X,
  UserCircle2
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { hasPermission } from '../../lib/auth';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { PermissionKey } from '../../lib/permissions';

type ProjectOption = { id: string; name: string; code: string };
type DisciplineOption = { id: string; name: string; code: string };
type FolderOption = { id: string; name: string; path: string; parentId?: string; disciplineId?: string };
type UserOption = { id: string; name: string; email: string };
type ProjectMemberOption = {
  id: string;
  userId: string;
  role: string;
  user?: UserOption | null;
};

type Workflow = {
  id: string;
  name: string;
  scopeType: 'global' | 'document_specific';
  requireForPublication: boolean;
};

type ApprovalRequest = {
  id: string;
  status: string;
  requestedAt: string;
  lastActionAt?: string;
  currentStep: { id: string; name: string; stepOrder: number } | null;
  document: { id: string; documentNumber: string; name: string; status: string } | null;
};

type DocumentVersion = {
  id: string;
  revision: string;
  fileName: string;
  fileExtension?: string;
  mimeType: string;
  sizeBytes: number;
  notes?: string;
  createdAt: string;
  uploadedBy?: { id: string; name: string; email: string } | null;
};

type DocumentListItem = {
  id: string;
  name: string;
  documentNumber: string;
  status: string;
  confidentialityLevel: string;
  renewable: boolean;
  renewalFrequency?: 'day' | 'week' | 'month' | 'year' | null;
  dueDate?: string;
  fileExtension?: string;
  sizeBytes?: number;
  projectId: string;
  folderId?: string;
  disciplineId?: string;
  responsibleUserId?: string;
  currentVersionId?: string;
  updatedAt: string;
  createdAt: string;
  project?: { id: string; name: string; code: string };
  folder?: { id: string; name: string } | null;
  discipline?: { id: string; code: string; name: string } | null;
  responsibleUser?: { id: string; name: string; email: string } | null;
};

type DocumentDetail = DocumentListItem & {
  currentVersion: DocumentVersion | null;
  preview: { available: boolean; mimeType: string | null; url: string | null };
  metadata: Array<{ id: string; metaKey: string; metaValue?: string; valueType: string }>;
  versions: DocumentVersion[];
  comments: Array<{ id: string; body: string; createdAt: string; author: { id: string; name: string; email: string } | null }>;
  audit: Array<{ id: string; action: string; createdAt: string; actorId?: string; beforeState?: unknown; afterState?: unknown }>;
};

type FilePayload = {
  fileName: string;
  mimeType: string;
  base64Content: string;
  sizeBytes: number;
};

type UploadForm = {
  name: string;
  documentNumber: string;
  projectId: string;
  folderId: string;
  disciplineId: string;
  confidentialityLevel: string;
  renewable: boolean;
  renewalFrequency: '' | 'day' | 'week' | 'month' | 'year';
  dueDate: string;
  responsibleUserId: string;
  status: string;
  revision: string;
  notes: string;
};

type ReviewDraft = {
  stamp: string;
  category: string;
  severity: string;
  page: string;
  location: string;
  actionRequired: string;
  checklist: string[];
  note: string;
};

type ReviewAnnotation = {
  id: string;
  kind: 'comment' | 'text' | 'draw' | 'highlight' | 'stamp';
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  stamp?: string;
  path?: Array<{ x: number; y: number }>;
  replies?: Array<{ id: string; text: string; createdAt: string }>;
  createdAt: string;
};

type SavedReviewPayload = {
  versionId: string | null;
  annotations: ReviewAnnotation[];
};

type ReviewPageAsset = {
  pageIndex: number;
  width: number;
  height: number;
  imageUrl: string;
};

const emptyUploadForm: UploadForm = {
  name: '',
  documentNumber: '',
  projectId: '',
  folderId: '',
  disciplineId: '',
  confidentialityLevel: 'internal',
  renewable: false,
  renewalFrequency: '',
  dueDate: '',
  responsibleUserId: '',
  status: 'draft',
  revision: 'A',
  notes: ''
};

const reviewChecklistOptions = ['Alcance', 'Normativa', 'Coordinacion', 'Cantidades', 'Firma y sello', 'Fechas', 'Version vigente'];
const reviewStampOptions = ['Aprobado', 'Aprobado con comentarios', 'Requiere correccion', 'Rechazado', 'Informativo'];

const emptyReviewDraft: ReviewDraft = {
  stamp: 'Requiere correccion',
  category: 'Observacion',
  severity: 'media',
  page: '',
  location: '',
  actionRequired: '',
  checklist: [],
  note: ''
};

const reviewToolOptions = [
  { value: 'comment', label: 'Comentario', help: 'Haz click en el archivo para marcar el punto y luego escribe la observacion.' },
  { value: 'text', label: 'Texto', help: 'Haz click en el archivo y escribe texto literal dentro del documento.' },
  { value: 'draw', label: 'Trazo', help: 'Mantén presionado y dibuja libremente sobre el documento.' },
  { value: 'highlight', label: 'Resaltado', help: 'Arrastra para marcar un bloque o una zona importante.' },
  { value: 'stamp', label: 'Sello', help: 'Elige el sello y colocalo con un click.' }
] as const;

const reviewColorOptions = [
  { value: '#b91c1c', label: 'Rojo' },
  { value: '#ea580c', label: 'Naranja' },
  { value: '#ca8a04', label: 'Amarillo' },
  { value: '#15803d', label: 'Verde' },
  { value: '#0369a1', label: 'Azul' },
  { value: '#7c3aed', label: 'Morado' }
] as const;

function renderReviewToolIcon(tool: (typeof reviewToolOptions)[number]['value']) {
  if (tool === 'comment') return <MessageSquareMore size={16} />;
  if (tool === 'text') return <Type size={16} />;
  if (tool === 'draw') return <PenLine size={16} />;
  if (tool === 'highlight') return <Highlighter size={16} />;
  return <Stamp size={16} />;
}

function buildAnnotationSignature(items: ReviewAnnotation[]) {
  return JSON.stringify(
    [...items]
      .map((item) => ({
        ...item,
        path: item.path?.map((point) => ({ x: Number(point.x.toFixed(4)), y: Number(point.y.toFixed(4)) }))
      }))
      .sort((left, right) => left.id.localeCompare(right.id))
  );
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('holocron_token');
}

function normalizeLabel(value?: string | null) {
  if (!value) return 'Sin definir';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSize(size?: number) {
  if (!size) return 'Sin tamaño';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
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
    sizeBytes: file.size
  };
}

async function fetchProtectedBlob(path: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}${path}`, {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
  });

  if (!response.ok) {
    throw new Error('No fue posible descargar el archivo');
  }

  return response.blob();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function mapMembersToUsers(members: ProjectMemberOption[]) {
  return members
    .map((member) => member.user)
    .filter((user): user is UserOption => Boolean(user))
    .map((user) => ({ id: user.id, name: user.name, email: user.email }));
}

function renewalFrequencyLabel(value?: string | null) {
  switch (value) {
    case 'day':
      return 'Cada día';
    case 'week':
      return 'Cada semana';
    case 'month':
      return 'Cada mes';
    case 'year':
      return 'Cada año';
    default:
      return 'Sin periodicidad';
  }
}

function buildReviewComment(review: ReviewDraft) {
  return [
    '[REVIEW]',
    `Sello: ${review.stamp}`,
    `Categoria: ${review.category}`,
    `Severidad: ${review.severity}`,
    `Pagina: ${review.page || 'Sin pagina'}`,
    `Ubicacion: ${review.location || 'Sin ubicacion'}`,
    `Checklist: ${review.checklist.length ? review.checklist.join(', ') : 'Sin checklist'}`,
    `Accion: ${review.actionRequired || 'Sin accion definida'}`,
    'Nota:',
    review.note.trim()
  ].join('\n');
}

function parseReviewComment(body: string) {
  if (!body.startsWith('[REVIEW]')) return null;

  const field = (label: string) => body.match(new RegExp(`${label}:\\s*(.*)`))?.[1]?.trim() ?? '';
  const checklist = field('Checklist');
  const noteIndex = body.indexOf('Nota:');

  return {
    stamp: field('Sello'),
    category: field('Categoria'),
    severity: field('Severidad'),
    page: field('Pagina'),
    location: field('Ubicacion'),
    actionRequired: field('Accion'),
    checklist: checklist && checklist !== 'Sin checklist' ? checklist.split(',').map((item) => item.trim()).filter(Boolean) : [],
    note: noteIndex >= 0 ? body.slice(noteIndex + 'Nota:'.length).trim() : ''
  };
}

function buildAnnotationComment(payload: SavedReviewPayload) {
  return `[ANNOTATION_SET]\n${JSON.stringify(payload)}`;
}

function parseAnnotationComment(body: string) {
  if (!body.startsWith('[ANNOTATION_SET]')) return null;

  try {
    return JSON.parse(body.slice('[ANNOTATION_SET]\n'.length)) as SavedReviewPayload;
  } catch {
    return null;
  }
}

function StatusPill({ status }: { status: string }) {
  const className = status === 'approved' || status === 'published' ? 'success' : status === 'expired' || status === 'rejected' ? 'danger' : 'warning';
  return <span className={`pill ${className}`}>{normalizeLabel(status)}</span>;
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecciona'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function QuickMetric({ icon: Icon, label, value }: { icon: typeof FilePlus2; label: string; value: number }) {
  return (
    <article className="card span-3 project-metric info">
      <Icon size={20} />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

type ExplorerPreset = 'all' | 'pending' | 'renewable' | 'recent' | 'unfiled';
type DashboardExplorerPreset = ExplorerPreset | 'approved' | 'draft' | 'inReview' | 'expired' | 'expiring';

type FolderDraft = {
  name: string;
  disciplineId: string;
};

const emptyFolderDraft: FolderDraft = {
  name: '',
  disciplineId: ''
};

function sanitizeFolderName(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function validateFolderName(name: string) {
  const sanitized = sanitizeFolderName(name);

  if (!sanitized) {
    return 'Escribe un nombre para la carpeta.';
  }

  if (sanitized.length < 3) {
    return 'Usa al menos 3 caracteres para que la carpeta sea identificable.';
  }

  if (sanitized.length > 36) {
    return 'Mantén el nombre debajo de 36 caracteres para conservar rutas legibles.';
  }

  if (!/^[A-Za-z0-9 _-]+$/.test(sanitized)) {
    return 'Solo se permiten letras, números, espacios, guion y guion bajo.';
  }

  return '';
}

function buildFolderChildrenMap(folders: FolderOption[]) {
  return folders.reduce<Record<string, FolderOption[]>>((accumulator, folder) => {
    const key = folder.parentId ?? 'root';
    accumulator[key] ??= [];
    accumulator[key].push(folder);
    return accumulator;
  }, {});
}

function isFolderInside(folder: FolderOption, selectedFolderId: string, folderMap: Map<string, FolderOption>) {
  if (!selectedFolderId) return true;
  if (folder.id === selectedFolderId) return true;

  let currentParentId = folder.parentId;
  while (currentParentId) {
    if (currentParentId === selectedFolderId) return true;
    currentParentId = folderMap.get(currentParentId)?.parentId;
  }

  return false;
}

function getFolderBreadcrumbs(folderId: string, folderMap: Map<string, FolderOption>) {
  if (!folderId) return [];

  const chain: FolderOption[] = [];
  let current = folderMap.get(folderId);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? folderMap.get(current.parentId) : undefined;
  }

  return chain;
}

function normalizeExplorerPreset(value: string | null): DashboardExplorerPreset {
  if (value === 'pending' || value === 'renewable' || value === 'recent' || value === 'unfiled' || value === 'approved' || value === 'draft' || value === 'inReview' || value === 'expired' || value === 'expiring') {
    return value;
  }
  return 'all';
}

function isPastOrToday(value?: string) {
  if (!value) return false;
  const target = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target.getTime() <= today.getTime();
}

function isWithinNextDays(value: string | undefined, days: number) {
  if (!value) return false;
  const target = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);
  return target.getTime() > today.getTime() && target.getTime() <= limit.getTime();
}

export function DocumentsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProjectId = searchParams.get('projectId') ?? '';
  const queryPreset = normalizeExplorerPreset(searchParams.get('preset'));
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(queryProjectId);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<DashboardExplorerPreset>(queryPreset);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState<FolderDraft>(emptyFolderDraft);
  const [folderSaving, setFolderSaving] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canManageFolders = hasPermission(PermissionKey.ProjectsManage);

  useEffect(() => {
    setSelectedProjectId(queryProjectId);
  }, [queryProjectId]);

  useEffect(() => {
    setSelectedPreset(queryPreset);
  }, [queryPreset]);

  useEffect(() => {
    let active = true;

    async function loadCatalogs() {
      try {
        const [projectsResponse, disciplinesResponse] = await Promise.all([
          apiGet<ProjectOption[]>('/projects', getToken() ?? undefined),
          apiGet<DisciplineOption[]>('/folders/disciplines', getToken() ?? undefined)
        ]);

        if (!active) return;

        setProjects(projectsResponse);
        setDisciplines(disciplinesResponse);

        if (!queryProjectId && projectsResponse[0]) {
          setSelectedProjectId(projectsResponse[0].id);
        }
      } catch (catalogError) {
        if (!active) return;
        setError(getErrorMessage(catalogError, 'No fue posible cargar los proyectos o disciplinas.'));
      }
    }

    void loadCatalogs();
    return () => {
      active = false;
    };
  }, [queryProjectId]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (selectedProjectId) query.set('projectId', selectedProjectId);
        const [documentsResponse, foldersResponse] = await Promise.all([
          apiGet<DocumentListItem[]>(`/documents${query.toString() ? `?${query.toString()}` : ''}`, getToken() ?? undefined),
          selectedProjectId ? apiGet<FolderOption[]>(`/folders?projectId=${encodeURIComponent(selectedProjectId)}`, getToken() ?? undefined) : Promise.resolve([])
        ]);
        if (!active) return;
        setDocuments(documentsResponse);
        setFolders(foldersResponse);
        setSelectedDocumentId((current) => current || documentsResponse[0]?.id || '');
        setError('');
      } catch (error) {
        if (!active) return;
        setDocuments([]);
        setFolders([]);
        setError(getErrorMessage(error, 'No fue posible cargar los documentos.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [search, selectedProjectId]);

  useEffect(() => {
    setSelectedFolderId('');
    setSelectedDocumentId('');
    setShowCreateFolder(false);
    setShowProjectPicker(false);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!documents.some((item) => item.id === selectedDocumentId)) {
      setSelectedDocumentId(documents[0]?.id ?? '');
    }
  }, [documents, selectedDocumentId]);

  useEffect(() => {
    if (selectedFolderId && !folders.some((folder) => folder.id === selectedFolderId)) {
      setSelectedFolderId('');
    }
  }, [folders, selectedFolderId]);

  useEffect(() => {
    if (selectedProjectId === queryProjectId) return;

    const params = new URLSearchParams(searchParams.toString());
    if (selectedProjectId) {
      params.set('projectId', selectedProjectId);
    } else {
      params.delete('projectId');
    }
    if (selectedPreset !== 'all') {
      params.set('preset', selectedPreset);
    } else {
      params.delete('preset');
    }
    router.replace(`/documents${params.toString() ? `?${params.toString()}` : ''}`);
  }, [queryProjectId, router, searchParams, selectedPreset, selectedProjectId]);

  const folderMap = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);
  const folderChildrenMap = useMemo(() => buildFolderChildrenMap(folders), [folders]);
  const folderBreadcrumbs = useMemo(() => getFolderBreadcrumbs(selectedFolderId, folderMap), [folderMap, selectedFolderId]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((item) => {
      if (selectedPreset === 'pending' && item.status !== 'pending_approval') return false;
      if (selectedPreset === 'renewable' && !item.renewable) return false;
      if (selectedPreset === 'unfiled' && item.folderId) return false;
      if (selectedPreset === 'approved' && !['approved', 'published'].includes(item.status)) return false;
      if (selectedPreset === 'draft' && item.status !== 'draft') return false;
      if (selectedPreset === 'inReview' && !['in_review', 'pending_approval'].includes(item.status)) return false;
      if (selectedPreset === 'expired' && !(item.status === 'expired' || isPastOrToday(item.dueDate))) return false;
      if (selectedPreset === 'expiring' && !isWithinNextDays(item.dueDate, 7)) return false;
      if (selectedPreset === 'recent') {
        const updatedAt = new Date(item.updatedAt).getTime();
        const threeDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 3;
        if (updatedAt < threeDaysAgo) return false;
      }

      if (!selectedFolderId) return true;
      if (!item.folderId) return false;
      const folder = folderMap.get(item.folderId);
      return folder ? isFolderInside(folder, selectedFolderId, folderMap) : false;
    });
  }, [documents, folderMap, selectedFolderId, selectedPreset]);

  const selectedDocument = useMemo(
    () => filteredDocuments.find((item) => item.id === selectedDocumentId) ?? filteredDocuments[0] ?? null,
    [filteredDocuments, selectedDocumentId]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? documents.find((item) => item.projectId === selectedProjectId)?.project ?? null,
    [documents, projects, selectedProjectId]
  );

  const projectCount = useMemo(() => new Set(documents.map((item) => item.projectId)).size, [documents]);
  const rootFolders = useMemo(
    () => [...(folderChildrenMap.root ?? [])].sort((left, right) => left.name.localeCompare(right.name)),
    [folderChildrenMap]
  );
  const siblingFolders = useMemo(() => {
    const parentKey = selectedFolderId ? selectedFolderId : 'root';
    return (folderChildrenMap[parentKey] ?? []).map((folder) => folder.name.toLowerCase());
  }, [folderChildrenMap, selectedFolderId]);

  const folderRuleError = useMemo(() => validateFolderName(folderDraft.name), [folderDraft.name]);
  const folderDuplicateError = useMemo(() => {
    const normalized = sanitizeFolderName(folderDraft.name).toLowerCase();
    if (!normalized) return '';
    return siblingFolders.includes(normalized) ? 'Ya existe una carpeta con este nombre en el mismo nivel.' : '';
  }, [folderDraft.name, siblingFolders]);
  const folderPathPreview = useMemo(() => {
    const parts = folderBreadcrumbs.map((item) => item.name);
    const nextName = sanitizeFolderName(folderDraft.name);
    if (nextName) parts.push(nextName);
    return parts.join(' / ') || 'Raíz del proyecto';
  }, [folderBreadcrumbs, folderDraft.name]);

  const projectStats = useMemo(
    () => [
      { label: 'Archivos visibles', value: filteredDocuments.length, icon: FilePlus2 },
      { label: 'Carpetas', value: folders.length, icon: Layers3 },
      { label: 'Pendientes', value: documents.filter((item) => item.status === 'pending_approval').length, icon: Send },
      { label: 'Renovables', value: documents.filter((item) => item.renewable).length, icon: Clock3 }
    ],
    [documents, filteredDocuments.length, folders.length]
  );

  const smartPresets: Array<{ id: DashboardExplorerPreset; label: string; hint: string; count: number }> = [
    { id: 'all', label: 'Todo', hint: 'Vista completa del proyecto', count: documents.length },
    {
      id: 'pending',
      label: 'Pendientes',
      hint: 'Documentos esperando aprobación',
      count: documents.filter((item) => item.status === 'pending_approval').length
    },
    {
      id: 'inReview',
      label: 'En revisión',
      hint: 'Documentos en revisión o por aprobar',
      count: documents.filter((item) => ['in_review', 'pending_approval'].includes(item.status)).length
    },
    {
      id: 'approved',
      label: 'Aprobados',
      hint: 'Listos o publicados',
      count: documents.filter((item) => ['approved', 'published'].includes(item.status)).length
    },
    { id: 'draft', label: 'Borradores', hint: 'Aún sin cerrar versión', count: documents.filter((item) => item.status === 'draft').length },
    {
      id: 'expired',
      label: 'Vencidos',
      hint: 'Fuera de fecha objetivo',
      count: documents.filter((item) => item.status === 'expired' || isPastOrToday(item.dueDate)).length
    },
    {
      id: 'expiring',
      label: 'Próximos a vencer',
      hint: 'Vencen en los próximos 7 días',
      count: documents.filter((item) => isWithinNextDays(item.dueDate, 7)).length
    },
    { id: 'renewable', label: 'Renovables', hint: 'Archivos con ciclo de renovación', count: documents.filter((item) => item.renewable).length },
    {
      id: 'recent',
      label: 'Recientes',
      hint: 'Cambios de los últimos 3 días',
      count: documents.filter((item) => new Date(item.updatedAt).getTime() >= Date.now() - 1000 * 60 * 60 * 24 * 3).length
    },
    { id: 'unfiled', label: 'Sin carpeta', hint: 'Pendientes por ordenar', count: documents.filter((item) => !item.folderId).length }
  ];

  const filteredProjects = useMemo(() => {
    const normalized = projectSearch.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) => `${project.code} ${project.name}`.toLowerCase().includes(normalized));
  }, [projectSearch, projects]);

  function openDocument(documentId: string) {
    router.push(`/documents/${documentId}`);
  }

  function chooseProject(projectId: string) {
    setSelectedProjectId(projectId);
    setProjectSearch('');
    setShowProjectPicker(false);
  }

  async function createFolder() {
    if (!selectedProjectId || folderRuleError || folderDuplicateError) return;

    setFolderSaving(true);
    try {
      const created = await apiPost<FolderOption>(
        '/folders',
        {
          projectId: selectedProjectId,
          parentId: selectedFolderId || undefined,
          disciplineId: folderDraft.disciplineId || undefined,
          name: sanitizeFolderName(folderDraft.name)
        },
        getToken() ?? undefined
      );

      setFolders((current) => [...current, created].sort((left, right) => left.path.localeCompare(right.path)));
      setSelectedFolderId(created.id);
      setFolderDraft(emptyFolderDraft);
      setShowCreateFolder(false);
      setError('');
    } catch (folderError) {
      setError(getErrorMessage(folderError, 'No fue posible crear la carpeta.'));
    } finally {
      setFolderSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{selectedProject ? `Drive documental de ${selectedProject.name}` : 'Drive documental'}</h1>
          <p className="muted">Explora por proyecto, navega carpetas, detecta pendientes y entra al archivo correcto sin perder contexto.</p>
        </div>
        <div className="projects-actions">
          {selectedProjectId ? (
            <Link className="button secondary" href={`/projects/${selectedProjectId}`}>
              Ver proyecto
            </Link>
          ) : null}
          {canManageFolders ? (
            <button className="button secondary" type="button" onClick={() => setShowCreateFolder((current) => !current)} disabled={!selectedProjectId}>
              <FolderPlus size={18} />
              Nueva carpeta
            </button>
          ) : null}
          <Link className="button" href={selectedProjectId ? `/documents/new?projectId=${selectedProjectId}` : '/documents/new'}>
            <Upload size={18} />
            Nuevo documento
          </Link>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <article className="card document-drive-shell" style={{ marginTop: 16 }}>
        <div className="document-drive-toolbar">
          <div className="document-drive-hero">
            <div className="document-drive-project-card">
              <div className="document-preview-badge">
                <Building2 size={16} />
                {selectedProject?.code ?? `${projectCount} proyectos`}
              </div>
              <div>
                <strong>{selectedProject?.name ?? 'Selecciona un proyecto para entrar a su drive'}</strong>
                <p className="muted">
                  {selectedProject
                    ? 'Carpetas, archivos y acciones viven dentro del proyecto. Cambiar de proyecto debe ser una búsqueda, no un dropdown eterno.'
                    : 'Usa el selector compacto para abrir un proyecto específico.'}
                </p>
              </div>
            </div>
            <div className="projects-actions">
              <button className="button secondary" type="button" onClick={() => setShowProjectPicker(true)}>
                <Search size={18} />
                {selectedProject ? 'Cambiar proyecto' : 'Abrir proyecto'}
              </button>
              {selectedProjectId ? (
                <Link className="button secondary" href={`/projects/${selectedProjectId}`}>
                  Ver proyecto
                </Link>
              ) : null}
              {canManageFolders ? (
                <button className="button secondary" type="button" onClick={() => setShowCreateFolder((current) => !current)} disabled={!selectedProjectId}>
                  <FolderPlus size={18} />
                  Nueva carpeta
                </button>
              ) : null}
              <Link className="button" href={selectedProjectId ? `/documents/new?projectId=${selectedProjectId}` : '/documents/new'}>
                <Upload size={18} />
                Nuevo documento
              </Link>
            </div>
          </div>

          <div className="document-drive-toolbar-main">
            <div className="field">
              <label>Buscar en el drive</label>
              <div className="search-input">
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, número, carpeta, disciplina o responsable" />
              </div>
            </div>
          </div>
          <div className="document-drive-breadcrumbs">
            <button className={`document-breadcrumb ${!selectedFolderId ? 'active' : ''}`} type="button" onClick={() => setSelectedFolderId('')}>
              <Building2 size={14} />
              {selectedProject?.code ?? 'Proyecto'}
            </button>
            {folderBreadcrumbs.map((folder) => (
              <button className={`document-breadcrumb ${folder.id === selectedFolderId ? 'active' : ''}`} key={folder.id} type="button" onClick={() => setSelectedFolderId(folder.id)}>
                <ArrowRight size={14} />
                {folder.name}
              </button>
            ))}
          </div>
        </div>

        <div className="document-drive-layout">
          <aside className="document-drive-sidebar">
            <div className="document-drive-sidebar-section">
              <div className="panel-header">
                <h2>Accesos rápidos</h2>
                <span className="pill">{smartPresets.find((preset) => preset.id === selectedPreset)?.count ?? 0}</span>
              </div>
              <div className="document-preset-list">
                {smartPresets.map((preset) => (
                  <button
                    className={`document-preset-card ${selectedPreset === preset.id ? 'active' : ''}`}
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                  >
                    <strong>{preset.label}</strong>
                    <span>{preset.hint}</span>
                    <small>{preset.count} elementos</small>
                  </button>
                ))}
              </div>
              <div className="document-project-stats">
                {projectStats.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div className="document-project-stat" key={metric.label}>
                      <Icon size={16} />
                      <div>
                        <strong>{metric.value}</strong>
                        <small>{metric.label}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="document-drive-sidebar-section">
              <div className="panel-header">
                <h2>Carpetas</h2>
                <span className="pill">{folders.length}</span>
              </div>
              <div className="folder-tree">
                <button className={`folder-tree-node ${!selectedFolderId ? 'active' : ''}`} type="button" onClick={() => setSelectedFolderId('')}>
                  <div>
                    <strong>Raíz del proyecto</strong>
                    <small>Todo lo que cuelga directamente del proyecto</small>
                  </div>
                </button>
                {rootFolders.map((folder) => (
                  <FolderTreeButton
                    childrenMap={folderChildrenMap}
                    currentFolderId={selectedFolderId}
                    folder={folder}
                    key={folder.id}
                    onSelect={setSelectedFolderId}
                  />
                ))}
                {!loading && !rootFolders.length ? <p className="muted">Todavía no hay carpetas creadas en este proyecto.</p> : null}
              </div>
            </div>
          </aside>

          <div className="document-drive-main">
            {showCreateFolder ? (
              <div className="document-folder-creator">
                <div className="panel-header">
                  <h2>Crear carpeta</h2>
                  <span className="pill">{selectedFolderId ? 'Dentro de carpeta actual' : 'Nivel raíz'}</span>
                </div>
                <div className="quick-filters-grid">
                  <TextField
                    label="Nombre"
                    value={folderDraft.name}
                    onChange={(value) => setFolderDraft((current) => ({ ...current, name: value }))}
                    placeholder="Ej. ARC_Planos emitidos"
                  />
                  <SelectField
                    label="Disciplina"
                    value={folderDraft.disciplineId}
                    onChange={(value) => setFolderDraft((current) => ({ ...current, disciplineId: value }))}
                    options={disciplines.map((discipline) => ({ value: discipline.id, label: `${discipline.code} · ${discipline.name}` }))}
                    placeholder="Sin disciplina fija"
                  />
                </div>
                <div className="document-folder-rules">
                  <div className="simple-document-item">
                    <strong>Ruta resultante</strong>
                    <small>{folderPathPreview}</small>
                  </div>
                  <div className="simple-document-item">
                    <strong>Reglas</strong>
                    <small>Solo letras, números, espacios, guion y guion bajo.</small>
                    <small>Máximo 36 caracteres para no romper la lectura del árbol.</small>
                    <small>No se permiten nombres repetidos en el mismo nivel.</small>
                  </div>
                </div>
                {folderRuleError ? <p className="muted">{folderRuleError}</p> : null}
                {!folderRuleError && folderDuplicateError ? <p className="muted">{folderDuplicateError}</p> : null}
                <div className="projects-actions">
                  <button className="button secondary" type="button" onClick={() => setShowCreateFolder(false)}>
                    Cancelar
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => void createFolder()}
                    disabled={folderSaving || Boolean(folderRuleError) || Boolean(folderDuplicateError) || !selectedProjectId}
                  >
                    {folderSaving ? 'Creando...' : 'Guardar carpeta'}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="document-file-grid">
              <div className="panel-header">
                <h2>{selectedFolderId ? `Contenido de ${folderBreadcrumbs[folderBreadcrumbs.length - 1]?.name ?? 'carpeta'}` : 'Archivos del proyecto'}</h2>
                <span className="pill">{loading ? 'Cargando' : `${filteredDocuments.length} visibles`}</span>
              </div>
              <div className="document-file-list">
                {filteredDocuments.map((document) => (
                  <button
                    className={`document-file-card ${selectedDocument?.id === document.id ? 'active' : ''}`}
                    key={document.id}
                    type="button"
                    onClick={() => setSelectedDocumentId(document.id)}
                    onDoubleClick={() => openDocument(document.id)}
                  >
                    <div className="document-file-card-head">
                      <div className="document-file-card-title">
                        <FileText size={18} />
                        <div>
                          <strong>{document.name}</strong>
                          <small>{document.documentNumber}</small>
                        </div>
                      </div>
                      <StatusPill status={document.status} />
                    </div>
                    <div className="document-file-meta">
                      <span>{document.folder?.name ?? 'Sin carpeta'}</span>
                      <span>{document.discipline?.code ?? 'GEN'}</span>
                      <span>{formatSize(document.sizeBytes)}</span>
                    </div>
                    <div className="document-file-meta">
                      <span>{document.responsibleUser?.name ?? 'Sin responsable'}</span>
                      <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <small className="document-file-card-hint">Click para previsualizar. Doble click para abrir.</small>
                  </button>
                ))}
                {!loading && !filteredDocuments.length ? (
                  <div className="preview-empty">
                    <p className="muted">No hay archivos para esta combinación de proyecto, carpeta y filtro rápido.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="document-drive-preview">
            {selectedDocument ? (
              <>
                <div className="document-preview-hero">
                  <div className="document-preview-badge">
                    <FolderOpen size={16} />
                    {selectedDocument.folder?.name ?? 'Sin carpeta'}
                  </div>
                  <h2>{selectedDocument.name}</h2>
                  <p className="muted">{selectedDocument.documentNumber} · {selectedDocument.project?.code ?? selectedDocument.projectId}</p>
                </div>

                <div className="document-preview-summary">
                  <div className="state-card">
                    <span>Estado</span>
                    <strong>{normalizeLabel(selectedDocument.status)}</strong>
                  </div>
                  <div className="state-card">
                    <span>Disciplina</span>
                    <strong>{selectedDocument.discipline?.name ?? 'Sin disciplina'}</strong>
                  </div>
                  <div className="state-card">
                    <span>Responsable</span>
                    <strong>{selectedDocument.responsibleUser?.name ?? 'Sin responsable'}</strong>
                  </div>
                  <div className="state-card">
                    <span>Tamaño</span>
                    <strong>{formatSize(selectedDocument.sizeBytes)}</strong>
                  </div>
                </div>

                <div className="document-preview-actions">
                  <Link className="button" href={`/documents/${selectedDocument.id}`}>
                    <Eye size={16} />
                    Abrir documento
                  </Link>
                </div>

                <div className="document-preview-insights">
                  <div className="simple-document-item">
                    <strong>Ubicación</strong>
                    <small>{selectedDocument.folder?.name ? `${selectedDocument.project?.name ?? 'Proyecto'} / ${selectedDocument.folder.name}` : 'Aún no se asigna a una carpeta'}</small>
                  </div>
                  <div className="simple-document-item">
                    <strong>Movimiento recomendado</strong>
                    <small>
                      {selectedDocument.status === 'pending_approval'
                        ? 'Empújalo a revisión o aprobación para que no se quede atascado.'
                        : selectedDocument.renewable
                          ? 'Tiene ciclo renovable: conviene vigilar su próxima actualización.'
                          : 'Está listo para abrirse o seguir su flujo normal.'}
                    </small>
                  </div>
                  <div className="simple-document-item">
                    <strong>Lectura rápida</strong>
                    <small>{selectedDocument.confidentialityLevel ? `Nivel ${normalizeLabel(selectedDocument.confidentialityLevel)}` : 'Sin clasificación'}</small>
                    <small>{selectedDocument.dueDate ? `Vence el ${formatDate(selectedDocument.dueDate)}` : 'Sin fecha de vencimiento definida'}</small>
                  </div>
                  <div className="simple-document-item">
                    <strong>Acciones</strong>
                    <div className="document-inline-links">
                      <Link href={`/documents/${selectedDocument.id}/review`}>Revisar</Link>
                      <Link href={`/documents/${selectedDocument.id}/version`}>Nueva versión</Link>
                      <Link href={`/documents/${selectedDocument.id}/approval`}>Solicitar aprobación</Link>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="preview-empty">
                <Sparkles size={18} />
                <p className="muted">Selecciona un archivo para ver su ficha rápida y abrirlo en el visor completo.</p>
              </div>
            )}
          </aside>
        </div>
      </article>

      {showProjectPicker ? (
        <div className="document-project-picker">
          <div className="card document-project-picker-card">
            <div className="panel-header">
              <h2>Abrir proyecto</h2>
              <button className="button secondary" type="button" onClick={() => setShowProjectPicker(false)}>
                <X size={16} />
                Cerrar
              </button>
            </div>
            <div className="field">
              <label>Buscar proyecto</label>
              <div className="search-input">
                <Search size={16} />
                <input value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Código o nombre del proyecto" />
              </div>
            </div>
            <div className="document-project-picker-list">
              {filteredProjects.map((project) => (
                <button className="document-project-picker-item" key={project.id} type="button" onClick={() => chooseProject(project.id)}>
                  <div>
                    <strong>{project.name}</strong>
                    <small>{project.code}</small>
                  </div>
                  <ArrowRight size={16} />
                </button>
              ))}
              {!filteredProjects.length ? <p className="muted">No encontramos proyectos con ese criterio.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FolderTreeButton({
  folder,
  currentFolderId,
  onSelect,
  childrenMap
}: {
  folder: FolderOption;
  currentFolderId: string;
  onSelect: (folderId: string) => void;
  childrenMap: Record<string, FolderOption[]>;
}) {
  const children = [...(childrenMap[folder.id] ?? [])].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="folder-tree-branch">
      <button className={`folder-tree-node ${currentFolderId === folder.id ? 'active' : ''}`} type="button" onClick={() => onSelect(folder.id)}>
        <div>
          <strong>{folder.name}</strong>
          <small>{folder.path}</small>
        </div>
      </button>
      {children.length ? (
        <div className="folder-tree-children">
          {children.map((child) => (
            <FolderTreeButton childrenMap={childrenMap} currentFolderId={currentFolderId} folder={child} key={child.id} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DocumentForm({
  mode,
  documentId
}: {
  mode: 'create' | 'version';
  documentId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetProjectId = searchParams.get('projectId') ?? '';
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineOption[]>([]);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [form, setForm] = useState<UploadForm>(emptyUploadForm);
  const [file, setFile] = useState<FilePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadBase() {
      try {
        const [projectsResponse, disciplinesResponse] = await Promise.all([
          apiGet<ProjectOption[]>('/projects', getToken() ?? undefined),
          apiGet<DisciplineOption[]>('/folders/disciplines', getToken() ?? undefined)
        ]);
        if (!active) return;
        setProjects(projectsResponse);
        setDisciplines(disciplinesResponse);
        if (mode === 'create') {
          const initialProjectId =
            (presetProjectId && projectsResponse.some((project) => project.id === presetProjectId) ? presetProjectId : '') ||
            projectsResponse[0]?.id ||
            '';
          if (initialProjectId) {
            setForm((current) => ({ ...current, projectId: current.projectId || initialProjectId }));
          }
        }
      } catch {
        if (!active) return;
        setError('No fue posible cargar catálogos para el formulario.');
      }
    }

    void loadBase();
    return () => {
      active = false;
    };
  }, [mode, presetProjectId]);

  useEffect(() => {
    let active = true;
    if (mode !== 'version' || !documentId) return;

    async function loadDetail() {
      try {
        const response = await apiGet<DocumentDetail>(`/documents/${documentId}`, getToken() ?? undefined);
        if (!active) return;
        setDetail(response);
        setForm({
          ...emptyUploadForm,
          name: response.name,
          documentNumber: response.documentNumber,
          projectId: response.projectId,
          folderId: response.folderId ?? '',
          disciplineId: response.disciplineId ?? '',
          confidentialityLevel: response.confidentialityLevel,
          renewable: response.renewable,
          renewalFrequency: response.renewalFrequency ?? '',
          dueDate: response.dueDate ?? '',
          responsibleUserId: response.responsibleUserId ?? '',
          status: response.status,
          revision: response.currentVersion?.revision ? `${response.currentVersion.revision}-1` : 'B',
          notes: ''
        });
      } catch {
        if (!active) return;
        setError('No fue posible cargar el documento para subir la nueva versión.');
      }
    }

    void loadDetail();
    return () => {
      active = false;
    };
  }, [documentId, mode]);

  useEffect(() => {
    let active = true;
    if (!form.projectId) {
      setFolders([]);
      setUsers([]);
      return;
    }

    async function loadProjectData() {
      try {
        const [folderResponse, membersResponse] = await Promise.all([
          apiGet<FolderOption[]>(`/folders?projectId=${encodeURIComponent(form.projectId)}`, getToken() ?? undefined),
          apiGet<ProjectMemberOption[]>(`/projects/${form.projectId}/users`, getToken() ?? undefined)
        ]);
        if (!active) return;
        setFolders(folderResponse);
        setUsers(mapMembersToUsers(membersResponse));
      } catch {
        try {
          const fallbackUsers = await apiGet<UserOption[]>('/users', getToken() ?? undefined);
          if (!active) return;
          setUsers(fallbackUsers);
        } catch {
          if (!active) return;
          setUsers([]);
        }
        if (active) {
          setFolders([]);
        }
      }
    }

    void loadProjectData();
    return () => {
      active = false;
    };
  }, [form.projectId]);

  async function handleFileChange(fileList: FileList | null) {
    const next = fileList?.[0];
    if (!next) return;
    const payload = await fileToPayload(next);
    setFile(payload);
    if (mode === 'create' && !form.name) {
      setForm((current) => ({ ...current, name: next.name.replace(/\.[^.]+$/, '') }));
    }
  }

  async function submit() {
    if (!file) {
      setError('Selecciona un archivo antes de guardar.');
      return;
    }
    if (mode === 'create' && (!form.projectId || !form.name || !form.documentNumber)) {
      setError('Completa proyecto, nombre y número documental.');
      return;
    }
    if (mode === 'create' && !form.folderId) {
      setError('Selecciona la carpeta donde vivirá el documento.');
      return;
    }
    if (form.renewable && !form.renewalFrequency) {
      setError('Selecciona cada cuánto se renueva el documento.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const payload = {
          ...form,
          renewalFrequency: form.renewable ? form.renewalFrequency : undefined,
          fileName: file.fileName,
          mimeType: file.mimeType,
          base64Content: file.base64Content,
          sizeBytes: file.sizeBytes
        };

        let created: DocumentDetail;
        try {
          created = await apiPost<DocumentDetail>('/documents', payload, getToken() ?? undefined);
        } catch (error) {
          if (error instanceof Error && error.message.includes('renewalFrequency should not exist')) {
            const { renewalFrequency, ...legacyPayload } = payload;
            created = await apiPost<DocumentDetail>('/documents', legacyPayload, getToken() ?? undefined);
          } else {
            throw error;
          }
        }

        router.push(`/documents/${created.id}`);
        router.refresh();
        return;
      }

      if (!documentId) return;

      await apiPost<DocumentDetail>(
        `/documents/${documentId}/versions`,
        {
          fileName: file.fileName,
          mimeType: file.mimeType,
          base64Content: file.base64Content,
          sizeBytes: file.sizeBytes,
          revision: form.revision,
          notes: form.notes
        },
        getToken() ?? undefined
      );
      router.push(`/documents/${documentId}`);
      router.refresh();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          mode === 'create' ? 'No fue posible crear el documento.' : 'No fue posible subir la nueva versión.'
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const visibleFolders = useMemo(() => {
    if (!form.disciplineId) return folders;
    return folders.filter((folder) => !folder.disciplineId || folder.disciplineId === form.disciplineId);
  }, [folders, form.disciplineId]);

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{mode === 'create' ? 'Nuevo documento' : 'Nueva versión'}</h1>
          <p className="muted">
            {mode === 'create'
              ? 'Alta documental amarrada a proyecto, carpeta, disciplina y responsables.'
              : `Sube una nueva revisión para ${detail?.documentNumber ?? 'el documento seleccionado'}.`}
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={mode === 'create' ? (form.projectId ? `/documents?projectId=${form.projectId}` : '/documents') : `/documents/${documentId}`}>
            Volver
          </Link>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <article className="card">
        <div className="quick-filters-grid">
          {mode === 'create' ? (
            <>
              <SelectField
                label="Proyecto"
                value={form.projectId}
                onChange={(value) => setForm((current) => ({ ...current, projectId: value, folderId: '', responsibleUserId: '' }))}
                options={projects.map((project) => ({ value: project.id, label: `${project.code} · ${project.name}` }))}
              />
              <TextField label="Documento" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
              <TextField
                label="Número documental"
                value={form.documentNumber}
                onChange={(value) => setForm((current) => ({ ...current, documentNumber: value }))}
              />
              <SelectField
                label="Disciplina"
                value={form.disciplineId}
                onChange={(value) => setForm((current) => ({ ...current, disciplineId: value, folderId: '' }))}
                options={disciplines.map((discipline) => ({ value: discipline.id, label: `${discipline.code} · ${discipline.name}` }))}
              />
              <SelectField
                label="Carpeta"
                value={form.folderId}
                onChange={(value) => setForm((current) => ({ ...current, folderId: value }))}
                options={visibleFolders.map((folder) => ({ value: folder.id, label: folder.path }))}
                placeholder={visibleFolders.length ? 'Selecciona la carpeta del proyecto' : 'No hay carpetas disponibles'}
              />
              <SelectField
                label="Responsable"
                value={form.responsibleUserId}
                onChange={(value) => setForm((current) => ({ ...current, responsibleUserId: value }))}
                options={users.map((user) => ({ value: user.id, label: `${user.name} · ${user.email}` }))}
                placeholder={users.length ? 'Selecciona' : 'Sin usuarios disponibles'}
              />
              <SelectField
                label="Confidencialidad"
                value={form.confidentialityLevel}
                onChange={(value) => setForm((current) => ({ ...current, confidentialityLevel: value }))}
                options={[
                  { value: 'public', label: 'Público' },
                  { value: 'internal', label: 'Interno' },
                  { value: 'confidential', label: 'Confidencial' },
                  { value: 'restricted', label: 'Restringido' }
                ]}
              />
              <SelectField
                label="Estado inicial"
                value={form.status}
                onChange={(value) => setForm((current) => ({ ...current, status: value }))}
                options={[
                  { value: 'draft', label: 'Borrador' },
                  { value: 'in_review', label: 'En revisión' },
                  { value: 'pending_approval', label: 'Pendiente de aprobación' },
                  { value: 'approved', label: 'Aprobado' }
                ]}
              />
              <TextField
                label="Fecha de vencimiento"
                type="date"
                value={form.dueDate}
                onChange={(value) => setForm((current) => ({ ...current, dueDate: value }))}
              />
            </>
          ) : null}

          <TextField label="Revisión" value={form.revision} onChange={(value) => setForm((current) => ({ ...current, revision: value }))} />
          <div className="field">
            <label>Archivo</label>
            <input type="file" onChange={(event) => void handleFileChange(event.target.files)} />
          </div>
          <div className="field">
            <label>Renovable</label>
            <select
              value={form.renewable ? 'yes' : 'no'}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  renewable: event.target.value === 'yes',
                  renewalFrequency: event.target.value === 'yes' ? current.renewalFrequency : ''
                }))
              }
            >
              <option value="no">No</option>
              <option value="yes">Sí</option>
            </select>
          </div>
          {form.renewable ? (
            <SelectField
              label="Se renueva"
              value={form.renewalFrequency}
              onChange={(value) => setForm((current) => ({ ...current, renewalFrequency: value as UploadForm['renewalFrequency'] }))}
              options={[
                { value: 'day', label: 'Cada día' },
                { value: 'week', label: 'Cada semana' },
                { value: 'month', label: 'Cada mes' },
                { value: 'year', label: 'Cada año' }
              ]}
            />
          ) : null}
          <div className="field span-2">
            <label>Notas</label>
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
        </div>
        {file ? <p className="muted">Archivo seleccionado: {file.fileName} · {formatSize(file.sizeBytes)}</p> : null}
        <div className="projects-actions">
          <button className="button" type="button" onClick={() => void submit()} disabled={saving}>
            {saving ? 'Guardando...' : mode === 'create' ? 'Crear documento' : 'Subir versión'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function DocumentCreatePage() {
  return <DocumentForm mode="create" />;
}

export function DocumentVersionPage() {
  const params = useParams<{ id: string }>();
  return <DocumentForm mode="version" documentId={params.id} />;
}

export function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalRequest[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canCreate = hasPermission(PermissionKey.DocumentsCreate);
  const canEdit = hasPermission(PermissionKey.DocumentsEdit);
  const canDownload = hasPermission(PermissionKey.DocumentsDownload);
  const canApprove = hasPermission(PermissionKey.DocumentsApprove);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await apiGet<DocumentDetail>(`/documents/${params.id}`, getToken() ?? undefined);
        if (!active) return;
        setDetail(response);
        setError('');
      } catch {
        if (!active) return;
        setError('No fue posible cargar el documento.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    let active = true;

    apiGet<ApprovalRequest[]>(`/approvals/requests/history?documentId=${encodeURIComponent(params.id)}`, getToken() ?? undefined)
      .then((response) => {
        if (active) setApprovalHistory(response);
      })
      .catch(() => {
        if (active) setApprovalHistory([]);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    let objectUrl = '';
    if (!detail?.preview.available) {
      setPreviewUrl('');
      setPreviewError('');
      return;
    }

    fetchProtectedBlob(`/documents/${detail.id}/content`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setPreviewError('');
      })
      .catch(() => {
        setPreviewUrl('');
        setPreviewError('No fue posible cargar la vista previa del archivo.');
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [detail?.id, detail?.preview.available]);

  async function refreshDetail() {
    const response = await apiGet<DocumentDetail>(`/documents/${params.id}`, getToken() ?? undefined);
    setDetail(response);
  }

  async function saveComment() {
    if (!comment.trim()) return;
    try {
      const updated = await apiPost<DocumentDetail>(`/documents/${params.id}/comments`, { body: comment }, getToken() ?? undefined);
      setDetail(updated);
      setComment('');
      setError('');
    } catch {
      setError('No fue posible registrar el comentario.');
    }
  }

  async function updateStatus(status: string) {
    try {
      const updated = await apiPatch<DocumentDetail>(`/documents/${params.id}`, { status }, getToken() ?? undefined);
      setDetail(updated);
      setError('');
    } catch {
      setError('No fue posible actualizar el estado.');
    }
  }

  async function downloadCurrent() {
    if (!detail) return;
    try {
      const blob = await fetchProtectedBlob(`/documents/${detail.id}/download`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = detail.currentVersion?.fileName ?? `${detail.documentNumber}.${detail.fileExtension ?? 'bin'}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No fue posible descargar el archivo.');
    }
  }

  if (loading) {
    return (
      <section className="projects-workspace">
        <article className="card muted">Cargando documento...</article>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="projects-workspace">
        <article className="card muted">{error || 'Documento no disponible.'}</article>
      </section>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{detail.documentNumber}</h1>
          <p className="muted">{detail.name}</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/documents">
            Volver al listado
          </Link>
          <Link className="button secondary" href={`/documents/${detail.id}/review`}>
            Revisar documento
          </Link>
          {canCreate ? (
            <Link className="button secondary" href={`/documents/${detail.id}/version`}>
              <History size={18} />
              Nueva versión
            </Link>
          ) : null}
          {canApprove ? (
            <Link className="button" href={`/documents/${detail.id}/approval`}>
              <Send size={18} />
              Solicitar aprobación
            </Link>
          ) : null}
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <div className="grid">
        <QuickMetric icon={FolderTree} label="Proyecto" value={1} />
        <QuickMetric icon={UserCircle2} label="Responsable" value={detail.responsibleUser ? 1 : 0} />
        <QuickMetric icon={Clock3} label="Versiones" value={detail.versions.length} />
        <QuickMetric icon={CheckCircle2} label="Solicitudes" value={approvalHistory.length} />
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-8">
          <div className="panel-header">
            <h2>Archivo actual</h2>
            <StatusPill status={detail.status} />
          </div>
          <p className="muted">
            {detail.project?.name ?? detail.projectId} · {detail.folder?.name ?? 'Sin carpeta'} · {detail.discipline?.name ?? 'Sin disciplina'}
          </p>
          {detail.preview.available && previewUrl ? (
            detail.preview.mimeType?.startsWith('image/') ? (
              <img alt={detail.name} className="document-preview-image" src={previewUrl} />
            ) : (
              <iframe className="document-preview-frame" src={previewUrl} title={detail.name} />
            )
          ) : (
            <div className="preview-empty">
              <p className="muted">
                {previewError || 'No hay vista previa para este formato. Puedes descargarlo o subir una nueva versión.'}
              </p>
            </div>
          )}
          <div className="projects-actions" style={{ marginTop: 16 }}>
            {canDownload ? (
              <button className="button secondary" type="button" onClick={() => void downloadCurrent()}>
                <Download size={18} />
                Descargar
              </button>
            ) : null}
            {canEdit ? (
              <button className="button secondary" type="button" onClick={() => void updateStatus('in_review')}>
                En revisión
              </button>
            ) : null}
            {canEdit ? (
              <button className="button secondary" type="button" onClick={() => void updateStatus('published')}>
                Publicar
              </button>
            ) : null}
          </div>
        </article>

        <article className="card span-4">
          <div className="panel-header">
            <h2>Ficha</h2>
            <Eye size={18} color="var(--primary)" />
          </div>
          <div className="simple-document-list">
            <div className="simple-document-item">
              <strong>Responsable</strong>
              <small>{detail.responsibleUser?.name ?? 'Sin responsable'}</small>
            </div>
            <div className="simple-document-item">
              <strong>Disciplina</strong>
              <small>{detail.discipline?.name ?? 'Sin disciplina'}</small>
            </div>
            <div className="simple-document-item">
              <strong>Vencimiento</strong>
              <small>{formatDate(detail.dueDate)}</small>
            </div>
            <div className="simple-document-item">
              <strong>Renovable</strong>
              <small>{detail.renewable ? 'Sí' : 'No'}</small>
            </div>
            {detail.renewable ? (
              <div className="simple-document-item">
                <strong>Frecuencia de renovación</strong>
                <small>{renewalFrequencyLabel(detail.renewalFrequency)}</small>
              </div>
            ) : null}
            <div className="simple-document-item">
              <strong>Formato</strong>
              <small>{detail.currentVersion?.mimeType ?? 'Sin archivo'}</small>
            </div>
            <div className="simple-document-item">
              <strong>Tamaño</strong>
              <small>{formatSize(detail.currentVersion?.sizeBytes)}</small>
            </div>
          </div>
        </article>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-4">
          <div className="panel-header">
            <h2>Versiones</h2>
            <History size={18} color="var(--primary)" />
          </div>
          <div className="simple-document-list">
            {detail.versions.map((version) => (
              <div className="simple-document-item" key={version.id}>
                <strong>Rev. {version.revision}</strong>
                <span>{version.fileName}</span>
                <small>{version.notes ?? 'Sin notas'} · {formatSize(version.sizeBytes)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="card span-4">
          <div className="panel-header">
            <h2>Comentarios</h2>
            <Send size={18} color="var(--primary)" />
          </div>
          <div className="field">
            <label>Nuevo comentario</label>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Anota observaciones o pendientes." />
          </div>
          <button className="button" type="button" onClick={() => void saveComment()}>
            Guardar comentario
          </button>
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            {detail.comments.map((item) => (
              <div className="simple-document-item" key={item.id}>
                <strong>{item.author?.name ?? 'Usuario'}</strong>
                <span>{item.body}</span>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="card span-4">
          <div className="panel-header">
            <h2>Auditoría y aprobaciones</h2>
            <History size={18} color="var(--accent)" />
          </div>
          <div className="simple-document-list">
            {detail.audit.map((item) => (
              <div className="simple-document-item" key={item.id}>
                <strong>{normalizeLabel(item.action)}</strong>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
            ))}
            {approvalHistory.map((item) => (
              <div className="simple-document-item" key={item.id}>
                <strong>Solicitud {normalizeLabel(item.status)}</strong>
                <small>{item.currentStep?.name ?? 'Sin paso actual'} · {new Date(item.requestedAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
          <div className="projects-actions" style={{ marginTop: 12 }}>
            <button className="button secondary" type="button" onClick={() => void refreshDetail()}>
              Actualizar
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

export function DocumentReviewPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [pages, setPages] = useState<ReviewPageAsset[]>([]);
  const [annotations, setAnnotations] = useState<ReviewAnnotation[]>([]);
  const [savedVersionId, setSavedVersionId] = useState<string | null>(null);
  const [savedAnnotationSignature, setSavedAnnotationSignature] = useState('[]');
  const [activeTool, setActiveTool] = useState<(typeof reviewToolOptions)[number]['value']>('comment');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [pageJumpValue, setPageJumpValue] = useState('1');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [sidebarTab, setSidebarTab] = useState<'compose' | 'annotations' | 'comments'>('compose');
  const [annotationScope, setAnnotationScope] = useState<'page' | 'all'>('page');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [pendingCommentPlacement, setPendingCommentPlacement] = useState<{ kind: 'comment' | 'text'; pageIndex: number; x: number; y: number } | null>(null);
  const [stampText, setStampText] = useState('Requiere correccion');
  const [strokeColor, setStrokeColor] = useState('#b91c1c');
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [interaction, setInteraction] = useState<
    | { kind: 'draw'; pageIndex: number; path: Array<{ x: number; y: number }> }
    | { kind: 'highlight'; pageIndex: number; startX: number; startY: number; currentX: number; currentY: number }
    | null
  >(null);
  const previewUrlsRef = useRef<string[]>([]);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await apiGet<DocumentDetail>(`/documents/${params.id}`, getToken() ?? undefined);
        if (!active) return;
        setDetail(response);
        const saved = response.comments.map((item) => parseAnnotationComment(item.body)).find(Boolean);
        const savedAnnotations = saved?.annotations ?? [];
        setAnnotations(savedAnnotations);
        setSavedAnnotationSignature(buildAnnotationSignature(savedAnnotations));
        setSavedVersionId(saved?.versionId ?? null);
        setSelectedAnnotationId(null);
        setError('');
      } catch {
        if (!active) return;
        setError('No fue posible cargar el documento para revisión.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    let active = true;

    async function ensurePdfJs() {
      const pdfWindow = window as Window & { pdfjsLib?: any };
      if (pdfWindow.pdfjsLib) return pdfWindow.pdfjsLib;

      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[data-pdfjs="true"]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('No fue posible cargar PDF.js.')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.dataset.pdfjs = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No fue posible cargar PDF.js.'));
        document.head.appendChild(script);
      });

      pdfWindow.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      return pdfWindow.pdfjsLib;
    }

    async function renderReviewPages() {
      if (!detail?.preview.available) {
        setPages([]);
        setRendering(false);
        return;
      }

      setRendering(true);
      try {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = [];

        const blob = await fetchProtectedBlob(`/documents/${detail.id}/content`);
        if (!active) return;

        if (detail.preview.mimeType === 'application/pdf') {
          const pdfjsLib = await ensurePdfJs();
          const buffer = await blob.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          const nextPages: ReviewPageAsset[] = [];

          for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex += 1) {
            const page = await pdf.getPage(pageIndex + 1);
            const viewport = page.getViewport({ scale: 1.35 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) continue;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;
            nextPages.push({
              pageIndex,
              width: viewport.width,
              height: viewport.height,
              imageUrl: canvas.toDataURL('image/png')
            });
          }

          if (active) setPages(nextPages);
        } else if (detail.preview.mimeType?.startsWith('image/')) {
          const imageUrl = URL.createObjectURL(blob);
          previewUrlsRef.current.push(imageUrl);

          const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(new Error('No fue posible cargar la imagen.'));
            element.src = imageUrl;
          });

          if (active) {
            setPages([
              {
                pageIndex: 0,
                width: image.naturalWidth,
                height: image.naturalHeight,
                imageUrl
              }
            ]);
          }
        } else {
          if (active) {
            setPages([]);
            setError('Este formato todavía no se puede revisar con anotaciones directas.');
          }
        }
      } catch (renderError) {
        if (active) {
          setPages([]);
          setError(renderError instanceof Error ? renderError.message : 'No fue posible preparar el documento para revisión.');
        }
      } finally {
        if (active) setRendering(false);
      }
    }

    void renderReviewPages();

    return () => {
      active = false;
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, [detail?.id, detail?.preview.available, detail?.preview.mimeType]);

  useEffect(() => {
    if (!pages.length) {
      setActivePageIndex(0);
      setPageJumpValue('1');
      return;
    }

    if (!pages.some((page) => page.pageIndex === activePageIndex)) {
      setActivePageIndex(pages[0]?.pageIndex ?? 0);
    }
  }, [activePageIndex, pages]);

  useEffect(() => {
    setPageJumpValue(String(activePageIndex + 1));
  }, [activePageIndex]);

  useEffect(() => {
    if (activeTool === 'comment' || activeTool === 'text') {
      setSidebarTab('compose');
    }
  }, [activeTool]);

  useEffect(() => {
    if (!pendingCommentPlacement) return;
    setSidebarTab('compose');
  }, [pendingCommentPlacement]);

  useEffect(() => {
    if (activeTool !== 'comment' && activeTool !== 'text' && !pendingCommentPlacement) return;
    const timer = window.setTimeout(() => {
      commentTextareaRef.current?.focus();
      commentTextareaRef.current?.setSelectionRange(commentText.length, commentText.length);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeTool, pendingCommentPlacement, commentText.length]);

  function getPoint(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    };
  }

  function beginInteraction(pageIndex: number, event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    setActivePageIndex(pageIndex);
    const point = getPoint(event);

    if (activeTool === 'comment' || activeTool === 'text') {
      setPendingCommentPlacement({
        kind: activeTool,
        pageIndex,
        x: point.x,
        y: point.y
      });
      setError('');
      return;
    }

    if (activeTool === 'stamp') {
      setAnnotations((current) => [
        {
          id: crypto.randomUUID(),
          kind: 'stamp',
          pageIndex,
          x: point.x,
          y: point.y,
          stamp: stampText,
          color: strokeColor,
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
      setError('');
      return;
    }

    if (activeTool === 'draw') {
      event.currentTarget.setPointerCapture(event.pointerId);
      setInteraction({ kind: 'draw', pageIndex, path: [point] });
      return;
    }

    if (activeTool === 'highlight') {
      event.currentTarget.setPointerCapture(event.pointerId);
      setInteraction({ kind: 'highlight', pageIndex, startX: point.x, startY: point.y, currentX: point.x, currentY: point.y });
    }
  }

  function moveInteraction(pageIndex: number, event: React.PointerEvent<HTMLDivElement>) {
    if (!interaction || interaction.pageIndex !== pageIndex) return;
    event.preventDefault();
    const point = getPoint(event);

    if (interaction.kind === 'draw') {
      setInteraction((current) => {
        if (!current || current.kind !== 'draw' || current.pageIndex !== pageIndex) return current;
        const previous = current.path[current.path.length - 1];
        if (previous && Math.abs(previous.x - point.x) < 0.0015 && Math.abs(previous.y - point.y) < 0.0015) {
          return current;
        }
        return { ...current, path: [...current.path, point] };
      });
      return;
    }

    if (interaction.kind === 'highlight') {
      setInteraction((current) => {
        if (!current || current.kind !== 'highlight' || current.pageIndex !== pageIndex) return current;
        return { ...current, currentX: point.x, currentY: point.y };
      });
    }
  }

  function endInteraction(pageIndex: number, event?: React.PointerEvent<HTMLDivElement>) {
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!interaction || interaction.pageIndex !== pageIndex) return;

    if (interaction.kind === 'draw' && interaction.path.length > 0) {
      setAnnotations((current) => [
        {
          id: crypto.randomUUID(),
          kind: 'draw',
          pageIndex,
          x: interaction.path[0].x,
          y: interaction.path[0].y,
          path: interaction.path,
          color: strokeColor,
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
    }

    if (interaction.kind === 'highlight') {
      const width = Math.abs(interaction.currentX - interaction.startX);
      const height = Math.abs(interaction.currentY - interaction.startY);
      if (width > 0.005 && height > 0.005) {
        setAnnotations((current) => [
          {
            id: crypto.randomUUID(),
            kind: 'highlight',
            pageIndex,
            x: Math.min(interaction.startX, interaction.currentX),
            y: Math.min(interaction.startY, interaction.currentY),
            width,
            height,
            color: '#facc15',
            createdAt: new Date().toISOString()
          },
          ...current
        ]);
      }
    }

    setInteraction(null);
  }

  async function saveAnnotations() {
    if (!detail) return;
    setSaving(true);
    try {
      const payload: SavedReviewPayload = {
        versionId: detail.currentVersion?.id ?? null,
        annotations
      };
      const updated = await apiPost<DocumentDetail>(`/documents/${detail.id}/comments`, { body: buildAnnotationComment(payload) }, getToken() ?? undefined);
      setDetail(updated);
      setSavedAnnotationSignature(buildAnnotationSignature(annotations));
      setError('');
    } catch {
      setError('No fue posible guardar la revisión anotada.');
    } finally {
      setSaving(false);
    }
  }

  function renderPath(path: Array<{ x: number; y: number }>) {
    return path.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x * 1000} ${point.y * 1000}`).join(' ');
  }

  function confirmPendingComment() {
    if (editingAnnotationId) {
      if (!commentText.trim()) {
        setError('Escribe el contenido actualizado antes de guardar.');
        return;
      }

      setAnnotations((current) => current.map((entry) => (
        entry.id === editingAnnotationId
          ? { ...entry, text: commentText.trim(), color: strokeColor }
          : entry
      )));
      setCommentText('');
      setEditingAnnotationId(null);
      setSidebarTab('comments');
      setError('');
      return;
    }

    if (!pendingCommentPlacement) {
      setError('Primero marca el punto del archivo donde quieres dejar el texto.');
      return;
    }

    if (!commentText.trim()) {
      setError('Escribe el contenido para guardar la marca seleccionada.');
      return;
    }

    setAnnotations((current) => [
      {
        id: crypto.randomUUID(),
        kind: pendingCommentPlacement.kind,
        pageIndex: pendingCommentPlacement.pageIndex,
        x: pendingCommentPlacement.x,
        y: pendingCommentPlacement.y,
        text: commentText.trim(),
        color: strokeColor,
        replies: pendingCommentPlacement.kind === 'comment' ? [] : undefined,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
    setCommentText('');
    setPendingCommentPlacement(null);
    if (pendingCommentPlacement.kind === 'comment') {
      setSidebarTab('comments');
    }
    setError('');
  }

  function cancelPendingComment() {
    setPendingCommentPlacement(null);
    setCommentText('');
    setEditingAnnotationId(null);
    setError('');
  }

  function focusAnnotation(annotationId: string) {
    const target = annotations.find((entry) => entry.id === annotationId);
    if (!target) return;
    setActivePageIndex(target.pageIndex);
    setSelectedAnnotationId(annotationId);
    setSidebarTab('annotations');
  }

  function focusComment(page?: string) {
    if (!page) {
      setSidebarTab('comments');
      return;
    }

    const pageNumber = Number(page);
    if (Number.isNaN(pageNumber) || pageNumber <= 0) {
      setSidebarTab('comments');
      return;
    }

    setActivePageIndex(pageNumber - 1);
    setSidebarTab('comments');
  }

  function removeAnnotation(annotationId: string) {
    if (editingAnnotationId === annotationId) {
      setEditingAnnotationId(null);
      setCommentText('');
    }
    if (replyingToId === annotationId) {
      setReplyingToId(null);
      setReplyText('');
    }
    setAnnotations((current) => current.filter((entry) => entry.id !== annotationId));
  }

  function beginEditComment(annotationId: string) {
    const target = annotations.find((entry) => entry.id === annotationId && entry.kind === 'comment');
    if (!target) return;
    setEditingAnnotationId(annotationId);
    setCommentText(target.text ?? '');
    setStrokeColor(target.color ?? '#b91c1c');
    setPendingCommentPlacement(null);
    setSidebarTab('compose');
    setActiveTool('comment');
    setActivePageIndex(target.pageIndex);
    setSelectedAnnotationId(annotationId);
    setReplyingToId(null);
    setReplyText('');
  }

  function saveReply(annotationId: string) {
    if (!replyText.trim()) return;
    setAnnotations((current) => current.map((entry) => (
      entry.id === annotationId && entry.kind === 'comment'
        ? {
            ...entry,
            replies: [
              ...(entry.replies ?? []),
              { id: crypto.randomUUID(), text: replyText.trim(), createdAt: new Date().toISOString() }
            ]
          }
        : entry
    )));
    setReplyText('');
    setReplyingToId(null);
  }

  function undoLastAnnotation() {
    setAnnotations((current) => current.slice(1));
  }

  function clearCurrentPage() {
    if (pendingCommentPlacement?.pageIndex === activePageIndex) {
      setPendingCommentPlacement(null);
      setCommentText('');
    }
    if (annotations.some((entry) => entry.id === selectedAnnotationId && entry.pageIndex === activePageIndex)) {
      setSelectedAnnotationId(null);
    }
    setAnnotations((current) => current.filter((entry) => entry.pageIndex !== activePageIndex));
  }

  function clearAllAnnotations() {
    setPendingCommentPlacement(null);
    setCommentText('');
    setSelectedAnnotationId(null);
    setAnnotations([]);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = target ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) : false;

      if (!isTypingTarget && (activeTool === 'comment' || activeTool === 'text') && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        commentTextareaRef.current?.focus();
        setCommentText((current) => current + event.key);
        event.preventDefault();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!saving && !isTypingTarget) {
          void saveAnnotations();
        }
        return;
      }

      if (event.key === 'Escape' && pendingCommentPlacement) {
        event.preventDefault();
        cancelPendingComment();
        return;
      }

      if (isTypingTarget) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousPage();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextPage();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, pendingCommentPlacement, saving, pages.length, annotations]);

  if (loading) {
    return (
      <section className="projects-workspace">
        <article className="card muted">Cargando revisión...</article>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="projects-workspace">
        <article className="card muted">{error || 'Documento no disponible.'}</article>
      </section>
    );
  }

  const currentVersionId = detail.currentVersion?.id ?? null;
  const versionMismatch = Boolean(savedVersionId && currentVersionId && savedVersionId !== currentVersionId);
  const activeToolMeta = reviewToolOptions.find((tool) => tool.value === activeTool) ?? reviewToolOptions[0];
  const activePageAnnotations = annotations.filter((item) => item.pageIndex === activePageIndex);
  const activePage = pages.find((page) => page.pageIndex === activePageIndex) ?? pages[0] ?? null;
  const visibleAnnotationItems = annotationScope === 'page'
    ? annotations.filter((item) => item.pageIndex === activePageIndex)
    : annotations;
  const commentAnnotationItems = annotations.filter((item) => item.kind === 'comment');
  const visibleComments = detail.comments.filter((item) => !item.body.startsWith('[ANNOTATION_SET]'));
  const reviewComments = visibleComments.map((item) => {
    const parsed = parseReviewComment(item.body);
    return {
      ...item,
      parsed,
      excerpt: parsed?.note || item.body
    };
  });
  const hasUnsavedChanges = pendingCommentPlacement !== null || commentText.trim().length > 0 || buildAnnotationSignature(annotations) !== savedAnnotationSignature;

  function goToPreviousPage() {
    if (!pages.length) return;
    setActivePageIndex((current) => Math.max(0, current - 1));
  }

  function goToNextPage() {
    if (!pages.length) return;
    setActivePageIndex((current) => Math.min(pages.length - 1, current + 1));
  }

  function jumpToPage() {
    if (!pages.length) return;
    const pageNumber = Number(pageJumpValue);
    if (Number.isNaN(pageNumber)) return;
    const nextPageIndex = Math.min(Math.max(pageNumber - 1, 0), pages.length - 1);
    setActivePageIndex(nextPageIndex);
  }

  function zoomOut() {
    setZoomLevel((current) => Math.max(0.6, Number((current - 0.1).toFixed(2))));
  }

  function zoomIn() {
    setZoomLevel((current) => Math.min(2.4, Number((current + 0.1).toFixed(2))));
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Revisión de documento</h1>
          <p className="muted">{detail.documentNumber} · {detail.name}</p>
        </div>
        <div className="projects-actions">
          {hasUnsavedChanges ? <span className="pill warning">Cambios sin guardar</span> : <span className="pill success">Guardado</span>}
          <Link className="button secondary" href={`/documents/${detail.id}`}>
            Volver al documento
          </Link>
          <button className="button" type="button" onClick={() => void saveAnnotations()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar revisión'}
          </button>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}
      {versionMismatch ? <div className="card muted">Estas anotaciones vienen de otra versión del documento. Revisa si siguen vigentes antes de guardar.</div> : null}

      <div className="review-workspace">
        <article className="card review-document-card">
          <div className="panel-header">
            <div className="review-panel-title">
              <FileCheck2 size={18} />
              <h2>Documento anotable</h2>
            </div>
            <span className="pill">{rendering ? 'Preparando visor' : `${pages.length} página(s)`}</span>
          </div>

          <div className="review-toolbar-stack">
            <div className="review-page-toolbar review-page-toolbar-compact">
              <div className="review-page-nav">
                <div className="review-status-bar review-status-bar-inline">
                  <div className="review-status-chip compact">
                    <Paintbrush size={14} />
                    <div>
                      <strong>Herramienta</strong>
                      <span>{activeToolMeta.label}</span>
                    </div>
                  </div>
                  <div className="review-status-chip compact">
                    <FileText size={14} />
                    <div>
                      <strong>Página</strong>
                      <span>{activePageIndex + 1}</span>
                    </div>
                  </div>
                  <div className="review-status-chip compact">
                    <StickyNote size={14} />
                    <div>
                      <strong>Marcas</strong>
                      <span>{activePageAnnotations.length}</span>
                    </div>
                  </div>
                  <div className="review-status-chip compact">
                    <ZoomIn size={14} />
                    <div>
                      <strong>Zoom</strong>
                      <span>{Math.round(zoomLevel * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="review-page-nav-actions">
                  <button className="button secondary" type="button" onClick={goToPreviousPage} disabled={activePageIndex <= 0}>
                    Anterior
                  </button>
                  <div className="review-page-counter">
                    <strong>Página {activePageIndex + 1}</strong>
                    <span>de {pages.length || 0}</span>
                  </div>
                  <div className="review-page-jump">
                    <label htmlFor="review-page-jump">Ir a</label>
                    <input
                      id="review-page-jump"
                      type="number"
                      min={1}
                      max={pages.length || 1}
                      value={pageJumpValue}
                      onChange={(event) => setPageJumpValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          jumpToPage();
                        }
                      }}
                    />
                  </div>
                  <button className="button secondary" type="button" onClick={goToNextPage} disabled={activePageIndex >= pages.length - 1}>
                    Siguiente
                  </button>
                </div>
              </div>
            </div>

            <div className="review-top-tools review-top-tools-compact">
              <div className="review-tools-inline">
                {reviewToolOptions.map((tool) => (
                  <button
                    className={`review-tool-pill ${activeTool === tool.value ? 'active' : ''}`}
                    key={tool.value}
                    type="button"
                    onClick={() => setActiveTool(tool.value)}
                    title={tool.help}
                  >
                    <span className="review-tool-icon small">{renderReviewToolIcon(tool.value)}</span>
                    <strong>{tool.label}</strong>
                  </button>
                ))}
              </div>

              <div className="review-toolbar-strip review-toolbar-strip-compact">
                <div className="field review-color-field">
                  <label><Palette size={14} /> Color</label>
                  <div className="review-color-swatches">
                    {reviewColorOptions.map((option) => (
                      <button
                        aria-label={option.label}
                        className={`review-color-swatch ${strokeColor === option.value ? 'active' : ''}`}
                        key={option.value}
                        style={{ backgroundColor: option.value }}
                        title={option.label}
                        type="button"
                        onClick={() => setStrokeColor(option.value)}
                      />
                    ))}
                  </div>
                </div>

                {activeTool === 'stamp' ? (
                  <div className="review-toolbar-field review-toolbar-field-compact">
                    <SelectField
                      label="Sello"
                      value={stampText}
                      onChange={setStampText}
                      options={reviewStampOptions.map((stamp) => ({ value: stamp, label: stamp }))}
                    />
                  </div>
                ) : null}

                <div className="review-toolbar-note">
                  {pendingCommentPlacement
                    ? pendingCommentPlacement.kind === 'text'
                      ? 'Punto listo: escribe el texto literal a la derecha.'
                      : 'Punto listo: escribe el comentario a la derecha.'
                    : activeToolMeta.help}
                </div>

                <div className="review-action-row review-action-row-toolbar">
                  <button className="button secondary" type="button" onClick={zoomOut} disabled={zoomLevel <= 0.6}>
                    <ZoomOut size={15} />
                    Alejar
                  </button>
                  <button className="button secondary" type="button" onClick={() => setZoomLevel(1)} disabled={zoomLevel === 1}>
                    100%
                  </button>
                  <button className="button secondary" type="button" onClick={zoomIn} disabled={zoomLevel >= 2.4}>
                    <ZoomIn size={15} />
                    Acercar
                  </button>
                  <button className="button secondary" type="button" onClick={undoLastAnnotation} disabled={!annotations.length}>
                    <Undo2 size={15} />
                    Deshacer
                  </button>
                  <button className="button secondary" type="button" onClick={clearCurrentPage} disabled={!activePageAnnotations.length}>
                    <Trash2 size={15} />
                    Página
                  </button>
                  <button className="button secondary" type="button" onClick={clearAllAnnotations} disabled={!annotations.length}>
                    <Trash2 size={15} />
                    Todo
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="review-canvas-stack">
            {activePage ? (() => {
              const page = activePage;
              const pageAnnotations = annotations.filter((item) => item.pageIndex === page.pageIndex);
              const liveHighlight =
                interaction?.kind === 'highlight' && interaction.pageIndex === page.pageIndex
                  ? {
                      x: Math.min(interaction.startX, interaction.currentX),
                      y: Math.min(interaction.startY, interaction.currentY),
                      width: Math.abs(interaction.currentX - interaction.startX),
                      height: Math.abs(interaction.currentY - interaction.startY)
                    }
                  : null;

              return (
                <div className="review-page-shell" key={page.pageIndex}>
                  <div className="review-page-label">Página {page.pageIndex + 1}</div>
                  <div className="review-page-viewport">
                    <div
                      className={`review-page-stage ${activeTool === 'draw' ? 'is-drawing' : ''} ${activeTool === 'highlight' ? 'is-highlighting' : ''} ${page.pageIndex === activePageIndex ? 'is-active' : ''}`}
                      onPointerDown={(event) => beginInteraction(page.pageIndex, event)}
                      onPointerMove={(event) => moveInteraction(page.pageIndex, event)}
                      onPointerUp={(event) => endInteraction(page.pageIndex, event)}
                      onPointerCancel={(event) => endInteraction(page.pageIndex, event)}
                      onPointerEnter={() => setActivePageIndex(page.pageIndex)}
                      style={{ width: `${page.width * zoomLevel}px` }}
                    >
                      <img alt={`Página ${page.pageIndex + 1}`} className="review-page-image" src={page.imageUrl} />
                      <svg className="review-page-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                        {pageAnnotations.filter((item) => item.kind === 'highlight').map((item) => (
                          <rect
                            fill="rgba(250, 204, 21, 0.28)"
                            height={(item.height ?? 0) * 1000}
                            key={item.id}
                            stroke="rgba(202, 138, 4, 0.8)"
                            strokeWidth="2"
                            width={(item.width ?? 0) * 1000}
                            x={item.x * 1000}
                            y={item.y * 1000}
                          />
                        ))}
                        {liveHighlight ? (
                          <rect
                            fill="rgba(250, 204, 21, 0.22)"
                            height={liveHighlight.height * 1000}
                            stroke="rgba(202, 138, 4, 0.8)"
                            strokeDasharray="8 6"
                            strokeWidth="2"
                            width={liveHighlight.width * 1000}
                            x={liveHighlight.x * 1000}
                            y={liveHighlight.y * 1000}
                          />
                        ) : null}

                        {pageAnnotations.filter((item) => item.kind === 'draw' && item.path?.length).map((item) => (
                          item.path && item.path.length === 1 ? (
                            <circle
                              cx={item.path[0].x * 1000}
                              cy={item.path[0].y * 1000}
                              fill={item.color ?? '#b91c1c'}
                              key={item.id}
                              r="5"
                            />
                          ) : (
                            <path
                              d={renderPath(item.path ?? [])}
                              fill="none"
                              key={item.id}
                              stroke={item.color ?? '#b91c1c'}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="4"
                            />
                          )
                        ))}
                        {interaction?.kind === 'draw' && interaction.pageIndex === page.pageIndex ? (
                          interaction.path.length === 1 ? (
                            <circle
                              cx={interaction.path[0].x * 1000}
                              cy={interaction.path[0].y * 1000}
                              fill={strokeColor}
                              r="5"
                            />
                          ) : (
                            <path
                              d={renderPath(interaction.path)}
                              fill="none"
                              stroke={strokeColor}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="4"
                            />
                          )
                        ) : null}
                      </svg>

                      {pageAnnotations.filter((item) => item.kind === 'text').map((item) => (
                        <div className="review-inline-text" key={item.id} style={{ color: item.color ?? '#0369a1', left: `${item.x * 100}%`, top: `${item.y * 100}%` }}>
                          {item.text}
                        </div>
                      ))}

                      {pageAnnotations.filter((item) => item.kind === 'comment' || item.kind === 'stamp').map((item) => (
                        <div className={`review-pin ${item.kind}`} key={item.id} style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}>
                          <strong>{item.kind === 'stamp' ? item.stamp : 'Comentario'}</strong>
                          <span>{item.kind === 'stamp' ? '' : item.text}</span>
                        </div>
                      ))}
                      {pendingCommentPlacement?.pageIndex === page.pageIndex ? (
                        pendingCommentPlacement.kind === 'text' ? (
                          <div
                            className="review-inline-text pending"
                            style={{ color: strokeColor, left: `${pendingCommentPlacement.x * 100}%`, top: `${pendingCommentPlacement.y * 100}%` }}
                          >
                            {commentText.trim() || 'Nuevo texto'}
                          </div>
                        ) : (
                          <div
                            className="review-pin pending review-pin-editor"
                            style={{ left: `${pendingCommentPlacement.x * 100}%`, top: `${pendingCommentPlacement.y * 100}%` }}
                            onPointerDown={(event) => event.stopPropagation()}
                          >
                            <strong>Nuevo comentario</strong>
                            <textarea
                              className="review-pin-textarea"
                              value={commentText}
                              onChange={(event) => setCommentText(event.target.value)}
                              placeholder="Escribe el comentario aquí."
                            />
                            <div className="review-pin-actions">
                              <button className="button" type="button" onClick={confirmPendingComment}>
                                Guardar
                              </button>
                              <button className="button secondary" type="button" onClick={cancelPendingComment}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })() : null}

            {!rendering && !pages.length ? <div className="preview-empty"><p className="muted">Este documento aún no puede abrirse en el visor de revisión.</p></div> : null}
          </div>
        </article>

        <aside className="card review-sidebar-card">
          <div className="panel-header">
            <div className="review-panel-title">
              <PanelRightOpen size={18} />
              <h2>Panel de revisión</h2>
            </div>
            <span className="pill">Derecha</span>
          </div>

          <div className="review-sidebar-tabs">
            <button className={`review-sidebar-tab ${sidebarTab === 'compose' ? 'active' : ''}`} type="button" onClick={() => setSidebarTab('compose')}>
              <MessageSquareMore size={15} />
              Redactar
            </button>
            <button className={`review-sidebar-tab ${sidebarTab === 'annotations' ? 'active' : ''}`} type="button" onClick={() => setSidebarTab('annotations')}>
              <Paintbrush size={15} />
              Marcas
            </button>
            <button className={`review-sidebar-tab ${sidebarTab === 'comments' ? 'active' : ''}`} type="button" onClick={() => setSidebarTab('comments')}>
              <History size={15} />
              Historial
            </button>
          </div>

          {sidebarTab === 'compose' ? (
            <>
            <div className="review-side-section">
              <div className="review-side-section-title">
                {activeTool === 'text' ? <Type size={16} /> : <MessageSquareMore size={16} />}
                <strong>
                  {editingAnnotationId
                    ? 'Editar comentario'
                    : activeTool === 'text' || pendingCommentPlacement?.kind === 'text'
                      ? 'Texto dentro del documento'
                      : 'Comentario puntual'}
                </strong>
              </div>
              <div className="field review-comment-field">
                <textarea
                  ref={commentTextareaRef}
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder={
                    pendingCommentPlacement?.kind === 'text'
                      ? 'Escribe el texto que quieres ver dentro del documento.'
                      : pendingCommentPlacement
                        ? 'Escribe la observacion para el punto marcado.'
                        : activeTool === 'text'
                          ? 'Puedes empezar a escribir aqui y luego marcar el punto.'
                          : 'Puedes empezar a escribir aqui o marcar primero el punto.'
                  }
                />
              </div>
              <small className="muted">
                {pendingCommentPlacement
                  ? `Punto seleccionado en la página ${pendingCommentPlacement.pageIndex + 1}.`
                  : activeTool === 'text'
                    ? 'Escribe el texto y luego haz click en el documento para colocarlo.'
                    : 'Puedes escribir primero o marcar primero el lugar exacto en el archivo.'}
              </small>
              <div className="review-action-row">
                <button className="button" type="button" onClick={confirmPendingComment}>
                  <Send size={15} />
                  {editingAnnotationId ? 'Guardar cambios' : activeTool === 'text' || pendingCommentPlacement?.kind === 'text' ? 'Guardar texto' : 'Guardar comentario'}
                </button>
                <button className="button secondary" type="button" onClick={cancelPendingComment} disabled={!pendingCommentPlacement && !commentText.trim()}>
                  <X size={15} />
                  Cancelar
                </button>
              </div>
            </div>

          <div className="review-side-section">
            <div className="review-side-section-title">
              <Sparkles size={16} />
              <strong>Flujo recomendado</strong>
            </div>
            <div className="review-checklist">
              <div className="review-checklist-item"><span>1</span><small>Elige herramienta arriba.</small></div>
              <div className="review-checklist-item"><span>2</span><small>Marca el punto o zona en el archivo.</small></div>
              <div className="review-checklist-item"><span>3</span><small>Escribe el comentario en esta columna y guarda.</small></div>
            </div>
          </div>
            </>
          ) : null}

          {sidebarTab === 'annotations' ? (
            <>
          <div className="panel-header review-subheader">
            <div className="review-panel-title">
              <Paintbrush size={16} />
              <h2>Anotaciones</h2>
            </div>
            <span className="pill">{visibleAnnotationItems.length}</span>
          </div>
          <div className="review-scope-switch">
            <button className={`review-scope-button ${annotationScope === 'page' ? 'active' : ''}`} type="button" onClick={() => setAnnotationScope('page')}>
              Página actual
            </button>
            <button className={`review-scope-button ${annotationScope === 'all' ? 'active' : ''}`} type="button" onClick={() => setAnnotationScope('all')}>
              Todas
            </button>
          </div>
          <div className="simple-document-list review-annotation-list">
            {visibleAnnotationItems.map((item) => (
              <div className={`simple-document-item review-note-item ${item.pageIndex === activePageIndex ? 'review-annotation-active' : ''} ${selectedAnnotationId === item.id ? 'review-note-selected' : ''}`} key={item.id}>
                <button className="review-note-button" type="button" onClick={() => focusAnnotation(item.id)}>
                  <div className="review-note-head">
                    <span className="review-tool-icon small">{renderReviewToolIcon(item.kind)}</span>
                    <strong>{item.kind === 'stamp' ? item.stamp : item.kind === 'text' ? 'Texto' : normalizeLabel(item.kind)}</strong>
                  </div>
                  <small>Página {item.pageIndex + 1}</small>
                  <small>{item.text ?? (item.kind === 'draw' ? 'Trazo libre' : item.kind === 'highlight' ? 'Área resaltada' : '')}</small>
                </button>
                <div className="review-inline-actions">
                  <button className="button secondary" type="button" onClick={() => focusAnnotation(item.id)}>
                    Ir
                  </button>
                  <button className="button secondary" type="button" onClick={() => removeAnnotation(item.id)}>
                    <Trash2 size={14} />
                    Quitar
                  </button>
                </div>
              </div>
            ))}
            {!visibleAnnotationItems.length ? <p className="muted">No hay marcas en este alcance.</p> : null}
          </div>
            </>
          ) : null}

          {sidebarTab === 'comments' ? (
            <>
          <div className="panel-header review-subheader">
            <div className="review-panel-title">
              <MessageSquareMore size={16} />
              <h2>Comentarios</h2>
            </div>
            <span className="pill">{commentAnnotationItems.length}</span>
          </div>
          <div className="simple-document-list review-comments-list">
            {commentAnnotationItems.map((item) => (
              <div className={`simple-document-item review-note-item ${selectedAnnotationId === item.id ? 'review-note-selected' : ''}`} key={item.id}>
                <button className="review-note-button" type="button" onClick={() => focusAnnotation(item.id)}>
                  <strong>Comentario</strong>
                  <small>Página {item.pageIndex + 1} · {new Date(item.createdAt).toLocaleString()}</small>
                  <span>{item.text}</span>
                </button>
                {(item.replies ?? []).length ? (
                  <div className="review-replies">
                    {(item.replies ?? []).map((reply) => (
                      <div className="review-reply-item" key={reply.id}>
                        <strong>Respuesta</strong>
                        <small>{new Date(reply.createdAt).toLocaleString()}</small>
                        <span>{reply.text}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="review-inline-actions">
                  <button className="button secondary" type="button" onClick={() => focusAnnotation(item.id)}>
                    Ir
                  </button>
                  <button className="button secondary" type="button" onClick={() => beginEditComment(item.id)}>
                    Editar
                  </button>
                  <button className="button secondary" type="button" onClick={() => setReplyingToId((current) => current === item.id ? null : item.id)}>
                    Responder
                  </button>
                  <button className="button secondary" type="button" onClick={() => removeAnnotation(item.id)}>
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
                {replyingToId === item.id ? (
                  <div className="review-reply-composer">
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Escribe una respuesta para este comentario."
                    />
                    <div className="review-inline-actions">
                      <button className="button" type="button" onClick={() => saveReply(item.id)}>
                        Guardar respuesta
                      </button>
                      <button className="button secondary" type="button" onClick={() => { setReplyingToId(null); setReplyText(''); }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            {!commentAnnotationItems.length ? <p className="muted">Todavía no hay comentarios de revisión en esta sesión.</p> : null}
          </div>

          <div className="panel-header review-subheader">
            <div className="review-panel-title">
              <History size={16} />
              <h2>Historial guardado</h2>
            </div>
            <span className="pill">{reviewComments.length}</span>
          </div>
          <div className="simple-document-list review-comments-list">
            {reviewComments.map((item) => (
              <button className="simple-document-item review-note-item review-note-button" key={item.id} type="button" onClick={() => focusComment(item.parsed?.page)}>
                <strong>{item.parsed?.stamp || item.author?.name || 'Comentario'}</strong>
                <small>{item.parsed?.page ? `Página ${item.parsed.page}` : new Date(item.createdAt).toLocaleString()}</small>
                <span>{item.excerpt}</span>
              </button>
            ))}
            {!reviewComments.length ? <p className="muted">Todavía no hay historial guardado para esta revisión.</p> : null}
          </div>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

export function DocumentApprovalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [flows, setFlows] = useState<Workflow[]>([]);
  const [workflowId, setWorkflowId] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await apiGet<DocumentDetail>(`/documents/${params.id}`, getToken() ?? undefined);
        if (!active) return;
        setDetail(response);

        apiGet<Workflow[]>(`/approvals/flows?projectId=${encodeURIComponent(response.projectId)}`, getToken() ?? undefined)
          .then((items) => {
            if (!active) return;
            setFlows(items.filter((item) => item.scopeType === 'global' || item.scopeType === 'document_specific'));
          })
          .catch(() => {
            if (active) setFlows([]);
          });
      } catch {
        if (!active) return;
        setError('No fue posible preparar la solicitud de aprobación.');
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [params.id]);

  async function submit() {
    setSaving(true);
    try {
      await apiPost(
        '/approvals/requests',
        {
          documentId: params.id,
          workflowId: workflowId || undefined,
          comment: comment || undefined
        },
        getToken() ?? undefined
      );
      router.push(`/documents/${params.id}`);
      router.refresh();
    } catch {
      setError('No fue posible solicitar la aprobación. Verifica que exista un flujo aplicable para este documento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Solicitar aprobación</h1>
          <p className="muted">{detail ? `${detail.documentNumber} · ${detail.name}` : 'Cargando documento...'}</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={detail ? `/documents/${detail.id}` : '/documents'}>
            Volver
          </Link>
        </div>
      </div>

      {error ? <div className="card muted">{error}</div> : null}

      <article className="card">
        <div className="quick-filters-grid">
          <TextField label="Proyecto" value={detail?.project?.name ?? ''} onChange={() => undefined} />
          <TextField label="Disciplina" value={detail?.discipline?.name ?? ''} onChange={() => undefined} />
          <SelectField
            label="Workflow"
            value={workflowId}
            onChange={setWorkflowId}
            options={flows.map((flow) => ({
              value: flow.id,
              label: `${flow.name}${flow.requireForPublication ? ' · obligatorio para publicar' : ''}`
            }))}
            placeholder="Automático según configuración"
          />
          <div className="field span-2">
            <label>Comentario inicial</label>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Indica alcance, observaciones o prioridad." />
          </div>
        </div>
        {!flows.length ? (
          <p className="muted">
            Si no eliges un workflow, el sistema intentará usar el flujo global o específico del proyecto. Si todavía no existe, configúralo en la página de aprobaciones.
          </p>
        ) : null}
        <div className="projects-actions">
          <button className="button" type="button" onClick={() => void submit()} disabled={saving || !detail}>
            {saving ? 'Solicitando...' : 'Enviar a aprobación'}
          </button>
          <Link className="button secondary" href="/approvals">
            Ir a aprobaciones
          </Link>
        </div>
      </article>
    </section>
  );
}
