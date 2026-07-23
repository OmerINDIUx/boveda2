'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet } from '../../../lib/api';
import { normalizeLabel } from '../../../lib/labels';
import { formatCurrency } from './utils';

type DashboardMetric = { key: string; label: string; value: number };
type DashboardData = {
  contractsByStatus: DashboardMetric[];
  contractsByType: DashboardMetric[];
  expiringThisMonth: number;
  totalAmount: number;
  pendingObligations: number;
  activeContracts: number;
  totalContracts: number;
};

export function ClmDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const d = await apiGet<DashboardData>('/clm/dashboard');
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
            {(data?.contractsByStatus ?? []).map((item) => (
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
            {(data?.contractsByType ?? []).map((item, i) => (
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
