'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, File, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { uploadFile } from '../../lib/upload';
import { getSessionToken } from '../../lib/auth';
import { useTranslation } from 'react-i18next';

type BulkUploadItem = {
  id: string;
  originalName: string;
  status: string;
  errorMessage?: string;
};

type BulkProgress = {
  status: string;
  totalFiles: number;
  processedFiles: number;
  items: BulkUploadItem[];
};

export function UploadsWorkspace() {
  const { t } = useTranslation();
  const token = getSessionToken();
  const searchParams = useSearchParams();
  const presetProjectId = searchParams.get('projectId') ?? '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProject, setSelectedProject] = useState(presetProjectId);
  const [folders, setFolders] = useState<
    Array<{ id: string; path: string; disciplineId?: string }>
  >([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string; code: string }>>(
    []
  );
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [sharedDiscipline, setSharedDiscipline] = useState('');
  const [sharedResponsible, setSharedResponsible] = useState('');
  const [sharedConfidentiality, setSharedConfidentiality] = useState('internal');
  const [sharedStatus, setSharedStatus] = useState('draft');
  const [sharedDueDate, setSharedDueDate] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [sharedPrefix, setSharedPrefix] = useState('');
  const [fileMetadata, setFileMetadata] = useState<
    Record<string, { name: string; documentNumber: string; notes: string }>
  >({});
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const [catalogs, setCatalogs] = useState<
    Array<{ category: string; catalogKey: string; label: string }>
  >([]);
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiGet<Array<{ id: string; name: string }>>('/projects', token);
      setProjects(data);
      const preferred = data.find((project) => project.id === presetProjectId)?.id;
      if (preferred) setSelectedProject(preferred);
      else if (data.length && !selectedProject) setSelectedProject(data[0].id);
    } catch {
      // Ignore project loading failures in the workspace shell.
    }
  }, [presetProjectId, token, selectedProject]);

  const loadCatalogs = useCallback(async () => {
    try {
      const data = await apiGet<Array<{ category: string; catalogKey: string; label: string }>>(
        '/uploads/catalogs',
        token
      );
      setCatalogs(data);
    } catch {
      // Ignore catalog loading failures and allow uploads without catalog metadata.
    }
  }, [token]);

  useEffect(() => {
    loadProjects();
    loadCatalogs();
  }, [loadProjects, loadCatalogs]);

  useEffect(() => {
    if (!selectedProject) {
      setFolders([]);
      return;
    }
    apiGet<Array<{ id: string; path: string; name?: string; disciplineId?: string }>>(
      `/folders?projectId=${encodeURIComponent(selectedProject)}`,
      token
    )
      .then((data) =>
        setFolders(
          data.map((folder) => ({
            id: folder.id,
            path: folder.path || folder.name || folder.id,
            disciplineId: folder.disciplineId,
          }))
        )
      )
      .catch(() => setFolders([]));
  }, [selectedProject, token]);

  useEffect(() => {
    if (!selectedProject) return;
    Promise.all([
      apiGet<Array<{ id: string; name: string; code: string }>>('/folders/disciplines', token),
      apiGet<
        Array<{
          id: string;
          userId?: string;
          name?: string;
          email?: string;
          user?: { id: string; name: string; email: string };
        }>
      >(`/projects/${selectedProject}/users`, token),
    ])
      .then(([disciplineData, memberData]) => {
        setDisciplines(disciplineData);
        setUsers(
          memberData.map(
            (member) =>
              member.user ?? {
                id: member.userId || member.id,
                name: member.name || member.userId || member.id,
                email: member.email || '',
              }
          )
        );
      })
      .catch(() => {
        setDisciplines([]);
        setUsers([]);
      });
  }, [selectedProject, token]);

  const visibleFolders = useMemo(
    () =>
      sharedDiscipline ? folders.filter((folder) => folder.disciplineId === sharedDiscipline) : [],
    [folders, sharedDiscipline]
  );

  useEffect(() => {
    setSelectedFolder('');
  }, [sharedDiscipline]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
    setFileMetadata((prev) => {
      const next = { ...prev };
      incoming.forEach((file, index) => {
        next[file.name + '-' + file.lastModified + '-' + index] ??= {
          name: file.name.replace(/\.[^.]+$/, ''),
          documentNumber: '',
          notes: '',
        };
      });
      return next;
    });
  };

  const startUpload = async () => {
    if (!selectedProject || !selectedFolder || files.length === 0 || uploading) return;
    setUploading(true);
    try {
      const { id } = await apiPost<{ id: string }>(
        '/uploads/bulk/start',
        { projectId: selectedProject, metadata: { catalogKey: selectedCatalog || undefined } },
        token
      );

      for (const file of files) {
        const fileIndex = files.indexOf(file);
        const key = `${file.name}-${file.lastModified}-${fileIndex}`;
        const meta = fileMetadata[key] ?? {
          name: file.name.replace(/\.[^.]+$/, ''),
          documentNumber: '',
          notes: '',
        };
        const uploaded = await uploadFile(
          file,
          () => token ?? null,
          () => undefined
        );
        await apiPost(
          `/uploads/bulk/${id}/files`,
          {
            files: [
              {
                fileKey: uploaded.fileKey,
                originalName: file.name,
                mimeType: uploaded.mimeType,
                sizeBytes: uploaded.sizeBytes,
                metadata: { ...meta, sharedPrefix, catalogKey: selectedCatalog || undefined },
              },
            ],
          },
          token
        );
        if (!selectedFolder) throw new Error('Selecciona una carpeta compartida antes de cargar.');
        await apiPost(
          '/documents',
          {
            projectId: selectedProject,
            folderId: selectedFolder,
            name: meta.name || `${sharedPrefix || 'Documento'} ${fileIndex + 1}`,
            documentNumber:
              meta.documentNumber ||
              `${sharedPrefix || 'DOC'}-${String(fileIndex + 1).padStart(3, '0')}`,
            notes: meta.notes || sharedNotes || undefined,
            disciplineId: sharedDiscipline || undefined,
            responsibleUserId: sharedResponsible || undefined,
            confidentialityLevel: sharedConfidentiality,
            dueDate: sharedDueDate || undefined,
            fileKey: uploaded.fileKey,
            fileName: uploaded.fileName,
            mimeType: uploaded.mimeType,
            sizeBytes: uploaded.sizeBytes,
            status: 'draft',
          },
          token
        );
      }
      const result = await apiPost<{ status: string; processed: number; total: number }>(
        `/uploads/bulk/${id}/process`,
        {},
        token
      );
      setProgress({
        status: result.status,
        totalFiles: result.total,
        processedFiles: result.processed,
        items: files.map((f) => ({ id: '', originalName: f.name, status: 'completed' })),
      });
      setFiles([]);
    } catch {
      setProgress({
        status: 'failed',
        totalFiles: files.length,
        processedFiles: 0,
        items: files.map((f) => ({
          id: '',
          originalName: f.name,
          status: 'failed',
          errorMessage: 'Error de carga',
        })),
      });
    }
    setUploading(false);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('bulk.title')}</h1>
          <p
            style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}
          >
            {t('bulk.dropzone')}
          </p>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            padding: '0.35rem 0.5rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface)',
            fontSize: '0.875rem',
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <div>
            <strong>Datos compartidos</strong>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              Se aplican a todos los archivos; puedes sobrescribir nombre, número y notas por
              archivo.
            </div>
          </div>
          <span className="pill info">Carga masiva</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '0.65rem',
          }}
        >
          <div className="field">
            <label>Disciplina</label>
            <select value={sharedDiscipline} onChange={(e) => setSharedDiscipline(e.target.value)}>
              <option value="">Selecciona primero</option>
              {disciplines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Carpeta</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              disabled={!sharedDiscipline || !visibleFolders.length}
            >
              <option value="">
                {sharedDiscipline ? 'Selecciona una carpeta' : 'Selecciona disciplina primero'}
              </option>
              {visibleFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.path}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Responsable</label>
            <select
              value={sharedResponsible}
              onChange={(e) => setSharedResponsible(e.target.value)}
            >
              <option value="">Sin responsable</option>
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Confidencialidad</label>
            <select
              value={sharedConfidentiality}
              onChange={(e) => setSharedConfidentiality(e.target.value)}
            >
              <option value="public">Público</option>
              <option value="internal">Interno</option>
              <option value="confidential">Confidencial</option>
              <option value="restricted">Restringido</option>
            </select>
          </div>
          <div className="field">
            <label>Estado inicial</label>
            <select value={sharedStatus} onChange={(e) => setSharedStatus(e.target.value)}>
              <option value="draft">Borrador</option>
              <option value="in_review">En revisión</option>
              <option value="pending_approval">Pendiente de aprobación</option>
              <option value="approved">Aprobado</option>
            </select>
          </div>
          <div className="field">
            <label>Vencimiento</label>
            <input
              type="date"
              value={sharedDueDate}
              onChange={(e) => setSharedDueDate(e.target.value)}
            />
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Prefijo / nombre común</label>
            <input
              value={sharedPrefix}
              onChange={(e) => setSharedPrefix(e.target.value)}
              placeholder="Ej. Contratos 2026"
            />
          </div>
          <div className="field" style={{ gridColumn: 'span 4' }}>
            <label>Notas compartidas</label>
            <input
              value={sharedNotes}
              onChange={(e) => setSharedNotes(e.target.value)}
              placeholder="Notas que se aplicarán a todos"
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--color-primary-light)' : 'var(--surface)',
            transition: 'all 160ms ease',
          }}
        >
          <Upload
            size={24}
            style={{
              color: dragging ? 'var(--color-primary)' : 'var(--text-tertiary)',
              marginBottom: '0.75rem',
            }}
          />
          <p
            style={{
              color: dragging ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              margin: '0 0 0.25rem',
            }}
          >
            {dragging ? 'Suelta los archivos aquí' : t('bulk.dropzone')}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: 0 }}>
            o haz clic para seleccionar archivos
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              {files.length} archivo(s) seleccionado(s)
            </h3>
            <div style={{ display: 'grid', gap: '0.375rem', marginBottom: '1rem' }}>
              {files.map((file, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.35rem 0.5rem',
                    background: 'var(--surface-strong)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <File size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span>{file.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFiles((current) => {
                        const next = new Set(current);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      })
                    }
                  >
                    {expandedFiles.has(i) ? 'Ocultar datos' : 'Editar datos'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    style={{
                      padding: '0.25rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--color-danger)',
                    }}
                  >
                    <X size={14} />
                  </button>
                  {expandedFiles.has(i)
                    ? (() => {
                        const key = `${file.name}-${file.lastModified}-${i}`;
                        const meta = fileMetadata[key] ?? {
                          name: file.name.replace(/\.[^.]+$/, ''),
                          documentNumber: '',
                          notes: '',
                        };
                        return (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                              gap: '0.375rem',
                              marginTop: '0.5rem',
                              width: '100%',
                            }}
                          >
                            <input
                              value={meta.name}
                              onChange={(e) =>
                                setFileMetadata((current) => ({
                                  ...current,
                                  [key]: { ...meta, name: e.target.value },
                                }))
                              }
                              placeholder="Nombre propio"
                            />
                            <input
                              value={meta.documentNumber}
                              onChange={(e) =>
                                setFileMetadata((current) => ({
                                  ...current,
                                  [key]: { ...meta, documentNumber: e.target.value },
                                }))
                              }
                              placeholder="Número documental propio"
                            />
                            <input
                              value={meta.notes}
                              onChange={(e) =>
                                setFileMetadata((current) => ({
                                  ...current,
                                  [key]: { ...meta, notes: e.target.value },
                                }))
                              }
                              placeholder="Notas propias"
                            />
                          </div>
                        );
                      })()
                    : null}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Datos compartidos</label>
              <input
                value={sharedPrefix}
                onChange={(e) => setSharedPrefix(e.target.value)}
                placeholder="Prefijo común opcional para nombres o códigos"
                style={{
                  width: '100%',
                  padding: '0.35rem 0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <small style={{ color: 'var(--text-tertiary)' }}>
                Cada archivo puede sobrescribir su nombre, número y notas abajo.
              </small>
            </div>{' '}
            {catalogs.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                  }}
                >
                  {t('bulk.metadata')}
                </label>
                <select
                  value={selectedCatalog}
                  onChange={(e) => setSelectedCatalog(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">Sin catálogo</option>
                  {catalogs.map((c) => (
                    <option key={c.catalogKey} value={c.catalogKey}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={startUpload}
              disabled={uploading || !selectedProject}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? (
                <>
                  <Clock size={16} /> Subiendo...
                </>
              ) : (
                <>
                  <Upload size={16} /> {t('common.upload')} {files.length} archivo(s)
                </>
              )}
            </button>
          </div>
        )}

        {progress && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '1rem',
              background: 'var(--surface-strong)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {progress.status === 'completed' ? (
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
              ) : progress.status === 'failed' ? (
                <AlertCircle size={16} style={{ color: 'var(--color-danger)' }} />
              ) : (
                <Clock size={16} style={{ color: 'var(--color-primary)' }} />
              )}
              {t('bulk.progress')}: {progress.processedFiles}/{progress.totalFiles}
            </h3>
            <div
              style={{
                height: 6,
                background: 'var(--border)',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(progress.processedFiles / Math.max(progress.totalFiles, 1)) * 100}%`,
                  background:
                    progress.status === 'failed' ? 'var(--color-danger)' : 'var(--color-primary)',
                  borderRadius: '999px',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            {progress.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.25rem 0',
                  fontSize: '0.8125rem',
                }}
              >
                <span>{item.originalName}</span>
                <span
                  style={{
                    color:
                      item.status === 'completed' ? 'var(--color-success)' : 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {item.status === 'completed' ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <AlertCircle size={12} />
                  )}
                  {item.errorMessage ?? item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
