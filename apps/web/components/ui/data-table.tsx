'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from 'lucide-react';
import styles from '../../styles/table.module.css';

type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  isLoading?: boolean;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  emptyMessage = 'No hay datos disponibles.',
  onRowClick,
  selectedIds,
  onSelectionChange,
  isLoading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(defaultPageSize);

  // Filter
  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const val = item[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), 'es', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice(page * perPage, (page + 1) * perPage);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const toggleSelect = (id: string) => {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (!selectedIds || !onSelectionChange) return;
    if (selectedIds.size === paged.length && paged.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(paged.map(keyExtractor)));
    }
  };

  const allSelected = paged.length > 0 && selectedIds?.size === paged.length;

  return (
    <div>
      {searchable && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <div className={styles.searchWrapper}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
            <Search size={16} className={styles.searchIcon} />
          </div>
        </div>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {onSelectionChange && (
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? styles.sortable : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {col.label}
                  {col.sortable && (
                    <span
                      className={`${styles.sortIcon} ${sortKey === col.key ? styles.sortIconActive : ''}`}
                    >
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronsUpDown size={14} />
                      )}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (onSelectionChange ? 1 : 0)}>
                  <div
                    style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
                  >
                    Cargando...
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectionChange ? 1 : 0)}>
                  <div
                    style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
                  >
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((item) => {
                const id = keyExtractor(item);
                const isSelected = selectedIds?.has(id);
                return (
                  <tr
                    key={id}
                    className={isSelected ? styles.selectedRow : ''}
                    onClick={() => onRowClick?.(item)}
                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                  >
                    {onSelectionChange && (
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleSelect(id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Seleccionar fila ${id}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key}>{col.render(item)}</td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            {sorted.length} resultados · Página {page + 1} de {totalPages}
          </div>
          <div className={styles.paginationButtons}>
            <button
              className={styles.pageBtn}
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  className={`${styles.pageBtn} ${page === pageNum - 1 ? styles.pageBtnActive : ''}`}
                  onClick={() => setPage(pageNum - 1)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className={styles.pageBtn}
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
          <div className={styles.perPage}>
            <label htmlFor="per-page">Por página:</label>
            <select
              id="per-page"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(0);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
