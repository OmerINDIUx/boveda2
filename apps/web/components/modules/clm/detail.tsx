'use client';
/* eslint-disable @typescript-eslint/no-unused-expressions */

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckSquare,
  CheckCircle2,
  CircleDashed,
  DollarSign,
  FilePlus2,
  FileSignature,
  FileText,
  History,
  Landmark,
  MessageSquare,
  PencilLine,
  Plus,
  RefreshCcw,
  Route,
  Send,
  ShieldCheck,
  Download,
  Upload,
  Tags,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiGet, apiPatch, apiPost } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';
import { ContractDetail, AskResponse, RiskMatrix } from './types';
import {
  buildFallbackDetail,
  formatCurrency,
  formatDate,
  formatMinutes,
  getLifecycleLabel,
  lifecycleStageOptions,
} from './utils';

type TimelineItem = {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  type: 'lifecycle' | 'version' | 'signature' | 'negotiation' | 'obligation' | 'milestone';
};

function getRiskColor(level?: string) {
  if (level === 'low') return 'var(--success)';
  if (level === 'medium') return 'var(--warning)';
  if (level === 'high') return 'var(--danger)';
  return 'var(--critical)';
}

const HEALTH_COLORS = { high: '#10b981', medium: '#f59e0b', low: '#f97316', critical: '#ef4444' };

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#3b82f6', '#8b5cf6'];

const TIMELINE_TYPE_COLORS: Record<string, string> = {
  lifecycle: '#3b82f6',
  version: '#8b5cf6',
  signature: '#10b981',
  negotiation: '#f59e0b',
  obligation: '#ef4444',
  milestone: '#06b6d4',
};

function getHealthColor(score: number) {
  if (score >= 80) return HEALTH_COLORS.high;
  if (score >= 60) return HEALTH_COLORS.medium;
  if (score >= 40) return HEALTH_COLORS.low;
  return HEALTH_COLORS.critical;
}

function computeHealthScore(
  detail: ContractDetail,
  riskMatrix: RiskMatrix | null,
  readiness: ReturnType<typeof buildReadiness>
) {
  const readinessScore = readiness.progress;
  const riskScore = riskMatrix ? 100 - riskMatrix.overallScore : 50;
  const totalObligations = detail.obligations.length;
  const completedObligations = detail.obligations.filter((o) => o.status === 'completed').length;
  const obligationRate =
    totalObligations > 0 ? (completedObligations / totalObligations) * 100 : 100;
  const totalPayments = detail.payments.length;
  const paidPayments = detail.payments.filter((p) => p.status === 'paid').length;
  const paymentRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 100;
  const hasFinalSignature = detail.signatures.some((s) =>
    ['completed', 'signed', 'done'].includes(String(s.status).toLowerCase())
  );
  const signatureScore = hasFinalSignature ? 100 : detail.signatures.length > 0 ? 50 : 0;

  const weighted =
    readinessScore * 0.2 +
    riskScore * 0.25 +
    obligationRate * 0.2 +
    paymentRate * 0.2 +
    signatureScore * 0.15;
  const score = Math.round(Math.min(100, Math.max(0, weighted)));
  let label: string;
  if (score >= 80) label = 'Excelente';
  else if (score >= 60) label = 'Buena';
  else if (score >= 40) label = 'Regular';
  else label = 'Crítica';
  return { score, label };
}

function getNextDeadline(
  detail: ContractDetail
): { date: string; label: string; type: string; daysUntil: number } | null {
  const today = new Date();
  const candidates: Array<{ date: string; label: string; type: string; daysUntil: number }> = [];
  for (const o of detail.obligations) {
    if (o.commitmentDate && new Date(o.commitmentDate) >= today) {
      const d = new Date(o.commitmentDate);
      candidates.push({
        date: o.commitmentDate,
        label: o.description.slice(0, 80),
        type: 'Obligación',
        daysUntil: Math.ceil((d.getTime() - today.getTime()) / 86400000),
      });
    }
  }
  for (const p of detail.payments) {
    if (p.dueDate && new Date(p.dueDate) >= today) {
      const d = new Date(p.dueDate);
      candidates.push({
        date: p.dueDate,
        label: p.concept.slice(0, 80),
        type: 'Pago',
        daysUntil: Math.ceil((d.getTime() - today.getTime()) / 86400000),
      });
    }
  }
  for (const m of detail.milestones) {
    if (new Date(m.milestoneDate) >= today) {
      const d = new Date(m.milestoneDate);
      candidates.push({
        date: m.milestoneDate,
        label: m.name.slice(0, 80),
        type: 'Hito',
        daysUntil: Math.ceil((d.getTime() - today.getTime()) / 86400000),
      });
    }
  }
  if (detail.endDate && new Date(detail.endDate) >= today) {
    const d = new Date(detail.endDate);
    candidates.push({
      date: detail.endDate,
      label: 'Vencimiento del contrato',
      type: 'Contrato',
      daysUntil: Math.ceil((d.getTime() - today.getTime()) / 86400000),
    });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.daysUntil - b.daysUntil);
  return candidates[0];
}

function buildReadiness(detail: ContractDetail, riskMatrix: RiskMatrix | null) {
  const completedSignatures = detail.signatures.filter((item) =>
    ['completed', 'signed', 'done'].includes(String(item.status).toLowerCase())
  ).length;
  const overdueObligations = detail.obligations.filter((item) =>
    ['overdue', 'pending'].includes(String(item.status).toLowerCase())
  ).length;
  const overduePayments =
    riskMatrix?.indicators?.overduePayments ??
    detail.payments.filter((item) =>
      ['overdue', 'pending'].includes(String(item.status).toLowerCase())
    ).length;

  const hasSupplier = Boolean(detail.supplierName?.trim());
  const hasClient = Boolean(detail.clientName?.trim());
  const hasAmount = Boolean(detail.amount);
  const hasCurrency = Boolean(detail.currency);
  const hasDates = Boolean(detail.startDate && detail.endDate);
  const hasContractType = Boolean(detail.contractType);
  const hasCurrentVersion = detail.versions.length > 0;
  const hasAttachments = detail.attachments.length > 0;
  const hasNegotiationTrace = detail.negotiations.length > 0 || detail.lifecycleHistory.length > 1;
  const hasSignatureFlow = detail.signatures.length > 0;
  const hasFinalSignature = completedSignatures > 0;
  const hasObligations = detail.obligations.length > 0;
  const hasMilestones = detail.milestones.length > 0;
  const hasPayments = detail.payments.length > 0;
  const isOperational = ['active', 'renewed', 'closed'].includes(detail.status);
  const isOverdueFree = overdueObligations === 0 && overduePayments === 0;

  const categories = [
    {
      key: 'parties',
      label: 'Partes del contrato',
      items: [
        {
          key: 'supplier',
          label: 'Proveedor definido',
          done: hasSupplier,
          hint: 'Falta el proveedor.',
        },
        { key: 'client', label: 'Cliente definido', done: hasClient, hint: 'Falta el cliente.' },
      ],
    },
    {
      key: 'terms',
      label: 'Términos comerciales',
      items: [
        { key: 'amount', label: 'Monto definido', done: hasAmount, hint: 'Falta el monto.' },
        { key: 'currency', label: 'Moneda definida', done: hasCurrency, hint: 'Falta la moneda.' },
        {
          key: 'dates',
          label: 'Vigencia definida',
          done: hasDates,
          hint: 'Faltan fechas de inicio y fin.',
        },
        {
          key: 'type',
          label: 'Tipo de contrato',
          done: hasContractType,
          hint: 'Falta el tipo de contrato.',
        },
      ],
    },
    {
      key: 'docs',
      label: 'Documentación',
      items: [
        {
          key: 'version',
          label: 'Borrador contractual',
          done: hasCurrentVersion,
          hint: 'Falta versión base.',
        },
        {
          key: 'attachments',
          label: 'Anexos adjuntos',
          done: hasAttachments,
          hint: 'Faltan anexos.',
        },
      ],
    },
    {
      key: 'negotiation',
      label: 'Negociación',
      items: [
        {
          key: 'trace',
          label: 'Trazabilidad de negociación',
          done: hasNegotiationTrace,
          hint: 'No hay rondas de negociación.',
        },
      ],
    },
    {
      key: 'signature',
      label: 'Firma',
      items: [
        {
          key: 'flow',
          label: 'Ruta de firma creada',
          done: hasSignatureFlow,
          hint: 'No se ha enviado a firma.',
        },
        {
          key: 'signed',
          label: 'Firma completada',
          done: hasFinalSignature,
          hint: 'Falta firma final de todas las partes.',
        },
      ],
    },
    {
      key: 'execution',
      label: 'Ejecución y cumplimiento',
      items: [
        {
          key: 'obligations',
          label: 'Obligaciones definidas',
          done: hasObligations,
          hint: 'Faltan obligaciones.',
        },
        { key: 'milestones', label: 'Hitos definidos', done: hasMilestones, hint: 'Faltan hitos.' },
        { key: 'payments', label: 'Pagos registrados', done: hasPayments, hint: 'Faltan pagos.' },
        {
          key: 'active',
          label: 'Contrato activo',
          done: isOperational,
          hint: 'El contrato no está vigente.',
        },
        {
          key: 'overdueFree',
          label: 'Sin vencimientos atrasados',
          done: isOverdueFree,
          hint: 'Hay obligaciones o pagos vencidos.',
        },
      ],
    },
  ];

  const allItems = categories.flatMap((c) => c.items);
  const completed = allItems.filter((item) => item.done).length;
  const progress = Math.round((completed / allItems.length) * 100);
  const blockers = allItems.filter((item) => !item.done).slice(0, 3);

  let nextAction = 'Revisar expediente contractual.';
  let nextActionLink = `/clm/${detail.id}`;
  if (!hasSupplier || !hasClient) {
    nextAction = 'Completar las partes del contrato';
    nextActionLink = `/clm/${detail.id}/edit`;
  } else if (!hasAmount || !hasDates) {
    nextAction = 'Definir términos comerciales';
    nextActionLink = `/clm/${detail.id}/edit`;
  } else if (!hasCurrentVersion) {
    nextAction = 'Subir borrador del contrato';
    nextActionLink = `/clm/${detail.id}/versions`;
  } else if (!hasSignatureFlow) {
    nextAction = 'Enviar a firma';
    nextActionLink = `/clm/${detail.id}/signatures`;
  } else if (!hasFinalSignature) {
    nextAction = 'Dar seguimiento a firma pendiente';
    nextActionLink = `/clm/${detail.id}/signatures`;
  } else if (!hasObligations) {
    nextAction = 'Crear obligaciones de cumplimiento';
    nextActionLink = `/clm/${detail.id}/obligations`;
  } else if (overdueObligations > 0 || overduePayments > 0) {
    nextAction = 'Atender vencimientos abiertos';
    nextActionLink = `/clm/${detail.id}`;
  } else {
    nextAction = 'Gestionar cumplimiento y renovaciones';
    nextActionLink = `/clm/${detail.id}`;
  }

  return {
    progress,
    categories,
    allItems,
    completed,
    total: allItems.length,
    blockers,
    nextAction,
    nextActionLink,
    completedSignatures,
    overdueObligations,
    overduePayments,
  };
}

function buildTimeline(detail: ContractDetail) {
  const items: TimelineItem[] = [
    ...(detail.lifecycleHistory ?? []).map((event) => ({
      id: `life-${event.id}`,
      date: event.createdAt,
      title: `${getLifecycleLabel(event.stage)}${event.decision ? ` · ${event.decision}` : ''}`,
      subtitle: event.comments ?? `Cambio desde ${getLifecycleLabel(event.previousStage)}.`,
      type: 'lifecycle' as const,
    })),
    ...(detail.versions ?? []).map((version) => ({
      id: `version-${version.id}`,
      date: version.createdAt,
      title: `Versión ${version.versionLabel}`,
      subtitle: version.changeSummary ?? version.fileName,
      type: 'version' as const,
    })),
    ...(detail.signatures ?? []).map((signature) => ({
      id: `signature-${signature.id}`,
      date: signature.signedAt ?? signature.createdAt,
      title: `Firma ${normalizeLabel(signature.status)}`,
      subtitle: normalizeLabel(signature.provider),
      type: 'signature' as const,
    })),
    ...(detail.negotiations ?? []).map((negotiation) => ({
      id: `negotiation-${negotiation.id}`,
      date: negotiation.createdAt,
      title: `Ronda con ${negotiation.partyName}`,
      subtitle: normalizeLabel(negotiation.status),
      type: 'negotiation' as const,
    })),
    ...(detail.obligations ?? [])
      .filter((obligation) => obligation.commitmentDate)
      .map((obligation) => ({
        id: `obligation-${obligation.id}`,
        date: obligation.commitmentDate!,
        title: `Obligación ${normalizeLabel(obligation.status)}`,
        subtitle: obligation.description,
        type: 'obligation' as const,
      })),
    ...(detail.milestones ?? []).map((milestone) => ({
      id: `milestone-${milestone.id}`,
      date: milestone.milestoneDate,
      title: `Hito ${normalizeLabel(milestone.status)}`,
      subtitle: milestone.name,
      type: 'milestone' as const,
    })),
  ];

  return items
    .filter((item) => Boolean(item.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [riskMatrix, setRiskMatrix] = useState<RiskMatrix | null>(null);
  const activeTab = searchParams.get('tab') ?? 'route';
  const [askQuestion, setAskQuestion] = useState('');
  const [askResult, setAskResult] = useState<AskResponse | null>(null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagName, setTagName] = useState('');
  const [lifecycleForm, setLifecycleForm] = useState({
    stage: '',
    comments: '',
    decision: '',
  });
  const [timelineFilters, setTimelineFilters] = useState<Set<string>>(
    new Set(['lifecycle', 'version', 'signature', 'negotiation', 'obligation', 'milestone'])
  );

  function setActiveTab(tab: string) {
    router.replace(`/clm/${contractId}?tab=${tab}`, { scroll: false });
  }

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const response = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`);
        if (!active) return;
        setDetail(response);
        setLifecycleForm((prev) => ({ ...prev, stage: response.lifecycleStage ?? 'request' }));
      } catch (err: any) {
        if (!active) return;
        const fallback = buildFallbackDetail(contractId);
        if (fallback) {
          setDetail(fallback);
          setLifecycleForm((prev) => ({ ...prev, stage: fallback.lifecycleStage ?? 'request' }));
          setMessage('Vista de respaldo.');
          return;
        }
        setMessage(err?.message ?? 'No se pudo cargar el detalle.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  useEffect(() => {
    if (!contractId || activeTab !== 'risk') return;
    let active = true;
    async function load() {
      try {
        const matrix = await apiGet<RiskMatrix>(`/clm/contracts/${contractId}/risk-matrix`);
        if (active) setRiskMatrix(matrix);
      } catch {
        if (active) setRiskMatrix(null);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId, activeTab]);

  async function updateStatus(status: string) {
    if (!detail) return;
    try {
      const response = await apiPatch<ContractDetail>(`/clm/contracts/${detail.id}`, { status });
      setDetail(response);
    } catch {
      setMessage('No se pudo actualizar el estado.');
    }
  }

  async function runClose() {
    if (!detail) return;
    try {
      const response = await apiPost<ContractDetail>(`/clm/contracts/${detail.id}/close`, {
        closeReason: 'Cierre manual',
      });
      setDetail(response);
    } catch {
      setMessage('No se pudo cerrar.');
    }
  }

  async function runRenew() {
    if (!detail) return;
    try {
      const response = await apiPost<ContractDetail>(`/clm/contracts/${detail.id}/renew`, {
        renewalDate: new Date().toISOString().slice(0, 10),
      });
      setDetail(response);
    } catch {
      setMessage('No se pudo renovar.');
    }
  }

  async function askContract() {
    if (!detail || !askQuestion.trim()) return;
    try {
      const response = await apiPost<AskResponse>(`/clm/contracts/${detail.id}/ask`, {
        question: askQuestion,
      });
      setAskResult(response);
    } catch {
      setMessage('No se pudo consultar con IA.');
    }
  }

  async function addTag() {
    if (!detail || !tagName.trim()) return;
    try {
      const response = await apiPost<ContractDetail>(`/clm/contracts/${detail.id}/tags`, {
        tagNames: [tagName.trim()],
      });
      setDetail(response);
      setTagName('');
      setShowTagInput(false);
    } catch {
      setMessage('No se pudo agregar tag.');
    }
  }

  async function submitLifecycleTransition() {
    if (!detail || !lifecycleForm.stage) return;
    try {
      const response = await apiPost<ContractDetail>(
        `/clm/contracts/${detail.id}/lifecycle`,
        lifecycleForm
      );
      setDetail(response);
      setLifecycleForm((prev) => ({
        ...prev,
        stage: response.lifecycleStage ?? prev.stage,
        comments: '',
        decision: '',
      }));
    } catch (error: any) {
      if (String(error?.message ?? '').includes('Cannot POST /clm/contracts')) {
        setMessage('La API activa todavía no expone el ciclo de vida.');
        return;
      }
      setMessage('No se pudo actualizar la etapa del ciclo de vida.');
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
          <p className="muted">{message || 'Contrato no encontrado.'}</p>
        </article>
      </section>
    );

  const tabs = [
    { key: 'route', label: 'Ruta al contrato', icon: <Route size={16} /> },
    { key: 'lifecycle', label: 'Ciclo de vida', icon: <History size={16} /> },
    { key: 'obligations', label: 'Obligaciones', icon: <CheckSquare size={16} /> },
    { key: 'milestones', label: 'Hitos', icon: <CalendarClock size={16} /> },
    { key: 'amendments', label: 'Enmiendas', icon: <FilePlus2 size={16} /> },
    { key: 'payments', label: 'Pagos', icon: <DollarSign size={16} /> },
    { key: 'signatures', label: 'Firmas', icon: <FileSignature size={16} /> },
    { key: 'negotiations', label: 'Negociación', icon: <MessageSquare size={16} /> },
    { key: 'versions', label: 'Versiones', icon: <FileText size={16} /> },
    { key: 'attachments', label: 'Anexos', icon: <Upload size={16} /> },
    { key: 'comments', label: 'Comentarios', icon: <MessageSquare size={16} /> },
    { key: 'risk', label: 'Matriz de riesgo', icon: <AlertTriangle size={16} /> },
  ];
  const readiness = buildReadiness(detail, riskMatrix);
  const healthScore = computeHealthScore(detail, riskMatrix, readiness);
  const nextDeadline = getNextDeadline(detail);
  const timeline = buildTimeline(detail);
  const currentStageIndex = lifecycleStageOptions.findIndex(
    (item) => item.value === detail.lifecycleStage
  );
  const riskDimensionCards = riskMatrix
    ? Object.entries(riskMatrix.dimensions).map(([key, dim]) => (
        <div key={key} className="field span-3">
          <label>
            {dim.label} ({Math.round(dim.weight * 100)}%)
          </label>
          <div
            style={{
              height: 24,
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${dim.score}%`,
                height: '100%',
                background:
                  dim.score < 25
                    ? 'var(--success)'
                    : dim.score < 50
                      ? 'var(--warning)'
                      : dim.score < 75
                        ? 'var(--danger)'
                        : 'var(--critical)',
                borderRadius: 4,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <small>{dim.score} / 100</small>
        </div>
      ))
    : null;
  const riskSection =
    activeTab === 'risk' ? (
      <article className="card">
        <div className="panel-header">
          <h2>Matriz de riesgo</h2>
          <AlertTriangle size={18} />
        </div>
        {riskMatrix ? (
          <>
            <div className="state-card" style={{ marginBottom: 16 }}>
              <span>Puntaje general</span>
              <strong
                style={{
                  fontSize: '1.5rem',
                  color:
                    riskMatrix.overallLevel === 'low'
                      ? 'var(--success)'
                      : riskMatrix.overallLevel === 'medium'
                        ? 'var(--warning)'
                        : riskMatrix.overallLevel === 'high'
                          ? 'var(--danger)'
                          : 'var(--critical)',
                }}
              >
                {riskMatrix.overallScore} / 100
              </strong>
              <span>Nivel: {normalizeLabel(riskMatrix.overallLevel)}</span>
            </div>
            <div className="quick-filters-grid">{riskDimensionCards}</div>
          </>
        ) : (
          <p className="muted">Cargando matriz de riesgo...</p>
        )}
      </article>
    ) : null;
  const negotiationsContent =
    detail.negotiations.length === 0 ? (
      <p className="muted">
        No hay rondas de negociación registradas. Crea la primera para iniciar el diálogo entre
        partes.
      </p>
    ) : (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div className="state-card">
            <span>Rondas totales</span>
            <strong>{detail.negotiations.length}</strong>
          </div>
          <div className="state-card">
            <span>Aceptadas</span>
            <strong style={{ color: 'var(--success)' }}>
              {detail.negotiations.filter((n) => n.status === 'accepted').length}
            </strong>
          </div>
          <div className="state-card">
            <span>Rechazadas</span>
            <strong style={{ color: 'var(--danger)' }}>
              {detail.negotiations.filter((n) => n.status === 'rejected').length}
            </strong>
          </div>
          <div className="state-card">
            <span>Partes involucradas</span>
            <strong>{new Set(detail.negotiations.map((n) => n.partyName)).size}</strong>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {[...detail.negotiations].reverse().map((n, idx) => {
            const isAccepted = n.status === 'accepted';
            const isRejected = n.status === 'rejected';
            const borderColor = isAccepted
              ? 'var(--success)'
              : isRejected
                ? 'var(--danger)'
                : 'var(--border)';
            return (
              <div
                key={n.id}
                style={{
                  border: `1px solid ${borderColor}`,
                  borderRadius: 12,
                  padding: 14,
                  background: isAccepted
                    ? 'rgba(16,185,129,0.04)'
                    : isRejected
                      ? 'rgba(239,68,68,0.04)'
                      : 'transparent',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                      #{detail.negotiations.length - idx}
                    </span>
                    <strong style={{ fontSize: '0.875rem' }}>{n.partyName}</strong>
                    <span
                      className={`pill ${isAccepted ? 'success' : isRejected ? 'danger' : 'info'}`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {normalizeLabel(n.status)}
                    </span>
                  </div>
                  <small className="muted">{formatDate(n.createdAt)}</small>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 10 }}>
                    <small
                      style={{
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: 4,
                        color: 'var(--muted)',
                      }}
                    >
                      Texto original
                    </small>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        whiteSpace: 'pre-wrap',
                        fontStyle: n.originalText ? 'normal' : 'italic',
                        opacity: n.originalText ? 1 : 0.5,
                      }}
                    >
                      {n.originalText || 'Sin texto original registrado'}
                    </p>
                  </div>
                  <div
                    style={{
                      background: isAccepted
                        ? 'rgba(16,185,129,0.06)'
                        : isRejected
                          ? 'rgba(239,68,68,0.06)'
                          : 'var(--bg-secondary)',
                      borderRadius: 8,
                      padding: 10,
                      border: `1px solid ${borderColor}20`,
                    }}
                  >
                    <small
                      style={{
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: 4,
                        color: borderColor,
                      }}
                    >
                      Propuesta de {n.partyName}
                    </small>
                    <p style={{ margin: 0, fontSize: '0.8125rem', whiteSpace: 'pre-wrap' }}>
                      {n.proposedText || 'Sin propuesta registrada'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );

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
          <Link className="button secondary" href={`/clm/${detail.id}/export`}>
            <Download size={18} /> Exportar
          </Link>
          <Link className="button secondary" href={`/clm/${detail.id}/audit`}>
            <ShieldCheck size={18} /> Auditoría
          </Link>
          <Link className="button secondary" href={`/rfis/new?projectId=${detail.projectId}`}>
            <MessageSquare size={18} /> Nuevo RFI
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
            <small className="muted">
              Etapa actual: {getLifecycleLabel(detail.lifecycleStage)}
              {detail.lifecycleChangedAt ? ` · ${formatDate(detail.lifecycleChangedAt)}` : ''}
            </small>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 18,
              background: `linear-gradient(135deg, ${getHealthColor(healthScore.score)}08, rgba(59,130,246,0.04))`,
            }}
          >
            <div className="panel-header" style={{ marginBottom: 8 }}>
              <h2 style={{ fontSize: '1.1rem' }}>Salud del contrato</h2>
              <ShieldCheck size={18} color={getHealthColor(healthScore.score)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'end', gap: 12, marginBottom: 8 }}>
              <strong
                style={{
                  fontSize: '2rem',
                  lineHeight: 1,
                  color: getHealthColor(healthScore.score),
                }}
              >
                {healthScore.score}
              </strong>
              <span style={{ color: getHealthColor(healthScore.score), fontWeight: 600 }}>
                /100 · {healthScore.label}
              </span>
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: `${healthScore.score}%`,
                  height: '100%',
                  background: getHealthColor(healthScore.score),
                  borderRadius: 999,
                  transition: 'width 0.5s',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: '0.75rem' }}>
              <span
                className="pill"
                style={{ background: `${getHealthColor(healthScore.score)}22` }}
              >
                Avance: {readiness.progress}%
              </span>
              <span
                className="pill"
                style={{ background: `${getHealthColor(healthScore.score)}22` }}
              >
                Obligaciones: {detail.obligations.filter((o) => o.status === 'completed').length}/
                {detail.obligations.length}
              </span>
              <span
                className="pill"
                style={{ background: `${getHealthColor(healthScore.score)}22` }}
              >
                Pagos: {detail.payments.filter((p) => p.status === 'paid').length}/
                {detail.payments.length}
              </span>
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 18,
              background: 'var(--bg-secondary)',
            }}
          >
            <div className="panel-header" style={{ marginBottom: 8 }}>
              <h2 style={{ fontSize: '1.1rem' }}>Semáforo operativo</h2>
              <AlertTriangle size={18} />
            </div>
            <div className="simple-document-list" style={{ gap: 10 }}>
              <div className="simple-document-item" style={{ padding: 0, border: 'none' }}>
                <strong>{readiness.completedSignatures}</strong>
                <small>firmas finalizadas</small>
              </div>
              <div className="simple-document-item" style={{ padding: 0, border: 'none' }}>
                <strong
                  style={{ color: readiness.overdueObligations ? 'var(--danger)' : undefined }}
                >
                  {readiness.overdueObligations}
                </strong>
                <small>obligaciones vencidas o pendientes</small>
              </div>
              <div className="simple-document-item" style={{ padding: 0, border: 'none' }}>
                <strong style={{ color: readiness.overduePayments ? 'var(--danger)' : undefined }}>
                  {readiness.overduePayments}
                </strong>
                <small>pagos vencidos o pendientes</small>
              </div>
              <div className="simple-document-item" style={{ padding: 0, border: 'none' }}>
                <strong style={{ color: getRiskColor(riskMatrix?.overallLevel) }}>
                  {riskMatrix?.overallScore ?? '--'}
                </strong>
                <small>riesgo general</small>
              </div>
            </div>
          </div>
        </div>

        {nextDeadline ? (
          <div
            style={{
              marginTop: 16,
              border: `1px solid ${nextDeadline.daysUntil <= 7 ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: 12,
              padding: '12px 16px',
              background:
                nextDeadline.daysUntil <= 7 ? 'rgba(239,68,68,0.06)' : 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {nextDeadline.daysUntil <= 7 ? (
              <AlertTriangle size={18} color="var(--danger)" />
            ) : (
              <CalendarClock size={18} />
            )}
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '0.875rem' }}>Próximo vencimiento</strong>
              <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                {nextDeadline.label} · {formatDate(nextDeadline.date)} (
                {nextDeadline.daysUntil > 0 ? `${nextDeadline.daysUntil} días` : 'Hoy'})
              </p>
            </div>
            <span className={`pill ${nextDeadline.daysUntil <= 7 ? 'danger' : 'info'}`}>
              {nextDeadline.type}
            </span>
          </div>
        ) : null}

        <div className="project-state-grid" style={{ marginTop: 16 }}>
          <div className="state-card">
            <span>Estado</span>
            <strong>{normalizeLabel(detail.status)}</strong>
          </div>
          <div className="state-card">
            <span>Ciclo de vida</span>
            <strong>{getLifecycleLabel(detail.lifecycleStage)}</strong>
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

        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <div className="panel-header" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem' }}>Madurez contractual</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {readiness.completed}/{readiness.total}
              </span>
              <Link
                className="button secondary"
                href={readiness.nextActionLink}
                style={{ fontSize: '0.75rem', minHeight: 0, padding: '4px 10px' }}
              >
                {readiness.nextAction}
              </Link>
            </div>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: 'var(--bg-secondary)',
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: `${readiness.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--success), var(--accent))',
                borderRadius: 999,
                transition: 'width 0.5s',
              }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 8,
            }}
          >
            {readiness.categories.map((cat) => {
              const done = cat.items.filter((i) => i.done).length;
              const total = cat.items.length;
              return (
                <div
                  key={cat.key}
                  style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <strong style={{ fontSize: '0.8125rem' }}>{cat.label}</strong>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: done === total ? 'var(--success)' : 'var(--muted)',
                      }}
                    >
                      {done}/{total}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 999,
                      background: 'var(--bg-secondary)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${(done / total) * 100}%`,
                        height: '100%',
                        background: done === total ? 'var(--success)' : 'var(--warning)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 6, display: 'grid', gap: 3 }}>
                    {cat.items.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.7rem',
                          color: 'var(--muted)',
                        }}
                      >
                        {item.done ? (
                          <CheckCircle2 size={10} color="var(--success)" />
                        ) : (
                          <CircleDashed size={10} color="var(--warning)" />
                        )}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
          <Link className="button secondary" href={`/clm/${detail.id}/edit`}>
            <PencilLine size={16} /> Editar contrato
          </Link>
          <Link className="button secondary" href={`/clm/${detail.id}/workspace`}>
            <Users size={16} /> Abrir workspace
          </Link>
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

      <article className="card" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Línea del tiempo contractual</h2>
          <History size={18} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {lifecycleStageOptions.map((stage, index) => {
            const isDone = currentStageIndex > index;
            const isCurrent = currentStageIndex === index;
            return (
              <div
                key={stage.value}
                style={{
                  border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 14,
                  padding: 12,
                  background: isCurrent ? 'var(--accent-bg)' : 'transparent',
                  opacity: isDone || isCurrent ? 1 : 0.72,
                }}
              >
                <small className="muted">
                  {isDone ? 'Listo' : isCurrent ? 'Actual' : 'Siguiente'}
                </small>
                <strong style={{ display: 'block', marginTop: 4 }}>{stage.label}</strong>
              </div>
            );
          })}
        </div>
        <div className="projects-actions" style={{ marginBottom: 12, gap: 6 }}>
          {Object.entries(TIMELINE_TYPE_COLORS).map(([type, color]) => (
            <button
              key={type}
              className="button secondary"
              type="button"
              onClick={() =>
                setTimelineFilters((prev) => {
                  const next = new Set(prev);
                  next.has(type) ? next.delete(type) : next.add(type);
                  return next;
                })
              }
              style={{
                fontSize: '0.7rem',
                minHeight: 0,
                padding: '3px 8px',
                opacity: timelineFilters.has(type) ? 1 : 0.4,
                borderColor: timelineFilters.has(type) ? color : undefined,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: color,
                  display: 'inline-block',
                  marginRight: 4,
                }}
              />
              {normalizeLabel(type)}
            </button>
          ))}
        </div>
        {timeline.length > 0 ? (
          <div style={{ position: 'relative', paddingLeft: 24, marginBottom: 8 }}>
            <div
              style={{
                position: 'absolute',
                left: 10,
                top: 0,
                bottom: 0,
                width: 2,
                background: 'var(--border)',
              }}
            />
            {(() => {
              const filtered = timeline.filter((item) => timelineFilters.has(item.type));
              const sorted = [...filtered].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              return sorted.map((item, idx) => {
                const color = TIMELINE_TYPE_COLORS[item.type] ?? 'var(--muted)';
                return (
                  <div key={item.id} style={{ position: 'relative', padding: '0 0 16px 20px' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: -16,
                        top: 4,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: color,
                        border: '2px solid var(--bg)',
                        zIndex: 1,
                      }}
                    />
                    {idx < sorted.length - 1 ? (
                      <div
                        style={{
                          position: 'absolute',
                          left: -11,
                          top: 16,
                          bottom: 0,
                          width: 2,
                          background: 'var(--border)',
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.875rem' }}>{item.title}</strong>
                        <p
                          style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <small
                          style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block' }}
                        >
                          {formatDate(item.date)}
                        </small>
                        <span style={{ fontSize: '0.65rem', color, fontWeight: 600 }}>
                          {normalizeLabel(item.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <p className="muted">
            Aún no hay eventos suficientes para construir la línea del tiempo.
          </p>
        )}
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

      {activeTab === 'lifecycle' && (
        <article className="card">
          <div className="panel-header">
            <h2>Ciclo de vida</h2>
            <span className="pill info">{getLifecycleLabel(detail.lifecycleStage)}</span>
          </div>
          <div className="quick-filters-grid" style={{ marginBottom: 16 }}>
            <div className="field span-2">
              <label>Nueva etapa</label>
              <select
                value={lifecycleForm.stage}
                onChange={(e) => setLifecycleForm({ ...lifecycleForm, stage: e.target.value })}
              >
                {lifecycleStageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Decisión</label>
              <input
                value={lifecycleForm.decision}
                onChange={(e) => setLifecycleForm({ ...lifecycleForm, decision: e.target.value })}
                placeholder="Aprobado, observado, enviado..."
              />
            </div>
            <div className="field span-3">
              <label>Comentarios</label>
              <textarea
                value={lifecycleForm.comments}
                onChange={(e) => setLifecycleForm({ ...lifecycleForm, comments: e.target.value })}
                rows={3}
                placeholder="Motivo del cambio, acuerdos, contexto..."
              />
            </div>
          </div>
          <div className="projects-actions" style={{ marginBottom: 16 }}>
            <button className="button" type="button" onClick={submitLifecycleTransition}>
              Actualizar etapa
            </button>
          </div>
          <div className="simple-document-list">
            {(detail.lifecycleHistory ?? []).map((event) => (
              <div key={event.id} className="simple-document-item">
                <strong>
                  {getLifecycleLabel(event.previousStage)} {'->'} {getLifecycleLabel(event.stage)}
                </strong>
                <small>
                  {event.changedBy?.name ?? 'Sin responsable'} · {formatDate(event.createdAt)} ·{' '}
                  Tiempo previo: {formatMinutes(event.timeInPreviousStageMinutes)}
                </small>
                <span>
                  {event.decision ? `Decisión: ${event.decision}. ` : ''}
                  {event.comments ?? 'Sin comentarios.'}
                </span>
                <small className="muted">
                  {event.relatedDocument
                    ? `Documento: ${event.relatedDocument.documentNumber ?? event.relatedDocument.name}`
                    : event.relatedVersion
                      ? `Versión: ${event.relatedVersion.versionLabel}`
                      : 'Sin soporte vinculado'}
                </small>
              </div>
            ))}
            {!detail.lifecycleHistory?.length ? (
              <div className="simple-document-item">Aún no hay historial de etapas.</div>
            ) : null}
          </div>
        </article>
      )}
      {activeTab === 'obligations' && (
        <article className="card">
          <div className="panel-header">
            <h2>Obligaciones</h2>
            <Link className="button" href={`/clm/${detail.id}/obligations`}>
              Gestionar
            </Link>
          </div>
          {detail.obligations.length > 0 ? (
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const counts: Record<string, number> = {};
                        for (const o of detail.obligations)
                          counts[o.status] = (counts[o.status] ?? 0) + 1;
                        return Object.entries(counts).map(([status, value], i) => ({
                          name: normalizeLabel(status),
                          value,
                          fill: CHART_COLORS[i % CHART_COLORS.length],
                        }));
                      })()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {Object.entries(
                        detail.obligations.reduce(
                          (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
                          {} as Record<string, number>
                        )
                      ).map(([status], i) => (
                        <Cell key={status} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginTop: 4,
                  }}
                >
                  {Object.entries(
                    detail.obligations.reduce(
                      (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
                      {} as Record<string, number>
                    )
                  ).map(([status, count], i) => (
                    <span
                      key={status}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: CHART_COLORS[i % CHART_COLORS.length],
                          display: 'inline-block',
                        }}
                      />
                      {normalizeLabel(status)}: {count}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="simple-document-list" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {detail.obligations.map((o) => (
                    <div key={o.id} className="simple-document-item">
                      <strong>{o.description}</strong>
                      <small>
                        {o.responsibleUser?.name ?? 'Sin responsable'} ·{' '}
                        {formatDate(o.commitmentDate)} · {normalizeLabel(o.status)}
                      </small>
                      <span>{o.comments ?? ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="muted" style={{ marginBottom: 16 }}>
              Aún no hay obligaciones registradas.
            </p>
          )}
        </article>
      )}
      {activeTab === 'milestones' && (
        <article className="card">
          <div className="panel-header">
            <h2>Hitos</h2>
            <Link className="button" href={`/clm/${detail.id}/milestones`}>
              Gestionar
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
              Gestionar
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
              Gestionar
            </Link>
          </div>
          {detail.payments.length > 0 ? (
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: '1.5rem' }}>
                    {formatCurrency(
                      String(detail.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)),
                      detail.currency
                    )}
                  </strong>
                  <small className="muted" style={{ display: 'block' }}>
                    monto total de pagos
                  </small>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={(() => {
                      const byStatus: Record<string, number> = {};
                      for (const p of detail.payments)
                        byStatus[p.status] =
                          (byStatus[p.status] ?? 0) + (parseFloat(p.amount) || 0);
                      return Object.entries(byStatus).map(([status, total], i) => ({
                        name: normalizeLabel(status),
                        total,
                        fill: CHART_COLORS[i % CHART_COLORS.length],
                      }));
                    })()}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: any) =>
                        formatCurrency(String(value ?? 0), detail.currency)
                      }
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {detail.payments
                        .reduce((acc, p) => {
                          const key = p.status;
                          if (!acc.includes(key)) acc.push(key);
                          return acc;
                        }, [] as string[])
                        .map((status, i) => (
                          <Cell key={status} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="simple-document-list" style={{ maxHeight: 300, overflowY: 'auto' }}>
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
            </div>
          ) : (
            <p className="muted" style={{ marginBottom: 16 }}>
              Aún no hay pagos registrados.
            </p>
          )}
        </article>
      )}
      {activeTab === 'signatures' && (
        <article className="card">
          <div className="panel-header">
            <h2>Solicitudes de firma</h2>
            <Link className="button" href={`/clm/${detail.id}/signatures`}>
              Gestionar
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
            <h2>Workspace de negociación</h2>
            <Link className="button" href={`/clm/${detail.id}/negotiations`}>
              Gestionar
            </Link>
          </div>
          {negotiationsContent}
        </article>
      )}
      {activeTab === 'versions' && (
        <article className="card">
          <div className="panel-header">
            <h2>Versiones</h2>
            <Link className="button" href={`/clm/${detail.id}/versions`}>
              Gestionar
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
              Gestionar
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
              Gestionar
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
      {riskSection}
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
