// app/(dashboard)/dispute/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/Navbar";
import { PriorityLabel } from "@/components/disputes/DisputeBadges";
import DisputeDetail from "@/components/disputes/Disputedetail";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDisputes, fetchDisputeById, clearSelectedDispute } from "@/lib/redux/disputeSlice";
import { downloadReport } from "@/lib/api/reportApi";
import type { ApiDispute } from "@/lib/api/disputeApi";
import type { Dispute } from "@/components/disputes/types";

// ── Normalizers ───────────────────────────────────────────
const normalizeStatus = (s?: string): "Open" | "In Progress" | "Resolved" => {
  const upper = s?.toUpperCase() ?? "";
  if (upper === "IN_PROGRESS") return "In Progress";
  if (upper === "RESOLVED" || upper === "CLOSE") return "Resolved";
  return "Open";
};

const toDispute = (d: ApiDispute): Dispute => ({
  id:              d.id,
  jobId:           d.jobId ?? "—",
  /* TODO-BACKEND: parties should be client name vs expert name.
     Currently only IDs are returned — needs client.name and expert.name */
  parties:         `${d.client?.name ?? d.client?.id ?? "Client"} vs ${d.expert?.name ?? d.expert?.id ?? "Expert"}`,
  /* TODO-BACKEND: issue/category field missing — e.g. "Quality", "No-show", "Payment", "Scope" */
  issue:           (d as unknown as Record<string, unknown>).issue as string ?? d.client?.statement?.slice(0, 30) ?? "—",
  priority:        d.priority ?? "MEDIUM",
  status:          normalizeStatus(d.status),
  opened:          d.date
    ? new Date(d.date).toLocaleDateString("en-GB")
    : d.createdAt
    ? new Date(d.createdAt).toLocaleDateString("en-GB")
    : "—",
  escrowAmount:    d.amountInEscrows ? `₦${Number(d.amountInEscrows).toLocaleString()}` : "—",
  clientStatement: d.client?.statement ?? "No statement provided.",
  expertStatement: d.expert?.statement ?? "No statement provided.",
  clientEvidence:  d.client?.evidence ?? [],
  expertEvidence:  d.expert?.evidence ?? [],
  chatId:          d.chatId ?? "",
  mediationNotes:  [],
});

const PAGE_SIZE = 10;

export default function DisputesPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus } =
    useAppSelector((s) => s.disputes);

  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchDisputes());
  }, [dispatch, listStatus]);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const url   = await downloadReport({ reportType: "dispute", type: "pdf", fromDate: "2026-05-15", toDate: today });
      const a = document.createElement("a");
      a.href = url; a.download = `disputes_report_${today}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Disputes report downloaded");
    } catch { toast.error("Failed to download disputes report"); }
    finally { setDownloading(false); }
  };

  // ── Stats ────────────────────────────────────────────────
  const stats = {
    open:       list.filter((d) => !d.status || d.status === "OPEN").length,
    inProgress: list.filter((d) => d.status === "IN_PROGRESS").length,
    resolved:   list.filter((d) => d.status === "RESOLVED" || d.status === "CLOSE").length,
  };

  // ── Filtered + paginated ──────────────────────────────────
  const filtered = list.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.id.toLowerCase().includes(q) ||
      (d.jobId ?? "").toLowerCase().includes(q) ||
      (d.client?.id ?? "").toLowerCase().includes(q) ||
      (d.expert?.id ?? "").toLowerCase().includes(q) ||
      (d.client?.name ?? "").toLowerCase().includes(q) ||
      (d.expert?.name ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  // ── Detail view ───────────────────────────────────────────
  if (selectedStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="Disputes Resolution" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          flex: 1, gap: "10px", color: "#9CA3AF" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "13px" }}>Loading dispute...</span>
        </div>
      </div>
    );
  }

  if (selectedStatus === "succeeded" && selected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Topbar title="Disputes Resolution" />
        <DisputeDetail
          dispute={toDispute(selected)}
          disputeId={selected.id}
          onBack={() => dispatch(clearSelectedDispute())}
        />
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0,
      backgroundColor: "#F4F5F7" }}>
      <Topbar title="Disputes Resolution" />

      <style>{`
        .dp-wrap      { padding: 16px; gap: 16px; }
        .dp-stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; }
        .dp-stat-cell { padding: 20px 24px; text-align: center; background:#fff; border-right: 1px solid #E5E7EB; }
        .dp-stat-cell:last-child { border-right: none; }
        .dp-stat-lbl  { font-size: 13px; color: #6B7280; margin-bottom: 6px; }
        .dp-stat-val  { font-size: 28px; font-weight: 700; color: #111827; line-height: 1; }
        .dp-tbl-wrap  { display: none; }
        .dp-cards     { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .dp-pgn       { flex-direction: column; gap: 8px; align-items: flex-start !important; }
        @media(min-width: 640px) {
          .dp-wrap      { padding: 24px 32px; gap: 20px; }
          .dp-tbl-wrap  { display: block; }
          .dp-cards     { display: none; }
          .dp-pgn       { flex-direction: row !important; align-items: center !important; }
        }
      `}</style>

      <div className="dp-wrap" style={{ flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column" }}>

        {/* ── Stats row (Image 2 style — label top, value below) ── */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
          borderRadius: "16px", overflow: "hidden" }}>
          <div className="dp-stat-grid">
            {[
              { label: "Open",        value: stats.open       },
              { label: "In Progress", value: stats.inProgress },
              { label: "Resolved",    value: stats.resolved   },
            ].map((s) => (
              <div key={s.label} className="dp-stat-cell">
                <p className="dp-stat-lbl">{s.label}</p>
                <p className="dp-stat-val">{listStatus === "loading" ? "—" : s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Table card ── */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
          borderRadius: "16px", overflow: "hidden" }}>

          {/* Toolbar — search left, export right (Image 2) */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px",
            padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input type="text" placeholder="Search name..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px",
                  paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px",
                  fontSize: "13px", outline: "none", border: "1px solid #E5E7EB",
                  backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
            </div>
            <button onClick={handleExport} disabled={downloading}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                borderRadius: "10px", fontSize: "13px", fontWeight: 500,
                border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#374151",
                cursor: downloading ? "not-allowed" : "pointer", flexShrink: 0,
                opacity: downloading ? 0.7 : 1 }}>
              {downloading
                ? <><Loader2 size={13} className="animate-spin" /> Exporting...</>
                : <><Download size={13} /> Export</>}
            </button>
          </div>

          {/* Loading / error */}
          {listStatus === "loading" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
              padding: "60px", gap: "10px", color: "#9CA3AF" }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: "13px" }}>Loading disputes...</span>
            </div>
          )}
          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "60px",
              fontSize: "13px", color: "#ef4444" }}>{listError}</p>
          )}

          {listStatus === "succeeded" && (
            <>
              {/* ── Desktop table — columns match Image 2 ── */}
              <div className="dp-tbl-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      {["Case ID", "Job ID", "Parties", "Issue", "Priority", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 20px",
                          fontSize: "12px", fontWeight: 600, color: "#9CA3AF",
                          letterSpacing: "0.03em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px",
                        fontSize: "14px", color: "#9CA3AF" }}>No disputes found.</td></tr>
                    ) : paginated.map((d) => {
                      const ui = toDispute(d);
                      return (
                        <tr key={d.id}
                          style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>

                          {/* Case ID */}
                          <td style={{ padding: "16px 20px", fontSize: "13px",
                            fontWeight: 500, color: "#111827" }}>{ui.id}</td>

                          {/* Job ID */}
                          <td style={{ padding: "16px 20px", fontSize: "13px",
                            color: "#6B7280" }}>{ui.jobId}</td>

                          {/* Parties — "Client vs Expert" */}
                          <td style={{ padding: "16px 20px", fontSize: "13px",
                            color: "#374151" }}>{ui.parties}</td>

                          {/* Issue — short category */}
                          <td style={{ padding: "16px 20px", fontSize: "13px",
                            color: "#374151" }}>{ui.issue}</td>

                          {/* Priority */}
                          <td style={{ padding: "16px 20px" }}>
                            <PriorityLabel priority={ui.priority} />
                          </td>

                          {/* Actions — eye + Resolve */}
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <button
                                onClick={() => dispatch(fetchDisputeById(d.id))}
                                style={{ padding: "4px", borderRadius: "6px", border: "none",
                                  background: "none", cursor: "pointer", color: "#9CA3AF",
                                  display: "flex", alignItems: "center" }}>
                                <Eye size={17} strokeWidth={1.8} />
                              </button>
                              {ui.status === "Resolved" ? (
                                <span style={{ fontSize: "12px", fontWeight: 600,
                                  padding: "4px 12px", borderRadius: "999px",
                                  backgroundColor: "#dcfce7", color: "#15803d",
                                  border: "1px solid #bbf7d0" }}>Resolved</span>
                              ) : (
                                <button
                                  onClick={() => dispatch(fetchDisputeById(d.id))}
                                  style={{ fontSize: "13px", fontWeight: 500, color: "#374151",
                                    background: "none", border: "none", cursor: "pointer",
                                    padding: 0 }}>
                                  Resolve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="dp-cards">
                {paginated.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px",
                    color: "#9CA3AF" }}>No disputes found.</p>
                ) : paginated.map((d) => {
                  const ui = toDispute(d);
                  return (
                    <div key={d.id} style={{ padding: "14px 16px", borderRadius: "12px",
                      border: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827",
                            marginBottom: "2px" }}>{ui.id}</p>
                          <p style={{ fontSize: "12px", color: "#6B7280",
                            marginBottom: "2px" }}>Job: {ui.jobId}</p>
                          <p style={{ fontSize: "12px", color: "#374151" }}>{ui.parties}</p>
                        </div>
                        <PriorityLabel priority={ui.priority} />
                      </div>
                      <div style={{ display: "flex", gap: "8px", paddingTop: "10px",
                        borderTop: "1px solid #F3F4F6" }}>
                        {ui.status === "Resolved" ? (
                          <span style={{ flex: 1, textAlign: "center", padding: "8px",
                            borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                            backgroundColor: "#dcfce7", color: "#15803d",
                            border: "1px solid #bbf7d0" }}>Resolved</span>
                        ) : (
                          <button onClick={() => dispatch(fetchDisputeById(d.id))}
                            style={{ flex: 1, padding: "8px", borderRadius: "8px",
                              fontSize: "13px", fontWeight: 500, color: "#2563EB",
                              backgroundColor: "#EFF6FF", border: "none", cursor: "pointer" }}>
                            Resolve
                          </button>
                        )}
                        <button onClick={() => dispatch(fetchDisputeById(d.id))}
                          style={{ padding: "8px 12px", borderRadius: "8px",
                            border: "1px solid #E5E7EB", background: "none",
                            cursor: "pointer", color: "#9CA3AF" }}>
                          <Eye size={16} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Pagination ── */}
              <div className="dp-pgn" style={{ display: "flex", justifyContent: "space-between",
                padding: "14px 20px", borderTop: "1px solid #E5E7EB",
                backgroundColor: "#F9FAFB" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                  {filtered.length === 0
                    ? "No results"
                    : `Showing ${from} to ${to} of ${filtered.length} results`}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px",
                      border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280",
                      cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px",
                        fontWeight: p === page ? 600 : 400,
                        border:           p === page ? "none"           : "1px solid #E5E7EB",
                        backgroundColor:  p === page ? "#2563EB"        : "#fff",
                        color:            p === page ? "#fff"            : "#6B7280",
                        cursor: "pointer" }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px",
                      border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                      opacity: page === totalPages ? 0.4 : 1 }}>
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}