'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiGet } from '../../../lib/api';
import { getToken, type BitacoraEntry } from './types';

const ITEMS_PER_PAGE = 15;

export function BitacorasListPage() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [entries, setEntries] = useState<BitacoraEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!projectId) return;
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({ projectId });
        if (filtroEstado) query.set('estado', filtroEstado);
        if (filtroTurno) query.set('turno', filtroTurno);
        if (fechaDesde) query.set('fechaDesde', fechaDesde);
        if (fechaHasta) query.set('fechaHasta', fechaHasta);
        const response = await apiGet<BitacoraEntry[]>(`/bitacoras?${query}`, getToken());
        if (!active) return;
        setEntries(response);
      } catch {
        if (!active) return;
        setError('No fue posible cargar la bitácora.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [projectId, filtroEstado, filtroTurno, fechaDesde, fechaHasta]);

  const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));
  const paginated = entries.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Bitácora de Obra</h1>
          <p className="muted">Registro diario de actividades, personal, equipos y recursos.</p>
        </div>
        <div className="projects-actions">
          <Link className="button" href={`/projects/${projectId}/bitacoras/new`}>
            <Plus size={18} />
            Nueva entrada
          </Link>
        </div>
      </div>

      {error ? (
        <div className="card muted" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : null}

      <div className="quick-filters-grid">
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
            Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="firmado">Firmado</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
            Turno
          </label>
          <select
            value={filtroTurno}
            onChange={(e) => {
              setFiltroTurno(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <option value="">Todos los turnos</option>
            <option value="matutino">Matutino</option>
            <option value="vespertino">Vespertino</option>
            <option value="nocturno">Nocturno</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
            Fecha desde
          </label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
            Fecha hasta
          </label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          />
        </div>
      </div>

      {loading ? (
        <article className="card">
          <p className="muted">Cargando bitácora...</p>
        </article>
      ) : entries.length === 0 ? (
        <article className="card">
          <p className="muted">No hay entradas en la bitácora. Crea la primera entrada.</p>
        </article>
      ) : (
        <>
          <section className="grid">
            {paginated.map((entry) => (
              <div className="project-list-item" key={entry.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <BookOpen size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div>
                    <strong>
                      #{entry.folio} - {entry.fecha}
                    </strong>
                    <p className="muted" style={{ fontSize: '0.8rem' }}>
                      {entry.turno} | {entry.createdBy?.name ?? 'Desconocido'}
                      {entry.avanceEstimado ? ` | ${entry.avanceEstimado}% avance` : ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className={`pill ${entry.estado === 'firmado' ? 'success' : entry.estado === 'borrador' ? 'warning' : ''}`}
                  >
                    {entry.estado === 'firmado'
                      ? 'Firmado'
                      : entry.estado === 'borrador'
                        ? 'Borrador'
                        : 'Cerrado'}
                  </span>
                  <Link
                    className="button secondary"
                    href={`/projects/${projectId}/bitacoras/${entry.id}`}
                  >
                    Abrir
                  </Link>
                </div>
              </div>
            ))}
          </section>
          {totalPages > 1 && (
            <div
              className="pagination"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 16,
              }}
            >
              <div className="paginationInfo" style={{ fontSize: 13, color: 'var(--muted)' }}>
                {entries.length} resultados · Página {page} de {totalPages}
              </div>
              <div className="paginationButtons" style={{ display: 'flex', gap: 4 }}>
                <button
                  className="pageBtn"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  style={{
                    padding: '0.4rem 0.7rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '0.4rem 0.7rem',
                      border: `1px solid ${p === page ? 'var(--color-primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: p === page ? 'var(--color-primary)' : '#fff',
                      color: p === page ? '#fff' : 'inherit',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: p === page ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="pageBtn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{
                    padding: '0.4rem 0.7rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
