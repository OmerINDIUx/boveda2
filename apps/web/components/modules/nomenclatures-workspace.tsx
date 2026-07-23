'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, Check, X, RefreshCw } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { getSessionToken } from '../../lib/auth';
import { useTranslation } from 'react-i18next';

type Segment = { type: string; value?: string; padding?: number };
type Rule = {
  id: string;
  projectId: string;
  name: string;
  pattern: string;
  segments: Segment[];
  isActive: boolean;
};

const SEGMENT_TYPES = [
  { value: 'project_code', label: 'Código del centro de costos' },
  { value: 'discipline', label: 'Disciplina' },
  { value: 'sequential', label: 'Secuencial' },
  { value: 'year', label: 'Año' },
  { value: 'month', label: 'Mes' },
  { value: 'text', label: 'Texto fijo' },
];

export function NomenclaturesWorkspace() {
  const { t } = useTranslation();
  const token = getSessionToken();
  const [rules, setRules] = useState<Rule[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiGet<Array<{ id: string; name: string; code: string }>>(
        '/projects',
        token
      );
      setProjects(data);
      if (data.length && !selectedProject) setSelectedProject(data[0].id);
    } catch {
      // Ignore project loading failures in the editor shell.
    }
  }, [token, selectedProject]);

  const loadRules = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const data = await apiGet<Rule[]>(`/nomenclatures?projectId=${selectedProject}`, token);
      setRules(data);
    } catch {
      // Ignore refresh failures and keep the current rules.
    }
  }, [selectedProject, token]);

  useEffect(() => {
    loadProjects();
  }, []);
  useEffect(() => {
    loadRules();
  }, [selectedProject]);

  const buildPattern = (segments: Segment[]) =>
    segments.map((s) => `{${s.type}${s.value ? ':' + s.value : ''}}`).join('-');

  const handlePreview = async (segments: Segment[]) => {
    if (!editing) return;
    try {
      const ctx: Record<string, string> = {
        projectCode: projects.find((p) => p.id === selectedProject)?.code ?? 'XXXX',
      };
      const res = await apiPost<{ preview: string }>(
        `/nomenclatures/${editing.id}/preview`,
        { context: ctx },
        token
      );
      setPreview(res.preview);
    } catch {
      setPreview(buildPattern(segments).replace(/\{(\w+)\}/g, 'XXXX'));
    }
  };

  const save = async () => {
    if (!editing || !selectedProject) return;
    setSaving(true);
    try {
      const pattern = buildPattern(editing.segments);
      if (creating) {
        await apiPost(
          '/nomenclatures',
          { projectId: selectedProject, name: editing.name, pattern, segments: editing.segments },
          token
        );
      } else {
        await apiPatch(
          `/nomenclatures/${editing.id}`,
          { name: editing.name, pattern, segments: editing.segments },
          token
        );
      }
      setCreating(false);
      setEditing(null);
      setPreview('');
      loadRules();
    } catch {
      // Ignore save failures so the editor values stay available.
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    try {
      await apiDelete(`/nomenclatures/${id}`, token);
      loadRules();
    } catch {
      // Ignore delete failures until the next refresh.
    }
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {t('nomenclatures.title')}
          </h1>
          <p
            style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}
          >
            {t('nomenclatures.pattern')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
          <button
            onClick={() => {
              setCreating(true);
              setEditing({
                id: '',
                projectId: selectedProject,
                name: '',
                pattern: '',
                segments: [{ type: 'project_code' }],
                isActive: true,
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Plus size={16} /> {t('nomenclatures.new')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {t('nomenclatures.title')}
          </h2>
          {rules.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              {t('nomenclatures.no_rules')}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rule.name}</div>
                    <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {rule.pattern}
                    </code>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      onClick={() => {
                        setCreating(false);
                        setEditing(rule);
                        setPreview('');
                      }}
                      style={{
                        padding: '0.375rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(rule.id)}
                      style={{
                        padding: '0.375rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        color: 'var(--color-danger)',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(editing || creating) && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              {creating ? t('nomenclatures.new') : 'Editar'}
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.375rem',
                }}
              >
                {t('common.name')}
              </label>
              <input
                value={editing?.name ?? ''}
                onChange={(e) => setEditing({ ...editing!, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.375rem',
                }}
              >
                {t('nomenclatures.segments')}
              </label>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {editing?.segments.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={seg.type}
                      onChange={(e) => {
                        const s = [...editing.segments];
                        s[i] = {
                          ...s[i],
                          type: e.target.value,
                          value: e.target.value === 'text' ? '' : undefined,
                        };
                        setEditing({ ...editing, segments: s, pattern: buildPattern(s) });
                      }}
                      style={{
                        flex: 1,
                        padding: '0.375rem 0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {SEGMENT_TYPES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                    {seg.type === 'text' && (
                      <input
                        value={seg.value ?? ''}
                        onChange={(e) => {
                          const s = [...editing.segments];
                          s[i] = { ...s[i], value: e.target.value };
                          setEditing({ ...editing, segments: s, pattern: buildPattern(s) });
                        }}
                        placeholder="Valor"
                        style={{
                          width: 120,
                          padding: '0.375rem 0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8125rem',
                        }}
                      />
                    )}
                    {seg.type === 'sequential' && (
                      <input
                        type="number"
                        value={seg.padding ?? 3}
                        onChange={(e) => {
                          const s = [...editing.segments];
                          s[i] = { ...s[i], padding: parseInt(e.target.value) || 3 };
                          setEditing({ ...editing, segments: s, pattern: buildPattern(s) });
                        }}
                        min={1}
                        max={10}
                        style={{
                          width: 60,
                          padding: '0.375rem 0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8125rem',
                        }}
                      />
                    )}
                    <button
                      onClick={() => {
                        const s = editing.segments.filter((_, j) => j !== i);
                        setEditing({ ...editing, segments: s, pattern: buildPattern(s) });
                      }}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-danger-light)',
                        cursor: 'pointer',
                        color: 'var(--color-danger)',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const s = [...editing!.segments, { type: 'text', value: '' }];
                  setEditing({ ...editing!, segments: s, pattern: buildPattern(s) });
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  fontSize: '0.8125rem',
                  width: '100%',
                }}
              >
                + Agregar segmento
              </button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.375rem',
                }}
              >
                {t('nomenclatures.pattern')}
              </label>
              <code
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  background: 'var(--surface-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              >
                {buildPattern(editing?.segments ?? [])}
              </code>
            </div>
            {preview && (
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                  }}
                >
                  {t('nomenclatures.preview')}
                </label>
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--color-primary-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    fontFamily: 'monospace',
                  }}
                >
                  {preview}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handlePreview(editing!.segments)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                }}
              >
                <Eye size={14} /> {t('nomenclatures.preview')}
              </button>
              <button
                onClick={save}
                disabled={saving || !editing?.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  opacity: saving || !editing?.name ? 0.6 : 1,
                }}
              >
                {saving ? <RefreshCw size={14} /> : <Check size={14} />} {t('common.save')}
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                  setPreview('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
