'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiPost } from '../../../lib/api';
import { getErrorMessage, formatCurrency } from './utils';

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
      const r = await apiPost<any>('/clm/reports', { type });
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
