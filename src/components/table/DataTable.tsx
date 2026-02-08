"use client";

import { useState } from "react";
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
  searchable = true,
  searchPlaceholder = "Buscar jogador...",
  pageSize = 10,
  stickyHeader = true,
  emptyMessage = "Nenhum dado encontrado",
  filterTabs,
  onFilterChange,
  activeFilter,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  // Search filter
  const filtered = data.filter((row) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return Object.values(row).some(
      (val) => typeof val === "string" && val.toLowerCase().includes(term),
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null || bVal == null) return 0;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
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
              value={search}
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
                      className="inline-flex items-center gap-1 hover:text-fb-text transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {col.blurred && (
                        <span className="text-fb-accent-gold text-[9px]">
                          PRO
                        </span>
                      )}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
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
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-fb-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={idx}
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
                        ? col.render(row, page * pageSize + idx)
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
            {page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, sorted.length)} de {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg bg-fb-surface text-fb-text-secondary hover:text-fb-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page < 3 ? i : page - 2 + i;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`size-8 rounded-lg text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-fb-primary text-fb-primary-content"
                      : "bg-fb-surface text-fb-text-secondary hover:text-fb-text"
                  }`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
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
  const pct = (hits / total) * 100;
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
        {hits}/{total}
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
