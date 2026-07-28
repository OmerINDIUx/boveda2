'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { getSessionToken } from '../../lib/auth';

type Analysis = {
  document: { name: string; documentNumber: string };
  version: { revision: string; fileName: string } | null;
  status: string;
  error?: string;
  indexModel?: string;
  transcription: Array<{ id: string; pageNumber?: number; sectionLabel?: string; text: string }>;
  indexItems: Array<{ label: string; value: string }>;
};

export function DocumentAnalysisPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const token = getSessionToken();

  async function load() {
    setLoading(true);
    try {
      setData(await apiGet<Analysis>(`/ai-query/documents/${params.id}/analysis`, token));
      setError('');
    } catch {
      setError('No fue posible cargar la extracción.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  async function processWithOllama() {
    setProcessing(true);
    try {
      await apiPost(`/ai-query/documents/${params.id}/analysis/reindex`, {}, token);
      window.setTimeout(() => void load(), 1200);
    } catch {
      setError('No fue posible iniciar la extracción con Ollama.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <section className="projects-workspace documents-indigo-theme">
      <nav className="breadcrumbs" style={{ marginBottom: 8 }}>
        <Link href="/documents">Documentos</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Extracción IA</span>
      </nav>
      <div className="topbar">
        <div>
          <h1>{data?.document.name ?? 'Extracción del documento'}</h1>
          <p className="muted">Transcripción e información estructurada generada con Ollama.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/documents/${params.id}`}>
            Volver al documento
          </Link>
          <button
            className="button"
            type="button"
            onClick={() => void processWithOllama()}
            disabled={processing || loading}
          >
            <Sparkles size={18} />
            {processing ? 'Procesando…' : 'Procesar con Ollama'}
          </button>
        </div>
      </div>
      {error ? <div className="card alert-error">{error}</div> : null}
      {loading ? (
        <div className="card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
      ) : data ? (
        <div className="grid">
          <article className="card span-5">
            <div className="panel-header">
              <h2>Estado de extracción</h2>
              <strong>{data.status}</strong>
            </div>
            <p className="muted">
              Versión {data.version?.revision ?? '—'} · {data.version?.fileName ?? 'Sin archivo'}
            </p>
            <p>{data.error ?? `Modelo: ${data.indexModel ?? 'Ollama'}`}</p>
            <div className="analysis-stat">
              <strong>{data.transcription.length}</strong>
              <span>bloques de texto</span>
            </div>
            <div className="analysis-stat">
              <strong>{data.indexItems.length}</strong>
              <span>datos estructurados</span>
            </div>
          </article>
          <article className="card span-7">
            <div className="panel-header">
              <h2>Datos extraídos</h2>
            </div>
            {data.indexItems.length ? (
              data.indexItems.map((item, index) => (
                <div className="analysis-index-row" key={`${item.label}-${index}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))
            ) : (
              <p className="muted">No hay datos estructurados todavía.</p>
            )}
          </article>
          <article className="card span-12">
            <div className="panel-header">
              <h2>Transcripción</h2>
            </div>
            {data.transcription.length ? (
              data.transcription.map((item) => (
                <div className="analysis-transcription-row" key={item.id}>
                  <span>
                    {item.sectionLabel ??
                      (item.pageNumber ? `Página ${item.pageNumber}` : 'Fragmento')}
                  </span>
                  <p>{item.text}</p>
                </div>
              ))
            ) : (
              <p className="muted">No hay texto extraído todavía.</p>
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}
