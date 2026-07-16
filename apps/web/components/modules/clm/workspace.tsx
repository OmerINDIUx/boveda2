'use client';

import Link from 'next/link';
import {
  BarChart3,
  FileCode2,
  FilePlus2,
  FileText,
  Library,
  BriefcaseBusiness,
  MessageSquare,
  SlidersHorizontal,
  Upload,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet, apiPost } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';
import type {
  ContractListItem,
  PaginatedResponse,
  TextSearchResult,
  SearchResponse,
} from './types';
import {
  formatCurrency,
  formatDate,
  getContractTone,
  getLifecycleLabel,
  statusOptions,
  fallbackContracts,
  TextField,
  BatchActionsBar,
} from './utils';

export function ClmWorkspacePage() {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [batchMsg, setBatchMsg] = useState('');
  const [textResults, setTextResults] = useState<TextSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        if (typeFilter) params.set('contractType', typeFilter);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (amountMin) params.set('amountMin', amountMin);
        if (amountMax) params.set('amountMax', amountMax);
        params.set('page', String(page));
        const qs = params.toString();
        const result = await apiGet<PaginatedResponse<ContractListItem>>(
          `/clm/contracts${qs ? `?${qs}` : ''}`
        );
        if (!active) return;
        setContracts(result.items.length ? result.items : fallbackContracts);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setSelectedId((prev: string) =>
          result.items.length
            ? (result.items.find((c: ContractListItem) => c.id === prev)?.id ??
              result.items[0]?.id ??
              '')
            : ''
        );
      } catch {
        if (!active) return;
        setContracts(fallbackContracts);
        setTotal(fallbackContracts.length);
        setTotalPages(1);
        setSelectedId(fallbackContracts[0]?.id ?? '');
        setMessage('Vista de respaldo.');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [search, statusFilter, typeFilter, dateFrom, dateTo, amountMin, amountMax, page]);

  useEffect(() => {
    if (!search || search.length < 3) {
      setTextResults([]);
      return;
    }
    let active = true;
    setSearching(true);
    async function searchText() {
      try {
        const res = await apiGet<SearchResponse>(
          `/clm/search?q=${encodeURIComponent(search)}&page=1&limit=5`
        );
        if (!active) return;
        setTextResults(res.textResults ?? []);
      } catch {
        if (!active) return;
        setTextResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }
    const timer = setTimeout(() => void searchText(), 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const filtered = useMemo(() => contracts, [contracts]);
  const selectedContract = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  async function handleBatch(action: string) {
    if (selected.size === 0) return;
    setBatchMsg('');
    try {
      const result = await apiPost<{
        results: Array<{ id: string; ok: boolean; error?: string }>;
        total: number;
        success: number;
        failed: number;
      }>('/clm/contracts/batch', { ids: [...selected], action, payload: {} });
      setBatchMsg(`Lote: ${result.success} ok, ${result.failed} errores.`);
      setSelected(new Set());
      setPage(1);
      const res = await apiGet<PaginatedResponse<ContractListItem>>('/clm/contracts');
      setContracts(res.items.length ? res.items : fallbackContracts);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setBatchMsg('Error en operación masiva.');
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeCount = contracts.filter((c) => c.status === 'active').length;
  const expiringCount = contracts.filter((c) => c.status === 'expiring_soon').length;
  const expiredCount = contracts.filter((c) => c.status === 'expired').length;
  const pendingCount = contracts.reduce((t, c) => t + (c.pendingObligations ?? 0), 0);

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Contratos"
        description="Centro de gestión contractual con búsqueda avanzada, filtros y operaciones masivas."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          <BriefcaseBusiness size={18} /> Contratos
        </Link>
        <Link className="button secondary" href="/clm/requests">
          <MessageSquare size={18} /> Solicitudes
        </Link>
        <Link className="button secondary" href="/clm/counterparties">
          <Users size={18} /> Contrapartes
        </Link>
        <Link className="button secondary" href="/clm/dashboard">
          <BarChart3 size={18} /> Dashboard
        </Link>
        <Link className="button secondary" href="/clm/templates">
          <FileCode2 size={18} /> Plantillas
        </Link>
        <Link className="button secondary" href="/clm/clauses">
          <Library size={18} /> Cláusulas
        </Link>
        <Link className="button secondary" href="/clm/reports">
          <FileText size={18} /> Reportes
        </Link>
        <Link className="button secondary" href="/clm/import">
          <Upload size={18} /> Importar
        </Link>
      </div>
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/clm/new">
          <FilePlus2 size={18} /> Nuevo contrato
        </Link>
        <Link className="button secondary" href="/rfis/new">
          <MessageSquare size={18} /> Nuevo RFI
        </Link>
      </div>
      {message ? <article className="card muted">{message}</article> : null}
      {batchMsg ? <article className="card muted">{batchMsg}</article> : null}
      <div className="grid" style={{ marginBottom: 16 }}>
        <article className="card span-3 project-metric ok">
          <span className="muted">Vigentes</span>
          <strong>{activeCount}</strong>
        </article>
        <article className="card span-3 project-metric warn">
          <span className="muted">Por vencer</span>
          <strong>{expiringCount}</strong>
        </article>
        <article className="card span-3 project-metric danger">
          <span className="muted">Vencidos</span>
          <strong>{expiredCount}</strong>
        </article>
        <article className="card span-3 project-metric info">
          <span className="muted">Obligaciones pendientes</span>
          <strong>{pendingCount}</strong>
        </article>
      </div>
      <BatchActionsBar
        selected={selected}
        onAction={handleBatch}
        onClear={() => setSelected(new Set())}
      />
      <section className="grid">
        <article className="card span-5">
          <div className="panel-header">
            <h2>Contratos</h2>
            <div className="projects-actions" style={{ gap: 8 }}>
              <span className="pill">{filtered.length}</span>
              <button
                className="button secondary"
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                style={{ minHeight: 32, padding: '0 10px', fontSize: '0.8125rem' }}
              >
                <SlidersHorizontal size={15} /> Filtros
              </button>
            </div>
          </div>
          <div className="quick-filters-grid">
            <div className="field span-2">
              <label>Buscar</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, proveedor, contenido de documentos..."
              />
            </div>
            <div className="field">
              <label>Estado</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {showFilters ? (
            <div className="quick-filters-grid" style={{ marginTop: 8 }}>
              <TextField label="Tipo" value={typeFilter} onChange={setTypeFilter} />
              <TextField label="Vence desde" type="date" value={dateFrom} onChange={setDateFrom} />
              <TextField label="Vence hasta" type="date" value={dateTo} onChange={setDateTo} />
              <TextField label="Monto mín" value={amountMin} onChange={setAmountMin} />
              <TextField label="Monto máx" value={amountMax} onChange={setAmountMax} />
            </div>
          ) : null}
          {textResults.length > 0 ? (
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <small className="muted" style={{ display: 'block', marginBottom: 4 }}>
                Resultados en contenido de documentos:
              </small>
              {textResults.map((tr, i) => (
                <div
                  key={`tr-${i}`}
                  className="project-list-item"
                  style={{
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderLeft: '3px solid var(--primary)',
                  }}
                  onClick={() => setSelectedId(tr.contractId)}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {tr.contractName || tr.contractId}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--muted)',
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: tr.snippet.replace(
                        new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                        (m) =>
                          `<mark style="background:#fef08a;padding:0 2px;border-radius:2px">${m}</mark>`
                      ),
                    }}
                  />
                </div>
              ))}
            </div>
          ) : null}
          {searching ? (
            <div style={{ padding: '8px 0', textAlign: 'center' }}>
              <small className="muted">Buscando en documentos...</small>
            </div>
          ) : null}
          <div className="project-list" style={{ marginTop: 12 }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`project-list-item ${item.id === selectedId ? 'active' : ''}`}
                style={{ cursor: 'pointer', padding: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{ flex: 1 }} onClick={() => setSelectedId(item.id)}>
                    <div className="project-list-head">
                      <strong>{item.name}</strong>
                      <span className={`pill ${getContractTone(item.status)}`}>
                        {normalizeLabel(item.status)}
                      </span>
                    </div>
                    <span>{item.supplierName ?? item.clientName ?? 'Sin contraparte'}</span>
                    <small className="muted">{getLifecycleLabel(item.lifecycleStage)}</small>
                    <small className="muted">
                      {item.project?.code ?? item.projectId} · {formatDate(item.endDate)} ·{' '}
                      {item.pendingObligations ?? 0} pendientes
                    </small>
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length ? (
              <div className="simple-document-item">No hay contratos con esos filtros.</div>
            ) : null}
          </div>
          {totalPages > 1 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                marginTop: 8,
                borderTop: '1px solid var(--border)',
              }}
            >
              <small className="muted">
                {total} resultados · Página {page} de {totalPages}
              </small>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="button secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ minHeight: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem' }}
                >
                  Anterior
                </button>
                <button
                  className="button secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ minHeight: '2rem', padding: '0 0.625rem', fontSize: '0.8125rem' }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </article>
        <div className="span-7 project-detail-stack">
          {selectedContract ? (
            <article className="card">
              <div className="project-hero">
                <div>
                  <div className="project-code">
                    {selectedContract.project?.code ?? selectedContract.projectId}
                  </div>
                  <h2>{selectedContract.name}</h2>
                  <p className="muted">
                    {selectedContract.contractType ?? 'Sin tipo'} ·{' '}
                    {selectedContract.supplierName ??
                      selectedContract.clientName ??
                      'Sin contraparte'}
                  </p>
                  <small className="muted">
                    Etapa: {getLifecycleLabel(selectedContract.lifecycleStage)}
                  </small>
                </div>
                <div className="projects-actions">
                  <span className={`pill ${getContractTone(selectedContract.status)}`}>
                    {normalizeLabel(selectedContract.status)}
                  </span>
                </div>
              </div>
              <div className="project-state-grid">
                <div className="state-card">
                  <span>Proyecto</span>
                  <strong>{selectedContract.project?.name ?? selectedContract.projectId}</strong>
                </div>
                <div className="state-card">
                  <span>Vencimiento</span>
                  <strong>{formatDate(selectedContract.endDate)}</strong>
                </div>
                <div className="state-card">
                  <span>Monto</span>
                  <strong>
                    {formatCurrency(selectedContract.amount, selectedContract.currency)}
                  </strong>
                </div>
              </div>
              <div className="projects-actions" style={{ marginTop: 12 }}>
                {selectedContract.tags?.map((t) => (
                  <span
                    key={t.id}
                    className="pill info"
                    style={{ background: t.color ?? 'var(--primary-bg)' }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
              <div className="projects-actions" style={{ marginTop: 12 }}>
                <Link className="button" href={`/clm/${selectedContract.id}`}>
                  Ver contrato
                </Link>
              </div>
            </article>
          ) : (
            <article className="card">
              <p className="muted">Selecciona un contrato.</p>
            </article>
          )}
        </div>
      </section>
    </section>
  );
}
