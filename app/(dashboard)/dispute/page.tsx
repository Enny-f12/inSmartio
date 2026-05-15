// app/(dashboard)/dispute/page.tsx
"use client";

import { useState } from "react";
import { Search, Download, Eye } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { PriorityLabel } from "@/components/disputes/DisputeBadges";
import DisputeDetail from "@/components/disputes/Disputedetail";
import { mockDisputes, PAGE_SIZE } from "@/components/disputes/types";
import type { Dispute } from "@/components/disputes/types";

export default function DisputesPage() {
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<Dispute | null>(null);

  const stats = {
    open:       mockDisputes.filter((d) => d.status === "Open").length,
    inProgress: mockDisputes.filter((d) => d.status === "In Progress").length,
    resolved:   mockDisputes.filter((d) => d.status === "Resolved").length,
  };

  const filtered = mockDisputes.filter(
    (d) =>
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.parties.toLowerCase().includes(search.toLowerCase()) ||
      d.jobId.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Disputes Resolution" />

      <div className="flex-1 overflow-y-auto bg-background">
        {selected ? (
          <DisputeDetail dispute={selected} onBack={() => setSelected(null)} />
        ) : (
          <div className="px-8 py-6 space-y-5">

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Open",        value: stats.open        },
                { label: "In Progress", value: stats.inProgress  },
                { label: "Resolved",    value: stats.resolved    },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl px-8 py-5 text-center bg-surface border border-border"
                >
                  <p className="text-[13px] text-text-muted mb-1">{s.label}</p>
                  <p className="text-[28px] font-bold text-text-main">{s.value}</p>
                </div>
              ))}
            </div>

            {/* ── Table card ── */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">

              {/* Search + Export */}
              <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
                  <Download size={14} /> Export
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      {["Case ID", "Job ID", "Parties", "Issue", "Priority", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-14 text-sm text-text-muted">
                          No disputes found.
                        </td>
                      </tr>
                    ) : (
                      paginated.map((dispute) => (
                        <tr key={dispute.id} className="hover:bg-background transition-colors">
                          <td className="px-5 py-4 text-[13.5px] font-semibold text-text-main">
                            {dispute.id}
                          </td>
                          <td className="px-5 py-4 text-[13.5px] text-text-muted">{dispute.jobId}</td>
                          <td className="px-5 py-4 text-[13.5px] text-text-muted">{dispute.parties}</td>
                          <td className="px-5 py-4 text-[13.5px] text-text-muted">{dispute.issue}</td>
                          <td className="px-5 py-4">
                            <PriorityLabel priority={dispute.priority} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelected(dispute)}
                                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                                title="View dispute"
                              >
                                <Eye size={17} strokeWidth={1.8} />
                              </button>
                              <button
                                onClick={() => setSelected(dispute)}
                                className="text-[13px] font-medium px-3 py-1 rounded-lg text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                              >
                                Resolve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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

          </div>
        )}
      </div>
    </div>
  );
}