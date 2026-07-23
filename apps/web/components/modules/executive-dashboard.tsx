'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CircleAlert,
  FileClock,
  FileText,
  FolderKanban,
  GitBranch,
  Landmark,
  MessageSquareQuote,
  Activity,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../../lib/api';
import { getSessionUser } from '../../lib/auth';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

type MetricValue = number | null;
type MetricSet = Record<string, MetricValue>;
type ChartPoint = { key: string; label: string; value: number };
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

type DashboardData = {
  generatedAt: string;
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

const KPI_CONFIG = [
  {
    key: 'activeProjects',
    label: 'Centros de costos activos',
    icon: FolderKanban,
    color: '#0f766e',
    href: '/projects',
  },
  {
    key: 'controlledDocuments',
    label: 'Documentos controlados',
    icon: FileText,
    color: '#0284c7',
    href: '/documents',
  },
  {
    key: 'documentsInReview',
    label: 'En revisión',
    icon: FileClock,
    color: '#d97706',
    href: '/documents?preset=inReview',
  },
  {
    key: 'expiredDocuments',
    label: 'Vencidos',
    icon: AlertTriangle,
    color: '#dc2626',
    href: '/documents?preset=expired',
  },
  {
    key: 'openRfis',
    label: 'RFIs abiertos',
    icon: MessageSquareQuote,
    color: '#7c3aed',
    href: '/rfis?status=open',
  },
  {
    key: 'activeContracts',
    label: 'Contratos vigentes',
    icon: Landmark,
    color: '#16a34a',
    href: '/clm',
  },
  {
    key: 'stoppedFlows',
    label: 'Flujos detenidos',
    icon: GitBranch,
    color: '#b91c1c',
    href: '/approvals?status=stopped',
  },
  {
    key: 'earlyAlerts',
    label: 'Alertas tempranas',
    icon: CircleAlert,
    color: '#ea580c',
    href: '#signals',
  },
];

function formatMetric(value: MetricValue) {
  if (value === null) return '—';
  return Intl.NumberFormat('es-MX').format(value);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MetricCard({
  config,
  value,
  loading,
}: {
  config: (typeof KPI_CONFIG)[0];
  value: MetricValue;
  loading: boolean;
}) {
  const isCritical = config.key === 'expiredDocuments' || config.key === 'stoppedFlows';
  const isWarning = config.key === 'openRfis' || config.key === 'earlyAlerts';
  const iconBg =
    isCritical && (value ?? 0) > 0
      ? '#fee2e2'
      : isWarning && (value ?? 0) > 0
        ? '#fef3c7'
        : '#ccfbf1';
  const iconColor =
    isCritical && (value ?? 0) > 0
      ? '#dc2626'
      : isWarning && (value ?? 0) > 0
        ? '#d97706'
        : config.color;

  return (
    <a
      href={config.href}
      style={{
        display: 'grid',
        gap: '0.75rem',
        padding: '1.25rem',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 'var(--radius-lg)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 160ms ease, transform 160ms ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            background: iconBg,
            color: iconColor,
          }}
        >
          <config.icon size={20} />
        </div>
        <Activity size={16} style={{ color: '#d1d5db' }} />
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2, color: '#111827' }}>
          {loading ? <Skeleton variant="title" width="50%" /> : formatMetric(value)}
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
          {config.label}
        </div>
      </div>
    </a>
  );
}

function DashboardSkeletonLayout() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <Skeleton variant="title" width="30%" />
        <Skeleton variant="text" width="50%" />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '1.25rem',
              border: '1px solid #e5e7eb',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Skeleton variant="circle" width="2.5rem" height="2.5rem" />
            <Skeleton variant="title" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExecutiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);

  useEffect(() => {
    let active = true;
    setUser(getSessionUser());
    async function load() {
      setLoading(true);
      try {
        const res = await apiGet<DashboardData>(
          '/dashboard/executive',
          typeof window !== 'undefined'
            ? (window.localStorage.getItem('holocron_token') ?? undefined)
            : undefined
        );
        if (active) setData(res);
      } catch {
        if (active) setError('No fue posible cargar el dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const signals = useMemo(() => (data?.signals ?? []).filter((s) => s.count > 0), [data]);

  if (loading) return <DashboardSkeletonLayout />;

  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 1400 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Dashboard ejecutivo
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Visibilidad global de documentos, flujos, RFIs, contratos y alertas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {user && <Badge variant="primary">{user.name}</Badge>}
          {data && <Badge>{formatDate(data.generatedAt)}</Badge>}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: 'var(--radius-md)',
            color: '#dc2626',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {KPI_CONFIG.map((kpi) => (
          <MetricCard
            key={kpi.key}
            config={kpi}
            value={data?.global[kpi.key] ?? null}
            loading={loading}
          />
        ))}
      </div>

      {/* Signals + Projects */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Signals */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Señales ejecutivas</h2>
            <Badge variant={signals.length > 0 ? 'warning' : 'default'}>{signals.length}</Badge>
          </div>
          {signals.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Sin alertas prioritarias.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {signals.map((s) => (
                <div
                  key={s.key}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e5e7eb',
                    background:
                      s.priority === 'critical'
                        ? '#fef2f2'
                        : s.priority === 'high'
                          ? '#fff7ed'
                          : '#f9fafb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                      {s.description}
                    </div>
                  </div>
                  <div
                    style={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: '999px',
                      display: 'grid',
                      placeItems: 'center',
                      background:
                        s.priority === 'critical'
                          ? '#fee2e2'
                          : s.priority === 'high'
                            ? '#fef3c7'
                            : '#f3f4f6',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      color:
                        s.priority === 'critical'
                          ? '#dc2626'
                          : s.priority === 'high'
                            ? '#d97706'
                            : '#6b7280',
                    }}
                  >
                    {s.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project table */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              Indicadores por centro de costos
            </h2>
            <Badge>{data?.projects.length ?? 0} centros de costos</Badge>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Centro de costos</th>
                  <th>Documentos</th>
                  <th>Aprob.</th>
                  <th>Revisión</th>
                  <th>Vencidos</th>
                  <th>Flujos det.</th>
                  <th>Consultas</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                {(data?.projects ?? []).slice(0, 10).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/projects/${p.id}`} className="table-link">
                        <strong>{p.name}</strong>
                      </Link>
                      <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{p.code}</div>
                    </td>
                    <td>{formatMetric(p.metrics.controlledDocuments)}</td>
                    <td>{formatMetric(p.metrics.approvedDocuments)}</td>
                    <td>{formatMetric(p.metrics.documentsInReview)}</td>
                    <td>
                      <Badge
                        variant={Number(p.metrics.expiredDocuments) > 0 ? 'danger' : 'default'}
                      >
                        {formatMetric(p.metrics.expiredDocuments)}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={Number(p.metrics.stoppedFlows) > 0 ? 'warning' : 'default'}>
                        {formatMetric(p.metrics.stoppedFlows)}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={Number(p.metrics.openRfis) > 0 ? 'warning' : 'default'}>
                        {formatMetric(p.metrics.openRfis)}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={Number(p.metrics.earlyAlerts) > 0 ? 'danger' : 'default'}>
                        {formatMetric(p.metrics.earlyAlerts)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <ChartCard title="Documentos por estado">
          <DonutChart data={data?.charts.documentStatusDistribution ?? []} />
        </ChartCard>
        <ChartCard title="Documentos por disciplina">
          <BarChart data={data?.charts.documentsByDiscipline ?? []} />
        </ChartCard>
        <ChartCard title="Renovaciones próximas">
          <BarChart data={data?.charts.upcomingRenewals ?? []} />
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <ChartCard title="Consultas por estado">
          <BarChart data={data?.charts.rfisByStatus ?? []} compact />
        </ChartCard>
        <ChartCard title="Contratos por estado">
          <BarChart data={data?.charts.contractsByStatus ?? []} compact />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
      }}
    >
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 1rem', color: '#374151' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function DonutChart({ data }: { data: ChartPoint[] }) {
  const total = data.reduce((s, i) => s + i.value, 0);
  const palette = [
    '#0f766e',
    '#0284c7',
    '#d97706',
    '#dc2626',
    '#7c3aed',
    '#475569',
    '#14b8a6',
    '#ea580c',
  ];
  if (!data.length || total === 0)
    return <p style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Sin datos</p>;
  let start = 0;
  const segments = data.map((item, i) => {
    const end = start + (item.value / total) * 100;
    const grad = `${palette[i % palette.length]} ${start}% ${end}%`;
    start = end;
    return grad;
  });
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div
        style={{
          flexShrink: 0,
          width: 140,
          height: 140,
          borderRadius: '999px',
          background: `conic-gradient(${segments.join(', ')})`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '999px',
            background: '#fff',
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
          }}
        >
          <div>
            <strong style={{ fontSize: '1.25rem' }}>{total}</strong>
          </div>
          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Total</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'grid', gap: '0.375rem' }}>
        {data.map((item, i) => (
          <div
            key={item.key}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '999px',
                background: palette[i % palette.length],
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, color: '#6b7280' }}>{item.label}</span>
            <strong style={{ color: '#374151' }}>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, compact = false }: { data: ChartPoint[]; compact?: boolean }) {
  const max = Math.max(...data.map((i) => i.value), 0);
  if (!data.length || max === 0)
    return <p style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Sin datos</p>;
  return (
    <div style={{ display: 'grid', gap: '0.625rem' }}>
      {data.map((item) => (
        <div key={item.key}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
            }}
          >
            <span style={{ color: '#6b7280' }}>{item.label}</span>
            <strong style={{ color: '#374151' }}>{item.value}</strong>
          </div>
          <div
            style={{
              height: compact ? 6 : 8,
              background: '#e5e7eb',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(item.value / max) * 100}%`,
                background: 'linear-gradient(90deg, #0f766e, #14b8a6)',
                borderRadius: 'inherit',
                transition: 'width 400ms ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
