'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Activity,
  FileText,
  Mail,
} from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { getSessionToken } from '../../lib/auth';
import { useTranslation } from 'react-i18next';
import { NomenclaturesWorkspace } from './nomenclatures-workspace';

type Sla = {
  id: string;
  projectId: string;
  name: string;
  scope: string;
  targetHours: number;
  warningHours?: number;
  escalationUserId?: string;
  isActive: boolean;
};

type Metrics = {
  totalSlas: number;
  totalRecords: number;
  withinSla: number;
  breached: number;
  warning: number;
  avgResponseHours: string | null;
};

export function SlasWorkspace() {
  const { t } = useTranslation();
  const token = getSessionToken();
  const [projects, setProjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [slas, setSlas] = useState<Sla[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSla, setNewSla] = useState({
    name: '',
    scope: 'email_initial_response',
    targetHours: 4,
    warningHours: 3,
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'slas' | 'templates' | 'nomenclatures' | 'metrics'>('slas');

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiGet<Array<{ id: string; name: string; code: string }>>(
        '/projects',
        token
      );
      setProjects(data);
      if (data.length && !selectedProject) setSelectedProject(data[0].id);
    } catch {
      // Ignore project loading failures in the workspace shell.
    }
  }, [token, selectedProject]);

  const loadData = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const [slaData, metricsData] = await Promise.all([
        apiGet<Sla[]>(`/response-times/slas/${selectedProject}`, token),
        apiGet<Metrics>(`/response-times/metrics/${selectedProject}`, token),
      ]);
      setSlas(slaData);
      setMetrics(metricsData);
    } catch {
      // Keep the current dashboard values when refresh fails.
    }
  }, [selectedProject, token]);

  useEffect(() => {
    loadProjects();
  }, []);
  useEffect(() => {
    loadData();
  }, [selectedProject]);

  const createSla = async () => {
    if (!newSla.name || !selectedProject) return;
    setSaving(true);
    try {
      await apiPost('/response-times/slas', { ...newSla, projectId: selectedProject }, token);
      setCreating(false);
      setNewSla({ name: '', scope: 'email_initial_response', targetHours: 4, warningHours: 3 });
      loadData();
    } catch {
      // Ignore save failures so the draft remains editable.
    }
    setSaving(false);
  };

  const scopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      email_initial_response: 'Respuesta inicial a correo',
      email_resolution: 'Resolución de correo',
      workflow_step: 'Paso de flujo',
    };
    return labels[scope] ?? scope;
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('sla.title')}</h1>
          <p
            style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}
          >
            {t('sla.metrics')}
          </p>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface)',
            fontSize: '0.875rem',
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['slas', 'templates', 'nomenclatures', 'metrics'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            style={{
              padding: '0.5rem 1rem',
              border: `1px solid ${tab === tabKey ? 'var(--color-primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              background: tab === tabKey ? 'var(--color-primary-light)' : 'var(--surface)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: tab === tabKey ? 600 : 400,
              color: tab === tabKey ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
          >
            {tabKey === 'slas'
              ? t('sla.title')
              : tabKey === 'templates'
                ? 'Plantillas de solicitud'
                : tabKey === 'nomenclatures'
                  ? 'Nomenclaturas'
                  : t('sla.metrics')}
          </button>
        ))}
      </div>

      {tab === 'slas' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{t('sla.title')}</h2>
            <button
              onClick={() => setCreating(!creating)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.8125rem',
              }}
            >
              <Plus size={14} /> {t('sla.new')}
            </button>
          </div>

          {creating && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: 'var(--surface-strong)',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gap: '0.75rem',
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {t('common.name')}
                </label>
                <input
                  value={newSla.name}
                  onChange={(e) => setNewSla({ ...newSla, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {t('sla.scope')}
                </label>
                <select
                  value={newSla.scope}
                  onChange={(e) => setNewSla({ ...newSla, scope: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <option value="email_initial_response">Respuesta inicial</option>
                  <option value="email_resolution">Resolución</option>
                  <option value="workflow_step">Paso de flujo</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {t('sla.target_hours')}
                </label>
                <input
                  type="number"
                  value={newSla.targetHours}
                  onChange={(e) => setNewSla({ ...newSla, targetHours: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {t('sla.warning_hours')}
                </label>
                <input
                  type="number"
                  value={newSla.warningHours}
                  onChange={(e) => setNewSla({ ...newSla, warningHours: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
              <button
                onClick={createSla}
                disabled={saving || !newSla.name}
                style={{
                  gridColumn: '1 / -1',
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {t('common.save')}
              </button>
            </div>
          )}

          {slas.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              Sin SLAs configurados
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {slas.map((sla) => (
                <div
                  key={sla.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{sla.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {scopeLabel(sla.scope)} · {sla.targetHours}h objetivo
                      {sla.warningHours ? ` · ⚠️ ${sla.warningHours}h warning` : ''}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '999px',
                      background: sla.isActive
                        ? 'var(--color-success-light)'
                        : 'var(--surface-strong)',
                      color: sla.isActive ? 'var(--color-success)' : 'var(--text-tertiary)',
                    }}
                  >
                    {sla.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid">
          <article className="card span-7" style={{ padding: '1.25rem' }}>
            <div className="panel-header">
              <div>
                <h2 style={{ margin: 0 }}>Plantillas para pedir información</h2>
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  Define el asunto, la pregunta, el plazo del SLA y quién debe responder. Estas
                  plantillas aparecen directamente al crear un RFI.
                </p>
              </div>
              <FileText size={22} color="var(--color-primary)" />
            </div>
            <div className="projects-actions" style={{ marginTop: 16 }}>
              <Link
                className="button"
                href={`/rfi-templates/new${selectedProject ? `?projectId=${selectedProject}` : ''}`}
              >
                <Plus size={16} />
                Nueva plantilla
              </Link>
              <Link
                className="button secondary"
                href={`/rfi-templates${selectedProject ? `?projectId=${selectedProject}` : ''}`}
              >
                Administrar plantillas
              </Link>
            </div>
          </article>
          <article className="card span-5" style={{ padding: '1.25rem' }}>
            <div className="panel-header">
              <h2 style={{ margin: 0 }}>Ciclo por correo</h2>
              <Mail size={20} color="var(--color-primary)" />
            </div>
            <div className="simple-document-list">
              <div className="simple-document-item">
                <strong>1. Envío</strong>
                <span>El RFI se envía al correo de la persona responsable.</span>
              </div>
              <div className="simple-document-item">
                <strong>2. Respuesta</strong>
                <span>La persona responde al mismo correo sin entrar al sistema.</span>
              </div>
              <div className="simple-document-item">
                <strong>3. Expediente</strong>
                <span>La respuesta queda registrada en la conversación del RFI.</span>
              </div>
            </div>
          </article>
        </div>
      )}

      {tab === 'nomenclatures' && <NomenclaturesWorkspace />}

      {tab === 'metrics' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <Activity size={24} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {metrics?.totalRecords ?? 0}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Registros totales
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <CheckCircle2
              size={24}
              style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }}
            />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {metrics?.withinSla ?? 0}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {t('sla.within_sla')}
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <AlertTriangle
              size={24}
              style={{ color: 'var(--color-warning)', marginBottom: '0.5rem' }}
            />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning)' }}>
              {metrics?.warning ?? 0}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {t('sla.warning')}
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <XCircle size={24} style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              {metrics?.breached ?? 0}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {t('sla.breached')}
            </div>
          </div>
          <div
            className="card"
            style={{ padding: '1.25rem', textAlign: 'center', gridColumn: '1 / -1' }}
          >
            <BarChart3
              size={24}
              style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}
            />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {metrics?.avgResponseHours ?? '—'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {t('sla.avg_response')} (horas)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
