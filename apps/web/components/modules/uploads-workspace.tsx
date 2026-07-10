'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, File, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { buildBrowserApiUrl } from '../../lib/api-base';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const [catalogs, setCatalogs] = useState<
    Array<{ category: string; catalogKey: string; label: string }>
  >([]);
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiGet<Array<{ id: string; name: string }>>('/projects', token);
      setProjects(data);
      if (data.length && !selectedProject) setSelectedProject(data[0].id);
    } catch {
      // Ignore project loading failures in the workspace shell.
    }
  }, [token, selectedProject]);

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
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

  const startUpload = async () => {
    if (!selectedProject || files.length === 0 || uploading) return;
    setUploading(true);
    try {
      const { id } = await apiPost<{ id: string }>(
        '/uploads/bulk/start',
        { projectId: selectedProject, metadata: { catalogKey: selectedCatalog || undefined } },
        token
      );

      for (const file of files) {
        const uploadRes = await fetch(buildBrowserApiUrl('/uploads/init'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });
        const { uploadId: chunkUploadId } = await uploadRes.json();

        const chunkSize = 5 * 1024 * 1024;
        for (let i = 0; i < Math.ceil(file.size / chunkSize); i++) {
          const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
          const chunkForm = new FormData();
          chunkForm.append('chunk', chunk);
          await fetch(buildBrowserApiUrl(`/uploads/${chunkUploadId}/chunks/${i}`), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: chunkForm,
          });
        }

        const complete = await fetch(buildBrowserApiUrl(`/uploads/${chunkUploadId}/complete`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const { fileKey, mimeType, sizeBytes } = await complete.json();

        await apiPost(
          `/uploads/bulk/${id}/files`,
          {
            files: [{ fileKey, originalName: file.name, mimeType, sizeBytes }],
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
            padding: '0.5rem 0.75rem',
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

      <div className="card" style={{ padding: '1.5rem' }}>
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
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--color-primary-light)' : 'var(--surface)',
            transition: 'all 160ms ease',
          }}
        >
          <Upload
            size={40}
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
          <div style={{ marginTop: '1.5rem' }}>
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
                    padding: '0.5rem 0.75rem',
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
                    onClick={() => removeFile(i)}
                    style={{
                      padding: '0.25rem',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--color-danger)',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

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
                    padding: '0.5rem 0.75rem',
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
              marginTop: '1.5rem',
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
