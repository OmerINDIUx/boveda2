'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../../lib/api';
import { ContractDetail, Project, Tag } from './types';
import {
  fallbackProjects,
  statusOptions,
  lifecycleStageOptions,
  stripLifecycleFields,
  TextField,
} from './utils';

export function ContractFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [form, setForm] = useState<any>({
    projectId: '',
    name: '',
    supplierName: '',
    clientName: '',
    responsibleArea: '',
    contractType: '',
    status: 'draft',
    lifecycleStage: 'request',
    startDate: '',
    endDate: '',
    renewalDate: '',
    amount: '',
    currency: 'MXN',
    responsibleUserId: '',
    renewalNoticeDays: '30',
    closeReason: '',
    parentContractId: '',
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const p = await apiGet<Project[]>('/projects');
        if (active) setProjects(p.length ? p : fallbackProjects);
      } catch {
        if (active) setProjects(fallbackProjects);
      }
    }
    async function loadTags() {
      try {
        const t = await apiGet<Tag[]>('/clm/tags');
        if (active) setTags(t);
      } catch {
        setTags([]);
      }
    }
    void loadProjects();
    void loadTags();
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
          contractType: d.contractType ?? '',
          status: d.status,
          lifecycleStage: d.lifecycleStage ?? 'request',
          startDate: d.startDate ?? '',
          endDate: d.endDate ?? '',
          renewalDate: d.renewalDate ?? '',
          amount: d.amount ?? '',
          currency: d.currency ?? 'MXN',
          responsibleUserId: d.responsibleUserId ?? '',
          renewalNoticeDays: String(d.renewalNoticeDays ?? 30),
          closeReason: d.closeReason ?? '',
          parentContractId: d.parentContractId ?? '',
        });
        setSelectedTagIds(d.tags?.map((t: { id: string }) => t.id) ?? []);
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
      setError('Completa proyecto y nombre.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      if (mode === 'create') {
        let created: ContractDetail;
        try {
          created = await apiPost<ContractDetail>('/clm/contracts', payload);
        } catch (error: any) {
          if (!String(error?.message ?? '').includes('lifecycleStage should not exist'))
            throw error;
          created = await apiPost<ContractDetail>('/clm/contracts', stripLifecycleFields(payload));
        }
        if (selectedTagIds.length)
          await apiPost(`/clm/contracts/${created.id}/tags`, { tagIds: selectedTagIds });
        router.push(`/clm/${created.id}`);
        return;
      }
      if (!contractId) return;
      try {
        await apiPatch(`/clm/contracts/${contractId}`, payload);
      } catch (error: any) {
        if (!String(error?.message ?? '').includes('lifecycleStage should not exist')) throw error;
        await apiPatch(`/clm/contracts/${contractId}`, stripLifecycleFields(payload));
      }
      await apiPost(`/clm/contracts/${contractId}/tags`, { tagIds: selectedTagIds });
      router.push(`/clm/${contractId}`);
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar.');
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
                <label>Proyecto</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  <option value="">Selecciona</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Nombre"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <TextField
                label="Proveedor"
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
              <TextField
                label="Tipo"
                value={form.contractType}
                onChange={(v) => setForm({ ...form, contractType: v })}
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
              <TextField
                label="Renovación"
                type="date"
                value={form.renewalDate}
                onChange={(v) => setForm({ ...form, renewalDate: v })}
              />
              <TextField
                label="Monto"
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
              />
              <TextField
                label="Moneda"
                value={form.currency}
                onChange={(v) => setForm({ ...form, currency: v })}
              />
              <TextField
                label="Días preaviso"
                value={form.renewalNoticeDays}
                onChange={(v) => setForm({ ...form, renewalNoticeDays: v })}
              />
              <TextField
                label="Contrato padre (id)"
                value={form.parentContractId}
                onChange={(v) => setForm({ ...form, parentContractId: v })}
              />
            </div>
            {tags.length ? (
              <div className="field" style={{ marginTop: 12 }}>
                <label>Tags</label>
                <div className="projects-actions" style={{ gap: 4 }}>
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      className={`button ${selectedTagIds.includes(t.id) ? '' : 'secondary'}`}
                      type="button"
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                        )
                      }
                      style={{ fontSize: 12, padding: '2px 8px' }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
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
