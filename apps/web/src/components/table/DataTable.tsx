"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { ValueBadge, type ValueStatus } from "@/components/ui/ValueBadge";

/* ============================================================================
   TYPES
   ============================================================================ */
export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  blurred?: boolean; // For gated PRO columns
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  sortValue?: { key: string | null; dir: "asc" | "desc" };
  onSortValueChange?: (value: {
    key: string | null;
    dir: "asc" | "desc";
  }) => void;
  pageValue?: number;
  onPageValueChange?: (value: number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  stickyHeader?: boolean;
  emptyMessage?: string;
  filterTabs?: { label: string; value: string }[];
  onFilterChange?: (value: string) => void;
  activeFilter?: string;
}

/* ============================================================================
   COMPONENT
   ============================================================================ */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  searchValue,
  onSearchValueChange,
  sortValue,
  onSortValueChange,
  pageValue,
  onPageValueChange,
  searchable = true,
  searchPlaceholder = "Buscar jogador...",
  pageSize = 10,
  stickyHeader = true,
  emptyMessage = "Nenhum dado encontrado",
  filterTabs,
  onFilterChange,
  activeFilter,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<"asc" | "desc">(
    "desc",
  );
  const [internalPage, setInternalPage] = useState(0);

  const resolvedSearch = searchValue ?? internalSearch;
  const resolvedSortKey = sortValue?.key ?? internalSortKey;
  const resolvedSortDir = sortValue?.dir ?? internalSortDir;
  const resolvedPage = pageValue ?? internalPage;

  function setSearch(next: string) {
    if (searchValue === undefined) setInternalSearch(next);
    onSearchValueChange?.(next);
  }

  function setSort(next: { key: string | null; dir: "asc" | "desc" }) {
    if (sortValue === undefined) {
      setInternalSortKey(next.key);
      setInternalSortDir(next.dir);
    }
    onSortValueChange?.(next);
  }

  const setPage = useCallback(
    (next: number) => {
      const safeNext = Math.max(0, next);
      if (pageValue === undefined) setInternalPage(safeNext);
      onPageValueChange?.(safeNext);
    },
    [onPageValueChange, pageValue],
  );

  const filtered = useMemo(() => {
    if (!resolvedSearch) return data;
    const term = resolvedSearch.toLowerCase();
    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (typeof val === "string") {
          return val.toLowerCase().includes(term);
        }
        if (typeof val === "number") {
          return val.toString().includes(term);
        }
        return false;
      });
    });
  }, [data, resolvedSearch]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (!resolvedSortKey) return 0;
      const aVal = a[resolvedSortKey];
      const bVal = b[resolvedSortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        const cmp = aVal - bVal;
        return resolvedSortDir === "asc" ? cmp : -cmp;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
      return resolvedSortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, resolvedSortKey, resolvedSortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const safePage = totalPages > 0 ? Math.min(resolvedPage, totalPages - 1) : 0;

  useEffect(() => {
    if (resolvedPage !== safePage) setPage(safePage);
  }, [resolvedPage, safePage, setPage]);

  const paginated = useMemo(
    () => sorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sorted, safePage, pageSize],
  );

  const visiblePages = useMemo(() => {
    return Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
      const p = safePage < 3 ? i : safePage - 2 + i;
      return p >= totalPages ? null : p;
    }).filter((p): p is number => p !== null);
  }, [totalPages, safePage]);

  function handleSort(key: string) {
    if (resolvedSortKey === key) {
      setSort({ key, dir: resolvedSortDir === "asc" ? "desc" : "asc" });
    } else {
      setSort({ key, dir: "desc" });
    }
    setPage(0);
  }

  function buildFallbackRowKey(row: T, absoluteIndex: number): string {
    const rowId = row["id"];
    if (typeof rowId === "string" || typeof rowId === "number") {
      return String(rowId);
    }

    const rowName = row["name"];
    const rowPlayer = row["player"];
    if (typeof rowName === "string") return `${rowName}-${absoluteIndex}`;
    if (typeof rowPlayer === "string") return `${rowPlayer}-${absoluteIndex}`;

    return String(absoluteIndex);
  }

  return (
    <div className="w-full">
      {/* Toolbar: search + filter tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
        {searchable && (
          <div className="flex items-center gap-2 bg-fb-surface rounded-lg px-3 py-2 flex-1 max-w-md">
            <Search className="size-4 text-fb-text-muted shrink-0" />
            <input
              type="text"
              value={resolvedSearch}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              aria-label="Buscar na tabela"
              className="bg-transparent text-sm text-fb-text placeholder:text-fb-text-muted outline-none w-full"
            />
          </div>
        )}

        {filterTabs && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onFilterChange?.(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFilter === tab.value
                    ? "bg-fb-primary/15 text-fb-primary"
                    : "bg-fb-surface text-fb-text-secondary hover:text-fb-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-fb-border">
        <table className="w-full text-sm">
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <tr className="bg-fb-surface-darker border-b border-fb-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  aria-sort={
                    !col.sortable || resolvedSortKey !== col.key
                      ? "none"
                      : resolvedSortDir === "asc"
                        ? "ascending"
                        : "descending"
                  }
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-fb-text-muted whitespace-nowrap ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-fb-text transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {col.blurred && (
                        <span className="text-fb-accent-gold text-[9px]">
                          PRO
                        </span>
                      )}
                      {resolvedSortKey === col.key ? (
                        resolvedSortDir === "asc" ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.blurred && (
                        <span className="text-fb-accent-gold text-[9px]">
                          PRO
                        </span>
                      )}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  {resolvedSearch ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-fb-text-muted text-sm">
                        Nenhum resultado para &quot;{resolvedSearch}&quot;
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="text-fb-primary text-xs hover:underline"
                      >
                        Limpar busca
                      </button>
                    </div>
                  ) : (
                    <p className="text-fb-text-muted">{emptyMessage}</p>
                  )}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={
                    rowKey
                      ? rowKey(row, safePage * pageSize + idx)
                      : buildFallbackRowKey(row, safePage * pageSize + idx)
                  }
                  className="border-b border-fb-border/50 hover:bg-fb-surface/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 whitespace-nowrap ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left"
                      } ${col.blurred ? "blur-[2px] select-none opacity-60" : ""}`}
                    >
                      {col.render
                        ? col.render(row, safePage * pageSize + idx)
                        : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-fb-text-muted">
            {safePage * pageSize + 1}–
            {Math.min((safePage + 1) * pageSize, sorted.length)} de{" "}
            {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="p-1.5 rounded-lg bg-fb-surface text-fb-text-secondary hover:text-fb-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            {visiblePages.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPage(p)}
                className={`size-8 rounded-lg text-xs font-medium transition-colors ${
                  p === safePage
                    ? "bg-fb-primary text-fb-primary-content"
                    : "bg-fb-surface text-fb-text-secondary hover:text-fb-text"
                }`}
              >
                {p + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              disabled={safePage === totalPages - 1}
              className="p-1.5 rounded-lg bg-fb-surface text-fb-text-secondary hover:text-fb-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   HELPER: Progress bar for L5/L10 columns
   ============================================================================ */
export function SuccessBar({ hits, total }: { hits: number; total: number }) {
  // Validar inputs para prevenir NaN
  const safeHits = Number.isFinite(hits) ? hits : 0;
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 1;
  const safePct = (safeHits / safeTotal) * 100;

  // Clampar porcentagem entre 0-100
  const pct = Math.max(0, Math.min(100, safePct));

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-fb-surface-highlight overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 70
              ? "bg-fb-accent-green"
              : pct >= 40
                ? "bg-fb-accent-gold"
                : "bg-fb-accent-red"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-fb-text-secondary font-medium w-8 text-right">
        {safeHits}/{total > 0 ? total : 0}
      </span>
    </div>
  );
}

/* ============================================================================
   HELPER: Render status badge in table
   ============================================================================ */
export function StatusCell({ status }: { status: ValueStatus }) {
  return <ValueBadge status={status} />;
}
