'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Bot,
  CalendarClock,
  FilePlus2,
  FileText,
  Landmark,
  MessageSquare,
  PencilLine,
  RefreshCcw,
  Send,
  ShieldCheck,
  Download,
  Upload,
  Tags,
  BarChart3,
  DollarSign,
  FileSignature,
  FileCode2,
  Library,
  CheckSquare,
  Plus,
  SlidersHorizontal,
  X,
  History,
  Layers3,
  Users,
  CalendarDays,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from './section-header';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { normalizeLabel } from '../../lib/labels';

type Project = {
  id: string;
  name: string;
  code: string;
  workType?: string;
  currentStage?: string;
  targetDate?: string;
  responsible?: { id: string; name: string; email: string } | null;
};

type Tag = { id: string; name: string; color?: string };

type ContractListItem = {
  id: string;
  name: string;
  projectId: string;
  supplierName?: string;
  clientName?: string;
  responsibleArea?: string;
  contractType?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  amount?: string;
  currency: string;
  project?: Project;
  pendingObligations?: number;
  tags?: Tag[];
  responsibleUserId?: string;
  mainDocumentId?: string;
  currentVersionId?: string;
  renewable?: boolean;
  renewalNoticeDays?: number;
  alertDaysBefore?: number;
  parentContractId?: string;
  closeReason?: string;
  closedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ContractDetail = ContractListItem & {
  versions: Array<{
    id: string;
    versionLabel: string;
    fileName: string;
    changeSummary?: string;
    createdAt: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    fileName: string;
    notes?: string;
    createdAt: string;
  }>;
  obligations: Array<{
    id: string;
    description: string;
    commitmentDate?: string;
    status: string;
    comments?: string;
    responsibleUser?: { name: string } | null;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    milestoneDate: string;
    status: string;
    notes?: string;
    responsibleUser?: { name: string } | null;
  }>;
  comments: Array<{ id: string; body: string; createdAt: string; author: { name: string } | null }>;
  audit: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor?: { id: string; name: string } | null;
  }>;
  amendments: Array<{
    id: string;
    amendmentNumber: string;
    title: string;
    description?: string;
    amendmentDate: string;
    status: string;
  }>;
  payments: Array<{
    id: string;
    concept: string;
    amount: string;
    currency: string;
    paymentDate?: string;
    dueDate?: string;
    status: string;
    invoiceNumber?: string;
  }>;
  signatures: Array<{
    id: string;
    provider: string;
    status: string;
    signersJson: any;
    signedAt?: string;
    createdAt: string;
    createdBy?: { id: string; name: string } | null;
  }>;
  negotiations: Array<{
    id: string;
    partyName: string;
    status: string;
    proposedText?: string;
    originalText?: string;
    createdAt: string;
  }>;
  tags: Tag[];
  customValues: Array<{
    id: string;
    fieldId: string;
    value?: string;
    field: { fieldKey: string; fieldLabel: string; fieldType: string };
  }>;
  childrenContracts: Array<{ id: string; name: string; status: string }>;
};

type AskResponse = {
  answer: string;
  status: string;
  citations: Array<{ sourceType: string; label: string; fragment: string }>;
};
type FilePayload = { fileName: string; mimeType: string; base64Content: string; sizeBytes: number };

const statusOptions = [
  { value: 'draft', label: 'Borrador' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'active', label: 'Vigente' },
  { value: 'expiring_soon', label: 'Por vencer' },
  { value: 'expired', label: 'Vencido' },
  { value: 'renewed', label: 'Renovado' },
  { value: 'closed', label: 'Cerrado' },
];

const fallbackProjects: Project[] = [
  { id: 'p1', name: 'Torre Ejecutiva Norte', code: 'HOL-PRJ-001' },
  { id: 'p2', name: 'Planta Oriente', code: 'HOL-PRJ-014' },
];

const fallbackContracts: ContractListItem[] = [
  {
    id: 'c1',
    name: 'Contrato marco de servicios',
    projectId: 'p1',
    supplierName: 'Proveedor A',
    clientName: 'Holocron',
    responsibleArea: 'Legal',
    contractType: 'Servicios',
    status: 'expiring_soon',
    startDate: '2026-01-01',
    endDate: '2026-07-20',
    currency: 'MXN',
    amount: '1200000.00',
    project: fallbackProjects[0],
    pendingObligations: 2,
  },
];

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
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

function formatCurrency(amount?: string, currency = 'MXN') {
  if (!amount) return 'Sin monto';
  const parsed = Number(amount);
  if (Number.isNaN(parsed)) return `${amount} ${currency}`;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(parsed);
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value));
}

function getContractTone(status: string) {
  if (status === 'expired' || status === 'closed') return 'danger';
  if (status === 'expiring_soon' || status === 'in_review') return 'warning';
  return 'success';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
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
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function BatchActionsBar({
  selected,
  onAction,
  onClear,
}: {
  selected: Set<string>;
  onAction: (action: string) => void;
  onClear: () => void;
}) {
  if (selected.size === 0) return null;
  return (
    <div className="card" style={{ marginBottom: 16, padding: 12, background: 'var(--accent-bg)' }}>
      <div className="projects-actions" style={{ alignItems: 'center', gap: 12 }}>
        <strong>{selected.size} seleccionados</strong>
        <button className="button secondary" type="button" onClick={() => onAction('approve')}>
          <ShieldCheck size={16} /> Aprobar
        </button>
        <button className="button secondary" type="button" onClick={() => onAction('activate')}>
          <Landmark size={16} /> Vigentes
        </button>
        <button className="button secondary" type="button" onClick={() => onAction('renew')}>
          <RefreshCcw size={16} /> Renovar
        </button>
        <button className="button secondary" type="button" onClick={() => onAction('close')}>
          <CalendarClock size={16} /> Cerrar
        </button>
        <button className="button secondary" type="button" onClick={onClear}>
          <X size={16} /> Limpiar
        </button>
      </div>
    </div>
  );
}

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [batchMsg, setBatchMsg] = useState('');

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
        const qs = params.toString();
        const items = await apiGet<ContractListItem[]>(
          `/clm/contracts${qs ? `?${qs}` : ''}`,
          getToken()
        );
        if (!active) return;
        setContracts(items.length ? items : fallbackContracts);
        setSelectedId((prev) =>
          items.length ? (items.find((c) => c.id === prev)?.id ?? items[0]?.id ?? '') : ''
        );
      } catch {
        if (!active) return;
        setContracts(fallbackContracts);
        setSelectedId(fallbackContracts[0]?.id ?? '');
        setMessage('Vista de respaldo.');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [search, statusFilter, typeFilter, dateFrom, dateTo, amountMin, amountMax]);

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
      }>('/clm/contracts/batch', { ids: [...selected], action, payload: {} }, getToken());
      setBatchMsg(`Lote: ${result.success} ok, ${result.failed} errores.`);
      setSelected(new Set());
      const items = await apiGet<ContractListItem[]>('/clm/contracts', getToken());
      setContracts(items.length ? items : fallbackContracts);
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
        <Link className="button" href="/clm/new">
          <FilePlus2 size={18} /> Nuevo contrato
        </Link>
        <Link className="button secondary" href="/clm/dashboard">
          <BarChart3 size={18} /> Dashboard
        </Link>
        <Link className="button secondary" href="/clm/import">
          <Upload size={18} /> Importar
        </Link>
        <Link className="button secondary" href="/clm/reports">
          <FileText size={18} /> Reportes
        </Link>
        <Link className="button secondary" href="/clm/templates">
          <FileCode2 size={18} /> Plantillas
        </Link>
        <Link className="button secondary" href="/clm/clauses">
          <Library size={18} /> Cláusulas
        </Link>
        <button
          className="button secondary"
          type="button"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} /> Filtros
        </button>
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
            <span className="pill">{filtered.length}</span>
          </div>
          <div className="quick-filters-grid">
            <div className="field span-2">
              <label>Buscar</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, proveedor, cliente..."
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
                  Abrir expediente
                </Link>
                <Link className="button secondary" href={`/clm/${selectedContract.id}/edit`}>
                  <PencilLine size={18} /> Editar
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

export function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('obligations');
  const [askQuestion, setAskQuestion] = useState('');
  const [askResult, setAskResult] = useState<AskResponse | null>(null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagName, setTagName] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const response = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`, getToken());
        if (!active) return;
        setDetail(response);
      } catch {
        if (!active) return;
        setMessage('No se pudo cargar el detalle.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  async function updateStatus(status: string) {
    if (!detail) return;
    try {
      const response = await apiPatch<ContractDetail>(
        `/clm/contracts/${detail.id}`,
        { status },
        getToken()
      );
      setDetail(response);
    } catch {
      setMessage('No se pudo actualizar el estado.');
    }
  }

  async function runClose() {
    if (!detail) return;
    try {
      const response = await apiPost<ContractDetail>(
        `/clm/contracts/${detail.id}/close`,
        { closeReason: 'Cierre manual' },
        getToken()
      );
      setDetail(response);
    } catch {
      setMessage('No se pudo cerrar.');
    }
  }

  async function runRenew() {
    if (!detail) return;
    try {
      const response = await apiPost<ContractDetail>(
        `/clm/contracts/${detail.id}/renew`,
        { renewalDate: new Date().toISOString().slice(0, 10) },
        getToken()
      );
      setDetail(response);
    } catch {
      setMessage('No se pudo renovar.');
    }
  }

  async function askContract() {
    if (!detail || !askQuestion.trim()) return;
    try {
      const response = await apiPost<AskResponse>(
        `/clm/contracts/${detail.id}/ask`,
        { question: askQuestion },
        getToken()
      );
      setAskResult(response);
    } catch {
      setMessage('No se pudo consultar con IA.');
    }
  }

  async function addTag() {
    if (!detail || !tagName.trim()) return;
    try {
      const response = await apiPost<ContractDetail>(
        `/clm/contracts/${detail.id}/tags`,
        { tagNames: [tagName.trim()] },
        getToken()
      );
      setDetail(response);
      setTagName('');
      setShowTagInput(false);
    } catch {
      setMessage('No se pudo agregar tag.');
    }
  }

  if (!detail && loading)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando...</p>
        </article>
      </section>
    );
  if (!detail)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Contrato no encontrado.</p>
        </article>
      </section>
    );

  const tabs = [
    { key: 'obligations', label: 'Obligaciones', icon: <CheckSquare size={16} /> },
    { key: 'milestones', label: 'Hitos', icon: <CalendarClock size={16} /> },
    { key: 'amendments', label: 'Enmiendas', icon: <FilePlus2 size={16} /> },
    { key: 'payments', label: 'Pagos', icon: <DollarSign size={16} /> },
    { key: 'signatures', label: 'Firmas', icon: <FileSignature size={16} /> },
    { key: 'negotiations', label: 'Negociación', icon: <MessageSquare size={16} /> },
    { key: 'versions', label: 'Versiones', icon: <FileText size={16} /> },
    { key: 'attachments', label: 'Anexos', icon: <Upload size={16} /> },
    { key: 'comments', label: 'Comentarios', icon: <MessageSquare size={16} /> },
  ];

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{detail.name}</h1>
          <p className="muted">Expediente contractual completo.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/clm">
            Volver
          </Link>
          <Link className="button secondary" href={`/clm/${detail.id}/edit`}>
            <PencilLine size={18} /> Editar
          </Link>
          <Link className="button secondary" href={`/clm/${detail.id}/export`}>
            <Download size={18} /> Exportar
          </Link>
          <Link className="button secondary" href={`/clm/${detail.id}/audit`}>
            <ShieldCheck size={18} /> Auditoría
          </Link>
        </div>
      </div>
      {message ? <article className="card muted">{message}</article> : null}

      <article className="card">
        <div className="project-hero">
          <div>
            <div className="project-code">{detail.project?.code ?? detail.projectId}</div>
            <h2>{detail.name}</h2>
            <p className="muted">
              {detail.contractType ?? 'Sin tipo'} · {detail.supplierName ?? 'Sin proveedor'} ·{' '}
              {detail.clientName ?? 'Sin cliente'}
            </p>
          </div>
          <div className="projects-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => updateStatus('approved')}
            >
              <ShieldCheck size={18} /> Aprobar
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => updateStatus('active')}
            >
              <Landmark size={18} /> Vigente
            </button>
            <button className="button secondary" type="button" onClick={runRenew}>
              <RefreshCcw size={18} /> Renovar
            </button>
            <button className="button secondary" type="button" onClick={runClose}>
              <CalendarClock size={18} /> Cerrar
            </button>
          </div>
        </div>
        <div className="project-state-grid">
          <div className="state-card">
            <span>Estado</span>
            <strong>{normalizeLabel(detail.status)}</strong>
          </div>
          <div className="state-card">
            <span>Vencimiento</span>
            <strong>{formatDate(detail.endDate)}</strong>
          </div>
          <div className="state-card">
            <span>Monto</span>
            <strong>{formatCurrency(detail.amount, detail.currency)}</strong>
          </div>
          <div className="state-card">
            <span>Obligaciones pendientes</span>
            <strong>{detail.pendingObligations ?? detail.obligations?.length ?? 0}</strong>
          </div>
        </div>
        {detail.tags?.length ? (
          <div className="projects-actions" style={{ marginTop: 8 }}>
            {detail.tags.map((t) => (
              <span key={t.id} className="pill info">
                {t.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="projects-actions" style={{ marginTop: 8 }}>
          <button
            className="button secondary"
            type="button"
            onClick={() => setShowTagInput(!showTagInput)}
          >
            <Tags size={16} /> {showTagInput ? 'Cerrar' : 'Agregar tag'}
          </button>
          {detail.parentContractId ? <span className="pill info">Contrato derivado</span> : null}
          {detail.childrenContracts?.length ? (
            <span className="pill warn">{detail.childrenContracts.length} derivados</span>
          ) : null}
        </div>
        {showTagInput ? (
          <div className="field" style={{ marginTop: 8 }}>
            <label>Nuevo tag</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Nombre del tag"
              />
              <button className="button" type="button" onClick={addTag}>
                <Plus size={16} /> Agregar
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <div
        className="projects-actions"
        style={{ marginTop: 16, marginBottom: 16, gap: 4, flexWrap: 'wrap' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`button ${activeTab === tab.key ? '' : 'secondary'}`}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{ fontSize: 13 }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'obligations' && (
        <article className="card">
          <div className="panel-header">
            <h2>Obligaciones</h2>
            <Link className="button" href={`/clm/${detail.id}/obligations`}>
              Nueva
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.obligations ?? []).map((o) => (
              <div key={o.id} className="simple-document-item">
                <strong>{o.description}</strong>
                <small>
                  {o.responsibleUser?.name ?? 'Sin responsable'} · {formatDate(o.commitmentDate)} ·{' '}
                  {normalizeLabel(o.status)}
                </small>
                <span>{o.comments ?? ''}</span>
              </div>
            ))}
          </div>
        </article>
      )}
      {activeTab === 'milestones' && (
        <article className="card">
          <div className="panel-header">
            <h2>Hitos</h2>
            <Link className="button" href={`/clm/${detail.id}/milestones`}>
              Nuevo
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.milestones ?? []).map((m) => (
              <div key={m.id} className="simple-document-item">
                <strong>{m.name}</strong>
                <small>
                  {m.responsibleUser?.name ?? 'Sin responsable'} · {formatDate(m.milestoneDate)} ·{' '}
                  {normalizeLabel(m.status)}
                </small>
                <span>{m.notes ?? ''}</span>
              </div>
            ))}
          </div>
        </article>
      )}
      {activeTab === 'amendments' && (
        <article className="card">
          <div className="panel-header">
            <h2>Enmiendas</h2>
            <Link className="button" href={`/clm/${detail.id}/amendments`}>
              Nueva enmienda
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.amendments ?? []).map((a) => (
              <div key={a.id} className="simple-document-item">
                <strong>
                  {a.amendmentNumber} - {a.title}
                </strong>
                <small>
                  {formatDate(a.amendmentDate)} · {normalizeLabel(a.status)}
                </small>
                <span>{a.description ?? ''}</span>
              </div>
            ))}
          </div>
        </article>
      )}
      {activeTab === 'payments' && (
        <article className="card">
          <div className="panel-header">
            <h2>Pagos</h2>
            <Link className="button" href={`/clm/${detail.id}/payments`}>
              Nuevo pago
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.payments ?? []).map((p) => (
              <div key={p.id} className="simple-document-item">
                <strong>{p.concept}</strong>
                <small>
                  {formatCurrency(p.amount, p.currency)} ·{' '}
                  {p.invoiceNumber ? `Factura: ${p.invoiceNumber}` : ''} ·{' '}
                  {normalizeLabel(p.status)}
                </small>
                <span>Vence: {formatDate(p.dueDate)}</span>
              </div>
            ))}
          </div>
        </article>
      )}
      {activeTab === 'signatures' && (
        <article className="card">
          <div className="panel-header">
            <h2>Solicitudes de firma</h2>
            <Link className="button" href={`/clm/${detail.id}/signatures`}>
              Enviar a firma
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.signatures ?? []).map((s) => (
              <div key={s.id} className="simple-document-item">
                <strong>{normalizeLabel(s.provider)}</strong>
                <small>
                  Estado: {normalizeLabel(s.status)} ·{' '}
                  {s.signedAt ? `Firmado: ${formatDate(s.signedAt)}` : 'Pendiente'}
                </small>
              </div>
            ))}
          </div>
        </article>
      )}
      {activeTab === 'negotiations' && (
        <article className="card">
          <div className="panel-header">
            <h2>Negociación</h2>
            <Link className="button" href={`/clm/${detail.id}/negotiations`}>
              Nueva ronda
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.negotiations ?? []).map((n) => (
              <div key={n.id} className="simple-document-item">
                <strong>{n.partyName}</strong>
                <small>Estado: {normalizeLabel(n.status)}</small>
                <span>{n.proposedText?.slice(0, 200)}</span>
              </div>
            ))}
          </div>
        </article>
      )}
      {activeTab === 'versions' && (
        <article className="card">
          <div className="panel-header">
            <h2>Versiones</h2>
            <Link className="button" href={`/clm/${detail.id}/versions`}>
              Subir versión
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.versions ?? []).map((v) => (
              <div key={v.id} className="simple-document-item">
                <strong>{v.versionLabel}</strong>
                <small>{v.fileName}</small>
                <span>{v.changeSummary ?? ''}</span>
              </div>
            ))}
          </div>
        </article>
      )}
      {activeTab === 'attachments' && (
        <article className="card">
          <div className="panel-header">
            <h2>Anexos</h2>
            <Link className="button" href={`/clm/${detail.id}/attachments`}>
              Subir anexo
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.attachments ?? []).map((a) => (
              <div key={a.id} className="simple-document-item">
                <strong>{a.name}</strong>
                <small>{a.fileName}</small>
                <span>{a.notes ?? ''}</span>
              </div>
            ))}
          </div>
        </article>
      )}
      {activeTab === 'comments' && (
        <article className="card">
          <div className="panel-header">
            <h2>Comentarios</h2>
            <Link className="button" href={`/clm/${detail.id}/comments`}>
              Nuevo
            </Link>
          </div>
          <div className="simple-document-list">
            {(detail.comments ?? []).map((c) => (
              <div key={c.id} className="simple-document-item">
                <strong>{c.author?.name ?? 'Usuario'}</strong>
                <small>{new Date(c.createdAt).toLocaleString()}</small>
                <span>{c.body}</span>
              </div>
            ))}
          </div>
        </article>
      )}
      <article className="card" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Consulta IA del contrato</h2>
          <Bot size={18} />
        </div>
        <div className="field">
          <label>Pregunta</label>
          <textarea
            value={askQuestion}
            onChange={(e) => setAskQuestion(e.target.value)}
            placeholder="Ej: ¿Qué obligaciones están pendientes?"
          />
        </div>
        <button className="button" type="button" onClick={askContract}>
          <Send size={18} /> Consultar
        </button>
        {askResult ? (
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            <div className="simple-document-item">
              <strong>{normalizeLabel(askResult.status)}</strong>
              <span style={{ whiteSpace: 'pre-wrap' }}>{askResult.answer}</span>
            </div>
          </div>
        ) : null}
      </article>
    </section>
  );
}

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

export function ContractFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [form, setForm] = useState<any>({
    projectId: '',
    name: '',
    supplierName: '',
    clientName: '',
    responsibleArea: '',
    contractType: '',
    status: 'draft',
    startDate: '',
    endDate: '',
    renewalDate: '',
    amount: '',
    currency: 'MXN',
    responsibleUserId: '',
    renewalNoticeDays: '30',
    closeReason: '',
    parentContractId: '',
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const p = await apiGet<Project[]>('/projects', getToken());
        if (active) setProjects(p.length ? p : fallbackProjects);
      } catch {
        if (active) setProjects(fallbackProjects);
      }
    }
    async function loadTags() {
      try {
        const t = await apiGet<Tag[]>('/clm/tags', getToken());
        if (active) setTags(t);
      } catch {
        setTags([]);
      }
    }
    void loadProjects();
    void loadTags();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !contractId) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const d = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`, getToken());
        if (!active) return;
        setForm({
          projectId: d.projectId,
          name: d.name,
          supplierName: d.supplierName ?? '',
          clientName: d.clientName ?? '',
          responsibleArea: d.responsibleArea ?? '',
          contractType: d.contractType ?? '',
          status: d.status,
          startDate: d.startDate ?? '',
          endDate: d.endDate ?? '',
          renewalDate: d.renewalDate ?? '',
          amount: d.amount ?? '',
          currency: d.currency ?? 'MXN',
          responsibleUserId: d.responsibleUserId ?? '',
          renewalNoticeDays: String(d.renewalNoticeDays ?? 30),
          closeReason: d.closeReason ?? '',
          parentContractId: d.parentContractId ?? '',
        });
        setSelectedTagIds(d.tags?.map((t) => t.id) ?? []);
      } catch {
        setError('No se pudo cargar el contrato.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId, mode]);

  async function submit() {
    if (!form.projectId || !form.name.trim()) {
      setError('Completa proyecto y nombre.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      if (mode === 'create') {
        const created = await apiPost<ContractDetail>('/clm/contracts', payload, getToken());
        if (selectedTagIds.length)
          await apiPost(
            `/clm/contracts/${created.id}/tags`,
            { tagIds: selectedTagIds },
            getToken()
          );
        router.push(`/clm/${created.id}`);
        return;
      }
      if (!contractId) return;
      await apiPatch(`/clm/contracts/${contractId}`, payload, getToken());
      await apiPost(`/clm/contracts/${contractId}/tags`, { tagIds: selectedTagIds }, getToken());
      router.push(`/clm/${contractId}`);
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{mode === 'create' ? 'Nuevo contrato' : 'Editar contrato'}</h1>
        </div>
        <div className="projects-actions">
          <Link
            className="button secondary"
            href={mode === 'create' ? '/clm' : `/clm/${contractId}`}
          >
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="panel-header">
          <h2>Datos del contrato</h2>
        </div>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <>
            <div className="quick-filters-grid clm-form-grid">
              <div className="field">
                <label>Proyecto</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  <option value="">Selecciona</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Nombre"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <TextField
                label="Proveedor"
                value={form.supplierName}
                onChange={(v) => setForm({ ...form, supplierName: v })}
              />
              <TextField
                label="Cliente"
                value={form.clientName}
                onChange={(v) => setForm({ ...form, clientName: v })}
              />
              <TextField
                label="Área responsable"
                value={form.responsibleArea}
                onChange={(v) => setForm({ ...form, responsibleArea: v })}
              />
              <TextField
                label="Tipo"
                value={form.contractType}
                onChange={(v) => setForm({ ...form, contractType: v })}
              />
              <div className="field">
                <label>Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Inicio"
                type="date"
                value={form.startDate}
                onChange={(v) => setForm({ ...form, startDate: v })}
              />
              <TextField
                label="Vencimiento"
                type="date"
                value={form.endDate}
                onChange={(v) => setForm({ ...form, endDate: v })}
              />
              <TextField
                label="Renovación"
                type="date"
                value={form.renewalDate}
                onChange={(v) => setForm({ ...form, renewalDate: v })}
              />
              <TextField
                label="Monto"
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
              />
              <TextField
                label="Moneda"
                value={form.currency}
                onChange={(v) => setForm({ ...form, currency: v })}
              />
              <TextField
                label="Días preaviso"
                value={form.renewalNoticeDays}
                onChange={(v) => setForm({ ...form, renewalNoticeDays: v })}
              />
              <TextField
                label="Contrato padre (id)"
                value={form.parentContractId}
                onChange={(v) => setForm({ ...form, parentContractId: v })}
              />
            </div>
            {tags.length ? (
              <div className="field" style={{ marginTop: 12 }}>
                <label>Tags</label>
                <div className="projects-actions" style={{ gap: 4 }}>
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      className={`button ${selectedTagIds.includes(t.id) ? '' : 'secondary'}`}
                      type="button"
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                        )
                      }
                      style={{ fontSize: 12, padding: '2px 8px' }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="projects-actions" style={{ marginTop: 16 }}>
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : mode === 'create' ? 'Crear contrato' : 'Guardar cambios'}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export function ContractVersionCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({ versionLabel: '', changeSummary: '' });
  const [file, setFile] = useState<FilePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function onSelectFile(fileList: FileList | null) {
    const next = fileList?.[0];
    if (!next) return;
    setFile(await fileToPayload(next));
  }
  async function submit() {
    if (!contractId || !file) {
      setError('Selecciona el archivo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(
        `/clm/contracts/${contractId}/versions`,
        {
          versionLabel: form.versionLabel || `Rev-${Date.now()}`,
          changeSummary: form.changeSummary,
          ...file,
          sizeBytes: String(file.sizeBytes),
        },
        getToken()
      );
      router.push(`/clm/${contractId}`);
    } catch (e) {
      setError(getErrorMessage(e, 'Error al subir.'));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Subir versión</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <TextField
          label="Etiqueta"
          value={form.versionLabel}
          onChange={(v) => setForm({ ...form, versionLabel: v })}
        />
        <TextField
          label="Resumen de cambios"
          value={form.changeSummary}
          onChange={(v) => setForm({ ...form, changeSummary: v })}
        />
        <div className="field">
          <label>Archivo</label>
          <input type="file" onChange={(e) => void onSelectFile(e.target.files)} />
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Subiendo...' : 'Subir versión'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function ContractAttachmentCreatePage() {
  return <ContractVersionCreatePage />;
}

export function ContractObligationCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({ description: '', commitmentDate: '', comments: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (!contractId || !form.description.trim()) {
      setError('Escribe la obligación.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/obligations`, form, getToken());
      router.push(`/clm/${contractId}`);
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nueva obligación</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="field">
          <label>Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <TextField
          label="Fecha compromiso"
          type="date"
          value={form.commitmentDate}
          onChange={(v) => setForm({ ...form, commitmentDate: v })}
        />
        <TextField
          label="Comentarios"
          value={form.comments}
          onChange={(v) => setForm({ ...form, comments: v })}
        />
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function ContractMilestoneCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({ name: '', milestoneDate: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (!contractId || !form.name.trim()) {
      setError('Escribe el hito.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/milestones`, form, getToken());
      router.push(`/clm/${contractId}`);
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo hito</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <TextField
          label="Nombre"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <TextField
          label="Fecha"
          type="date"
          value={form.milestoneDate}
          onChange={(v) => setForm({ ...form, milestoneDate: v })}
        />
        <TextField
          label="Notas"
          value={form.notes}
          onChange={(v) => setForm({ ...form, notes: v })}
        />
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function ContractCommentCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (!contractId || !body.trim()) {
      setError('Escribe el comentario.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/comments`, { body }, getToken());
      router.push(`/clm/${contractId}`);
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo comentario</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="field">
          <label>Comentario</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function ClmDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const d = await apiGet('/clm/dashboard', getToken());
        if (active) setData(d);
      } catch {
        if (active)
          setData({
            contractsByStatus: [],
            contractsByType: [],
            expiringThisMonth: 0,
            totalAmount: 0,
            pendingObligations: 0,
            activeContracts: 0,
            totalContracts: 0,
          });
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading)
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando dashboard...</p>
        </article>
      </section>
    );

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Dashboard CLM"
        description="Indicadores clave de la gestión contractual."
      />
      <div className="grid" style={{ marginBottom: 16 }}>
        <article className="card span-3 project-metric ok">
          <span className="muted">Contratos vigentes</span>
          <strong>{data?.activeContracts ?? 0}</strong>
        </article>
        <article className="card span-3 project-metric warn">
          <span className="muted">Por vencer este mes</span>
          <strong>{data?.expiringThisMonth ?? 0}</strong>
        </article>
        <article className="card span-3 project-metric info">
          <span className="muted">Obligaciones pendientes</span>
          <strong>{data?.pendingObligations ?? 0}</strong>
        </article>
        <article className="card span-3 project-metric info">
          <span className="muted">Monto total contratado</span>
          <strong>{formatCurrency(String(data?.totalAmount ?? 0))}</strong>
        </article>
      </div>
      <div className="grid">
        <article className="card span-6">
          <div className="panel-header">
            <h2>Contratos por estado</h2>
          </div>
          <div className="simple-document-list">
            {(data?.contractsByStatus ?? []).map((item: any) => (
              <div
                key={item.key}
                className="simple-document-item"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span>{normalizeLabel(item.key)}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="card span-6">
          <div className="panel-header">
            <h2>Contratos por tipo</h2>
          </div>
          <div className="simple-document-list">
            {(data?.contractsByType ?? []).map((item: any, i: number) => (
              <div
                key={i}
                className="simple-document-item"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export function ClmImportPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [file, setFile] = useState<FilePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    async function load() {
      try {
        const p = await apiGet<Project[]>('/projects', getToken());
        setProjects(p.length ? p : fallbackProjects);
      } catch {
        setProjects(fallbackProjects);
      }
    }
    void load();
  }, []);
  async function submit() {
    if (!projectId || !file) {
      setError('Selecciona proyecto y archivo CSV.');
      return;
    }
    setSaving(true);
    setError('');
    setResult(null);
    try {
      const r = await apiPost(
        '/clm/contracts/import',
        { projectId, fileName: file.fileName, base64Content: file.base64Content },
        getToken()
      );
      setResult(r);
    } catch (e) {
      setError(getErrorMessage(e, 'Error al importar.'));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <SectionHeader title="Importar contratos" description="Carga masiva desde archivo CSV." />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="field">
          <label>Proyecto</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Selecciona</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Archivo CSV</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setFile(await fileToPayload(f));
            }}
          />
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Importando...' : 'Importar'}
          </button>
        </div>
        {result ? (
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            <div className="simple-document-item">
              <strong>Resultado</strong>
              <span>
                Total: {result.total} · Correctos: {result.success} · Errores:{' '}
                {result.errors?.length ?? 0}
              </span>
            </div>
          </div>
        ) : null}
      </article>
    </section>
  );
}

export function ClmReportsPage() {
  const [type, setType] = useState('contracts_by_status');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function generate() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await apiPost<any>('/clm/reports', { type }, getToken());
      setResult(r);
    } catch (e) {
      setError(getErrorMessage(e, 'Error al generar reporte.'));
    } finally {
      setLoading(false);
    }
  }
  const reportTypes = [
    { value: 'contracts_by_status', label: 'Contratos por estado' },
    { value: 'contracts_by_type', label: 'Contratos por tipo' },
    { value: 'expiration_forecast', label: 'Pronóstico de vencimientos' },
    { value: 'obligations_summary', label: 'Resumen de obligaciones' },
    { value: 'payments_summary', label: 'Resumen de pagos' },
    { value: 'financial_overview', label: 'Panorama financiero' },
  ];
  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Reportes CLM"
        description="Genera reportes avanzados de la gestión contractual."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="field">
          <label>Tipo de reporte</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {reportTypes.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <button className="button" type="button" onClick={generate} disabled={loading}>
          {loading ? 'Generando...' : 'Generar reporte'}
        </button>
        {result ? (
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            <div className="simple-document-item">
              <strong>{result.title}</strong>
              <small>
                Generado: {new Date(result.generatedAt).toLocaleString()} · Total: {result.total}
              </small>
            </div>
            {result.rows.map((row: any, i: number) => (
              <div
                key={i}
                className="simple-document-item"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span>{row.label}</span>
                <strong>
                  {typeof row.value === 'number' && row.label.includes('Monto')
                    ? formatCurrency(String(row.value))
                    : row.value}
                </strong>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}

export function ClmTemplatesListPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const t = await apiGet<any[]>('/clm/templates', getToken());
        setTemplates(t);
      } catch {
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);
  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Plantillas de contrato"
        description="Gestiona plantillas con cláusulas predefinidas."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/clm/templates/new">
          <FilePlus2 size={18} /> Nueva plantilla
        </Link>
        <Link className="button secondary" href="/clm/clauses">
          Biblioteca de cláusulas
        </Link>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : (
        <div className="simple-document-list">
          {templates.map((t) => (
            <Link
              key={t.id}
              className="simple-document-item"
              href={`/clm/templates/${t.id}`}
              style={{ textDecoration: 'none' }}
            >
              <strong>{t.name}</strong>
              <small>
                {t.contractType ?? 'Todos los tipos'} · {t.description ?? ''}
              </small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function ClmTemplateCreatePage() {
  const router = useRouter();
  const [clauses, setClauses] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', contractType: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const c = await apiGet<any[]>('/clm/clauses', getToken());
        setClauses(c);
      } catch {
        setClauses([]);
      }
    }
    void load();
  }, []);
  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const t = await apiPost<{ id: string }>(
        '/clm/templates',
        { ...form, clauseIds: selected },
        getToken()
      );
      router.push(`/clm/templates/${t.id}`);
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nueva plantilla</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/clm/templates">
            Cancelar
          </Link>
        </div>
      </div>
      <article className="card">
        <TextField
          label="Nombre"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <TextField
          label="Descripción"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <TextField
          label="Tipo de contrato"
          value={form.contractType}
          onChange={(v) => setForm({ ...form, contractType: v })}
        />
        {clauses.length ? (
          <div className="field" style={{ marginTop: 12 }}>
            <label>Cláusulas</label>
            <div className="simple-document-list">
              {clauses.map((c) => (
                <div
                  key={c.id}
                  className="simple-document-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setSelected((p) =>
                      p.includes(c.id) ? p.filter((id) => id !== c.id) : [...p, c.id]
                    )
                  }
                >
                  <strong>{c.title}</strong>
                  <small>{selected.includes(c.id) ? '✓ Seleccionada' : 'Click para agregar'}</small>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear plantilla'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function ClmTemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const t = await apiGet(`/clm/templates/${id}`, getToken());
        setTemplate(t);
      } catch {
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);
  if (loading)
    return (
      <section className="projects-workspace">
        <p className="muted">Cargando...</p>
      </section>
    );
  if (!template)
    return (
      <section className="projects-workspace">
        <p className="muted">Plantilla no encontrada.</p>
      </section>
    );
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{template.name}</h1>
          <p className="muted">
            {template.contractType ?? 'Sin tipo'} · {template.description ?? ''}
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/clm/templates">
            Volver
          </Link>
        </div>
      </div>
      <article className="card">
        <div className="panel-header">
          <h2>Cláusulas</h2>
        </div>
        {template.clauses?.length ? (
          <div className="simple-document-list">
            {template.clauses.map((c: any, i: number) => (
              <div key={c.id ?? i} className="simple-document-item">
                <strong>{c.title}</strong>
                <small>{c.category ?? ''}</small>
                <span>{c.content?.slice(0, 300)}...</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Sin cláusulas asignadas.</p>
        )}
      </article>
    </section>
  );
}

export function ClmClausesListPage() {
  const [clauses, setClauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  useEffect(() => {
    async function load() {
      try {
        const c = await apiGet<any[]>(
          `/clm/clauses${category ? `?category=${category}` : ''}`,
          getToken()
        );
        setClauses(c);
      } catch {
        setClauses([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [category]);
  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Biblioteca de cláusulas"
        description="Cláusulas predefinidas para contratos."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/clm/clauses/new">
          <Plus size={18} /> Nueva cláusula
        </Link>
        <Link className="button secondary" href="/clm/templates">
          Plantillas
        </Link>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      <div className="field">
        <label>Categoría</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Filtrar por categoría..."
        />
      </div>
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : (
        <div className="simple-document-list">
          {clauses.map((c) => (
            <div key={c.id} className="simple-document-item">
              <strong>{c.title}</strong>
              <span className="pill info">{c.category ?? 'General'}</span>
              <small>{c.content?.slice(0, 200)}...</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ClmClauseCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', content: '', category: '' });
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await apiPost('/clm/clauses', form, getToken());
      router.push('/clm/clauses');
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nueva cláusula</h1>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/clm/clauses">
            Cancelar
          </Link>
        </div>
      </div>
      <article className="card">
        <TextField
          label="Título"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
        />
        <TextField
          label="Categoría"
          value={form.category}
          onChange={(v) => setForm({ ...form, category: v })}
        />
        <div className="field">
          <label>Contenido</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={10}
          />
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={submit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear cláusula'}
          </button>
        </div>
      </article>
    </section>
  );
}

export function ClmCustomFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    contractType: '',
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'string',
  });
  const [saving, setSaving] = useState(false);
  async function load() {
    try {
      const f = await apiGet<any[]>('/clm/custom-fields', getToken());
      setFields(f);
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function createField() {
    if (!form.contractType || !form.fieldKey || !form.fieldLabel) return;
    setSaving(true);
    try {
      await apiPost('/clm/custom-fields', form, getToken());
      setForm({ contractType: '', fieldKey: '', fieldLabel: '', fieldType: 'string' });
      void load();
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Campos personalizados"
        description="Define campos adicionales por tipo de contrato."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <h2>Nuevo campo</h2>
        </div>
        <div className="quick-filters-grid">
          <TextField
            label="Tipo de contrato"
            value={form.contractType}
            onChange={(v) => setForm({ ...form, contractType: v })}
          />
          <TextField
            label="Key (interno)"
            value={form.fieldKey}
            onChange={(v) => setForm({ ...form, fieldKey: v })}
          />
          <TextField
            label="Etiqueta"
            value={form.fieldLabel}
            onChange={(v) => setForm({ ...form, fieldLabel: v })}
          />
          <div className="field">
            <label>Tipo</label>
            <select
              value={form.fieldType}
              onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
            >
              <option value="string">Texto</option>
              <option value="number">Número</option>
              <option value="date">Fecha</option>
              <option value="boolean">Sí/No</option>
            </select>
          </div>
        </div>
        <div className="projects-actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={createField} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear campo'}
          </button>
        </div>
      </article>
      <article className="card">
        <div className="panel-header">
          <h2>Campos existentes</h2>
        </div>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <div className="simple-document-list">
            {fields.map((f) => (
              <div key={f.id} className="simple-document-item">
                <strong>{f.fieldLabel}</strong>
                <small>
                  {f.contractType} · {f.fieldType} · {f.fieldKey}
                </small>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

export function ClmTagsSettingsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  async function load() {
    try {
      const t = await apiGet<Tag[]>('/clm/tags', getToken());
      setTags(t);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function createTag() {
    if (!name.trim()) return;
    try {
      await apiPost('/clm/tags', { name: name.trim(), color }, getToken());
      setName('');
      void load();
    } catch {
      setName(name.trim());
    }
  }
  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Administrar tags"
        description="Gestiona las etiquetas para clasificar contratos."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm">
          Volver
        </Link>
      </div>
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <h2>Nuevo tag</h2>
        </div>
        <div className="quick-filters-grid">
          <TextField label="Nombre" value={name} onChange={setName} />
          <TextField label="Color" value={color} onChange={setColor} />
        </div>
        <button className="button" type="button" onClick={createTag} style={{ marginTop: 12 }}>
          Crear tag
        </button>
      </article>
      <article className="card">
        <div className="panel-header">
          <h2>Tags existentes</h2>
        </div>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <div className="simple-document-list">
            {tags.map((t) => (
              <div
                key={t.id}
                className="simple-document-item"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: t.color ?? '#3b82f6',
                    display: 'inline-block',
                  }}
                />
                <strong>{t.name}</strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
