'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../../lib/api';
import { ContractDetail, Project } from './types';
import {
  statusOptions,
  lifecycleStageOptions,
  stripLifecycleFields,
  TextField,
  getErrorMessage,
} from './utils';

type ContractFormState = {
  projectId: string;
  name: string;
  supplierName: string;
  clientName: string;
  responsibleArea: string;
  status: string;
  lifecycleStage: string;
  startDate: string;
  endDate: string;
  renewable: boolean;
  renewalDate: string;
  amount: string;
  currency: string;
  responsibleUserId: string;
  renewalNoticeDays: string;
  closeReason: string;
};

export function ContractFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ContractFormState>({
    projectId: '',
    name: '',
    supplierName: '',
    clientName: '',
    responsibleArea: '',
    status: 'draft',
    lifecycleStage: 'request',
    startDate: '',
    endDate: '',
    renewable: false,
    renewalDate: '',
    amount: '0',
    currency: 'MXN',
    responsibleUserId: '',
    renewalNoticeDays: '30',
    closeReason: '',
  });
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const p = await apiGet<Project[]>('/projects');
        if (active) setProjects(p);
      } catch (projectError) {
        if (active) {
          setProjects([]);
          setError(getErrorMessage(projectError, 'No se pudieron cargar los centros de costos.'));
        }
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
    async function load() {
      setLoading(true);
      try {
        const d = await apiGet<ContractDetail>(`/clm/contracts/${contractId}`);
        if (!active) return;
        setForm({
          projectId: d.projectId,
          name: d.name,
          supplierName: d.supplierName ?? '',
          clientName: d.clientName ?? '',
          responsibleArea: d.responsibleArea ?? '',
          status: d.status,
          lifecycleStage: d.lifecycleStage ?? 'request',
          startDate: d.startDate ?? '',
          endDate: d.endDate ?? '',
          renewable: d.renewable ?? Boolean(d.renewalDate),
          renewalDate: d.renewalDate ?? '',
          amount: d.amount ?? '0',
          currency: d.currency ?? 'MXN',
          responsibleUserId: d.responsibleUserId ?? '',
          renewalNoticeDays: String(d.renewalNoticeDays ?? 30),
          closeReason: d.closeReason ?? '',
        });
      } catch {
        setError('No se pudo cargar el contrato.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contractId, mode]);

  async function submit() {
    if (!form.projectId || !form.name.trim()) {
      setError('Completa centro de costos y nombre del contrato.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { renewalDate, renewalNoticeDays, ...baseFields } = form;
      const submissionFields = form.renewable
        ? { ...baseFields, renewalDate, renewalNoticeDays }
        : baseFields;
      const payload = Object.fromEntries(
        Object.entries(submissionFields).filter(([, value]) => value !== '')
      );
      if (mode === 'create') {
        let created: ContractDetail;
        try {
          created = await apiPost<ContractDetail>('/clm/contracts', payload);
        } catch (error) {
          if (!getErrorMessage(error, '').includes('lifecycleStage should not exist')) throw error;
          created = await apiPost<ContractDetail>('/clm/contracts', stripLifecycleFields(payload));
        }
        router.push(`/clm/${created.id}`);
        return;
      }
      if (!contractId) return;
      try {
        await apiPatch(`/clm/contracts/${contractId}`, payload);
      } catch (error) {
        if (!getErrorMessage(error, '').includes('lifecycleStage should not exist')) throw error;
        await apiPatch(`/clm/contracts/${contractId}`, stripLifecycleFields(payload));
      }
      router.push(`/clm/${contractId}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{mode === 'create' ? 'Nuevo contrato' : 'Editar contrato'}</h1>
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
          <h2>Datos del contrato</h2>
        </div>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <>
            <div className="quick-filters-grid clm-form-grid">
              <div className="field">
                <label>Centro de costos</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  <option value="">Selecciona</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Nombre del contrato"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <TextField
                label="Proveedor interno"
                value={form.supplierName}
                onChange={(v) => setForm({ ...form, supplierName: v })}
              />
              <TextField
                label="Cliente"
                value={form.clientName}
                onChange={(v) => setForm({ ...form, clientName: v })}
              />
              <TextField
                label="Área responsable"
                value={form.responsibleArea}
                onChange={(v) => setForm({ ...form, responsibleArea: v })}
              />
              <div className="field">
                <label>Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Etapa del ciclo de vida</label>
                <select
                  value={form.lifecycleStage}
                  onChange={(e) => setForm({ ...form, lifecycleStage: e.target.value })}
                >
                  {lifecycleStageOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Inicio"
                type="date"
                value={form.startDate}
                onChange={(v) => setForm({ ...form, startDate: v })}
              />
              <TextField
                label="Vencimiento"
                type="date"
                value={form.endDate}
                onChange={(v) => setForm({ ...form, endDate: v })}
              />
              <div className="field">
                <label>¿Necesita renovación?</label>
                <select
                  value={form.renewable ? 'yes' : 'no'}
                  onChange={(e) => setForm({ ...form, renewable: e.target.value === 'yes' })}
                >
                  <option value="no">No</option>
                  <option value="yes">Sí</option>
                </select>
              </div>
              {form.renewable ? (
                <>
                  <TextField
                    label="Fecha de renovación"
                    type="date"
                    value={form.renewalDate}
                    onChange={(v) => setForm({ ...form, renewalDate: v })}
                  />
                  <TextField
                    label="Días de preaviso"
                    value={form.renewalNoticeDays}
                    onChange={(v) => setForm({ ...form, renewalNoticeDays: v })}
                  />
                </>
              ) : null}
              <TextField
                label="Monto (opcional)"
                type="number"
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
              />
              <TextField
                label="Moneda"
                value={form.currency}
                onChange={(v) => setForm({ ...form, currency: v })}
              />
            </div>
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
