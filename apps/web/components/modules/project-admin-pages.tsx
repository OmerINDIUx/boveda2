'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ModuleTable } from './module-table';
import { SectionHeader } from './section-header';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

type ProjectCatalogCategory = 'workType' | 'currentStage' | 'priority' | 'status';

type CatalogOption = {
  id: string;
  category: ProjectCatalogCategory;
  value: string;
  label: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

type DisciplineOption = {
  id: string;
  code: string;
  name: string;
  description?: string;
};

const categoryLabels: Record<ProjectCatalogCategory, string> = {
  workType: 'Tipo de obra',
  currentStage: 'Etapa actual',
  priority: 'Prioridad',
  status: 'Estado',
};

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('holocron_token');
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function ProjectCatalogsListPage() {
  const [items, setItems] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadItems() {
      setLoading(true);
      setError('');
      try {
        const response = await apiGet<CatalogOption[]>(
          '/projects/catalog-options',
          getToken() ?? undefined
        );
        if (!active) return;
        setItems(response);
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar los catálogos del proyecto.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadItems();
    return () => {
      active = false;
    };
  }, []);

  async function removeItem(item: CatalogOption) {
    try {
      await apiPatch(
        `/projects/catalog-options/${item.id}/deactivate`,
        {},
        getToken() ?? undefined
      );
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible eliminar la opción.'));
    }
  }

  const rows = useMemo(
    () =>
      items.map((item) => [
        categoryLabels[item.category],
        item.label,
        item.value,
        <div className="projects-actions" key={item.id}>
          <Link href={`/admin/project-catalogs/${item.id}/edit`}>Editar</Link>
          <button className="button secondary" type="button" onClick={() => void removeItem(item)}>
            Eliminar
          </button>
        </div>,
      ]),
    [items]
  );

  return (
    <>
      <SectionHeader
        title="Catálogos de proyecto"
        description="Mantenimiento separado para tipo de obra, etapa, prioridad y estado."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/admin/project-catalogs/new">
          Nueva opción
        </Link>
      </div>
      {error ? <div className="card muted">{error}</div> : null}
      <div className="card">
        {loading ? (
          <p className="muted">Cargando catálogo...</p>
        ) : (
          <ModuleTable columns={['Categoría', 'Etiqueta', 'Valor', 'Acción']} rows={rows} />
        )}
      </div>
    </>
  );
}

export function ProjectCatalogFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const optionId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({
    category: 'workType' as ProjectCatalogCategory,
    value: '',
    label: '',
  });
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !optionId) return;
    let active = true;

    async function loadItem() {
      setLoading(true);
      setError('');
      try {
        const response = await apiGet<CatalogOption[]>(
          '/projects/catalog-options',
          getToken() ?? undefined
        );
        if (!active) return;
        const item = response.find((entry) => entry.id === optionId);
        if (!item) {
          setError('No fue posible encontrar la opción solicitada.');
          return;
        }

        setForm({
          category: item.category,
          value: item.value,
          label: item.label,
        });
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar la opción del catálogo.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadItem();
    return () => {
      active = false;
    };
  }, [mode, optionId]);

  async function submit() {
    if (!form.label.trim() || !form.value.trim()) {
      setError('Completa categoría, valor y etiqueta.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (mode === 'create') {
        await apiPost('/projects/catalog-options', form, getToken() ?? undefined);
      } else if (optionId) {
        await apiPatch(`/projects/catalog-options/${optionId}`, form, getToken() ?? undefined);
      }

      router.push('/admin/project-catalogs');
      router.refresh();
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible guardar la opción.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionHeader
        title={mode === 'create' ? 'Nueva opción de catálogo' : 'Editar opción de catálogo'}
        description="Cada opción de proyecto se administra en su propia página."
      />
      {error ? <div className="card muted">{error}</div> : null}
      <article className="card">
        {loading ? (
          <p className="muted">Cargando formulario...</p>
        ) : (
          <>
            <div className="quick-filters-grid">
              <div className="field">
                <label>Categoría</label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as ProjectCatalogCategory,
                    }))
                  }
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Valor técnico</label>
                <input
                  value={form.value}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, value: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Etiqueta visible</label>
                <input
                  value={form.label}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, label: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="projects-actions">
              <Link className="button secondary" href="/admin/project-catalogs">
                Volver
              </Link>
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </article>
    </>
  );
}

export function ProjectDisciplinesListPage() {
  const [items, setItems] = useState<DisciplineOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadItems() {
      setLoading(true);
      setError('');
      try {
        const response = await apiGet<DisciplineOption[]>(
          '/folders/disciplines',
          getToken() ?? undefined
        );
        if (!active) return;
        setItems(response);
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar las disciplinas.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadItems();
    return () => {
      active = false;
    };
  }, []);

  async function removeItem(item: DisciplineOption) {
    try {
      await apiPatch(`/folders/disciplines/${item.id}/deactivate`, {}, getToken() ?? undefined);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible eliminar la disciplina.'));
    }
  }

  const rows = useMemo(
    () =>
      items.map((item) => [
        item.code,
        item.name,
        item.description ?? 'Sin descripción',
        <div className="projects-actions" key={item.id}>
          <Link href={`/admin/project-disciplines/${item.id}/edit`}>Editar</Link>
          <button className="button secondary" type="button" onClick={() => void removeItem(item)}>
            Eliminar
          </button>
        </div>,
      ]),
    [items]
  );

  return (
    <>
      <SectionHeader
        title="Disciplinas"
        description="Mantenimiento separado de disciplinas para los proyectos."
      />
      <div className="projects-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/admin/project-disciplines/new">
          Nueva disciplina
        </Link>
      </div>
      {error ? <div className="card muted">{error}</div> : null}
      <div className="card">
        {loading ? (
          <p className="muted">Cargando disciplinas...</p>
        ) : (
          <ModuleTable columns={['Código', 'Nombre', 'Descripción', 'Acción']} rows={rows} />
        )}
      </div>
    </>
  );
}

export function ProjectDisciplineFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams<{ id: string }>();
  const disciplineId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !disciplineId) return;
    let active = true;

    async function loadItem() {
      setLoading(true);
      setError('');
      try {
        const response = await apiGet<DisciplineOption[]>(
          '/folders/disciplines',
          getToken() ?? undefined
        );
        if (!active) return;
        const item = response.find((entry) => entry.id === disciplineId);
        if (!item) {
          setError('No fue posible encontrar la disciplina solicitada.');
          return;
        }

        setForm({
          code: item.code,
          name: item.name,
          description: item.description ?? '',
        });
      } catch (nextError) {
        if (!active) return;
        setError(getErrorMessage(nextError, 'No fue posible cargar la disciplina.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadItem();
    return () => {
      active = false;
    };
  }, [disciplineId, mode]);

  async function submit() {
    if (!form.code.trim() || !form.name.trim()) {
      setError('Completa código y nombre.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (mode === 'create') {
        await apiPost('/folders/disciplines', form, getToken() ?? undefined);
      } else if (disciplineId) {
        await apiPatch(`/folders/disciplines/${disciplineId}`, form, getToken() ?? undefined);
      }

      router.push('/admin/project-disciplines');
      router.refresh();
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'No fue posible guardar la disciplina.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionHeader
        title={mode === 'create' ? 'Nueva disciplina' : 'Editar disciplina'}
        description="Cada disciplina se administra en su propia página."
      />
      {error ? <div className="card muted">{error}</div> : null}
      <article className="card">
        {loading ? (
          <p className="muted">Cargando formulario...</p>
        ) : (
          <>
            <div className="quick-filters-grid">
              <div className="field">
                <label>Código</label>
                <input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div className="field">
                <label>Nombre</label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>
              <div className="field span-2">
                <label>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="projects-actions">
              <Link className="button secondary" href="/admin/project-disciplines">
                Volver
              </Link>
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </article>
    </>
  );
}
