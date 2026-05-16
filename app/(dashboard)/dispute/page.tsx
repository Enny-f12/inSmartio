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

  if (selected) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Topbar title="Disputes Resolution" />
        <DisputeDetail dispute={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="Disputes Resolution" />

      <div className="flex-1 overflow-y-auto bg-background">
        <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── Stat cards — 3 side by side ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Open",        value: stats.open        },
              { label: "In Progress", value: stats.inProgress  },
              { label: "Resolved",    value: stats.resolved    },
            ].map((s) => (
              <div
                key={s.label}
                style={{ borderRadius: "16px", padding: "20px 32px", textAlign: "center", backgroundColor: "#ffffff", border: "1px solid var(--color-border)" }}
              >
                <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-main)" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Table card ── */}
          <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>

            {/* Search + Export */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
                />
              </div>
              <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                <Download size={14} /> Export
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    {["Case ID", "Job ID", "Parties", "Issue", "Priority", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>
                        No disputes found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((dispute) => (
                      <tr key={dispute.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "16px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{dispute.id}</td>
                        <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{dispute.jobId}</td>
                        <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{dispute.parties}</td>
                        <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{dispute.issue}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <PriorityLabel priority={dispute.priority} />
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              onClick={() => setSelected(dispute)}
                              style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
                              title="View dispute"
                            >
                              <Eye size={17} strokeWidth={1.8} />
                            </button>
                            <button
                              onClick={() => setSelected(dispute)}
                              style={{ fontSize: "13px", fontWeight: 500, padding: "4px 12px", borderRadius: "8px", color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)", border: "none", cursor: "pointer" }}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={p === page ? "btn-primary" : ""}
                    style={p !== page ? { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" } : { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "none", cursor: "pointer" }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}