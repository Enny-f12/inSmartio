"use client";

import { useState } from "react";
import { mockEscrow, PAGE_SIZE } from "./types";
import type { EscrowRow } from "./types";

function TH({ children }: { children: string }) {
  return (
    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </th>
  );
}

function TD({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <td className={`px-5 py-4 text-[13.5px] ${bold ? "font-semibold text-text-main" : "text-text-muted"}`}>
      {children}
    </td>
  );
}

export default function EscrowReleasesTab() {
  const [rows, setRows] = useState<EscrowRow[]>(mockEscrow);
  const [page, setPage] = useState(1);

  const toggleSelect = (id: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));

  const selectedCount = rows.filter(r => r.selected).length;
  const totalPages    = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated     = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from          = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to            = Math.min(page * PAGE_SIZE, rows.length);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="w-12 px-5 py-3" />
              <TH>Job ID</TH>
              <TH>Client</TH>
              <TH>Expert</TH>
              <TH>Amount</TH>
              <TH>Date Left</TH>
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map(row => (
              <tr key={row.id} className="hover:bg-background transition-colors">
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={!!row.selected}
                    onChange={() => toggleSelect(row.id)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <TD bold>{row.jobId}</TD>
                <TD>{row.client}</TD>
                <TD>{row.expert}</TD>
                <TD bold>{row.amount}</TD>
                <TD>{row.dateLeft}</TD>
                <td className="px-5 py-4">
                  <button
                    className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      row.selected
                        ? "btn-primary"
                        : "border border-border bg-surface text-text-muted hover:bg-background"
                    }`}
                  >
                    Release
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
          {rows.length === 0 ? "No results" : `Showing ${from}–${to} of ${rows.length} results`}
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

      {/* Bulk actions */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
        <button
          className={`px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface transition-colors ${
            selectedCount > 0 ? "text-primary hover:bg-background" : "text-text-muted hover:bg-background"
          }`}
        >
          Release Selected{selectedCount > 0 ? ` (${selectedCount})` : ""}
        </button>
        <button className="px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
          Release All
        </button>
      </div>
    </div>
  );
}