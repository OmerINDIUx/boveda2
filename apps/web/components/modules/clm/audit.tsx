'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, History, Layers3, Users } from 'lucide-react';
import { normalizeLabel } from '../../../lib/labels';
import { ContractDetail } from './types';

export function ContractAuditSection({ detail }: { detail: ContractDetail }) {
  const audit = detail.audit ?? [];
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditActorFilter, setAuditActorFilter] = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [auditPerPage, setAuditPerPage] = useState(25);

  useEffect(() => {
    setAuditPage(0);
  }, [auditSearch, auditActionFilter, auditActorFilter, auditDateFrom, auditDateTo]);

  const actions = useMemo(() => Array.from(new Set(audit.map((a) => a.action))).sort(), [audit]);
  const actors = useMemo(
    () =>
      Array.from(
        new Map(
          audit.filter((a) => a.actor?.name).map((a) => [a.actor!.id, a.actor!.name])
        ).entries()
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [audit]
  );

  const filtered = useMemo(
    () =>
      audit.filter((item) => {
        if (
          auditSearch &&
          !normalizeLabel(item.action).toLowerCase().includes(auditSearch.toLowerCase())
        )
          return false;
        if (auditActionFilter && item.action !== auditActionFilter) return false;
        if (auditActorFilter && item.actor?.id !== auditActorFilter) return false;
        if (auditDateFrom && new Date(item.createdAt) < new Date(auditDateFrom)) return false;
        if (auditDateTo) {
          const toEnd = new Date(auditDateTo);
          toEnd.setHours(23, 59, 59, 999);
          if (new Date(item.createdAt) > toEnd) return false;
        }
        return true;
      }),
    [audit, auditSearch, auditActionFilter, auditActorFilter, auditDateFrom, auditDateTo]
  );

  const totalPages = Math.ceil(filtered.length / auditPerPage);
  const paged = filtered.slice(auditPage * auditPerPage, (auditPage + 1) * auditPerPage);

  return (
    <>
      <div className="grid" style={{ marginBottom: 16 }}>
        <article className="card span-3 project-metric info">
          <History size={20} />
          <strong>{audit.length}</strong>
          <span>Registros totales</span>
        </article>
        <article className="card span-3 project-metric">
          <Layers3 size={20} />
          <strong>{actions.length}</strong>
          <span>Tipos de acción</span>
        </article>
        <article className="card span-3 project-metric">
          <Users size={20} />
          <strong>{actors.length}</strong>
          <span>Usuarios distintos</span>
        </article>
        <article className="card span-3 project-metric">
          <CalendarDays size={20} />
          <strong>{filtered.length}</strong>
          <span>Filtrados</span>
        </article>
      </div>
      <article className="card">
        <div className="panel-header">
          <h2>Historial de actividad</h2>
          {(auditSearch ||
            auditActionFilter ||
            auditActorFilter ||
            auditDateFrom ||
            auditDateTo) && (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setAuditSearch('');
                setAuditActionFilter('');
                setAuditActorFilter('');
                setAuditDateFrom('');
                setAuditDateTo('');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div
          className="quick-filters-grid"
          style={{ marginBottom: 16, gridTemplateColumns: 'repeat(5, 1fr)' }}
        >
          <div className="field">
            <label>Buscar acción</label>
            <input
              className="input"
              type="text"
              placeholder="Ej. visualización, descarga..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Tipo de acción</label>
            <select
              className="input"
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {normalizeLabel(a)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Usuario</label>
            <select
              className="input"
              value={auditActorFilter}
              onChange={(e) => setAuditActorFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {actors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Fecha desde</label>
            <input
              className="input"
              type="date"
              value={auditDateFrom}
              onChange={(e) => setAuditDateFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Fecha hasta</label>
            <input
              className="input"
              type="date"
              value={auditDateTo}
              onChange={(e) => setAuditDateTo(e.target.value)}
            />
          </div>
        </div>
        <div className="simple-document-list">
          {paged.map((item) => (
            <div className="simple-document-item" key={item.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <strong>{normalizeLabel(item.action)}</strong>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
              <span>{item.actor?.name ?? 'Usuario'}</span>
            </div>
          ))}
          {paged.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', padding: 32 }}>
              No hay registros de auditoría con los filtros actuales.
            </p>
          )}
        </div>
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              marginTop: 8,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
              {filtered.length} resultados &middot; Página {auditPage + 1} de {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="button secondary"
                disabled={auditPage === 0}
                onClick={() => setAuditPage((p) => p - 1)}
                style={{ minHeight: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem' }}
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = auditPage === pageNum - 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setAuditPage(pageNum - 1)}
                    style={{
                      minWidth: '2rem',
                      height: '2rem',
                      border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 6,
                      background: isActive ? 'var(--primary)' : '#fff',
                      color: isActive ? '#fff' : '#374151',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="button secondary"
                disabled={auditPage >= totalPages - 1}
                onClick={() => setAuditPage((p) => p + 1)}
                style={{ minHeight: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem' }}
              >
                Siguiente
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem' }}>
              <label htmlFor="audit-per-page">Por página:</label>
              <select
                id="audit-per-page"
                className="input"
                value={auditPerPage}
                onChange={(e) => {
                  setAuditPerPage(Number(e.target.value));
                  setAuditPage(0);
                }}
                style={{ minHeight: '2rem', width: 'auto' }}
              >
                {[10, 25, 50, 100].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </article>
    </>
  );
}
