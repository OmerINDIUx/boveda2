'use client';

import Link from 'next/link';
import {
  Bot,
  CheckCircle2,
  Download,
  Eye,
  FileClock,
  FilePlus2,
  History,
  MessageSquare,
  Printer,
  Search,
  Send,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

type ProjectOption = { id: string; name: string; code: string };

type DocumentListItem = {
  id: string;
  name: string;
  documentNumber: string;
  status: string;
  confidentialityLevel: string;
  renewable: boolean;
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
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string; email: string } | null;
  }>;
  audit: Array<{
    id: string;
    action: string;
    createdAt: string;
    actorId?: string;
    beforeState?: unknown;
    afterState?: unknown;
  }>;
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
  dueDate: string;
  responsibleUserId: string;
  status: string;
  revision: string;
  notes: string;
};

const emptyUploadForm: UploadForm = {
  name: '',
  documentNumber: '',
  projectId: '',
  folderId: '',
  disciplineId: '',
  confidentialityLevel: 'internal',
  renewable: false,
  dueDate: '',
  responsibleUserId: '',
  status: 'draft',
  revision: 'A',
  notes: '',
};

const fallbackProjects: ProjectOption[] = [
  { id: 'mock-project-1', name: 'Torre Ejecutiva Norte', code: 'HOL-PRJ-001' },
  { id: 'mock-project-2', name: 'Planta de Tratamiento Oriente', code: 'HOL-PRJ-014' },
];

const fallbackDocuments: DocumentListItem[] = [
  {
    id: 'mock-doc-1',
    name: 'Plano de fachada nivel 12',
    documentNumber: 'ARC-IFC-012',
    status: 'in_review',
    confidentialityLevel: 'internal',
    renewable: false,
    dueDate: '2026-07-04',
    fileExtension: 'pdf',
    sizeBytes: 1443000,
    projectId: 'mock-project-1',
    folderId: 'f-1',
    disciplineId: 'd-1',
    responsibleUserId: 'u-1',
    currentVersionId: 'ver-1',
    updatedAt: '2026-07-02T09:00:00.000Z',
    createdAt: '2026-06-28T14:00:00.000Z',
    project: fallbackProjects[0],
    folder: { id: 'f-1', name: 'ARC_Arquitectura' },
    discipline: { id: 'd-1', code: 'ARC', name: 'Arquitectura' },
    responsibleUser: { id: 'u-1', name: 'Laura Méndez', email: 'laura@holocron.local' },
  },
  {
    id: 'mock-doc-2',
    name: 'Ficha de equipos HVAC',
    documentNumber: 'MEC-SUB-021',
    status: 'pending_approval',
    confidentialityLevel: 'confidential',
    renewable: true,
    dueDate: '2026-07-10',
    fileExtension: 'xlsx',
    sizeBytes: 932000,
    projectId: 'mock-project-1',
    folderId: 'f-2',
    disciplineId: 'd-2',
    responsibleUserId: 'u-2',
    currentVersionId: 'ver-2',
    updatedAt: '2026-07-01T17:20:00.000Z',
    createdAt: '2026-06-27T12:15:00.000Z',
    project: fallbackProjects[0],
    folder: { id: 'f-2', name: 'MEC_Mecánica' },
    discipline: { id: 'd-2', code: 'MEC', name: 'Mecánica' },
    responsibleUser: { id: 'u-2', name: 'José Ramírez', email: 'jose@holocron.local' },
  },
];

const fallbackDetail: Record<string, DocumentDetail> = {
  'mock-doc-1': {
    ...fallbackDocuments[0],
    currentVersion: {
      id: 'ver-1',
      revision: 'C',
      fileName: 'ARC-IFC-012.pdf',
      fileExtension: 'pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1443000,
      notes: 'Emisión coordinada IFC',
      createdAt: '2026-07-02T09:00:00.000Z',
      uploadedBy: { id: 'u-1', name: 'Laura Méndez', email: 'laura@holocron.local' },
    },
    preview: { available: true, mimeType: 'application/pdf', url: null },
    metadata: [
      { id: 'm-1', metaKey: 'cliente', metaValue: 'Grupo Holocron', valueType: 'string' },
      { id: 'm-2', metaKey: 'paquete', metaValue: 'Fachadas', valueType: 'string' },
    ],
    versions: [
      {
        id: 'ver-1',
        revision: 'C',
        fileName: 'ARC-IFC-012.pdf',
        fileExtension: 'pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1443000,
        notes: 'Emisión coordinada IFC',
        createdAt: '2026-07-02T09:00:00.000Z',
        uploadedBy: { id: 'u-1', name: 'Laura Méndez', email: 'laura@holocron.local' },
      },
      {
        id: 'ver-0',
        revision: 'B',
        fileName: 'ARC-IFC-012.pdf',
        fileExtension: 'pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1321000,
        notes: 'Revisión de coordinación',
        createdAt: '2026-06-30T15:00:00.000Z',
        uploadedBy: { id: 'u-1', name: 'Laura Méndez', email: 'laura@holocron.local' },
      },
    ],
    comments: [
      {
        id: 'c-1',
        body: 'Actualizar cotas de borde antes de liberar a obra.',
        createdAt: '2026-07-02T09:15:00.000Z',
        author: { id: 'u-2', name: 'José Ramírez', email: 'jose@holocron.local' },
      },
    ],
    audit: [
      { id: 'a-1', action: 'visualization', createdAt: '2026-07-02T09:20:00.000Z', actorId: 'u-2' },
      {
        id: 'a-2',
        action: 'upload_new_version',
        createdAt: '2026-07-02T09:00:00.000Z',
        actorId: 'u-1',
      },
    ],
  },
  'mock-doc-2': {
    ...fallbackDocuments[1],
    currentVersion: {
      id: 'ver-2',
      revision: 'A',
      fileName: 'MEC-SUB-021.xlsx',
      fileExtension: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: 932000,
      notes: 'Submittal para aprobación',
      createdAt: '2026-07-01T17:20:00.000Z',
      uploadedBy: { id: 'u-2', name: 'José Ramírez', email: 'jose@holocron.local' },
    },
    preview: {
      available: false,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      url: null,
    },
    metadata: [
      { id: 'm-3', metaKey: 'proveedor', metaValue: 'HVAC Solutions', valueType: 'string' },
    ],
    versions: [
      {
        id: 'ver-2',
        revision: 'A',
        fileName: 'MEC-SUB-021.xlsx',
        fileExtension: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sizeBytes: 932000,
        notes: 'Submittal para aprobación',
        createdAt: '2026-07-01T17:20:00.000Z',
        uploadedBy: { id: 'u-2', name: 'José Ramírez', email: 'jose@holocron.local' },
      },
    ],
    comments: [],
    audit: [
      {
        id: 'a-3',
        action: 'request_approval',
        createdAt: '2026-07-01T17:25:00.000Z',
        actorId: 'u-2',
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

function formatSize(size?: number) {
  if (!size) return 'Sin tamaño';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
    sizeBytes: file.size,
  };
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

export function DocumentsWorkspace() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<'new' | 'version'>('new');
  const [uploadForm, setUploadForm] = useState<UploadForm>(emptyUploadForm);
  const [uploadFile, setUploadFile] = useState<FilePayload | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    let active = true;

    async function loadBase() {
      setLoading(true);
      try {
        const [projectsResponse, documentsResponse] = await Promise.all([
          apiGet<ProjectOption[]>('/projects', getToken() ?? undefined),
          apiGet<DocumentListItem[]>(
            `/documents${search ? `?search=${encodeURIComponent(search)}` : ''}`,
            getToken() ?? undefined
          ),
        ]);
        if (!active) return;
        setProjects(projectsResponse.length ? projectsResponse : fallbackProjects);
        const docs = documentsResponse.length ? documentsResponse : fallbackDocuments;
        setDocuments(docs);
        setSelectedDocumentId((current) => current || docs[0]?.id || '');
      } catch {
        if (!active) return;
        setProjects(fallbackProjects);
        setDocuments(fallbackDocuments);
        setSelectedDocumentId((current) => current || fallbackDocuments[0]?.id || '');
        setError('Se cargó una vista de ejemplo porque la API documental aún no respondió.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBase();
    return () => {
      active = false;
    };
  }, [search]);

  useEffect(() => {
    let canceled = false;
    if (!selectedDocumentId) return;

    async function loadDetail() {
      setDetailLoading(true);
      try {
        const response = await apiGet<DocumentDetail>(
          `/documents/${selectedDocumentId}`,
          getToken() ?? undefined
        );
        if (!canceled) setDetail(response);
      } catch {
        if (!canceled)
          setDetail(fallbackDetail[selectedDocumentId] ?? fallbackDetail['mock-doc-1']);
      } finally {
        if (!canceled) setDetailLoading(false);
      }
    }

    void loadDetail();
    return () => {
      canceled = true;
    };
  }, [selectedDocumentId]);

  useEffect(() => {
    let objectUrl = '';
    if (!detail?.preview.available) {
      setPreviewUrl('');
      return;
    }

    fetchProtectedBlob(`/documents/${detail.id}/content`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => setPreviewUrl(''));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [detail?.id, detail?.preview.available]);

  const metrics = useMemo(() => {
    const total = documents.length;
    const approvals = documents.filter((item) => item.status === 'pending_approval').length;
    const review = documents.filter((item) => item.status === 'in_review').length;
    const overdue = documents.filter((item) => item.status === 'expired').length;
    return [
      { label: 'Documentos', value: total, icon: FilePlus2 },
      { label: 'Pendientes de aprobación', value: approvals, icon: Send },
      { label: 'En revisión', value: review, icon: Eye },
      { label: 'Vencidos', value: overdue, icon: FileClock },
    ];
  }, [documents]);

  function openNewUpload() {
    setUploadMode('new');
    setUploadForm(emptyUploadForm);
    setUploadFile(null);
    setShowUpload(true);
  }

  function openNewVersion() {
    if (!detail) return;
    setUploadMode('version');
    setUploadForm(() => ({
      ...emptyUploadForm,
      projectId: detail.projectId,
      folderId: detail.folderId ?? '',
      disciplineId: detail.disciplineId ?? '',
      documentNumber: detail.documentNumber,
      name: detail.name,
      revision: detail.currentVersion?.revision ? `${detail.currentVersion.revision}-1` : 'B',
    }));
    setUploadFile(null);
    setShowUpload(true);
  }

  async function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const payload = await fileToPayload(file);
    setUploadFile(payload);
    if (!uploadForm.name) {
      setUploadForm((current) => ({ ...current, name: file.name.replace(/\.[^.]+$/, '') }));
    }
  }

  async function submitUpload() {
    if (!uploadFile) {
      setError('Selecciona un archivo antes de guardar.');
      return;
    }

    try {
      if (uploadMode === 'new') {
        const created = await apiPost<DocumentDetail>(
          '/documents',
          {
            ...uploadForm,
            fileName: uploadFile.fileName,
            mimeType: uploadFile.mimeType,
            base64Content: uploadFile.base64Content,
            sizeBytes: uploadFile.sizeBytes,
          },
          getToken() ?? undefined
        );
        setDocuments((current) => [created, ...current]);
        setSelectedDocumentId(created.id);
      } else if (detail) {
        const updated = await apiPost<DocumentDetail>(
          `/documents/${detail.id}/versions`,
          {
            fileName: uploadFile.fileName,
            mimeType: uploadFile.mimeType,
            base64Content: uploadFile.base64Content,
            sizeBytes: uploadFile.sizeBytes,
            revision: uploadForm.revision,
            notes: uploadForm.notes,
          },
          getToken() ?? undefined
        );
        setDetail(updated);
        setDocuments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      setShowUpload(false);
      setError('');
    } catch {
      setError('No fue posible guardar el archivo o la nueva versión.');
    }
  }

  async function saveComment() {
    if (!detail || !comment.trim()) return;
    try {
      const updated = await apiPost<DocumentDetail>(
        `/documents/${detail.id}/comments`,
        { body: comment },
        getToken() ?? undefined
      );
      setDetail(updated);
      setComment('');
    } catch {
      setError('No fue posible registrar el comentario.');
    }
  }

  async function runAction(action: 'request-approval' | 'approve' | 'reject' | 'print') {
    if (!detail) return;
    try {
      if (action === 'request-approval') {
        await apiPost('/approvals/requests', { documentId: detail.id }, getToken() ?? undefined);
        const refreshed = await apiGet<DocumentDetail>(
          `/documents/${detail.id}`,
          getToken() ?? undefined
        );
        setDetail(refreshed);
        setDocuments((current) =>
          current.map((item) => (item.id === refreshed.id ? refreshed : item))
        );
      } else {
        const result = await apiPost<DocumentDetail | { ok: true }>(
          `/documents/${detail.id}/${action}`,
          {},
          getToken() ?? undefined
        );
        if ('id' in result) {
          setDetail(result);
          setDocuments((current) => current.map((item) => (item.id === result.id ? result : item)));
        } else if (action === 'print') {
          setError('');
        }
      }
    } catch {
      setError('No fue posible ejecutar la acción solicitada.');
    }
  }

  async function updateStatus(status: string) {
    if (!detail) return;
    try {
      const updated = await apiPatch<DocumentDetail>(
        `/documents/${detail.id}`,
        { status },
        getToken() ?? undefined
      );
      setDetail(updated);
      setDocuments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
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
      anchor.download =
        detail.currentVersion?.fileName ??
        `${detail.documentNumber}.${detail.fileExtension ?? 'bin'}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No fue posible descargar el archivo.');
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Documentos</h1>
          <p className="muted">
            Carga, visor, historial de versiones, comentarios y auditoría documental.
          </p>
        </div>
        <div className="projects-actions">
          <button className="button" type="button" onClick={openNewUpload}>
            <Upload size={18} />
            Cargar documento
          </button>
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
        <aside className="card span-4">
          <div className="panel-header">
            <h2>Tabla de documentos</h2>
            <span className="pill">{loading ? 'Cargando' : `${documents.length} registros`}</span>
          </div>
          <div className="field">
            <label>Buscar</label>
            <div className="search-input">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Número, nombre o disciplina"
              />
            </div>
          </div>
          <div className="project-list">
            {documents.map((document) => (
              <button
                className={`project-list-item ${document.id === selectedDocumentId ? 'active' : ''}`}
                key={document.id}
                type="button"
                onClick={() => setSelectedDocumentId(document.id)}
              >
                <div className="project-list-head">
                  <strong>{document.documentNumber}</strong>
                  <span
                    className={`pill ${document.status === 'approved' ? 'success' : document.status === 'expired' ? 'danger' : 'warning'}`}
                  >
                    {normalizeLabel(document.status)}
                  </span>
                </div>
                <span>{document.name}</span>
                <small className="muted">
                  {document.project?.code ?? document.projectId} ·{' '}
                  {document.discipline?.code ?? 'General'}
                </small>
              </button>
            ))}
          </div>
        </aside>

        <div className="span-8 project-detail-stack">
          {detail ? (
            <>
              <article className="card">
                <div className="project-hero">
                  <div>
                    <div className="project-code">{detail.documentNumber}</div>
                    <h2>{detail.name}</h2>
                    <p className="muted">
                      {detail.project?.name ?? detail.projectId} ·{' '}
                      {detail.folder?.name ?? 'Sin carpeta'} ·{' '}
                      {detail.discipline?.name ?? 'Sin disciplina'}
                    </p>
                  </div>
                  <div className="projects-actions">
                    <button className="button secondary" type="button" onClick={openNewVersion}>
                      <History size={18} />
                      Subir nueva versión
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => runAction('request-approval')}
                    >
                      <Send size={18} />
                      Solicitar aprobación
                    </button>
                    <Link className="button" href={`/ai-query?documentId=${detail.id}`}>
                      <Bot size={18} />
                      Consultar con IA
                    </Link>
                  </div>
                </div>

                <div className="project-state-grid">
                  <div className="state-card">
                    <span>Confidencialidad</span>
                    <strong>{normalizeLabel(detail.confidentialityLevel)}</strong>
                  </div>
                  <div className="state-card">
                    <span>Responsable</span>
                    <strong>{detail.responsibleUser?.name ?? 'Sin responsable'}</strong>
                  </div>
                  <div className="state-card">
                    <span>Vencimiento</span>
                    <strong>{detail.dueDate ?? 'Sin fecha'}</strong>
                  </div>
                  <div className="state-card">
                    <span>Renovable</span>
                    <strong>{detail.renewable ? 'Sí' : 'No'}</strong>
                  </div>
                </div>
              </article>

              <div className="grid">
                <article className="card span-8">
                  <div className="panel-header">
                    <h2>Visor del archivo</h2>
                    <span className="pill">
                      {detail.currentVersion
                        ? `Rev. ${detail.currentVersion.revision}`
                        : 'Sin versión'}
                    </span>
                  </div>
                  {detail.preview.available && previewUrl ? (
                    detail.preview.mimeType?.startsWith('image/') ? (
                      <img alt={detail.name} className="document-preview-image" src={previewUrl} />
                    ) : (
                      <iframe
                        className="document-preview-frame"
                        src={previewUrl}
                        title={detail.name}
                      />
                    )
                  ) : (
                    <div className="preview-empty">
                      <p className="muted">
                        No hay vista previa disponible para este formato. Puedes descargarlo o subir
                        una nueva versión.
                      </p>
                    </div>
                  )}
                  <div className="projects-actions" style={{ marginTop: 16 }}>
                    <button className="button secondary" type="button" onClick={downloadCurrent}>
                      <Download size={18} />
                      Descargar
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => runAction('print')}
                    >
                      <Printer size={18} />
                      Imprimir
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => updateStatus('published')}
                    >
                      <CheckCircle2 size={18} />
                      Publicar
                    </button>
                  </div>
                </article>

                <article className="card span-4">
                  <div className="panel-header">
                    <h2>Metadatos</h2>
                    <Eye size={18} color="var(--primary)" />
                  </div>
                  <div className="simple-document-list">
                    <div className="simple-document-item">
                      <strong>Formato</strong>
                      <small>{detail.currentVersion?.mimeType ?? 'Sin archivo'}</small>
                    </div>
                    <div className="simple-document-item">
                      <strong>Tamaño</strong>
                      <small>{formatSize(detail.currentVersion?.sizeBytes)}</small>
                    </div>
                    {detail.metadata.map((item) => (
                      <div className="simple-document-item" key={item.id}>
                        <strong>{item.metaKey}</strong>
                        <small>{item.metaValue ?? 'Sin valor'}</small>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="grid" style={{ marginTop: 16 }}>
                <article className="card span-4">
                  <div className="panel-header">
                    <h2>Historial de versiones</h2>
                    <History size={18} color="var(--primary)" />
                  </div>
                  <div className="simple-document-list">
                    {detail.versions.map((version) => (
                      <div className="simple-document-item" key={version.id}>
                        <strong>Rev. {version.revision}</strong>
                        <span>{version.fileName}</span>
                        <small>
                          {version.notes ?? 'Sin notas'} · {formatSize(version.sizeBytes)}
                        </small>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="card span-4">
                  <div className="panel-header">
                    <h2>Comentarios</h2>
                    <MessageSquare size={18} color="var(--primary)" />
                  </div>
                  <div className="field">
                    <label>Nuevo comentario</label>
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Anota observaciones, acuerdos o pendientes."
                    />
                  </div>
                  <button className="button" type="button" onClick={saveComment}>
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
                    <h2>Auditoría</h2>
                    <History size={18} color="var(--accent)" />
                  </div>
                  <div className="simple-document-list">
                    {detail.audit.map((item) => (
                      <div className="simple-document-item" key={item.id}>
                        <strong>{normalizeLabel(item.action)}</strong>
                        <small>{new Date(item.createdAt).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <article className="card" style={{ marginTop: 16 }}>
                <div className="panel-header">
                  <h2>Cambios rápidos de estado</h2>
                  <span className="pill">
                    {detailLoading ? 'Actualizando' : normalizeLabel(detail.status)}
                  </span>
                </div>
                <div className="projects-actions">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => updateStatus('draft')}
                  >
                    Borrador
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => updateStatus('in_review')}
                  >
                    En revisión
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => updateStatus('pending_approval')}
                  >
                    Pendiente de aprobación
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => runAction('approve')}
                  >
                    Aprobar
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => runAction('reject')}
                  >
                    Rechazar
                  </button>
                </div>
              </article>
            </>
          ) : (
            <article className="card">
              <p className="muted">Selecciona un documento para abrir el visor y su historial.</p>
            </article>
          )}
        </div>
      </div>

      {showUpload ? (
        <div className="project-editor">
          <div className="card">
            <div className="panel-header">
              <h2>{uploadMode === 'new' ? 'Cargar documento' : 'Subir nueva versión'}</h2>
              <button
                className="button secondary"
                type="button"
                onClick={() => setShowUpload(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="quick-filters-grid">
              {uploadMode === 'new' ? (
                <>
                  <SelectField
                    label="Proyecto"
                    value={uploadForm.projectId}
                    onChange={(value) =>
                      setUploadForm((current) => ({ ...current, projectId: value }))
                    }
                    options={projects.map((project) => ({
                      value: project.id,
                      label: `${project.code} · ${project.name}`,
                    }))}
                  />
                  <TextField
                    label="Documento"
                    value={uploadForm.name}
                    onChange={(value) => setUploadForm((current) => ({ ...current, name: value }))}
                  />
                  <TextField
                    label="Número documental"
                    value={uploadForm.documentNumber}
                    onChange={(value) =>
                      setUploadForm((current) => ({ ...current, documentNumber: value }))
                    }
                  />
                  <TextField
                    label="Carpeta"
                    value={uploadForm.folderId}
                    onChange={(value) =>
                      setUploadForm((current) => ({ ...current, folderId: value }))
                    }
                  />
                  <TextField
                    label="Disciplina"
                    value={uploadForm.disciplineId}
                    onChange={(value) =>
                      setUploadForm((current) => ({ ...current, disciplineId: value }))
                    }
                  />
                  <TextField
                    label="Responsable"
                    value={uploadForm.responsibleUserId}
                    onChange={(value) =>
                      setUploadForm((current) => ({ ...current, responsibleUserId: value }))
                    }
                  />
                  <SelectField
                    label="Confidencialidad"
                    value={uploadForm.confidentialityLevel}
                    onChange={(value) =>
                      setUploadForm((current) => ({ ...current, confidentialityLevel: value }))
                    }
                    options={[
                      { value: 'public', label: 'Público' },
                      { value: 'internal', label: 'Interno' },
                      { value: 'confidential', label: 'Confidencial' },
                      { value: 'restricted', label: 'Restringido' },
                    ]}
                  />
                  <SelectField
                    label="Estado inicial"
                    value={uploadForm.status}
                    onChange={(value) =>
                      setUploadForm((current) => ({ ...current, status: value }))
                    }
                    options={[
                      { value: 'draft', label: 'Borrador' },
                      { value: 'pending_approval', label: 'Pendiente de aprobación' },
                      { value: 'in_review', label: 'En revisión' },
                      { value: 'approved', label: 'Aprobado' },
                      { value: 'published', label: 'Publicado' },
                      { value: 'expired', label: 'Vencido' },
                    ]}
                  />
                  <TextField
                    label="Fecha de vencimiento"
                    type="date"
                    value={uploadForm.dueDate}
                    onChange={(value) =>
                      setUploadForm((current) => ({ ...current, dueDate: value }))
                    }
                  />
                </>
              ) : null}
              <TextField
                label="Revisión"
                value={uploadForm.revision}
                onChange={(value) => setUploadForm((current) => ({ ...current, revision: value }))}
              />
              <div className="field">
                <label>Archivo</label>
                <input
                  type="file"
                  onChange={(event) => void handleFileChange(event.target.files)}
                />
              </div>
              <div className="field span-2">
                <label>Notas</label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(event) =>
                    setUploadForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Renovable</label>
                <select
                  value={uploadForm.renewable ? 'yes' : 'no'}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      renewable: event.target.value === 'yes',
                    }))
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Sí</option>
                </select>
              </div>
            </div>
            {uploadFile ? (
              <p className="muted">
                Archivo seleccionado: {uploadFile.fileName} · {formatSize(uploadFile.sizeBytes)}
              </p>
            ) : null}
            <div className="projects-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setShowUpload(false)}
              >
                Cancelar
              </button>
              <button className="button" type="button" onClick={submitUpload}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
