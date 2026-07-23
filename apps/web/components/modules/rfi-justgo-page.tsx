'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FilePlus2, Send, Sparkles, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { normalizeLabel } from '../../lib/labels';

type ProjectOption = { id: string; name: string; code: string };
type ProjectMemberOption = { id: string; name: string; email: string; role: string };
type DocumentOption = { id: string; name: string; documentNumber: string };

type RfiTemplate = {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  titleTemplate: string;
  descriptionTemplate: string;
  defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
  defaultDueDays?: number;
  autoAssignRule?: Record<string, unknown>;
  isActive: boolean;
};

type TemplateEvaluation = {
  template: RfiTemplate;
  projectId: string;
  title: string;
  description: string;
  priority: string;
  dueDate?: string;
  assignedToId?: string;
  assignedToName?: string | null;
  projectMembers: ProjectMemberOption[];
  documents: DocumentOption[];
};

type CreateRfiForm = {
  projectId: string;
  documentId: string;
  title: string;
  description: string;
  assignedToId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate: string;
};

type Step = 'template' | 'form' | 'confirm';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

export function RfiJustGoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('template');

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [templates, setTemplates] = useState<RfiTemplate[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [evalData, setEvalData] = useState<TemplateEvaluation | null>(null);
  const [form, setForm] = useState<CreateRfiForm>({
    projectId: '',
    documentId: '',
    title: '',
    description: '',
    assignedToId: '',
    priority: 'normal',
    dueDate: '',
  });

  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [options, templatesData] = await Promise.all([
          apiGet<{ projects: ProjectOption[] }>('/rfis/form-options', getToken()),
          apiGet<RfiTemplate[]>('/rfis/templates?isActive=true', getToken()),
        ]);
        if (!active) return;
        setProjects(options.projects);
        setTemplates(templatesData.filter((t) => t.isActive));
      } catch {
        if (!active) return;
        setError('No fue posible cargar datos iniciales.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => !t.projectId || t.projectId === selectedProjectId);
  }, [templates, selectedProjectId]);

  async function handleNext() {
    if (!selectedProjectId || !selectedTemplateId) {
      setError('Selecciona centro de costos y plantilla.');
      return;
    }

    setEvaluating(true);
    setError('');

    try {
      const result = await apiPost<TemplateEvaluation>(
        `/rfis/templates/${selectedTemplateId}/evaluate`,
        { projectId: selectedProjectId },
        getToken()
      );
      setEvalData(result);
      setForm({
        projectId: result.projectId,
        documentId: '',
        title: result.title,
        description: result.description,
        assignedToId: result.assignedToId ?? '',
        priority: result.priority as any,
        dueDate: result.dueDate ?? '',
      });
      setStep('form');
    } catch {
      setError('No fue posible evaluar la plantilla.');
    } finally {
      setEvaluating(false);
    }
  }

  function handleFormChange(key: keyof CreateRfiForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Completa título y descripción del RFI.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await apiPost<any>(
        '/rfis',
        {
          ...form,
          templateId: selectedTemplateId,
          documentId: form.documentId || undefined,
          assignedToId: form.assignedToId || undefined,
          dueDate: form.dueDate || undefined,
        },
        getToken()
      );
      router.push(`/rfis/${created.id}`);
      router.refresh();
    } catch {
      setError('No fue posible crear el RFI.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando...</p>
        </article>
      </section>
    );
  }

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>
            RFI Rápido{' '}
            <Sparkles size={20} style={{ display: 'inline', color: 'var(--color-accent)' }} />
          </h1>
          <p className="muted">
            Flujo exprés: selecciona plantilla, revisa, y crea el RFI en segundos.
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href="/rfis">
            Volver a RFIs
          </Link>
        </div>
      </div>

      {error ? <article className="card muted">{error}</article> : null}

      {/* Step indicator */}
      <div className="grid" style={{ marginTop: 16 }}>
        {(['template', 'form', 'confirm'] as Step[]).map((s, i) => (
          <div
            className={`card span-4 ${step === s ? 'project-metric info' : ''}`}
            key={s}
            style={{ opacity: step === s ? 1 : 0.5, cursor: 'default' }}
          >
            <strong>{i + 1}</strong>
            <span>
              {s === 'template' ? 'Elegir plantilla' : s === 'form' ? 'Revisar datos' : 'Confirmar'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Choose template */}
      {step === 'template' ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>
              <Zap size={18} style={{ color: 'var(--color-accent)' }} /> Paso 1: Elige centro de
              costos y plantilla
            </h2>
          </div>

          <div className="quick-filters-grid rfi-filters-grid">
            <div className="field">
              <label>Centro de costos</label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedTemplateId('');
                }}
              >
                <option value="">Selecciona un centro de costos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProjectId ? (
              <div className="field span-2">
                <label>Plantilla rápida</label>
                {filteredTemplates.length === 0 ? (
                  <p className="muted" style={{ padding: '0.5rem 0' }}>
                    No hay plantillas disponibles para este centro de costos.{' '}
                    <Link href="/rfi-templates/new" style={{ color: 'var(--color-primary)' }}>
                      Crear una
                    </Link>
                  </p>
                ) : (
                  <div className="simple-document-list">
                    {filteredTemplates.map((t) => (
                      <div
                        className={`simple-document-item ${selectedTemplateId === t.id ? 'project-list-item active' : ''}`}
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="project-list-head">
                          <strong>{t.name}</strong>
                          <span
                            className={`pill ${t.defaultPriority === 'urgent' || t.defaultPriority === 'high' ? 'danger' : 'success'}`}
                          >
                            {normalizeLabel(t.defaultPriority)}
                          </span>
                        </div>
                        {t.description ? <small className="muted">{t.description}</small> : null}
                        <small>
                          {t.autoAssignRule ? 'Asignación automática · ' : ''}
                          {t.defaultDueDays
                            ? `Plazo: ${t.defaultDueDays} días`
                            : 'Sin plazo definido'}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="projects-actions" style={{ marginTop: 16 }}>
            <button
              className="button"
              type="button"
              onClick={handleNext}
              disabled={!selectedProjectId || !selectedTemplateId || evaluating}
            >
              {evaluating ? 'Evaluando...' : 'Siguiente: Revisar datos'}
            </button>
          </div>
        </article>
      ) : null}

      {/* Step 2: Review form */}
      {step === 'form' ? (
        <article className="card" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>
              <FilePlus2 size={18} color="var(--primary)" /> Paso 2: Revisa y ajusta
            </h2>
          </div>

          {evalData?.assignedToName ? (
            <div
              className="card"
              style={{
                marginBottom: 16,
                background: 'var(--color-primary-light)',
                borderColor: 'var(--color-primary-border)',
              }}
            >
              <span>
                Asignado automáticamente a: <strong>{evalData.assignedToName}</strong>
              </span>
              <small className="muted"> (puedes cambiarlo abajo)</small>
            </div>
          ) : null}

          <div className="quick-filters-grid rfi-filters-grid">
            <div className="field span-2">
              <label>Título</label>
              <input
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Prioridad</label>
              <select
                value={form.priority}
                onChange={(e) => handleFormChange('priority', e.target.value)}
              >
                <option value="low">Baja</option>
                <option value="normal">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div className="field">
              <label>Fecha límite</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleFormChange('dueDate', e.target.value)}
              />
            </div>
            <div className="field span-2">
              <label>Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Documento relacionado</label>
              <select
                value={form.documentId}
                onChange={(e) => handleFormChange('documentId', e.target.value)}
              >
                <option value="">Sin documento</option>
                {(evalData?.documents ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.documentNumber} · {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Responsable</label>
              <select
                value={form.assignedToId}
                onChange={(e) => handleFormChange('assignedToId', e.target.value)}
              >
                <option value="">Sin asignar</option>
                {(evalData?.projectMembers ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="projects-actions" style={{ marginTop: 16 }}>
            <button className="button secondary" type="button" onClick={() => setStep('template')}>
              Atrás
            </button>
            <button className="button" type="button" onClick={handleCreate} disabled={saving}>
              {saving ? (
                'Creando...'
              ) : (
                <>
                  <Send size={16} /> Crear RFI y enviar
                </>
              )}
            </button>
          </div>
        </article>
      ) : null}
    </section>
  );
}
