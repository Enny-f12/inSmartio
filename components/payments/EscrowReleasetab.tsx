/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/purity */
"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2, Eye, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchEscrows } from "@/lib/redux/paymentSlice";
import type { ApiEscrow } from "@/lib/api/paymentApi";
import { mockEscrowReleases } from "@/components/payments/types";

const PAGE_SIZE = 10;

function StatusPill({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  let bg = "#F9FAFB", color = "#6B7280", border = "1px solid #E5E7EB";
  if (["released", "paid", "completed"].includes(s))   { bg = "#f0fdf4"; color = "#15803d"; border = "1px solid #bbf7d0"; }
  else if (["holding", "pending", "held"].includes(s)) { bg = "#fffbeb"; color = "#d97706"; border = "1px solid #fde68a"; }
  else if (["disputed", "failed"].includes(s))         { bg = "#fef2f2"; color = "#dc2626"; border = "1px solid #fecaca"; }
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px",
      borderRadius: "20px", whiteSpace: "nowrap", background: bg, color, border }}>
      {status ?? "—"}
    </span>
  );
}

// ── Escrow Detail Modal ───────────────────────────────────
function EscrowDetailModal({
  escrow, onClose,
}: { escrow: ReturnType<typeof buildData>[number]; onClose: () => void }) {
  const rec = escrow as Record<string, unknown>;

  function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "10px" }}>
        <span style={{ minWidth: "160px", flexShrink: 0, color: "#6B7280", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "#111827", wordBreak: "break-all" }}>{value ?? "—"}</span>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: "16px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%",
        maxWidth: "480px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", margin: 0 }}>
            Escrow Detail
          </p>
          <button onClick={onClose}
            style={{ padding: "4px", borderRadius: "8px", border: "none",
              background: "none", cursor: "pointer", color: "#9CA3AF",
              display: "flex", alignItems: "center" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", maxHeight: "70vh", overflowY: "auto" }}>

          {/* Escrow Info */}
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "#6B7280", marginBottom: "14px" }}>
            Escrow Information
          </p>
          <div style={{ backgroundColor: "#F9FAFB", borderRadius: "12px",
            padding: "16px", marginBottom: "16px" }}>
            <Row label="Escrow ID:"       value={escrow.id} />
            <Row label="Job ID:"          value={String(rec.resourceId ?? rec.jobId ?? "—")} />
            <Row label="Provider:"        value={String(escrow.provider ?? "—")} />
            <Row label="Reference:"       value={String(rec.reference ?? "—")} />
            <Row label="Created:"         value={escrow.createdAt
              ? new Date(escrow.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : "—"} />
            <Row label="Days Left:"       value={
              <span style={{ fontWeight: 600, color: escrow.daysLeft <= 1 ? "#dc2626" : "#d97706" }}>
                {escrow.daysLeft} {escrow.daysLeft === 1 ? "day" : "days"}
              </span>
            } />
            <Row label="Escrow Status:"   value={<StatusPill status={escrow.escrowStatus} />} />
            <Row label="Payment Status:"  value={<StatusPill status={escrow.status} />} />
          </div>

          {/* Parties */}
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "#6B7280", marginBottom: "14px" }}>
            Parties
          </p>
          <div style={{ backgroundColor: "#F9FAFB", borderRadius: "12px",
            padding: "16px", marginBottom: "16px" }}>
            <Row label="Client ID:"  value={escrow.userId} />
            <Row label="Expert ID:"  value={escrow.expertId ?? "—"} />
          </div>

          {/* Payment */}
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "#6B7280", marginBottom: "14px" }}>
            Payment
          </p>
          <div style={{ backgroundColor: "#F9FAFB", borderRadius: "12px", padding: "16px" }}>
            <Row label="Amount:"    value={
              <span style={{ fontWeight: 600, fontSize: "15px", color: "#111827" }}>
                ₦{Number(escrow.amount).toLocaleString()}
              </span>
            } />
            <Row label="Currency:"  value={String(rec.currency ?? "NGN")} />
            <Row label="Purpose:"   value={String(rec.purpose ?? "—")} />
            <Row label="Released:"  value={rec.releasedAt
              ? new Date(String(rec.releasedAt)).toLocaleDateString("en-GB")
              : "Not yet released"} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #E5E7EB",
          display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "10px 24px", borderRadius: "10px",
              border: "1px solid #E5E7EB", backgroundColor: "#fff",
              fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "#374151" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Build data helper (extracted for type reuse) ──────────
function buildData(
  escrows: ApiEscrow[],
  escrowsStatus: string,
  now: number,
) {
  const source: ApiEscrow[] = escrowsStatus === "succeeded" && escrows.length > 0
    ? escrows
    : mockEscrowReleases.map((m) => ({
        id:           m.jobId,
        userId:       m.id,
        expertId:     m.expert,
        amount:       Number(m.amount.replace(/[₦,]/g, "")),
        escrowStatus: m.status.toLowerCase() as import("@/lib/api/paymentApi").EscrowStatus,
        provider:     "mock",
        status:       "pending" as const,
        createdAt:    m.date,
      }));

  return source.map((e) => {
    const rec      = e as Record<string, unknown>;
    const daysLeft = typeof rec.daysLeft === "number"
      ? rec.daysLeft
      : Math.max(0, Math.round((new Date(e.createdAt).getTime() + 7 * 86400000 - now) / 86400000));
    return { ...e, daysLeft };
  });
}

// ── Main component ────────────────────────────────────────
export default function EscrowReleasesTab() {
  const dispatch = useAppDispatch();
  const { escrows, escrowsStatus, escrowsError, escrowsMeta } = useAppSelector((s) => s.payments);

  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [viewing,  setViewing]  = useState<ReturnType<typeof buildData>[number] | null>(null);

  const now = useMemo(() => Date.now(), []);

  useEffect(() => {
    if (escrowsStatus === "idle") dispatch(fetchEscrows());
  }, [dispatch, escrowsStatus]);

  const data = useMemo(
    () => buildData(escrows, escrowsStatus, now),
    [escrows, escrowsStatus, now],
  );

  type EnrichedEscrow = (typeof data)[number];

  const filtered = data.filter((e: EnrichedEscrow) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.id ?? "").toLowerCase().includes(q)     ||
      (e.userId ?? "").toLowerCase().includes(q) ||
      ((e.expertId ?? "") as string).toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  const TH: React.CSSProperties = {
    textAlign: "left", padding: "12px 20px", fontSize: "11px",
    fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
    color: "var(--color-text-muted)",
  };
  const TD: React.CSSProperties = {
    padding: "15px 20px", fontSize: "13px",
    color: "var(--color-text-main)", borderBottom: "1px solid var(--color-border)",
  };

  return (
    <>
      <style>{`
        .escrow-table { display: none; }
        .escrow-cards { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .escrow-pgn   { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 768px) {
          .escrow-table { display: block; }
          .escrow-cards { display: none; }
          .escrow-pgn   { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)",
        backgroundColor: "#fff", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: "14px", fontWeight: 600,
            color: "var(--color-text-main)", margin: 0 }}>
            Escrow Releases
            {filtered.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: "12px", fontWeight: 600,
                padding: "2px 8px", borderRadius: 999,
                backgroundColor: "#FEF3C7", color: "#B45309" }}>
                {filtered.length}
              </span>
            )}
          </p>
          <div style={{ position: "relative", minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%",
              transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Search escrow, client, expert…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: "36px", paddingRight: "12px", paddingTop: "8px",
                paddingBottom: "8px", borderRadius: "10px",
                border: "1px solid var(--color-border)", fontSize: "13px", outline: "none",
                backgroundColor: "var(--color-background)", color: "var(--color-text-main)",
                width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Loading / Error */}
        {escrowsStatus === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
            <Loader2 size={18} className="animate-spin" />
            <span style={{ fontSize: "13px" }}>Loading escrows...</span>
          </div>
        )}
        {escrowsStatus === "failed" && (
          <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>
            {escrowsError}
          </p>
        )}

        {escrowsStatus !== "loading" && (
          <>
            {/* Desktop table */}
            <div className="escrow-table" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-background)" }}>
                    {["Escrow ID", "Client", "Expert", "Amount", "Days Left", "Status", "Actions"].map((h) => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px",
                      fontSize: "14px", color: "var(--color-text-muted)" }}>
                      No escrows found.
                    </td></tr>
                  ) : paginated.map((e) => {
                    const urgent = e.daysLeft <= 1;
                    return (
                      <tr key={e.id}
                        style={{ borderBottom: "1px solid var(--color-border)" }}
                        onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = "#F9FAFB")}
                        onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = "transparent")}>
                        <td style={{ ...TD, fontWeight: 600, fontFamily: "monospace",
                          fontSize: "12px" }}>{e.id}</td>
                        <td style={TD}>{e.userId}</td>
                        <td style={TD}>{e.expertId ?? "—"}</td>
                        <td style={{ ...TD, fontWeight: 600 }}>
                          ₦{Number(e.amount).toLocaleString()}
                        </td>
                        <td style={{ ...TD, fontWeight: 600,
                          color: urgent ? "#dc2626" : "#d97706" }}>
                          {e.daysLeft} {e.daysLeft === 1 ? "day" : "days"}
                        </td>
                        <td style={TD}><StatusPill status={e.escrowStatus} /></td>
                        <td style={TD}>
                          <button onClick={() => setViewing(e)}
                            style={{ padding: "6px", borderRadius: "8px", border: "none",
                              background: "none", cursor: "pointer", color: "#9CA3AF",
                              display: "flex", alignItems: "center" }}
                            title="View details">
                            <Eye size={17} strokeWidth={1.8} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="escrow-cards" style={{ backgroundColor: "var(--color-background)" }}>
              {paginated.length === 0
                ? <p style={{ textAlign: "center", padding: "40px", fontSize: "13px",
                    color: "var(--color-text-muted)" }}>No escrows found.</p>
                : paginated.map((e) => {
                  const urgent = e.daysLeft <= 1;
                  return (
                    <div key={e.id}
                      style={{ padding: "14px 16px", borderRadius: "12px",
                        border: "1px solid var(--color-border)", backgroundColor: "#fff",
                        display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600,
                          color: "var(--color-text-main)", marginBottom: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.id}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--color-text-muted)",
                          marginBottom: 4 }}>
                          Client: {e.userId} · Expert: {e.expertId ?? "—"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px",
                          flexWrap: "wrap" }}>
                          <StatusPill status={e.escrowStatus} />
                          <span style={{ fontSize: "13px", fontWeight: 600,
                            color: "var(--color-text-main)" }}>
                            ₦{Number(e.amount).toLocaleString()}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 600,
                            color: urgent ? "#dc2626" : "#d97706" }}>
                            {e.daysLeft} {e.daysLeft === 1 ? "day" : "days"} left
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setViewing(e)}
                        style={{ padding: "8px", borderRadius: "8px",
                          border: "1px solid var(--color-border)", background: "none",
                          cursor: "pointer", color: "#9CA3AF", flexShrink: 0,
                          display: "flex", alignItems: "center" }}>
                        <Eye size={16} strokeWidth={1.8} />
                      </button>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="escrow-pgn" style={{ display: "flex", justifyContent: "space-between",
          padding: "16px", borderTop: "1px solid var(--color-border)",
          backgroundColor: "var(--color-background)" }}>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            {filtered.length === 0
              ? "No results"
              : `Showing ${from}–${to} of ${escrowsMeta?.total || filtered.length} results`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
                border: "1px solid var(--color-border)", backgroundColor: "#fff",
                color: "var(--color-text-muted)",
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px",
                  border: p === page ? "none" : "1px solid var(--color-border)",
                  backgroundColor: p === page ? "#16a34a" : "#fff",
                  color: p === page ? "#fff" : "var(--color-text-muted)",
                  cursor: "pointer", fontWeight: p === page ? 600 : 400 }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px",
                border: "1px solid var(--color-border)", backgroundColor: "#fff",
                color: "var(--color-text-muted)",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {viewing && (
        <EscrowDetailModal escrow={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
}