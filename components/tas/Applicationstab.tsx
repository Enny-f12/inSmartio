"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Download } from "lucide-react";
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
    const matchFilter =
      filter === "All Applications" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">

        {/* Toolbar */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={15} className="text-text-muted" />
            <span className="text-sm font-semibold text-text-main">Filter</span>
          </div>
          <div className="flex items-center gap-3">
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
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-background">
          <p className="text-[12px] text-text-muted">
            {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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