// components/ui/DataTable.tsx
"use client";

import { useState } from "react";
import { Search, Download, SlidersHorizontal } from "lucide-react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  filterOptions?: readonly string[];
  filterKey?: keyof T;
  searchKey?: keyof T;
  pageSize?: number;
  onExport?: () => void;
  searchPlaceholder?: string;
}

const PAGE_SIZE_DEFAULT = 10;

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  filterOptions,
  filterKey,
  searchKey,
  pageSize = PAGE_SIZE_DEFAULT,
  onExport,
  searchPlaceholder = "Search...",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(filterOptions?.[0] ?? "");
  const [page, setPage] = useState(1);

  // ── Filter + search ──────────────────────────────────────
  const filtered = data.filter((row) => {
    const matchSearch = searchKey
      ? String(row[searchKey]).toLowerCase().includes(search.toLowerCase())
      : true;

    const matchFilter =
      !filterKey ||
      !filter ||
      filter === filterOptions?.[0] ||
      String(row[filterKey]) === filter;

    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilter = (v: string) => { setFilter(v); setPage(1); };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={15} className="text-text-muted" />
          <span className="text-sm font-semibold text-text-main">Filter</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          {searchKey && (
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          )}

          {/* Filter dropdown */}
          {filterOptions && (
            <FilterDropdown
              value={filter}
              options={filterOptions}
              onChange={handleFilter}
            />
          )}

          {/* Export */}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors"
            >
              <Download size={14} />
              Export
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-14 text-sm text-text-muted">
                  No results found.
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={row.id} className="hover:bg-background transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-5 py-4 text-[13.5px] ${col.className ?? ""}`}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-background">
        <p className="text-[12px] text-text-muted">
          {filtered.length === 0
            ? "No results"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
        </p>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all ${
                p === page
                  ? "btn-primary"
                  : "border border-border bg-surface text-text-muted hover:bg-background"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}