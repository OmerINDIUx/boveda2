'use client';

import Link from 'next/link';
import { AlertTriangle, CircleAlert, FileClock, FileText, FolderKanban, GitBranch, Landmark, MessageSquareQuote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../../lib/api';
import { getSessionUser } from '../../lib/auth';
import { SectionHeader } from './section-header';
type MetricValue = number | null;
type MetricSet = {
  activeProjects: MetricValue;
  controlledDocuments: MetricValue;
  approvedDocuments: MetricValue;
  documentsInReview: MetricValue;
  draftDocuments: MetricValue;
  expiredDocuments: MetricValue;
  documentsExpiringSoon: MetricValue;
  activeFlows: MetricValue;
  stoppedFlows: MetricValue;
  openRfis: MetricValue;
  activeContracts: MetricValue;
  contractsExpiringSoon: MetricValue;
  expiredContracts: MetricValue;
  earlyAlerts: MetricValue;
};

type ChartPoint = {
  key: string;
  label: string;
  value: number;
};

type ExecutiveSignal = {
  key: string;
  label: string;
  priority: 'critical' | 'high' | 'medium';
  count: number;
  description: string;
};

type ExecutiveProject = {
  id: string;
  name: string;
  code: string;
  status: string;
  isActive: boolean;
  metrics: MetricSet;
};

type ExecutiveDashboardResponse = {
  generatedAt: string;
  permissions: {
    documents: boolean;
    approvals: boolean;
    contracts: boolean;
    projects: boolean;
  };
  global: MetricSet;
  projects: ExecutiveProject[];
  charts: {
    documentStatusDistribution: ChartPoint[];
    documentsByDiscipline: ChartPoint[];
    upcomingRenewals: ChartPoint[];
    rfisByStatus: ChartPoint[];
    contractsByStatus: ChartPoint[];
  };
  signals: ExecutiveSignal[];
};

const metricCards = [
  { key: 'activeProjects', label: 'Proyectos activos', icon: FolderKanban },
  { key: 'controlledDocuments', label: 'Documentos controlados', icon: FileText },
  { key: 'approvedDocuments', label: 'Documentos aprobados', icon: FileText },
  { key: 'documentsInReview', label: 'Documentos en revision', icon: FileClock },
  { key: 'draftDocuments', label: 'Documentos en borrador', icon: FileText },
  { key: 'expiredDocuments', label: 'Documentos vencidos', icon: AlertTriangle },
  { key: 'documentsExpiringSoon', label: 'Proximos a vencer', icon: CircleAlert },
  { key: 'activeFlows', label: 'Flujos activos', icon: GitBranch },
  { key: 'stoppedFlows', label: 'Flujos detenidos', icon: GitBranch },
  { key: 'openRfis', label: 'RFIs abiertos', icon: MessageSquareQuote },
  { key: 'activeContracts', label: 'Contratos vigentes', icon: Landmark },
  { key: 'contractsExpiringSoon', label: 'Contratos proximos a vencer', icon: Landmark },
  { key: 'expiredContracts', label: 'Contratos vencidos', icon: Landmark },
  { key: 'earlyAlerts', label: 'Alertas tempranas', icon: AlertTriangle }
] as const;

function buildQueryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function documentHref(params?: { projectId?: string; preset?: string }) {
  return `/documents${buildQueryString(params ?? {})}`;
}

function approvalsHref(params?: { projectId?: string; status?: string }) {
  return `/approvals${buildQueryString(params ?? {})}`;
}

function rfisHref(params?: { projectId?: string; status?: string }) {
  return `/rfis${buildQueryString(params ?? {})}`;
}

function metricHref(key: keyof MetricSet) {
  switch (key) {
    case 'activeProjects':
      return '/projects';
    case 'controlledDocuments':
      return documentHref();
    case 'approvedDocuments':
      return documentHref({ preset: 'approved' });
    case 'documentsInReview':
      return documentHref({ preset: 'inReview' });
    case 'draftDocuments':
      return documentHref({ preset: 'draft' });
    case 'expiredDocuments':
      return documentHref({ preset: 'expired' });
    case 'documentsExpiringSoon':
      return documentHref({ preset: 'expiring' });
    case 'activeFlows':
      return approvalsHref({ status: 'active' });
    case 'stoppedFlows':
      return approvalsHref({ status: 'stopped' });
    case 'openRfis':
      return rfisHref({ status: 'open' });
    case 'activeContracts':
    case 'contractsExpiringSoon':
    case 'expiredContracts':
      return '/clm';
    case 'earlyAlerts':
      return '#dashboard-signals';
    default:
      return '/dashboard';
  }
}

function metricHrefByProject(key: keyof MetricSet, projectId: string) {
  switch (key) {
    case 'activeProjects':
      return `/projects/${projectId}`;
    case 'controlledDocuments':
      return documentHref({ projectId });
    case 'approvedDocuments':
      return documentHref({ projectId, preset: 'approved' });
    case 'documentsInReview':
      return documentHref({ projectId, preset: 'inReview' });
    case 'expiredDocuments':
      return documentHref({ projectId, preset: 'expired' });
    case 'stoppedFlows':
      return approvalsHref({ projectId, status: 'stopped' });
    case 'openRfis':
      return rfisHref({ projectId, status: 'open' });
    case 'activeContracts':
      return '/clm';
    case 'earlyAlerts':
      return `/projects/${projectId}`;
    default:
      return `/projects/${projectId}`;
  }
}

function signalHref(signalKey: string) {
  switch (signalKey) {
    case 'expiredDocuments':
      return documentHref({ preset: 'expired' });
    case 'upcomingRenewals':
      return documentHref({ preset: 'renewable' });
    case 'stoppedFlows':
      return approvalsHref({ status: 'stopped' });
    case 'expiredRfis':
      return rfisHref({ status: 'overdue' });
    case 'contractsExpiringSoon':
    case 'pendingObligations':
      return '/clm';
    default:
      return '/dashboard';
  }
}

function chartPointHref(chartKey: keyof ExecutiveDashboardResponse['charts'], point: ChartPoint) {
  switch (chartKey) {
    case 'documentStatusDistribution':
      if (point.key === 'approved' || point.key === 'published') return documentHref({ preset: 'approved' });
      if (point.key === 'pending_approval' || point.key === 'in_review') return documentHref({ preset: 'inReview' });
      if (point.key === 'draft') return documentHref({ preset: 'draft' });
      if (point.key === 'expired') return documentHref({ preset: 'expired' });
      return documentHref();
    case 'documentsByDiscipline':
      return documentHref();
    case 'upcomingRenewals':
      return documentHref({ projectId: point.key, preset: 'renewable' });
    case 'rfisByStatus':
      return rfisHref({ status: point.key === 'answered' ? 'answered' : point.key });
    case 'contractsByStatus':
      return '/clm';
    default:
      return '/dashboard';
  }
}

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

function formatMetric(value: MetricValue) {
  if (value === null) return 'Sin acceso';
  return Intl.NumberFormat('es-MX').format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function resolveDashboardError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('404')) {
      return 'La API actual no expone el endpoint del dashboard ejecutivo. Inicia la API completa para ver estos indicadores.';
    }
    if (error.message.includes('401')) {
      return 'Tu sesion ya no es valida. Vuelve a iniciar sesion para cargar el dashboard ejecutivo.';
    }
    if (error.message.includes('403')) {
      return 'Tu usuario no tiene permiso para consultar el dashboard ejecutivo en la API actual.';
    }
  }

  return 'No fue posible cargar el dashboard ejecutivo con la API actual.';
}

function metricTone(key: keyof MetricSet, value: MetricValue) {
  if (value === null) return 'muted';
  if (['expiredDocuments', 'stoppedFlows', 'expiredContracts', 'earlyAlerts'].includes(key)) {
    return value > 0 ? 'critical' : 'stable';
  }
  if (['documentsExpiringSoon', 'contractsExpiringSoon', 'openRfis'].includes(key)) {
    return value > 0 ? 'attention' : 'stable';
  }
  return 'stable';
}

export function ExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionUser, setSessionUser] = useState<ReturnType<typeof getSessionUser>>(null);

  useEffect(() => {
    let active = true;

    setSessionUser(getSessionUser());

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const response = await apiGet<ExecutiveDashboardResponse>('/dashboard/executive', getToken());
        if (!active) return;
        setData(response);
      } catch (nextError) {
        if (!active) return;
        setError(resolveDashboardError(nextError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const visibleSignals = useMemo(() => (data?.signals ?? []).filter((signal) => signal.count > 0), [data]);

  return (
    <section className="executive-dashboard" id="dashboard-signals">
      <SectionHeader
        title="Dashboard ejecutivo"
        description="Visibilidad global y por proyecto de documentos, flujos, RFIs, contratos y alertas tempranas."
      />

      {sessionUser ? (
        <div className="dashboard-context">
          <span className="pill">{sessionUser.name}</span>
          <span className="pill">{data ? formatDate(data.generatedAt) : 'Actualizando datos'}</span>
        </div>
      ) : null}

      {error ? <div className="card muted">{error}</div> : null}

      <div className="grid">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const value = data?.global[metric.key];
          const href = metricHref(metric.key);
          return (
            <Link className={`card span-3 executive-metric executive-link-card ${metricTone(metric.key, value ?? null)}`} href={href} key={metric.key}>
              <div className="executive-metric-head">
                <Icon size={20} />
                <span>{metric.label}</span>
              </div>
              <strong>{loading ? '...' : formatMetric(value ?? null)}</strong>
            </Link>
          );
        })}
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-4 executive-signals">
          <div className="panel-header">
            <h2>Senales ejecutivas</h2>
            <span className="pill">{visibleSignals.length}</span>
          </div>
          {visibleSignals.length ? (
            <div className="signal-list">
              {visibleSignals.map((signal) => (
                <Link className={`signal-card executive-link-card ${signal.priority}`} href={signalHref(signal.key)} key={signal.key}>
                  <div>
                    <strong>{signal.label}</strong>
                    <p>{signal.description}</p>
                  </div>
                  <span className="signal-count">{signal.count}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">No hay alertas priorizadas visibles para este usuario.</p>
          )}
        </article>

        <article className="card span-8">
          <div className="panel-header">
            <h2>Indicadores por proyecto</h2>
            <span className="pill">{data?.projects.length ?? 0} proyectos</span>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Activos</th>
                  <th>Docs</th>
                  <th>Aprobados</th>
                  <th>Revision</th>
                  <th>Vencidos</th>
                  <th>Flujos detenidos</th>
                  <th>RFIs abiertos</th>
                  <th>Contratos vigentes</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                {(data?.projects ?? []).map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link className="table-link" href={`/projects/${project.id}`}>
                        <strong>{project.name}</strong>
                      </Link>
                      <div className="muted">{project.code}</div>
                    </td>
                    <td><Link className="table-link" href={metricHrefByProject('activeProjects', project.id)}>{formatMetric(project.metrics.activeProjects)}</Link></td>
                    <td><Link className="table-link" href={metricHrefByProject('controlledDocuments', project.id)}>{formatMetric(project.metrics.controlledDocuments)}</Link></td>
                    <td><Link className="table-link" href={metricHrefByProject('approvedDocuments', project.id)}>{formatMetric(project.metrics.approvedDocuments)}</Link></td>
                    <td><Link className="table-link" href={metricHrefByProject('documentsInReview', project.id)}>{formatMetric(project.metrics.documentsInReview)}</Link></td>
                    <td><Link className="table-link" href={metricHrefByProject('expiredDocuments', project.id)}>{formatMetric(project.metrics.expiredDocuments)}</Link></td>
                    <td><Link className="table-link" href={metricHrefByProject('stoppedFlows', project.id)}>{formatMetric(project.metrics.stoppedFlows)}</Link></td>
                    <td><Link className="table-link" href={metricHrefByProject('openRfis', project.id)}>{formatMetric(project.metrics.openRfis)}</Link></td>
                    <td><Link className="table-link" href={metricHrefByProject('activeContracts', project.id)}>{formatMetric(project.metrics.activeContracts)}</Link></td>
                    <td><Link className="table-link" href={metricHrefByProject('earlyAlerts', project.id)}>{formatMetric(project.metrics.earlyAlerts)}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-4">
          <ChartHeader title="Distribucion documental por estado" />
          <DonutChart data={data?.charts.documentStatusDistribution ?? []} chartKey="documentStatusDistribution" />
        </article>
        <article className="card span-4">
          <ChartHeader title="Documentos por disciplina" />
          <BarChart data={data?.charts.documentsByDiscipline ?? []} chartKey="documentsByDiscipline" />
        </article>
        <article className="card span-4">
          <ChartHeader title="Renovaciones proximas" />
          <BarChart data={data?.charts.upcomingRenewals ?? []} chartKey="upcomingRenewals" />
        </article>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-6">
          <ChartHeader title="RFIs por estado" />
          <BarChart data={data?.charts.rfisByStatus ?? []} compact chartKey="rfisByStatus" />
        </article>
        <article className="card span-6">
          <ChartHeader title="Contratos por estado" />
          <BarChart data={data?.charts.contractsByStatus ?? []} compact chartKey="contractsByStatus" />
        </article>
      </div>
    </section>
  );
}

function ChartHeader({ title }: { title: string }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
    </div>
  );
}

function DonutChart({ data, chartKey }: { data: ChartPoint[]; chartKey: keyof ExecutiveDashboardResponse['charts'] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const palette = ['#0f766e', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#475569', '#14b8a6', '#ea580c'];

  if (!data.length || total === 0) {
    return <p className="muted">Sin datos disponibles para esta distribucion.</p>;
  }

  let start = 0;
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const end = start + percentage * 100;
    const gradient = `${palette[index % palette.length]} ${start}% ${end}%`;
    start = end;
    return gradient;
  });

  return (
    <div className="donut-wrap">
      <div className="donut-chart" style={{ background: `conic-gradient(${segments.join(', ')})` }}>
        <div className="donut-hole">
          <strong>{total}</strong>
          <span>Total</span>
        </div>
      </div>
      <div className="chart-legend">
        {data.map((item, index) => (
          <Link className="chart-legend-item executive-link-card" href={chartPointHref(chartKey, item)} key={item.key}>
            <span className="chart-dot" style={{ backgroundColor: palette[index % palette.length] }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, compact = false, chartKey }: { data: ChartPoint[]; compact?: boolean; chartKey: keyof ExecutiveDashboardResponse['charts'] }) {
  const max = Math.max(...data.map((item) => item.value), 0);

  if (!data.length || max === 0) {
    return <p className="muted">Sin datos disponibles para esta grafica.</p>;
  }

  return (
    <div className={`bar-chart ${compact ? 'compact' : ''}`}>
      {data.map((item) => (
        <Link className="bar-chart-row executive-link-card" href={chartPointHref(chartKey, item)} key={item.key}>
          <div className="bar-chart-labels">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </Link>
      ))}
    </div>
  );
}
