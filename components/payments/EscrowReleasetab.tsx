/* eslint-disable react-hooks/purity */
"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchEscrows } from "@/lib/redux/paymentSlice";
import type { ApiEscrow } from "@/lib/api/paymentApi";
import { mockEscrowReleases } from "@/components/payments/types";

const PAGE_SIZE = 10;

export default function EscrowReleasesTab() {
  const dispatch = useAppDispatch();
  const { escrows, escrowsStatus, escrowsError, escrowsMeta } = useAppSelector((s) => s.payments);

  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Stable "now" so it doesn't change on every render
  const now = useMemo(() => Date.now(), []);

  useEffect(() => {
    if (escrowsStatus === "idle") dispatch(fetchEscrows());
  }, [dispatch, escrowsStatus]);

  // Enrich escrows with daysLeft — computed once via useMemo
  const data = useMemo(() => {
    const source: ApiEscrow[] = escrowsStatus === "succeeded" && escrows.length > 0
      ? escrows
      : mockEscrowReleases.map((m) => ({
          id:           m.jobId,
          userId:       m.id,
          expertId:     m.expert,
          amount:       Number(m.amount.replace(/[₦,]/g, "")),
          escrowStatus: m.status.toLowerCase(),
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
  }, [escrows, escrowsStatus, now]);

  type EnrichedEscrow = (typeof data)[number];

  const filtered = data.filter((e: EnrichedEscrow) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.id ?? "").toLowerCase().includes(q)       ||
      (e.userId ?? "").toLowerCase().includes(q)   ||
      (e.expertId ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });

  const handleRelease = (id: string) => {
    toast.success(`Escrow ${id} released`);
    // TODO: dispatch releaseEscrowThunk(id)
  };

  const handleReleaseSelected = () => {
    if (selected.size === 0) { toast.warning("Select at least one escrow"); return; }
    toast.success(`Released ${selected.size} escrow(s)`);
    setSelected(new Set());
  };

  const handleReleaseAll = () => {
    toast.success(`Released all ${filtered.length} escrow(s)`);
    setSelected(new Set());
  };

  function StatusPill({ status }: { status?: string }) {
    const s = (status ?? "").toLowerCase();
    let bg = "#F9FAFB", color = "#6B7280", border = "1px solid #E5E7EB";
    if (["released", "paid", "completed"].includes(s)) { bg = "#f0fdf4"; color = "#15803d"; border = "1px solid #bbf7d0"; }
    else if (["holding", "pending", "held"].includes(s)) { bg = "#fffbeb"; color = "#d97706"; border = "1px solid #fde68a"; }
    else if (["disputed", "failed"].includes(s))         { bg = "#fef2f2"; color = "#dc2626"; border = "1px solid #fecaca"; }
    return <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap", background: bg, color, border }}>{status ?? "—"}</span>;
  }

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

      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#fff", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>
            Pending Escrow Releases
            {filtered.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: 999, backgroundColor: "#FEF3C7", color: "#B45309" }}>
                {filtered.length}
              </span>
            )}
          </p>
          <div style={{ position: "relative", minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Search job, client, expert…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: "36px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", borderRadius: "10px", border: "1px solid var(--color-border)", fontSize: "13px", outline: "none", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", width: "100%", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {escrowsStatus === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
            <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading escrows...</span>
          </div>
        )}
        {escrowsStatus === "failed" && (
          <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>{escrowsError}</p>
        )}

        {escrowsStatus !== "loading" && (
          <>
            {/* Desktop table */}
            <div className="escrow-table" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    <th style={{ padding: "12px 16px 12px 20px", width: 32 }}>
                      <input type="checkbox"
                        checked={selected.size === paginated.length && paginated.length > 0}
                        onChange={() => selected.size === paginated.length ? setSelected(new Set()) : setSelected(new Set(paginated.map((e) => e.id)))}
                        style={{ accentColor: "#16a34a", width: 14, height: 14 }} />
                    </th>
                    {["Job ID", "Client", "Expert", "Amount", "Days Left", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No pending escrows.</td></tr>
                  ) : paginated.map((e) => {
                    const urgent = e.daysLeft <= 1;
                    return (
                      <tr key={e.id} style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: selected.has(e.id) ? "#F0FDF4" : undefined }}>
                        <td style={{ padding: "15px 16px 15px 20px" }}>
                          <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)}
                            style={{ accentColor: "#16a34a", width: 14, height: 14 }} />
                        </td>
                        <td style={{ padding: "15px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", fontFamily: "monospace" }}>{e.id}</td>
                        <td style={{ padding: "15px 20px", fontSize: "13px", color: "var(--color-text-main)" }}>{e.userId}</td>
                        <td style={{ padding: "15px 20px", fontSize: "13px", color: "var(--color-text-main)" }}>{e.expertId ?? "—"}</td>
                        <td style={{ padding: "15px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", whiteSpace: "nowrap" }}>₦{Number(e.amount).toLocaleString()}</td>
                        <td style={{ padding: "15px 20px", fontSize: "13px", fontWeight: 600, color: urgent ? "#dc2626" : "#d97706", whiteSpace: "nowrap" }}>
                          {e.daysLeft} {e.daysLeft === 1 ? "day" : "days"}
                        </td>
                        <td style={{ padding: "15px 20px" }}><StatusPill status={e.escrowStatus} /></td>
                        <td style={{ padding: "15px 20px" }}>
                          <button onClick={() => handleRelease(e.id)}
                            style={{ fontSize: "12px", fontWeight: 600, padding: "5px 14px", borderRadius: "8px", border: "1px solid #16a34a", backgroundColor: "#fff", color: "#16a34a", cursor: "pointer" }}>
                            Release
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
                ? <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No pending escrows.</p>
                : paginated.map((e) => {
                  const urgent = e.daysLeft <= 1;
                  return (
                    <div key={e.id} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${selected.has(e.id) ? "#16a34a" : "var(--color-border)"}`, backgroundColor: selected.has(e.id) ? "#F0FDF4" : "#fff" }}
                      onClick={() => toggleSelect(e.id)}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <div>
                          <p style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600, color: "var(--color-text-main)", marginBottom: 2 }}>{e.id}</p>
                          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Client: {e.userId} · Expert: {e.expertId ?? "—"}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: 4 }}>₦{Number(e.amount).toLocaleString()}</p>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: urgent ? "#dc2626" : "#d97706" }}>{e.daysLeft} {e.daysLeft === 1 ? "day" : "days"} left</span>
                        </div>
                      </div>
                      <button onClick={(ev) => { ev.stopPropagation(); handleRelease(e.id); }}
                        style={{ width: "100%", marginTop: 8, padding: "8px", borderRadius: "8px", border: "1px solid #16a34a", backgroundColor: "#fff", color: "#16a34a", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                        Release
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Bulk actions */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", backgroundColor: "var(--color-background)" }}>
              <button onClick={handleReleaseSelected} disabled={selected.size === 0}
                style={{ padding: "8px 18px", borderRadius: "10px", border: "none", backgroundColor: "#16a34a", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: selected.size === 0 ? "not-allowed" : "pointer", opacity: selected.size === 0 ? 0.4 : 1 }}>
                Release Selected{selected.size > 0 ? ` (${selected.size})` : ""}
              </button>
              <button onClick={handleReleaseAll}
                style={{ padding: "8px 18px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-main)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Release All
              </button>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="escrow-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${escrowsMeta?.total || filtered.length} results`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: p === page ? "none" : "1px solid var(--color-border)", backgroundColor: p === page ? "#16a34a" : "#fff", color: p === page ? "#fff" : "var(--color-text-muted)", cursor: "pointer", fontWeight: p === page ? 600 : 400 }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-muted)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}