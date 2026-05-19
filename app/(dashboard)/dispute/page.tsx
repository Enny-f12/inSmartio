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

      <style>{`
        .disp-outer        { padding: 12px; gap: 12px; }
        .disp-stat-grid    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .disp-stat-card    { border-radius: 12px; padding: 14px 12px; text-align: center; background: #fff; border: 1px solid var(--color-border); }
        .disp-stat-value   { font-size: 24px; }
        .disp-toolbar      { flex-direction: column; gap: 8px; }
        .disp-table-wrap   { display: none; }
        .disp-cards        { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .disp-pagination   { flex-direction: column; gap: 8px; align-items: flex-start; }

        @media (min-width: 480px) {
          .disp-toolbar    { flex-direction: row; align-items: center; }
        }
        @media (min-width: 640px) {
          .disp-outer      { padding: 20px 32px; gap: 20px; }
          .disp-stat-card  { padding: 20px 32px; border-radius: 16px; }
          .disp-stat-value { font-size: 28px; }
          .disp-table-wrap { display: block; }
          .disp-cards      { display: none; }
          .disp-pagination { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div className="disp-outer" style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--color-background)", display: "flex", flexDirection: "column" }}>

        {/* Stat cards */}
        <div className="disp-stat-grid">
          {[
            { label: "Open",        value: stats.open       },
            { label: "In Progress", value: stats.inProgress },
            { label: "Resolved",    value: stats.resolved   },
          ].map((s) => (
            <div key={s.label} className="disp-stat-card">
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px", fontWeight: 500 }}>{s.label}</p>
              <p className="disp-stat-value" style={{ fontWeight: 700, color: "var(--color-text-main)" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>

          {/* Toolbar */}
          <div className="disp-toolbar" style={{ display: "flex", padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                type="text" placeholder="Search ID, parties, job..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
              />
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer", flexShrink: 0 }}>
              <Download size={14} /> Export
            </button>
          </div>

          {/* Desktop table */}
          <div className="disp-table-wrap" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                  {["Case ID", "Job ID", "Parties", "Issue", "Priority", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No disputes found.</td></tr>
                ) : paginated.map((dispute) => (
                  <tr key={dispute.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "16px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{dispute.id}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{dispute.jobId}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{dispute.parties}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{dispute.issue}</td>
                    <td style={{ padding: "16px 20px" }}><PriorityLabel priority={dispute.priority} /></td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button onClick={() => setSelected(dispute)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                          <Eye size={17} strokeWidth={1.8} />
                        </button>
                        <button onClick={() => setSelected(dispute)} style={{ fontSize: "13px", fontWeight: 500, padding: "4px 12px", borderRadius: "8px", color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)", border: "none", cursor: "pointer" }}>
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="disp-cards">
            {paginated.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No disputes found.</p>
            ) : paginated.map((dispute) => (
              <div key={dispute.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "8px" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "2px" }}>{dispute.id}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{dispute.parties}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{dispute.issue}</p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <PriorityLabel priority={dispute.priority} />
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>{dispute.jobId}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
                  <button onClick={() => setSelected(dispute)} style={{ flex: 1, padding: "8px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)", border: "none", cursor: "pointer" }}>
                    Resolve
                  </button>
                  <button onClick={() => setSelected(dispute)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                    <Eye size={16} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="disp-pagination" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={p === page ? "btn-primary" : ""}
                  style={p !== page ? { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" } : { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "none", cursor: "pointer" }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}