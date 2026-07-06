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
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from './section-header';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

type Project = {
  id: string;
  name: string;
  code: string;
  workType?: string;
  currentStage?: string;
  targetDate?: string;
  responsible?: { id: string; name: string; email: string } | null;
};

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
  audit: Array<{ id: string; action: string; createdAt: string }>;
};

type AskResponse = {
  answer: string;
  status: string;
  citations: Array<{ sourceType: string; label: string; fragment: string }>;
};

type FilePayload = {
  fileName: string;
  mimeType: string;
  base64Content: string;
  sizeBytes: number;
};

type ObligationFormState = {
  description: string;
  commitmentDate: string;
  comments: string;
};

type MilestoneFormState = {
  name: string;
  milestoneDate: string;
  notes: string;
};

type CommentFormState = {
  body: string;
};

type VersionFormState = {
  versionLabel: string;
  changeSummary: string;
};

type AttachmentFormState = {
  name: string;
  notes: string;
};

type ContractFormState = {
  projectId: string;
  name: string;
  supplierName: string;
  clientName: string;
  responsibleArea: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string;
  renewalDate: string;
  amount: string;
  currency: string;
  responsibleUserId: string;
  renewalNoticeDays: string;
  closeReason: string;
};

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

const emptyContractForm: ContractFormState = {
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
  renewalNoticeDays: '',
  closeReason: '',
};

const emptyObligationForm: ObligationFormState = {
  description: '',
  commitmentDate: '',
  comments: '',
};

const emptyMilestoneForm: MilestoneFormState = {
  name: '',
  milestoneDate: '',
  notes: '',
};

const emptyCommentForm: CommentFormState = {
  body: '',
};

const emptyVersionForm: VersionFormState = {
  versionLabel: '',
  changeSummary: '',
};

const emptyAttachmentForm: AttachmentFormState = {
  name: '',
  notes: '',
};

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

const fallbackDetail: ContractDetail = {
  ...fallbackContracts[0],
  versions: [
    {
      id: 'v1',
      versionLabel: 'Rev-A',
      fileName: 'Contrato-Marco-Rev-A.pdf',
      changeSummary: 'Versión contractual inicial aprobada para firma.',
      createdAt: '2026-01-05T11:30:00.000Z',
    },
  ],
  attachments: [
    {
      id: 'a1',
      name: 'Alcance comercial',
      fileName: 'Anexo-Alcance.pdf',
      notes: 'Anexo con matriz de entregables.',
      createdAt: '2026-01-06T10:00:00.000Z',
    },
  ],
  obligations: [
    {
      id: 'o1',
      description: 'Presentar garantía de cumplimiento.',
      commitmentDate: '2026-07-12',
      status: 'pending',
      comments: 'Pendiente de recepción por legal.',
      responsibleUser: { name: 'Laura Méndez' },
    },
  ],
  milestones: [
    {
      id: 'm1',
      name: 'Firma del convenio modificatorio',
      milestoneDate: '2026-07-15',
      status: 'scheduled',
      notes: 'Programar revisión con compras.',
      responsibleUser: { name: 'Paola Cruz' },
    },
  ],
  comments: [
    {
      id: 'cm1',
      body: 'El proveedor confirmó envío de documentación soporte.',
      createdAt: '2026-07-01T16:15:00.000Z',
      author: { name: 'Legal Holocron' },
    },
  ],
  audit: [
    {
      id: 'au1',
      action: 'status_updated',
      createdAt: '2026-07-01T12:00:00.000Z',
    },
  ],
};

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

function normalizeLabel(value?: string | null) {
  if (!value) return 'Sin definir';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(amount?: string, currency = 'MXN') {
  if (!amount) return 'Sin monto';
  const parsed = Number(amount);
  if (Number.isNaN(parsed)) return `${amount} ${currency}`;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(parsed);
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value));
}

function getDaysTo(date?: string) {
  if (!date) return null;
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function getContractTone(status: string) {
  if (status === 'expired' || status === 'closed') return 'danger';
  if (status === 'expiring_soon' || status === 'in_review') return 'warning';
  return 'success';
}

function contractToForm(contract: ContractListItem): ContractFormState {
  return {
    projectId: contract.projectId,
    name: contract.name,
    supplierName: contract.supplierName ?? '',
    clientName: contract.clientName ?? '',
    responsibleArea: contract.responsibleArea ?? '',
    contractType: contract.contractType ?? '',
    status: contract.status ?? 'draft',
    startDate: contract.startDate ?? '',
    endDate: contract.endDate ?? '',
    renewalDate: contract.renewalDate ?? '',
    amount: contract.amount ?? '',
    currency: contract.currency ?? 'MXN',
    responsibleUserId: '',
    renewalNoticeDays: '',
    closeReason: '',
  };
}

function getProjectAutofill(project?: Project | null) {
  return {
    contractType: project?.workType ?? '',
    responsibleArea: project?.currentStage ?? '',
    endDate: project?.targetDate ?? '',
    responsibleUserId: project?.responsible?.id ?? '',
  } satisfies Partial<ContractFormState>;
}

function mergeProjectAutofill(
  form: ContractFormState,
  previousProject?: Project | null,
  nextProject?: Project | null
): ContractFormState {
  const previousAutofill = getProjectAutofill(previousProject);
  const nextAutofill = getProjectAutofill(nextProject);
  const nextForm = { ...form, projectId: nextProject?.id ?? '' };

  (Object.keys(nextAutofill) as Array<keyof typeof nextAutofill>).forEach((key) => {
    const currentValue = form[key] ?? '';
    const previousValue = previousAutofill[key] ?? '';
    const nextValue = nextAutofill[key] ?? '';

    if (!currentValue || currentValue === previousValue) {
      nextForm[key] = nextValue;
    }
  });

  return nextForm;
}

function buildContractPayload(form: ContractFormState) {
  return Object.fromEntries(
    Object.entries({
      projectId: form.projectId,
      name: form.name.trim(),
      supplierName: form.supplierName.trim() || undefined,
      clientName: form.clientName.trim() || undefined,
      responsibleArea: form.responsibleArea.trim() || undefined,
      contractType: form.contractType.trim() || undefined,
      status: form.status || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      renewalDate: form.renewalDate || undefined,
      amount: form.amount.trim() || undefined,
      currency: form.currency.trim() || undefined,
      responsibleUserId: form.responsibleUserId.trim() || undefined,
      renewalNoticeDays: form.renewalNoticeDays.trim() || undefined,
      closeReason: form.closeReason.trim() || undefined,
    }).filter(([, value]) => value !== undefined)
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

async function loadContractDetail(contractId: string) {
  try {
    return await apiGet<ContractDetail>(`/clm/contracts/${contractId}`, getToken());
  } catch {
    return { ...fallbackDetail, id: contractId };
  }
}

function ContractHighlights({ contracts }: { contracts: ContractListItem[] }) {
  const active = contracts.filter((item) => item.status === 'active').length;
  const expiring = contracts.filter((item) => item.status === 'expiring_soon').length;
  const expired = contracts.filter((item) => item.status === 'expired').length;
  const pending = contracts.reduce((total, item) => total + (item.pendingObligations ?? 0), 0);

  return (
    <div className="grid" style={{ marginBottom: 16 }}>
      <article className="card span-3 project-metric ok">
        <span className="muted">Contratos vigentes</span>
        <strong>{active}</strong>
      </article>
      <article className="card span-3 project-metric warn">
        <span className="muted">Por vencer</span>
        <strong>{expiring}</strong>
      </article>
      <article className="card span-3 project-metric danger">
        <span className="muted">Vencidos</span>
        <strong>{expired}</strong>
      </article>
      <article className="card span-3 project-metric info">
        <span className="muted">Obligaciones pendientes</span>
        <strong>{pending}</strong>
      </article>
    </div>
  );
}

function ContractSummaryCard({ contract }: { contract: ContractListItem }) {
  const daysToEnd = getDaysTo(contract.endDate);

  return (
    <article className="card">
      <div className="project-hero">
        <div>
          <div className="project-code">{contract.project?.code ?? contract.projectId}</div>
          <h2>{contract.name}</h2>
          <p className="muted">
            {contract.contractType ?? 'Sin tipo'} ·{' '}
            {contract.supplierName ?? contract.clientName ?? 'Sin contraparte'}
          </p>
        </div>
        <div className="projects-actions">
          <span className={`pill ${getContractTone(contract.status)}`}>
            {normalizeLabel(contract.status)}
          </span>
        </div>
      </div>

      <div className="project-state-grid">
        <div className="state-card">
          <span>Proyecto</span>
          <strong>{contract.project?.name ?? contract.projectId}</strong>
        </div>
        <div className="state-card">
          <span>Vencimiento</span>
          <strong>{formatDate(contract.endDate)}</strong>
        </div>
        <div className="state-card">
          <span>Días restantes</span>
          <strong>{daysToEnd === null ? 'Sin fecha' : `${daysToEnd} días`}</strong>
        </div>
        <div className="state-card">
          <span>Monto</span>
          <strong>{formatCurrency(contract.amount, contract.currency)}</strong>
        </div>
      </div>

      <div className="projects-actions" style={{ marginTop: 16 }}>
        <Link className="button" href={`/clm/${contract.id}`}>
          Abrir expediente
        </Link>
        <Link className="button secondary" href={`/clm/${contract.id}/edit`}>
          <PencilLine size={18} />
          Editar
        </Link>
      </div>
    </article>
  );
}

function ContractFormFields({
  form,
  projects,
  selectedProject,
  onChange,
}: {
  form: ContractFormState;
  projects: Project[];
  selectedProject?: Project | null;
  onChange: (key: keyof ContractFormState, value: string) => void;
}) {
  return (
    <div className="quick-filters-grid clm-form-grid">
      <div className="field">
        <label>Proyecto</label>
        <select
          value={form.projectId}
          onChange={(event) => onChange('projectId', event.target.value)}
        >
          <option value="">Selecciona</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} · {project.name}
            </option>
          ))}
        </select>
        {selectedProject ? (
          <small className="muted">
            Se sugieren tipo, área, vencimiento y responsable con base en {selectedProject.code}.
          </small>
        ) : null}
      </div>
      <TextField label="Contrato" value={form.name} onChange={(value) => onChange('name', value)} />
      <TextField
        label="Proveedor"
        value={form.supplierName}
        onChange={(value) => onChange('supplierName', value)}
      />
      <TextField
        label="Cliente"
        value={form.clientName}
        onChange={(value) => onChange('clientName', value)}
      />
      <TextField
        label="Área responsable"
        value={form.responsibleArea}
        onChange={(value) => onChange('responsibleArea', value)}
      />
      <TextField
        label="Tipo de contrato"
        value={form.contractType}
        onChange={(value) => onChange('contractType', value)}
      />
      <div className="field">
        <label>Estado</label>
        <select value={form.status} onChange={(event) => onChange('status', event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <TextField
        label="Inicio"
        type="date"
        value={form.startDate}
        onChange={(value) => onChange('startDate', value)}
      />
      <TextField
        label="Vencimiento"
        type="date"
        value={form.endDate}
        onChange={(value) => onChange('endDate', value)}
      />
      <TextField
        label="Renovación"
        type="date"
        value={form.renewalDate}
        onChange={(value) => onChange('renewalDate', value)}
      />
      <TextField
        label="Monto"
        value={form.amount}
        onChange={(value) => onChange('amount', value)}
      />
      <TextField
        label="Moneda"
        value={form.currency}
        onChange={(value) => onChange('currency', value)}
      />
      <TextField
        label="Días de preaviso"
        value={form.renewalNoticeDays}
        onChange={(value) => onChange('renewalNoticeDays', value)}
      />
      <TextField
        label="Responsable (id)"
        value={form.responsibleUserId}
        onChange={(value) => onChange('responsibleUserId', value)}
      />
      <div className="field span-3">
        <label>Motivo de cierre</label>
        <textarea
          value={form.closeReason}
          onChange={(event) => onChange('closeReason', event.target.value)}
        />
      </div>
    </div>
  );
}

export function ClmWorkspacePage() {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const contractsResponse = await apiGet<ContractListItem[]>('/clm/contracts', getToken());

        if (!active) return;
        const items = contractsResponse.length ? contractsResponse : fallbackContracts;
        setContracts(items);
        setSelectedId(items[0]?.id ?? '');
      } catch {
        if (!active) return;
        setContracts(fallbackContracts);
        setSelectedId(fallbackContracts[0]?.id ?? '');
        setMessage(
          'Se muestra una vista de respaldo mientras el CLM termina de responder desde la API.'
        );
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      contracts.filter((item) => {
        const searchable = [
          item.name,
          item.supplierName,
          item.clientName,
          item.contractType,
          item.project?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesSearch = searchable.includes(search.toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [contracts, search, statusFilter]
  );

  const selectedContract = useMemo(
    () => filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  useEffect(() => {
    if (selectedContract && selectedContract.id !== selectedId) {
      setSelectedId(selectedContract.id);
    }
  }, [selectedContract, selectedId]);

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="CLM"
        description="Centro de gestión contractual con foco en visibilidad, vencimientos y acciones rápidas."
      />

      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/clm/new">
          <FilePlus2 size={18} />
          Nuevo contrato
        </Link>
      </div>

      {message ? <article className="card muted">{message}</article> : null}

      <ContractHighlights contracts={contracts} />

      <section className="grid">
        <article className="card span-5">
          <div className="panel-header">
            <h2>Contratos</h2>
            <span className="pill">{filtered.length}</span>
          </div>
          <div className="quick-filters-grid" style={{ marginBottom: 16 }}>
            <div className="field span-2">
              <label>Buscar</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Contrato, proveedor, cliente..."
              />
            </div>
            <div className="field">
              <label>Estado</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">Todos</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="project-list">
            {filtered.map((item) => (
              <button
                className={`project-list-item ${item.id === selectedId ? 'active' : ''}`}
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
              >
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
              </button>
            ))}
            {!filtered.length ? (
              <div className="simple-document-item">No hay contratos con ese filtro.</div>
            ) : null}
          </div>
        </article>

        <div className="span-7 project-detail-stack">
          {selectedContract ? (
            <ContractSummaryCard contract={selectedContract} />
          ) : (
            <article className="card">
              <p className="muted">Selecciona un contrato para ver su resumen ejecutivo.</p>
            </article>
          )}

          <article className="card" style={{ marginTop: 16 }}>
            <div className="panel-header">
              <h2>Próximos pasos</h2>
              <Landmark size={18} color="var(--primary)" />
            </div>
            <div className="simple-document-list">
              <div className="simple-document-item">
                <strong>Alta contractual independiente</strong>
                <span>La captura de nuevos contratos ya vive fuera del tablero principal.</span>
              </div>
              <div className="simple-document-item">
                <strong>Detalle por expediente</strong>
                <span>
                  Cada contrato puede abrirse en su propia vista para seguimiento y trazabilidad.
                </span>
              </div>
              <div className="simple-document-item">
                <strong>Edición aislada</strong>
                <span>La modificación del contrato ya no comparte estado con el listado.</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}

export function ContractFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ContractFormState>(emptyContractForm);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) ?? null,
    [projects, form.projectId]
  );

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await apiGet<Project[]>('/projects', getToken());
        if (!active) return;
        setProjects(response.length ? response : fallbackProjects);
      } catch {
        if (!active) return;
        setProjects(fallbackProjects);
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !contractId) return;
    let active = true;

    async function loadContract() {
      setLoading(true);
      setError('');
      try {
        const response = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`, getToken());
        if (!active) return;
        setForm(contractToForm(response));
      } catch {
        if (!active) return;
        const fallback =
          fallbackContracts.find((item) => item.id === contractId) ?? fallbackContracts[0];
        setForm(contractToForm(fallback));
        setError(
          'No fue posible cargar el contrato desde la API; se abrió un respaldo local para edición.'
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadContract();
    return () => {
      active = false;
    };
  }, [contractId, mode]);

  async function submit() {
    if (!form.projectId || !form.name.trim()) {
      setError('Completa al menos proyecto y nombre del contrato.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = buildContractPayload(form);
      if (mode === 'create') {
        const created = await apiPost<ContractDetail>('/clm/contracts', payload, getToken());
        router.push(`/clm/${created.id}`);
        router.refresh();
        return;
      }

      if (!contractId) {
        setError('Falta el identificador del contrato.');
        return;
      }

      const updated = await apiPatch<ContractDetail>(
        `/clm/contracts/${contractId}`,
        payload,
        getToken()
      );
      router.push(`/clm/${updated.id}`);
      router.refresh();
    } catch {
      setError(
        mode === 'create'
          ? 'No fue posible crear el contrato.'
          : 'No fue posible actualizar el contrato.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{mode === 'create' ? 'Nuevo contrato' : 'Editar contrato'}</h1>
          <p className="muted">
            {mode === 'create'
              ? 'Alta contractual en una pantalla dedicada, sin mezclar captura con seguimiento.'
              : 'Edición independiente para no compartir estado con el tablero principal.'}
          </p>
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
          <h2>{mode === 'create' ? 'Datos base del contrato' : 'Actualizar contrato'}</h2>
          <FileText size={18} color="var(--primary)" />
        </div>
        {loading ? (
          <p className="muted">Cargando contrato...</p>
        ) : (
          <>
            <ContractFormFields
              form={form}
              projects={projects}
              selectedProject={selectedProject}
              onChange={(key, value) =>
                setForm((current) => {
                  if (key !== 'projectId') {
                    return { ...current, [key]: value };
                  }

                  const previousProject =
                    projects.find((project) => project.id === current.projectId) ?? null;
                  const nextProject = projects.find((project) => project.id === value) ?? null;

                  if (mode !== 'create') {
                    return { ...current, projectId: value };
                  }

                  return mergeProjectAutofill(current, previousProject, nextProject);
                })
              }
            />
            {selectedProject ? (
              <div className="simple-document-list" style={{ marginTop: 16 }}>
                <div className="simple-document-item">
                  <strong>Datos sugeridos del proyecto</strong>
                  <span>
                    {selectedProject.workType ?? 'Sin tipo de obra'} ·{' '}
                    {selectedProject.currentStage ?? 'Sin etapa'} ·{' '}
                    {selectedProject.targetDate
                      ? formatDate(selectedProject.targetDate)
                      : 'Sin fecha objetivo'}
                  </span>
                  <small>{selectedProject.responsible?.name ?? 'Sin responsable asignado'}</small>
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

export function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [askQuestion, setAskQuestion] = useState('');
  const [askResult, setAskResult] = useState<AskResponse | null>(null);

  useEffect(() => {
    if (!contractId) return;
    let active = true;

    async function loadDetail() {
      setLoading(true);
      setMessage('');
      try {
        const response = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`, getToken());
        if (!active) return;
        setDetail(response);
      } catch {
        if (!active) return;
        setDetail({ ...fallbackDetail, id: contractId });
        setMessage('Se abrió un respaldo local porque la API no devolvió el detalle completo.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDetail();
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
      setMessage('No fue posible actualizar el estado del contrato.');
    }
  }

  async function runClose() {
    if (!detail) return;
    try {
      const response = await apiPost<ContractDetail>(
        `/clm/contracts/${detail.id}/close`,
        { closeReason: 'Cierre manual desde CLM' },
        getToken()
      );
      setDetail(response);
    } catch {
      setMessage('No fue posible cerrar el contrato.');
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
      setMessage('No fue posible renovar el contrato.');
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
      setMessage('No fue posible consultar el contrato con IA.');
    }
  }

  if (!detail && loading) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando expediente contractual...</p>
        </article>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">No fue posible abrir este contrato.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{detail.name}</h1>
          <p className="muted">
            Expediente contractual con historial, seguimiento operativo y trazabilidad.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/clm">
            Volver al listado
          </Link>
          <Link className="button secondary" href="/clm/new">
            Nuevo contrato
          </Link>
          <Link className="button secondary" href={`/clm/${detail.id}/versions/new`}>
            Subir versión
          </Link>
          <Link className="button secondary" href={`/clm/${detail.id}/attachments/new`}>
            Subir anexo
          </Link>
          <Link className="button secondary" href={`/clm/${detail.id}/edit`}>
            <PencilLine size={18} />
            Editar
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
              <ShieldCheck size={18} />
              Aprobar
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => updateStatus('active')}
            >
              <Landmark size={18} />
              Vigente
            </button>
            <button className="button secondary" type="button" onClick={runRenew}>
              <RefreshCcw size={18} />
              Renovar
            </button>
            <button className="button secondary" type="button" onClick={runClose}>
              <CalendarClock size={18} />
              Cerrar
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
            <strong>{detail.pendingObligations ?? detail.obligations.length}</strong>
          </div>
        </div>
      </article>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-6">
          <div className="panel-header">
            <h2>Obligaciones</h2>
            <FileText size={18} color="var(--primary)" />
          </div>
          <div className="projects-actions" style={{ marginBottom: 16 }}>
            <Link className="button" href={`/clm/${detail.id}/obligations/new`}>
              Registrar obligación
            </Link>
          </div>
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            {detail.obligations.map((item) => (
              <div className="simple-document-item" key={item.id}>
                <strong>{item.description}</strong>
                <small>
                  {item.responsibleUser?.name ?? 'Sin responsable'} ·{' '}
                  {formatDate(item.commitmentDate)} · {normalizeLabel(item.status)}
                </small>
                <span>{item.comments ?? 'Sin comentarios'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card span-6">
          <div className="panel-header">
            <h2>Hitos</h2>
            <CalendarClock size={18} color="var(--accent)" />
          </div>
          <div className="projects-actions" style={{ marginBottom: 16 }}>
            <Link className="button" href={`/clm/${detail.id}/milestones/new`}>
              Registrar hito
            </Link>
          </div>
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            {detail.milestones.map((item) => (
              <div className="simple-document-item" key={item.id}>
                <strong>{item.name}</strong>
                <small>
                  {item.responsibleUser?.name ?? 'Sin responsable'} ·{' '}
                  {formatDate(item.milestoneDate)} · {normalizeLabel(item.status)}
                </small>
                <span>{item.notes ?? 'Sin notas'}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-4">
          <div className="panel-header">
            <h2>Versiones</h2>
            <FileText size={18} color="var(--primary)" />
          </div>
          <div className="projects-actions" style={{ marginBottom: 16 }}>
            <Link className="button" href={`/clm/${detail.id}/versions/new`}>
              Subir versión
            </Link>
          </div>
          <div className="simple-document-list">
            {detail.versions.map((item) => (
              <div className="simple-document-item" key={item.id}>
                <strong>{item.versionLabel}</strong>
                <small>{item.fileName}</small>
                <span>{item.changeSummary ?? 'Sin resumen'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card span-4">
          <div className="panel-header">
            <h2>Anexos</h2>
            <FilePlus2 size={18} color="var(--primary)" />
          </div>
          <div className="projects-actions" style={{ marginBottom: 16 }}>
            <Link className="button" href={`/clm/${detail.id}/attachments/new`}>
              Subir anexo
            </Link>
          </div>
          <div className="simple-document-list">
            {detail.attachments.map((item) => (
              <div className="simple-document-item" key={item.id}>
                <strong>{item.name}</strong>
                <small>{item.fileName}</small>
                <span>{item.notes ?? 'Sin notas'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card span-4">
          <div className="panel-header">
            <h2>Comentarios</h2>
            <MessageSquare size={18} color="var(--accent)" />
          </div>
          <div className="projects-actions" style={{ marginBottom: 16 }}>
            <Link className="button" href={`/clm/${detail.id}/comments/new`}>
              Nuevo comentario
            </Link>
          </div>
          <div className="simple-document-list" style={{ marginTop: 16 }}>
            {detail.comments.map((item) => (
              <div className="simple-document-item" key={item.id}>
                <strong>{item.author?.name ?? 'Usuario'}</strong>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
                <span>{item.body}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-8">
          <div className="panel-header">
            <h2>Consulta IA del contrato</h2>
            <Bot size={18} color="var(--primary)" />
          </div>
          <div className="field">
            <label>Pregunta</label>
            <textarea
              value={askQuestion}
              onChange={(event) => setAskQuestion(event.target.value)}
              placeholder="Ejemplo: ¿Qué obligaciones están pendientes o cuándo vence este contrato?"
            />
          </div>
          <button className="button" type="button" onClick={askContract}>
            <Send size={18} />
            Consultar
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

        <article className="card span-4">
          <div className="panel-header">
            <h2>Auditoría</h2>
            <ShieldCheck size={18} color="var(--accent)" />
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
    </section>
  );
}

export function ContractVersionCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [form, setForm] = useState<VersionFormState>(emptyVersionForm);
  const [file, setFile] = useState<FilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;

    async function load() {
      const response = await loadContractDetail(contractId);
      if (!active) return;
      setDetail(response);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  async function onSelectFile(fileList: FileList | null) {
    const next = fileList?.[0];
    if (!next) return;
    const payload = await fileToPayload(next);
    setFile(payload);
    if (!form.versionLabel) {
      setForm((current) => ({ ...current, versionLabel: `Rev-${Date.now()}` }));
    }
  }

  async function submit() {
    if (!contractId || !file) {
      setError('Selecciona el archivo contractual que quieres subir.');
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
      router.refresh();
    } catch (error) {
      setError(getErrorMessage(error, 'No fue posible cargar la nueva versión contractual.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Subir versión contractual</h1>
          <p className="muted">Pantalla dedicada para alta de una nueva versión del expediente.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={contractId ? `/clm/${contractId}` : '/clm'}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="panel-header">
          <h2>{detail?.name ?? 'Versión contractual'}</h2>
          <FileText size={18} color="var(--primary)" />
        </div>
        {loading ? (
          <p className="muted">Cargando contrato...</p>
        ) : (
          <>
            <div className="quick-filters-grid">
              <TextField
                label="Etiqueta de versión"
                value={form.versionLabel}
                onChange={(value) => setForm((current) => ({ ...current, versionLabel: value }))}
              />
              <div className="field span-2">
                <label>Resumen de cambios</label>
                <input
                  value={form.changeSummary}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, changeSummary: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Archivo contractual</label>
              <input type="file" onChange={(event) => void onSelectFile(event.target.files)} />
            </div>
            <div className="projects-actions">
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Subiendo...' : 'Subir versión'}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export function ContractAttachmentCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [form, setForm] = useState<AttachmentFormState>(emptyAttachmentForm);
  const [file, setFile] = useState<FilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;

    async function load() {
      const response = await loadContractDetail(contractId);
      if (!active) return;
      setDetail(response);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  async function onSelectFile(fileList: FileList | null) {
    const next = fileList?.[0];
    if (!next) return;
    const payload = await fileToPayload(next);
    setFile(payload);
    if (!form.name) {
      setForm((current) => ({ ...current, name: next.name.replace(/\.[^.]+$/, '') }));
    }
  }

  async function submit() {
    if (!contractId || !file) {
      setError('Selecciona el archivo del anexo que quieres cargar.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiPost(
        `/clm/contracts/${contractId}/attachments`,
        {
          name: form.name || file.fileName,
          notes: form.notes,
          ...file,
          sizeBytes: String(file.sizeBytes),
        },
        getToken()
      );
      router.push(`/clm/${contractId}`);
      router.refresh();
    } catch (error) {
      setError(getErrorMessage(error, 'No fue posible cargar el anexo.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Subir anexo</h1>
          <p className="muted">Pantalla dedicada para registrar anexos y soportes del contrato.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={contractId ? `/clm/${contractId}` : '/clm'}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="panel-header">
          <h2>{detail?.name ?? 'Anexo contractual'}</h2>
          <FilePlus2 size={18} color="var(--primary)" />
        </div>
        {loading ? (
          <p className="muted">Cargando contrato...</p>
        ) : (
          <>
            <div className="quick-filters-grid">
              <TextField
                label="Nombre del anexo"
                value={form.name}
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              />
              <div className="field span-2">
                <label>Notas</label>
                <input
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Archivo</label>
              <input type="file" onChange={(event) => void onSelectFile(event.target.files)} />
            </div>
            <div className="projects-actions">
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Subiendo...' : 'Subir anexo'}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export function ContractObligationCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [form, setForm] = useState<ObligationFormState>(emptyObligationForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    async function load() {
      const response = await loadContractDetail(contractId);
      if (!active) return;
      setDetail(response);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  async function submit() {
    if (!contractId || !form.description.trim()) {
      setError('Escribe la obligación que quieres registrar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/obligations`, form, getToken());
      router.push(`/clm/${contractId}`);
      router.refresh();
    } catch {
      setError('No fue posible registrar la obligación.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nueva obligación</h1>
          <p className="muted">Pantalla dedicada para alta de obligaciones contractuales.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={contractId ? `/clm/${contractId}` : '/clm'}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="panel-header">
          <h2>{detail?.name ?? 'Obligación contractual'}</h2>
          <FileText size={18} color="var(--primary)" />
        </div>
        {loading ? (
          <p className="muted">Cargando contrato...</p>
        ) : (
          <>
            <div className="field">
              <label>Descripción</label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
            <div className="quick-filters-grid">
              <TextField
                label="Fecha compromiso"
                type="date"
                value={form.commitmentDate}
                onChange={(value) => setForm((current) => ({ ...current, commitmentDate: value }))}
              />
              <div className="field span-2">
                <label>Comentarios</label>
                <input
                  value={form.comments}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, comments: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="projects-actions">
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : 'Registrar obligación'}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export function ContractMilestoneCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [form, setForm] = useState<MilestoneFormState>(emptyMilestoneForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    async function load() {
      const response = await loadContractDetail(contractId);
      if (!active) return;
      setDetail(response);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  async function submit() {
    if (!contractId || !form.name.trim()) {
      setError('Escribe el hito que quieres registrar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/milestones`, form, getToken());
      router.push(`/clm/${contractId}`);
      router.refresh();
    } catch {
      setError('No fue posible registrar el hito.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo hito</h1>
          <p className="muted">Pantalla dedicada para alta de hitos del contrato.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={contractId ? `/clm/${contractId}` : '/clm'}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="panel-header">
          <h2>{detail?.name ?? 'Hito contractual'}</h2>
          <CalendarClock size={18} color="var(--accent)" />
        </div>
        {loading ? (
          <p className="muted">Cargando contrato...</p>
        ) : (
          <>
            <div className="quick-filters-grid">
              <TextField
                label="Nombre"
                value={form.name}
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              />
              <TextField
                label="Fecha"
                type="date"
                value={form.milestoneDate}
                onChange={(value) => setForm((current) => ({ ...current, milestoneDate: value }))}
              />
              <TextField
                label="Notas"
                value={form.notes}
                onChange={(value) => setForm((current) => ({ ...current, notes: value }))}
              />
            </div>
            <div className="projects-actions">
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : 'Registrar hito'}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export function ContractCommentCreatePage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [form, setForm] = useState<CommentFormState>(emptyCommentForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    async function load() {
      const response = await loadContractDetail(contractId);
      if (!active) return;
      setDetail(response);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  async function submit() {
    if (!contractId || !form.body.trim()) {
      setError('Escribe el comentario que quieres registrar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(`/clm/contracts/${contractId}/comments`, form, getToken());
      router.push(`/clm/${contractId}`);
      router.refresh();
    } catch {
      setError('No fue posible registrar el comentario.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nuevo comentario</h1>
          <p className="muted">
            Pantalla dedicada para alta de comentarios del expediente contractual.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={contractId ? `/clm/${contractId}` : '/clm'}>
            Cancelar
          </Link>
        </div>
      </div>
      {error ? <article className="card muted">{error}</article> : null}
      <article className="card">
        <div className="panel-header">
          <h2>{detail?.name ?? 'Comentario contractual'}</h2>
          <MessageSquare size={18} color="var(--accent)" />
        </div>
        {loading ? (
          <p className="muted">Cargando contrato...</p>
        ) : (
          <>
            <div className="field">
              <label>Comentario</label>
              <textarea
                value={form.body}
                onChange={(event) => setForm({ body: event.target.value })}
              />
            </div>
            <div className="projects-actions">
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar comentario'}
              </button>
            </div>
          </>
        )}
      </article>
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
