'use client';

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  FileCheck2,
  Pencil,
  Plus,
  RefreshCcw,
  Receipt,
  Search,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../../lib/api';
import { buildBrowserApiUrl } from '../../../lib/api-base';
import { getSessionToken } from '../../../lib/auth';
import { uploadFile } from '../../../lib/upload';
import modalStyles from '../../../styles/modal.module.css';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { EmptyState } from '../../ui/empty-state';
import styles from './payments-workspace.module.css';
import type { ContractDetail } from './types';
import { SectionLoadWarning } from './section-load-warning';
import { formatCurrency } from './utils';

type Payment = ContractDetail['payments'][number];
type PaymentStatus = 'scheduled' | 'pending' | 'overdue' | 'paid' | 'cancelled';
type ModalMode = 'schedule' | 'edit' | 'pay';
type Filter = 'all' | PaymentStatus;
type FormState = {
  concept: string;
  amount: string;
  currency: string;
  dueDate: string;
  paymentDate: string;
  invoiceNumber: string;
  notes: string;
  status: PaymentStatus;
};

const blankForm: FormState = {
  concept: '',
  amount: '',
  currency: 'MXN',
  dueDate: '',
  paymentDate: '',
  invoiceNumber: '',
  notes: '',
  status: 'scheduled',
};

const statusMeta: Record<
  PaymentStatus,
  { label: string; badge: 'default' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  scheduled: { label: 'Programado', badge: 'info' },
  pending: { label: 'Pendiente', badge: 'warning' },
  overdue: { label: 'Vencido', badge: 'danger' },
  paid: { label: 'Pagado', badge: 'success' },
  cancelled: { label: 'Cancelado', badge: 'default' },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function paymentStatus(payment: Payment): PaymentStatus {
  if (payment.status === 'paid' || payment.paymentDate) return 'paid';
  if (payment.status === 'cancelled') return 'cancelled';
  if (payment.dueDate && payment.dueDate < today()) return 'overdue';
  if (payment.status === 'pending') return 'pending';
  return 'scheduled';
}

function amount(value?: string) {
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function displayDate(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`)
  );
}

function formFor(payment?: Payment, mode: ModalMode = 'schedule'): FormState {
  if (!payment) return { ...blankForm };
  const currentStatus = paymentStatus(payment);
  return {
    concept: payment.concept,
    amount: payment.amount ?? '',
    currency: payment.currency,
    dueDate: payment.dueDate ?? '',
    paymentDate: mode === 'pay' ? today() : (payment.paymentDate ?? ''),
    invoiceNumber: payment.invoiceNumber ?? '',
    notes: payment.notes ?? '',
    status: mode === 'pay' ? 'paid' : currentStatus === 'overdue' ? 'scheduled' : currentStatus,
  };
}

export function PaymentsWorkspace() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [mode, setMode] = useState<ModalMode | null>(null);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [form, setForm] = useState<FormState>({ ...blankForm });
  const [proof, setProof] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [syncing, setSyncing] = useState('');

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    setLoading(true);
    apiGet<ContractDetail>(`/clm/contracts/${contractId}`)
      .then((result) => active && setDetail(result))
      .catch(() => {
        if (active) setMessage('No se pudieron cargar los pagos. Verifica tu acceso.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [contractId]);

  const payments = useMemo(
    () =>
      (detail?.payments ?? [])
        .slice()
        .sort((left, right) =>
          (left.dueDate ?? '9999-12-31').localeCompare(right.dueDate ?? '9999-12-31')
        ),
    [detail]
  );

  const summary = useMemo(() => {
    const active = payments.filter((item) => paymentStatus(item) !== 'cancelled');
    const paid = active.filter((item) => paymentStatus(item) === 'paid');
    const open = active.filter((item) =>
      ['scheduled', 'pending', 'overdue'].includes(paymentStatus(item))
    );
    return {
      total: active.reduce((sum, item) => sum + amount(item.amount), 0),
      paid: paid.reduce((sum, item) => sum + amount(item.amount), 0),
      open: open.reduce((sum, item) => sum + amount(item.amount), 0),
      overdue: active.filter((item) => paymentStatus(item) === 'overdue').length,
    };
  }, [payments]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((item) => {
      if (filter !== 'all' && paymentStatus(item) !== filter) return false;
      if (!query) return true;
      return [item.concept, item.invoiceNumber, item.notes]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [filter, payments, search]);

  function openModal(nextMode: ModalMode, payment?: Payment) {
    setMode(nextMode);
    setSelected(payment ?? null);
    setForm(formFor(payment, nextMode));
    setProof(null);
    setMessage('');
  }

  function closeModal() {
    if (saving) return;
    setMode(null);
    setSelected(null);
    setProof(null);
  }

  async function save() {
    if (!contractId || !form.concept.trim() || !form.amount || !form.dueDate) {
      setMessage('Completa el concepto, monto y fecha programada.');
      return;
    }
    if (form.status === 'paid' && !form.paymentDate) {
      setMessage('Indica la fecha real del pago.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      let invoiceFileKey = selected?.invoiceFileKey;
      if (proof) {
        const uploaded = await uploadFile(proof, () => getSessionToken() ?? null);
        invoiceFileKey = uploaded.fileKey;
      }
      const payload = {
        ...form,
        concept: form.concept.trim(),
        paymentDate: form.status === 'paid' ? form.paymentDate : '',
        invoiceNumber: form.invoiceNumber.trim(),
        notes: form.notes.trim(),
        invoiceFileKey,
      };
      const result = selected
        ? await apiPatch<ContractDetail>(
            `/clm/contracts/${contractId}/payments/${selected.id}`,
            payload
          )
        : await apiPost<ContractDetail>(`/clm/contracts/${contractId}/payments`, payload);
      setDetail(result);
      setMessage(selected ? 'Pago actualizado correctamente.' : 'Pago programado correctamente.');
      setMode(null);
      setSelected(null);
      setProof(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el pago.');
    } finally {
      setSaving(false);
    }
  }

  async function download(payment: Payment) {
    if (!contractId) return;
    setDownloading(payment.id);
    setMessage('');
    try {
      const token = getSessionToken();
      const response = await fetch(
        buildBrowserApiUrl(`/clm/contracts/${contractId}/payments/${payment.id}/proof`),
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!response.ok) throw new Error('No se pudo descargar el comprobante.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = payment.invoiceFileKey?.replace(/^[0-9a-f-]{36}-/i, '') || 'comprobante';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo descargar el comprobante.');
    } finally {
      setDownloading('');
    }
  }

  async function syncErp(payment: Payment) {
    if (!contractId) return;
    setSyncing(payment.id);
    setMessage('');
    try {
      const result = await apiPost<{ payment: Payment; duplicate: boolean }>(
        `/clm/contracts/${contractId}/payments/${payment.id}/sync-erp`,
        {}
      );
      setDetail((current) =>
        current
          ? {
              ...current,
              payments: current.payments.map((item) =>
                item.id === payment.id ? result.payment : item
              ),
            }
          : current
      );
      setMessage(
        result.duplicate
          ? 'El pago ya estaba sincronizado con el ERP.'
          : 'Pago sincronizado correctamente con el ERP.'
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo sincronizar con el ERP.');
    } finally {
      setSyncing('');
    }
  }

  if (loading && !detail) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando calendario de pagos...</p>
        </article>
      </section>
    );
  }
  if (!detail) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">{message || 'No se encontró el contrato.'}</p>
        </article>
      </section>
    );
  }

  const currency = payments[0]?.currency ?? detail.currency ?? 'MXN';
  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <span className={styles.eyebrow}>Control financiero</span>
          <h1>Calendario de pagos</h1>
          <p className="muted">
            Programa vencimientos, registra pagos y conserva sus comprobantes.
          </p>
        </div>
        <Button iconLeft={<Plus size={16} />} onClick={() => openModal('schedule')}>
          Programar pago
        </Button>
      </div>

      {message ? (
        <div className={styles.message} role="status">
          {message}
        </div>
      ) : null}
      <SectionLoadWarning detail={detail} section="payments" label="los pagos" />

      <div className={styles.metrics}>
        <Metric
          icon={<Wallet size={18} />}
          label="Total programado"
          value={formatCurrency(String(summary.total), currency)}
          hint={`${payments.length} movimientos`}
        />
        <Metric
          icon={<CheckCircle2 size={18} />}
          label="Pagado"
          value={formatCurrency(String(summary.paid), currency)}
          hint={`${summary.total ? Math.round((summary.paid / summary.total) * 100) : 0}% del total`}
          className={styles.paidMetric}
        />
        <Metric
          icon={<CalendarClock size={18} />}
          label="Por pagar"
          value={formatCurrency(String(summary.open), currency)}
          hint="Compromisos abiertos"
          className={styles.pendingMetric}
        />
        <Metric
          icon={<AlertTriangle size={18} />}
          label="Vencidos"
          value={String(summary.overdue)}
          hint={summary.overdue ? 'Requieren atención' : 'Todo al corriente'}
          className={summary.overdue ? styles.overdueMetric : ''}
        />
      </div>

      <article className={`card ${styles.workspaceCard}`}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={16} />
            <input
              aria-label="Buscar pagos"
              placeholder="Buscar concepto, factura o nota..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className={styles.filters} aria-label="Filtrar pagos">
            {(
              [
                ['all', 'Todos'],
                ['scheduled', 'Programados'],
                ['overdue', 'Vencidos'],
                ['paid', 'Pagados'],
              ] as Array<[Filter, string]>
            ).map(([value, label]) => (
              <button
                className={filter === value ? styles.filterActive : ''}
                key={value}
                type="button"
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visible.length ? (
          <div className={styles.paymentList}>
            {visible.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                downloading={downloading === payment.id}
                syncing={syncing === payment.id}
                onDownload={() => void download(payment)}
                onSync={() => void syncErp(payment)}
                onEdit={() => openModal('edit', payment)}
                onPay={() => openModal('pay', payment)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Receipt size={28} />}
            title={
              payments.length ? 'No hay pagos con estos filtros' : 'Aún no hay pagos programados'
            }
            description={
              payments.length
                ? 'Cambia la búsqueda o el filtro.'
                : 'Agrega el primer vencimiento para controlar el calendario financiero del contrato.'
            }
            action={
              !payments.length ? (
                <Button onClick={() => openModal('schedule')}>Programar primer pago</Button>
              ) : undefined
            }
          />
        )}
      </article>

      {mode ? (
        <PaymentModal
          mode={mode}
          form={form}
          setForm={setForm}
          proof={proof}
          setProof={setProof}
          hasProof={Boolean(selected?.invoiceFileKey)}
          saving={saving}
          onClose={closeModal}
          onSave={() => void save()}
          isEditing={Boolean(selected)}
        />
      ) : null}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  className?: string;
}) {
  return (
    <article className={`${styles.metricCard} ${className}`}>
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function PaymentRow({
  payment,
  downloading,
  syncing,
  onDownload,
  onSync,
  onEdit,
  onPay,
}: {
  payment: Payment;
  downloading: boolean;
  syncing: boolean;
  onDownload: () => void;
  onSync: () => void;
  onEdit: () => void;
  onPay: () => void;
}) {
  const status = paymentStatus(payment);
  const date = payment.dueDate ? new Date(`${payment.dueDate}T12:00:00`) : null;
  return (
    <article className={styles.paymentRow}>
      <div className={`${styles.dateBlock} ${status === 'overdue' ? styles.dateOverdue : ''}`}>
        <small>{date ? date.toLocaleDateString('es-MX', { month: 'short' }) : 'Sin'}</small>
        <strong>{date ? date.getDate() : '—'}</strong>
        <span>{date ? date.getFullYear() : 'fecha'}</span>
      </div>
      <div className={styles.paymentInfo}>
        <div className={styles.paymentTitle}>
          <strong>{payment.concept}</strong>
          <Badge variant={statusMeta[status].badge} size="sm">
            {statusMeta[status].label}
          </Badge>
        </div>
        <div className={styles.paymentMeta}>
          <span>Vence {displayDate(payment.dueDate)}</span>
          {payment.paymentDate ? <span>Pagado {displayDate(payment.paymentDate)}</span> : null}
          {payment.invoiceNumber ? <span>Factura {payment.invoiceNumber}</span> : null}
          {payment.invoiceFileKey ? (
            <span className={styles.hasProof}>
              <FileCheck2 size={14} /> Comprobante
            </span>
          ) : null}
          {payment.erpSyncStatus ? (
            <span>
              ERP: {payment.erpSyncStatus === 'synced' ? 'Sincronizado' : payment.erpSyncStatus}
            </span>
          ) : null}
        </div>
        {payment.paymentCondition ? <p>Condición: {payment.paymentCondition}</p> : null}
        {payment.notes ? <p>{payment.notes}</p> : null}
      </div>
      <div className={styles.amountBlock}>
        <strong>
          {payment.amount
            ? formatCurrency(payment.amount, payment.currency)
            : payment.percentage
              ? `${Number(payment.percentage)}%`
              : 'Sin importe'}
        </strong>
        <small>{payment.amount ? payment.currency : 'del monto contractual'}</small>
      </div>
      <div className={styles.rowActions}>
        {payment.invoiceFileKey ? (
          <Button
            size="sm"
            variant="outline"
            loading={downloading}
            iconLeft={<Download size={15} />}
            onClick={onDownload}
          >
            Comprobante
          </Button>
        ) : null}
        {status !== 'paid' && status !== 'cancelled' ? (
          <Button size="sm" iconLeft={<Receipt size={15} />} onClick={onPay}>
            Registrar pago
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          loading={syncing}
          iconLeft={<RefreshCcw size={15} />}
          onClick={onSync}
        >
          {payment.erpSyncStatus === 'synced' ? 'ERP sincronizado' : 'Sincronizar ERP'}
        </Button>
        <Button size="sm" variant="ghost" iconLeft={<Pencil size={15} />} onClick={onEdit}>
          Editar
        </Button>
      </div>
    </article>
  );
}

function PaymentModal({
  mode,
  form,
  setForm,
  proof,
  setProof,
  hasProof,
  saving,
  onClose,
  onSave,
  isEditing,
}: {
  mode: ModalMode;
  form: FormState;
  setForm: (value: FormState) => void;
  proof: File | null;
  setProof: (value: File | null) => void;
  hasProof: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  isEditing: boolean;
}) {
  const title =
    mode === 'schedule'
      ? 'Programar pago'
      : mode === 'pay'
        ? 'Registrar pago realizado'
        : 'Editar pago';
  return (
    <div
      className={modalStyles.backdrop}
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={`${modalStyles.modal} ${modalStyles.modalLg}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        <div className={modalStyles.modalHeader}>
          <div>
            <h2 id="payment-modal-title">{title}</h2>
            <p className="muted">
              {mode === 'pay'
                ? 'Confirma la fecha y adjunta el comprobante bancario.'
                : 'Define cuándo debe pagarse y deja la referencia lista para seguimiento.'}
            </p>
          </div>
          <button
            className={modalStyles.closeBtn}
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className={modalStyles.modalBody}>
          <div className={styles.formGrid}>
            <Field id="payment-concept" label="Concepto *" className={styles.spanTwo}>
              <input
                id="payment-concept"
                value={form.concept}
                onChange={(event) => setForm({ ...form, concept: event.target.value })}
                placeholder="Ej. Anticipo del 30%"
              />
            </Field>
            <Field id="payment-amount" label="Monto *">
              <input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />
            </Field>
            <Field id="payment-currency" label="Moneda">
              <select
                id="payment-currency"
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
              >
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </Field>
            <Field id="payment-due-date" label="Fecha programada *">
              <input
                id="payment-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              />
            </Field>
            {mode === 'pay' || form.status === 'paid' ? (
              <Field id="payment-date" label="Fecha real de pago *">
                <input
                  id="payment-date"
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) => setForm({ ...form, paymentDate: event.target.value })}
                />
              </Field>
            ) : (
              <Field id="payment-status" label="Estado">
                <select
                  id="payment-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as PaymentStatus })
                  }
                >
                  <option value="scheduled">Programado</option>
                  <option value="pending">Pendiente</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </Field>
            )}
            <Field id="payment-invoice" label="Factura o referencia" className={styles.spanTwo}>
              <input
                id="payment-invoice"
                value={form.invoiceNumber}
                onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })}
                placeholder="Folio de factura, transferencia o cheque"
              />
            </Field>
            <Field id="payment-notes" label="Notas" className={styles.spanTwo}>
              <textarea
                id="payment-notes"
                rows={3}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Condiciones, cuenta, autorización u observaciones"
              />
            </Field>
            <label className={`${styles.uploadBox} ${styles.spanTwo}`} htmlFor="payment-proof">
              <Upload size={22} />
              <span>
                <strong>
                  {proof
                    ? proof.name
                    : hasProof
                      ? 'Reemplazar comprobante'
                      : 'Adjuntar comprobante'}
                </strong>
                <small>
                  {proof
                    ? `${(proof.size / 1024 / 1024).toFixed(2)} MB`
                    : 'PDF, imagen, XML o archivo bancario'}
                </small>
              </span>
              <input
                id="payment-proof"
                type="file"
                accept="application/pdf,image/*,.xml"
                onChange={(event) => setProof(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
        <div className={modalStyles.modalFooter}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            loading={saving}
            iconLeft={mode === 'pay' ? <CheckCircle2 size={16} /> : <CalendarClock size={16} />}
            onClick={onSave}
          >
            {mode === 'pay' ? 'Confirmar pago' : isEditing ? 'Guardar cambios' : 'Programar pago'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  className = '',
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.formField} ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
