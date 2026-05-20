// components/tas/ApplicationsTab.tsx
"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Download, Eye } from "lucide-react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { AppBadge } from "./Tasbadges";
import ApplicationModal from "./Applicationmodal";
import { mockApplications, PAGE_SIZE } from "@/components/tas/types";
import type { Application } from "@/components/tas/types";

const FILTER_OPTIONS = ["All Applications", "Approved", "Pending", "Rejected"] as const;

export default function ApplicationsTab() {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<typeof FILTER_OPTIONS[number]>("All Applications");
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);

  const filtered = mockApplications.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All Applications" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <style>{`
        .apptab-toolbar-top { flex-direction: column; gap: 10px; }
        .apptab-toolbar-row { flex-direction: column; gap: 8px; }
        .apptab-export-btn  { display: none; }
        .apptab-table-wrap  { display: none; }
        .apptab-cards       { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .apptab-pagination  { flex-direction: column; gap: 8px; align-items: flex-start; }
        .animate-spin       { animation: spin 1s linear infinite; }
        @keyframes spin     { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (min-width: 480px) {
          .apptab-toolbar-row { flex-direction: row; align-items: center; }
          .apptab-export-btn  { display: flex; }
        }
        @media (min-width: 640px) {
          .apptab-toolbar-top { flex-direction: row; align-items: center; }
          .apptab-table-wrap  { display: block; }
          .apptab-cards       { display: none; }
          .apptab-pagination  { flex-direction: row; align-items: center; }
        }
      `}</style>

      {/* Main card box with clean margin space separating it from the top tab bars */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden mt-6">

        {/* Toolbar */}
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          {/* Cleared duplicate mt-10 and compacted padding to keep filter tag tight */}
          <div className="apptab-toolbar-top flex mb-2.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-main">Filter</span>
            </div>
          </div>
          <div className="apptab-toolbar-row flex gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <FilterDropdown
              value={filter}
              options={FILTER_OPTIONS}
              onChange={v => { setFilter(v); setPage(1); }}
            />
            <button className="apptab-export-btn items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors shrink-0">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Desktop table layout configuration */}
        <div className="apptab-table-wrap overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background">
                {["Name", "Type", "Status", "Submitted", "Network", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-sm text-text-muted">
                    No results found.
                  </td>
                </tr>
              ) : paginated.map(app => (
                <tr key={app.id} className="hover:bg-background transition-colors">
                  <td className="px-5 py-4 text-[13.5px] font-semibold text-text-main">{app.name}</td>
                  <td className="px-5 py-4 text-[13.5px] text-text-muted">{app.type}</td>
                  <td className="px-5 py-4"><AppBadge status={app.status} /></td>
                  <td className="px-5 py-4 text-[13.5px] text-text-muted">{app.submitted}</td>
                  <td className="px-5 py-4 text-[13.5px] text-text-muted">{app.network}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelected(app)}
                      className="text-[13px] font-medium px-3 py-1 rounded-lg text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards mapping */}
        <div className="apptab-cards">
          {paginated.length === 0 ? (
            <p className="text-center py-10 text-[13px] text-text-muted">No results found.</p>
          ) : paginated.map(app => (
            <div
              key={app.id}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>
                  {app.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{app.type}</span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{app.submitted}</span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{app.network}</span>
                </div>
                <AppBadge status={app.status} />
              </div>
              <button
                onClick={() => setSelected(app)}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  flexShrink: 0,
                }}
              >
                <Eye size={16} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>

        {/* Pagination element layout block */}
        <div
          className="apptab-pagination"
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "16px",
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-background)",
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
                border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)",
                color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.4 : 1,
              }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={p === page ? "btn-primary" : ""}
                style={p !== page ? {
                  width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px",
                  border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-muted)", cursor: "pointer",
                } : {
                  width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px",
                  border: "none", cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
                border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)",
                color: "var(--color-text-muted)", cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ApplicationModal app={selected} onClose={() => setSelected(null)} />
    </>
  );
}