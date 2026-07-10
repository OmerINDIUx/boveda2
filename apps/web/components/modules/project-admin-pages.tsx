'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
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

export function ProjectCatalogsListPage({ category }: { category: ProjectCatalogCategory }) {
  const [items, setItems] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [semanticIds, setSemanticIds] = useState<Set<string>>(new Set());
  const [semanticError, setSemanticError] = useState('');
  const [page, setPage] = useState(1);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ITEMS_PER_PAGE = 5;

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

  const semanticCount = useMemo(() => {
    if (!search.trim() || semanticIds.size === 0) return 0;
    const q = search.toLowerCase();
    return [...semanticIds].filter((id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return false;
      return !(
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }).length;
  }, [search, semanticIds, items]);

  useEffect(() => {
    setPage(1);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSemanticIds(new Set());
    setSemanticError('');

    if (search.trim().length < 2) return;

    searchTimerRef.current = setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const result = await apiPost<{ ids: string[] }>(
          '/projects/catalog-options/search-synonyms',
          { category, query: search },
          getToken() ?? undefined,
          controller.signal
        );
        if (!controller.signal.aborted) {
          setSemanticIds(new Set(result.ids));
        }
      } catch (nextError) {
        if (controller.signal.aborted) return;
        setSemanticError(getErrorMessage(nextError, 'Búsqueda semántica no disponible.'));
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search, category]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (searchAbortRef.current) searchAbortRef.current.abort();
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

  const filtered = useMemo(() => {
    const catItems = items.filter((item) => item.category === category);
    if (!search.trim()) return catItems;
    const q = search.toLowerCase();
    const textMatches = new Set(
      catItems
        .filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.value.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
        )
        .map((item) => item.id)
    );
    const merged = catItems.filter((item) => textMatches.has(item.id) || semanticIds.has(item.id));
    return merged.sort((a, b) => {
      const aText = textMatches.has(a.id) ? 0 : 1;
      const bText = textMatches.has(b.id) ? 0 : 1;
      return aText - bText;
    });
  }, [items, category, search, semanticIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const label = categoryLabels[category];

  return (
    <>
      <SectionHeader title={label} description={`Mantenimiento de ${label.toLowerCase()}.`} />
      <div className="search-input" style={{ marginBottom: 16 }}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar por etiqueta, valor o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {semanticError && search.trim().length >= 2 ? (
        <p style={{ fontSize: '0.8rem', color: '#888', margin: '-8px 0 12px 0' }}>
          {semanticError}
        </p>
      ) : null}
      {error ? <div className="card muted">{error}</div> : null}
      {loading ? (
        <div className="card">
          <p className="muted">Cargando catálogo...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <p className="muted">
            {search ? 'Sin resultados para la búsqueda.' : 'No hay opciones de catálogo.'}
          </p>
        </div>
      ) : (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <Link className="button secondary" href="/admin/project-catalogs">
              Volver al índice
            </Link>
            <Link className="button" href={`/admin/project-catalogs/category/${category}/new`}>
              Nueva opción
            </Link>
          </div>
          {semanticCount > 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#8a6d00', margin: '0 0 8px 0' }}>
              {semanticCount} resultado{semanticCount !== 1 ? 's' : ''} similar
              {semanticCount !== 1 ? 'es' : ''} encontrado{semanticCount !== 1 ? 's' : ''}
            </p>
          ) : null}
          <ModuleTable
            columns={['Etiqueta', 'Valor', 'Acción']}
            rows={paginatedItems.map((item) => {
              const q = search.toLowerCase();
              const isTextMatch =
                item.label.toLowerCase().includes(q) ||
                item.value.toLowerCase().includes(q) ||
                (item.description && item.description.toLowerCase().includes(q));
              const isSemantic = !isTextMatch && semanticIds.has(item.id);
              return [
                <span key={item.id}>
                  {item.label}
                  {isSemantic ? <span className="badge-similar"> similar</span> : null}
                </span>,
                item.value,
                <div className="projects-actions" key={`actions-${item.id}`}>
                  <Link href={`/admin/project-catalogs/category/${item.category}/${item.id}/edit`}>
                    Editar
                  </Link>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void removeItem(item)}
                  >
                    Eliminar
                  </button>
                </div>,
              ];
            })}
          />
          {totalPages > 1 && (
            <div className="pagination">
              <span className="paginationInfo">{filtered.length} opciones</span>
              <div className="paginationButtons">
                <button
                  className="pageBtn"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`pageBtn ${p === currentPage ? 'pageBtnActive' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="pageBtn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function normalizeChar(c: string): string {
  return c
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function generateCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';

  let code = words.map((w) => normalizeChar(w[0])).join('');

  if (code.length < 3 && words.length > 0) {
    const firstWord = words[0];
    for (let i = 1; i < firstWord.length && code.length < 3; i++) {
      code += normalizeChar(firstWord[i]);
    }
  }

  return code.slice(0, 3);
}

export function ProjectCatalogFormPage({
  mode,
  defaultCategory,
}: {
  mode: 'create' | 'edit';
  defaultCategory?: string;
}) {
  const params = useParams<{ id: string }>();
  const optionId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const category = (
    Object.keys(categoryLabels).includes(defaultCategory ?? '') ? defaultCategory! : 'workType'
  ) as ProjectCatalogCategory;
  const [form, setForm] = useState({
    category,
    value: '',
    label: '',
  });
  const [rows, setRows] = useState<Array<{ name: string; code: string }>>(
    mode === 'create' ? [{ name: '', code: '' }] : []
  );
  const [warnings, setWarnings] = useState<string[]>([]);
  const synonymAbortRef = useRef<AbortController | null>(null);
  const synonymTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
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

  const checkSynonym = useCallback(
    async (index: number, label: string) => {
      if (!label.trim()) {
        setWarnings((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
        return;
      }

      if (synonymAbortRef.current) {
        synonymAbortRef.current.abort();
      }
      const controller = new AbortController();
      synonymAbortRef.current = controller;

      try {
        const result = await apiPost<{ synonym: string | null }>(
          '/projects/catalog-options/check-synonyms',
          { category, label },
          getToken() ?? undefined,
          controller.signal
        );

        if (controller.signal.aborted) return;

        setWarnings((prev) => {
          const next = [...prev];
          next[index] = result.synonym ?? '';
          return next;
        });
      } catch {
        if (controller.signal.aborted) return;
      }
    },
    [category]
  );

  function updateRow(index: number, name: string) {
    setRows((current) => {
      const next = current.map((row, i) =>
        i === index ? { name, code: generateCode(name) } : row
      );
      return next;
    });

    const existing = synonymTimersRef.current.get(index);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      void checkSynonym(index, name);
    }, 400);
    synonymTimersRef.current.set(index, timer);
  }

  useEffect(() => {
    return () => {
      synonymTimersRef.current.forEach((timer) => clearTimeout(timer));
      synonymTimersRef.current.clear();
      if (synonymAbortRef.current) synonymAbortRef.current.abort();
    };
  }, []);

  function addRow() {
    setRows((current) => [...current, { name: '', code: '' }]);
    setWarnings((current) => [...current, '']);
  }

  function removeRow(index: number) {
    const existing = synonymTimersRef.current.get(index);
    if (existing) clearTimeout(existing);
    synonymTimersRef.current.delete(index);
    setRows((current) => current.filter((_, i) => i !== index));
    setWarnings((current) => current.filter((_, i) => i !== index));
  }

  async function submit() {
    if (mode === 'create') {
      const validRows = rows.filter((r) => r.name.trim());
      if (!validRows.length) {
        setError('Agrega al menos un nombre.');
        return;
      }

      setSaving(true);
      setError('');

      try {
        for (const row of validRows) {
          await apiPost(
            '/projects/catalog-options',
            { category, value: row.code, label: row.name },
            getToken() ?? undefined
          );
        }

        router.push(`/admin/project-catalogs/category/${category}`);
        router.refresh();
      } catch (nextError) {
        setError(getErrorMessage(nextError, 'No fue posible guardar una o más opciones.'));
      } finally {
        setSaving(false);
      }
    } else {
      if (!form.label.trim()) {
        setError('Completa el nombre.');
        return;
      }

      setSaving(true);
      setError('');

      try {
        if (optionId) {
          await apiPatch(
            `/projects/catalog-options/${optionId}`,
            { category: form.category, value: form.value, label: form.label },
            getToken() ?? undefined
          );
        }

        router.push(`/admin/project-catalogs/category/${form.category}`);
        router.refresh();
      } catch (nextError) {
        setError(getErrorMessage(nextError, 'No fue posible guardar la opción.'));
      } finally {
        setSaving(false);
      }
    }
  }

  return (
    <>
      <SectionHeader
        title={
          mode === 'create'
            ? `Nuevas opciones - ${categoryLabels[category]}`
            : 'Editar opción de catálogo'
        }
        description={
          mode === 'create'
            ? 'Agrega varias opciones a la vez. El código se calcula automáticamente.'
            : ''
        }
      />
      {error ? <div className="card muted">{error}</div> : null}
      <article className="card">
        {loading ? (
          <p className="muted">Cargando formulario...</p>
        ) : mode === 'create' ? (
          <>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Categoría</label>
              <p style={{ padding: '0.5rem 0', fontWeight: 600 }}>{categoryLabels[category]}</p>
            </div>
            {rows.map((row, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-end',
                  marginBottom: 12,
                }}
              >
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>{index === 0 ? 'Nombre' : ''}</label>
                  <input
                    value={row.name}
                    placeholder="Ej: Edificación vertical"
                    onChange={(e) => updateRow(index, e.target.value)}
                  />
                  {warnings[index] ? (
                    <p style={{ color: '#b8860b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      Ya existe algo similar con el nombre de &ldquo;{warnings[index]}&rdquo;
                    </p>
                  ) : null}
                </div>
                <div className="field" style={{ width: 120, marginBottom: 0 }}>
                  <label>{index === 0 ? 'Código' : ''}</label>
                  <input value={row.code} disabled style={{ fontWeight: 600 }} />
                </div>
                {rows.length > 1 && (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => removeRow(index)}
                    style={{ marginBottom: 0, whiteSpace: 'nowrap' }}
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))}
            <button
              className="button secondary"
              type="button"
              onClick={addRow}
              style={{ marginBottom: 16 }}
            >
              + Agregar otro
            </button>
            <div className="projects-actions">
              <Link
                className="button secondary"
                href={`/admin/project-catalogs/category/${category}`}
              >
                Volver
              </Link>
              <button className="button" type="button" onClick={submit} disabled={saving}>
                {saving
                  ? 'Guardando...'
                  : `Guardar ${rows.filter((r) => r.name.trim()).length || ''}`}
              </button>
            </div>
          </>
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
                <label>Nombre</label>
                <input
                  value={form.label}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, label: event.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Código</label>
                <input
                  value={form.value}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, value: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="projects-actions">
              <Link
                className="button secondary"
                href={`/admin/project-catalogs/category/${form.category}`}
              >
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
