'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, History, Scale } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';
import { formatCurrency, formatDate, getErrorMessage } from './utils';

export type ContractRecordType =
  | 'change_order'
  | 'claim'
  | 'dispute'
  | 'escalation'
  | 'penalty'
  | 'guarantee'
  | 'risk'
  | 'retention'
  | 'release';

type RecordAction = {
  id: string;
  action: string;
  comment?: string;
  createdAt: string;
  actor?: { name: string } | null;
};

type ContractRecord = {
  id: string;
  recordType: ContractRecordType;
  recordNumber: string;
  title: string;
  description?: string;
  status: string;
  approvalStatus: string;
  eventDate?: string;
  dueDate?: string;
  amount?: string;
  approvedAmount?: string;
  currency: string;
  impactDays?: number;
  approvedImpactDays?: number;
  counterparty?: string;
  basisClause?: string;
  calculation?: string;
  percentage?: string;
  issuer?: string;
  beneficiary?: string;
  validFrom?: string;
  validUntil?: string;
  parentRecordId?: string;
  parentRecord?: { id: string; recordNumber: string; title: string } | null;
  relatedAmendment?: { id: string; amendmentNumber: string; title: string } | null;
  responsibleUser?: { name: string } | null;
  metadata?: {
    capPercentage?: number;
    trigger?: string;
    frequency?: string;
    durationMonths?: number;
    startCondition?: string;
    coverage?: string;
    severity?: string;
    recommendation?: string;
    evidence?: string;
    pageNumber?: number;
  };
  actions?: RecordAction[];
};

type SectionConfig = {
  title: string;
  singular: string;
  description: string;
  types: ContractRecordType[];
  showMoney?: boolean;
  showImpact?: boolean;
  showValidity?: boolean;
  showPercentage?: boolean;
  showParties?: boolean;
  showCalculation?: boolean;
};

const sectionConfigs: Record<string, SectionConfig> = {
  change_orders: {
    title: 'Órdenes de cambio',
    singular: 'orden de cambio',
    description: 'Controla el impacto solicitado y aprobado en costo, plazo y alcance.',
    types: ['change_order'],
    showMoney: true,
    showImpact: true,
    showParties: true,
  },
  claims: {
    title: 'Claims y disputas',
    singular: 'claim o disputa',
    description: 'Registra reclamaciones, controversias, fundamentos y resultados.',
    types: ['claim', 'dispute'],
    showMoney: true,
    showImpact: true,
    showParties: true,
  },
  escalations: {
    title: 'Escalamientos',
    singular: 'escalamiento',
    description: 'Documenta decisiones elevadas a gerencia, dirección, comité o área legal.',
    types: ['escalation'],
    showParties: true,
  },
  penalties: {
    title: 'Penalizaciones',
    singular: 'penalización',
    description: 'Conecta incumplimientos, cláusulas, cálculos, impugnaciones y aplicación.',
    types: ['penalty'],
    showMoney: true,
    showPercentage: true,
    showCalculation: true,
    showParties: true,
  },
  guarantees: {
    title: 'Garantías',
    singular: 'garantía',
    description: 'Administra instrumentos, importes, emisores, beneficiarios y vencimientos.',
    types: ['guarantee'],
    showMoney: true,
    showValidity: true,
    showParties: true,
  },
  risks: {
    title: 'Riesgos',
    singular: 'riesgo',
    description: 'Da seguimiento a riesgos contractuales, severidad, mitigación y evidencia.',
    types: ['risk'],
    showParties: true,
  },
  retentions: {
    title: 'Retenciones',
    singular: 'retención',
    description: 'Mantiene el saldo retenido, porcentaje, condición y pago relacionado.',
    types: ['retention'],
    showMoney: true,
    showPercentage: true,
    showCalculation: true,
  },
  releases: {
    title: 'Liberaciones',
    singular: 'liberación',
    description: 'Controla liberaciones parciales o totales de garantías y retenciones.',
    types: ['release'],
    showMoney: true,
    showParties: true,
  },
};

const emptyForm = {
  recordType: 'change_order',
  recordNumber: '',
  title: '',
  description: '',
  eventDate: '',
  dueDate: '',
  amount: '',
  approvedAmount: '',
  currency: 'MXN',
  impactDays: '',
  approvedImpactDays: '',
  counterparty: '',
  basisClause: '',
  calculation: '',
  percentage: '',
  issuer: '',
  beneficiary: '',
  validFrom: '',
  validUntil: '',
  parentRecordId: '',
};

function configFor(section?: string) {
  return section ? sectionConfigs[section] : undefined;
}

export function ContractRecordsPage() {
  const params = useParams<{ id: string; recordType: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const section = Array.isArray(params?.recordType) ? params.recordType[0] : params?.recordType;
  const config = configFor(section);
  const [records, setRecords] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    if (!contractId || !config) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        config.types.map((type) =>
          apiGet<ContractRecord[]>(`/clm/contracts/${contractId}/records?type=${type}`)
        )
      );
      setRecords(
        results
          .flat()
          .sort((a, b) => String(b.eventDate ?? '').localeCompare(String(a.eventDate ?? '')))
      );
      setMessage('');
    } catch (error) {
      setMessage(getErrorMessage(error, 'No se pudieron cargar los registros contractuales.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [contractId, section]);

  async function action(
    record: ContractRecord,
    name: 'submit' | 'approve' | 'reject' | 'request-changes'
  ) {
    const comment = window.prompt('Comentario para el historial (opcional):') ?? '';
    try {
      await apiPost(`/clm/contracts/${contractId}/records/${record.id}/${name}`, { comment });
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, 'No se pudo completar la acción.'));
    }
  }

  if (!config)
    return (
      <article className="card">
        <p>Sección contractual no válida.</p>
      </article>
    );

  const pending = records.filter((record) => record.approvalStatus === 'pending').length;
  const totalAmount = records.reduce(
    (sum, record) => sum + Number(record.approvedAmount ?? record.amount ?? 0),
    0
  );
  const hasMoney = records.some((record) => record.amount || record.approvedAmount);

  return (
    <section className="projects-workspace">
      {['escalations', 'claims', 'risks'].includes(section ?? '') ? (
        <nav className="projects-actions" aria-label="Gestión de escalamientos">
          <Link
            className={section === 'escalations' ? 'button' : 'button secondary'}
            href={`/clm/${contractId}/records/escalations`}
          >
            <History size={16} /> Escalamientos
          </Link>
          <Link
            className={section === 'claims' ? 'button' : 'button secondary'}
            href={`/clm/${contractId}/records/claims`}
          >
            <Scale size={16} /> Disputas
          </Link>
          <Link
            className={section === 'risks' ? 'button' : 'button secondary'}
            href={`/clm/${contractId}/records/risks`}
          >
            <AlertTriangle size={16} /> Riesgos
          </Link>
        </nav>
      ) : null}
      <div className="topbar">
        <div>
          <h1>{config.title}</h1>
          <p className="muted">{config.description}</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/clm/${contractId}`}>
            Volver al contrato
          </Link>
          <Link className="button" href={`/clm/${contractId}/records/${section}/new`}>
            Nueva {config.singular}
          </Link>
        </div>
      </div>

      <div className="quick-filters-grid" style={{ marginBottom: 16 }}>
        <article className="card">
          <small className="muted">Registros</small>
          <h2>{records.length}</h2>
        </article>
        <article className="card">
          <small className="muted">Pendientes de aprobación</small>
          <h2>{pending}</h2>
        </article>
        {config.showMoney && hasMoney ? (
          <article className="card">
            <small className="muted">Impacto registrado</small>
            <h2>{formatCurrency(String(totalAmount), records[0]?.currency ?? 'MXN')}</h2>
          </article>
        ) : null}
      </div>

      {message ? (
        <article className="card" style={{ marginBottom: 16 }}>
          <p>{message}</p>
        </article>
      ) : null}
      <article className="card">
        {loading ? <p className="muted">Cargando registros...</p> : null}
        {!loading && records.length === 0 ? (
          <p className="muted">Aún no hay registros en esta sección.</p>
        ) : null}
        <div className="simple-document-list">
          {records.map((record) => (
            <div className="simple-document-item" key={record.id}>
              <div className="panel-header">
                <div>
                  <strong>
                    {record.recordNumber} · {record.title}
                  </strong>
                  <small>
                    {normalizeLabel(record.recordType)} · {formatDate(record.eventDate)} ·{' '}
                    {normalizeLabel(record.status)}
                  </small>
                </div>
                <span
                  className={`pill ${record.approvalStatus === 'approved' ? 'success' : record.approvalStatus === 'pending' ? 'warning' : 'info'}`}
                >
                  Aprobación: {normalizeLabel(record.approvalStatus)}
                </span>
              </div>
              <span>{record.description ?? 'Sin descripción.'}</span>
              <small className="muted">
                {record.amount ? `${formatCurrency(record.amount, record.currency)} · ` : ''}
                {record.impactDays != null ? `${record.impactDays} días de impacto · ` : ''}
                {record.dueDate ? `Vence: ${formatDate(record.dueDate)} · ` : ''}
                {record.counterparty ? `Contraparte: ${record.counterparty}` : ''}
              </small>
              {record.issuer ? <small>Emisor: {record.issuer}</small> : null}
              {record.beneficiary ? <small>Beneficiario: {record.beneficiary}</small> : null}
              {record.validFrom || record.validUntil ? (
                <small>
                  Vigencia: {formatDate(record.validFrom)} — {formatDate(record.validUntil)}
                </small>
              ) : null}
              {record.percentage ? <small>Tasa: {record.percentage}%</small> : null}
              {record.metadata?.capPercentage != null ? (
                <small>Tope máximo: {record.metadata.capPercentage}%</small>
              ) : null}
              {record.metadata?.trigger ? (
                <small>Supuesto de aplicación: {record.metadata.trigger}</small>
              ) : null}
              {record.metadata?.frequency ? (
                <small>Frecuencia: {record.metadata.frequency}</small>
              ) : null}
              {record.metadata?.durationMonths ? (
                <small>Duración: {record.metadata.durationMonths} meses</small>
              ) : null}
              {record.metadata?.startCondition ? (
                <small>Inicio: {record.metadata.startCondition}</small>
              ) : null}
              {record.metadata?.coverage ? (
                <small>Cobertura: {record.metadata.coverage}</small>
              ) : null}
              {record.metadata?.severity ? (
                <small>Severidad: {normalizeLabel(record.metadata.severity)}</small>
              ) : null}
              {record.metadata?.recommendation ? (
                <small>Recomendación: {record.metadata.recommendation}</small>
              ) : null}
              {record.basisClause ? <small>Fundamento: {record.basisClause}</small> : null}
              {record.calculation ? <small>Cálculo: {record.calculation}</small> : null}
              {record.metadata?.evidence ? (
                <details>
                  <summary>
                    Ver evidencia
                    {record.metadata.pageNumber ? ` · Página ${record.metadata.pageNumber}` : ''}
                  </summary>
                  <small>{record.metadata.evidence}</small>
                </details>
              ) : null}
              {record.parentRecord ? (
                <small>
                  Relacionado con {record.parentRecord.recordNumber} · {record.parentRecord.title}
                </small>
              ) : null}
              <div className="projects-actions" style={{ marginTop: 8 }}>
                {['not_submitted', 'rejected', 'changes_requested'].includes(
                  record.approvalStatus
                ) ? (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => action(record, 'submit')}
                  >
                    Enviar a aprobación
                  </button>
                ) : null}
                {record.approvalStatus === 'pending' ? (
                  <>
                    <button
                      className="button"
                      type="button"
                      onClick={() => action(record, 'approve')}
                    >
                      Aprobar
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => action(record, 'request-changes')}
                    >
                      Solicitar cambios
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => action(record, 'reject')}
                    >
                      Rechazar
                    </button>
                  </>
                ) : null}
              </div>
              {record.actions?.length ? (
                <details style={{ marginTop: 8 }}>
                  <summary>Historial ({record.actions.length})</summary>
                  <div className="simple-document-list" style={{ marginTop: 8 }}>
                    {[...record.actions]
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .map((item) => (
                        <div className="simple-document-item" key={item.id}>
                          <small>
                            {normalizeLabel(item.action)} · {item.actor?.name ?? 'Usuario'} ·{' '}
                            {new Date(item.createdAt).toLocaleString()}
                          </small>
                          <span>{item.comment ?? ''}</span>
                        </div>
                      ))}
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export function ContractRecordCreatePage() {
  const params = useParams<{ id: string; recordType: string }>();
  const router = useRouter();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const section = Array.isArray(params?.recordType) ? params.recordType[0] : params?.recordType;
  const config = configFor(section);
  const [related, setRelated] = useState<ContractRecord[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!contractId || !config) return;
    setForm((current) => ({ ...current, recordType: config.types[0] }));
    apiGet<ContractRecord[]>(`/clm/contracts/${contractId}/records`)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [contractId, section]);

  const payload = useMemo(
    () => Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '')),
    [form]
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!contractId || !config) return;
    setSaving(true);
    setMessage('');
    try {
      await apiPost(`/clm/contracts/${contractId}/records`, payload);
      router.push(`/clm/${contractId}/records/${section}`);
    } catch (error) {
      setMessage(getErrorMessage(error, 'No se pudo guardar el registro contractual.'));
      setSaving(false);
    }
  }

  if (!config)
    return (
      <article className="card">
        <p>Sección contractual no válida.</p>
      </article>
    );
  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>Nueva {config.singular}</h1>
          <p className="muted">
            El registro quedará dentro del expediente y podrá enviarse a aprobación.
          </p>
        </div>
      </div>
      <form className="card" onSubmit={submit}>
        <div className="quick-filters-grid">
          {config.types.length > 1 ? (
            <div className="field">
              <label>Tipo</label>
              <select value={form.recordType} onChange={(e) => set('recordType', e.target.value)}>
                {config.types.map((type) => (
                  <option key={type} value={type}>
                    {normalizeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="field">
            <label>Folio</label>
            <input
              required
              value={form.recordNumber}
              onChange={(e) => set('recordNumber', e.target.value)}
            />
          </div>
          <div className="field span-2">
            <label>Título</label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="field">
            <label>Fecha del evento</label>
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => set('eventDate', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Fecha límite</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
            />
          </div>
          <div className="field span-3">
            <label>Descripción y justificación</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div className="field span-2">
            <label>Cláusula o fundamento contractual</label>
            <textarea
              rows={2}
              value={form.basisClause}
              onChange={(e) => set('basisClause', e.target.value)}
            />
          </div>
          {config.showParties ? (
            <div className="field">
              <label>Contraparte</label>
              <input
                value={form.counterparty}
                onChange={(e) => set('counterparty', e.target.value)}
              />
            </div>
          ) : null}
          {config.showMoney ? (
            <>
              <div className="field">
                <label>Importe solicitado</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Moneda</label>
                <input
                  maxLength={3}
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value.toUpperCase())}
                />
              </div>
            </>
          ) : null}
          {config.showImpact ? (
            <div className="field">
              <label>Impacto en días</label>
              <input
                type="number"
                value={form.impactDays}
                onChange={(e) => set('impactDays', e.target.value)}
              />
            </div>
          ) : null}
          {config.showPercentage ? (
            <div className="field">
              <label>Porcentaje</label>
              <input
                type="number"
                step="0.0001"
                value={form.percentage}
                onChange={(e) => set('percentage', e.target.value)}
              />
            </div>
          ) : null}
          {config.showCalculation ? (
            <div className="field span-2">
              <label>Base o fórmula de cálculo</label>
              <textarea
                rows={2}
                value={form.calculation}
                onChange={(e) => set('calculation', e.target.value)}
              />
            </div>
          ) : null}
          {config.showValidity ? (
            <>
              <div className="field">
                <label>Emisor</label>
                <input value={form.issuer} onChange={(e) => set('issuer', e.target.value)} />
              </div>
              <div className="field">
                <label>Beneficiario</label>
                <input
                  value={form.beneficiary}
                  onChange={(e) => set('beneficiary', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Vigente desde</label>
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => set('validFrom', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Vigente hasta</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => set('validUntil', e.target.value)}
                />
              </div>
            </>
          ) : null}
          <div className="field span-2">
            <label>Registro relacionado</label>
            <select
              value={form.parentRecordId}
              onChange={(e) => set('parentRecordId', e.target.value)}
            >
              <option value="">Sin relación</option>
              {related.map((item) => (
                <option value={item.id} key={item.id}>
                  {normalizeLabel(item.recordType)} · {item.recordNumber} · {item.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        {message ? <p>{message}</p> : null}
        <div className="projects-actions" style={{ marginTop: 16 }}>
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar registro'}
          </button>
          <Link className="button secondary" href={`/clm/${contractId}/records/${section}`}>
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
