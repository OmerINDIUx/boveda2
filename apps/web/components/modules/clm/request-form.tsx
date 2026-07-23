'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../section-header';
import { apiGet, apiPost } from '../../../lib/api';
import { Project } from './types';

const contractTypes = [
  'Obra',
  'Prestación de servicios',
  'Arrendamiento',
  'Confidencialidad',
  'Compra de materiales',
  'Convenio modificatorio',
  'Proveedor',
  'Cliente',
  'Licenciamiento',
  'Mantenimiento',
  'Asociación o colaboración',
];

export function ContractRequestFormPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    contractType: '',
    projectId: '',
    counterpartyName: '',
    counterpartyRfc: '',
    estimatedAmount: '',
    currency: 'MXN',
    startDate: '',
    endDate: '',
    requestingArea: '',
    responsibleUserId: '',
    urgencyLevel: 'normal',
    riskLevel: 'low',
    description: '',
    justification: '',
  });

  useEffect(() => {
    apiGet<Project[]>('/projects')
      .then(setProjects)
      .catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contractType || !form.counterpartyName) {
      setError('Completa los campos obligatorios: tipo de contrato y contraparte.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await apiPost<{ id: string }>('/clm/requests', form);
      router.push(`/clm/requests/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar solicitud.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <SectionHeader
        title="Nueva solicitud de contrato"
        description="Registra una solicitud formal antes de crear el contrato."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/clm/requests">
          Volver
        </Link>
      </div>
      {error ? (
        <article className="card muted" style={{ marginBottom: 16 }}>
          {error}
        </article>
      ) : null}
      <form onSubmit={handleSubmit}>
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <h2>Información general</h2>
          </div>
          <div className="quick-filters-grid">
            <div className="field span-2">
              <label>Tipo de contrato *</label>
              <select
                value={form.contractType}
                onChange={(e) => set('contractType', e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {contractTypes.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Centro de costos</label>
              <select value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
                <option value="">Sin centro de costos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Moneda</label>
              <select value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </article>
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <h2>Contraparte</h2>
          </div>
          <div className="quick-filters-grid">
            <div className="field span-2">
              <label>Nombre / Razón social *</label>
              <input
                value={form.counterpartyName}
                onChange={(e) => set('counterpartyName', e.target.value)}
                placeholder="Proveedor o cliente"
                required
              />
            </div>
            <div className="field">
              <label>RFC</label>
              <input
                value={form.counterpartyRfc}
                onChange={(e) => set('counterpartyRfc', e.target.value)}
                placeholder="RFC"
              />
            </div>
            <div className="field">
              <label>Área solicitante</label>
              <input
                value={form.requestingArea}
                onChange={(e) => set('requestingArea', e.target.value)}
                placeholder="Ej. Operaciones"
              />
            </div>
          </div>
        </article>
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <h2>Económico y vigencia</h2>
          </div>
          <div className="quick-filters-grid">
            <div className="field">
              <label>Monto estimado</label>
              <input
                type="number"
                value={form.estimatedAmount}
                onChange={(e) => set('estimatedAmount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>Fecha inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Fecha fin</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </div>
          </div>
        </article>
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <h2>Clasificación</h2>
          </div>
          <div className="quick-filters-grid">
            <div className="field">
              <label>Urgencia</label>
              <select
                value={form.urgencyLevel}
                onChange={(e) => set('urgencyLevel', e.target.value)}
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div className="field">
              <label>Nivel de riesgo</label>
              <select value={form.riskLevel} onChange={(e) => set('riskLevel', e.target.value)}>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Descripción / Justificación</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe el motivo y alcance de la solicitud..."
            />
          </div>
        </article>
        <div className="projects-actions">
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear solicitud'}
          </button>
        </div>
      </form>
    </section>
  );
}
