import { ContractListItem, ContractDetail, FilePayload, Project } from './types';
import { normalizeLabel } from '../../../lib/labels';

export const statusOptions = [
  { value: 'draft', label: 'Borrador' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'active', label: 'Vigente' },
  { value: 'expiring_soon', label: 'Por vencer' },
  { value: 'expired', label: 'Vencido' },
  { value: 'renewed', label: 'Renovado' },
  { value: 'closed', label: 'Cerrado' },
];

export const lifecycleStageOptions = [
  { value: 'request', label: 'Solicitud' },
  { value: 'drafting', label: 'Elaboración' },
  { value: 'internal_review', label: 'Revisión interna' },
  { value: 'negotiation', label: 'Negociación' },
  { value: 'approval', label: 'Aprobación' },
  { value: 'signature', label: 'Firma' },
  { value: 'active', label: 'Contrato activo' },
  { value: 'obligations_tracking', label: 'Seguimiento de obligaciones' },
  { value: 'renewal_modification_termination', label: 'Renovación / modificación / terminación' },
  { value: 'archived', label: 'Archivo' },
];

export const fallbackProjects: Project[] = [
  { id: 'p1', name: 'Torre Ejecutiva Norte', code: 'HOL-PRJ-001' },
  { id: 'p2', name: 'Planta Oriente', code: 'HOL-PRJ-014' },
];

export const fallbackContracts: ContractListItem[] = [
  {
    id: 'c1',
    name: 'Contrato marco de servicios',
    projectId: 'p1',
    supplierName: 'Proveedor A',
    clientName: 'Holocron',
    responsibleArea: 'Legal',
    contractType: 'Servicios',
    status: 'expiring_soon',
    lifecycleStage: 'obligations_tracking',
    startDate: '2026-01-01',
    endDate: '2026-07-20',
    currency: 'MXN',
    amount: '1200000.00',
    project: fallbackProjects[0],
    pendingObligations: 2,
  },
];

export function buildFallbackDetail(contractId?: string): ContractDetail | null {
  const item =
    fallbackContracts.find((contract) => contract.id === contractId) ?? fallbackContracts[0];
  if (!item) return null;
  return {
    ...item,
    versions: [],
    attachments: [],
    obligations: [],
    milestones: [],
    comments: [],
    audit: [],
    amendments: [],
    payments: [],
    signatures: [],
    negotiations: [],
    tags: item.tags ?? [],
    customValues: [],
    childrenContracts: [],
    lifecycleHistory: item.lifecycleStage
      ? [
          {
            id: 'fallback-lifecycle-1',
            stage: item.lifecycleStage,
            createdAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
            comments: 'Vista de respaldo sin conexión a la API.',
            decision: 'fallback',
            changedBy: null,
          },
        ]
      : [],
  };
}

export function stripLifecycleFields<T extends Record<string, any>>(payload: T) {
  const rest = { ...payload };
  delete rest.lifecycleStage;
  return rest;
}

export async function fileToPayload(file: File): Promise<FilePayload> {
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

export function formatCurrency(amount?: string, currency = 'MXN') {
  if (!amount) return 'Sin monto';
  const parsed = Number(amount);
  if (Number.isNaN(parsed)) return `${amount} ${currency}`;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(parsed);
}

export function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value));
}

export function getContractTone(status: string) {
  if (status === 'expired' || status === 'closed') return 'danger';
  if (status === 'expiring_soon' || status === 'in_review') return 'warning';
  return 'success';
}

export function getLifecycleLabel(stage?: string) {
  return (
    lifecycleStageOptions.find((item) => item.value === stage)?.label ?? normalizeLabel(stage ?? '')
  );
}

export function formatMinutes(minutes?: number) {
  if (!minutes || minutes < 1) return 'Sin dato';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

import { ShieldCheck, Landmark, RefreshCcw, CalendarClock, X } from 'lucide-react';

export function TextField({
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

export function BatchActionsBar({
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
