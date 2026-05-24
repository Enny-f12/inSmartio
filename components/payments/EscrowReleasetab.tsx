// components/payments/EscrowReleasetab.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchEscrows } from "@/lib/redux/paymentSlice";
import type { ApiEscrow } from "@/lib/api/paymentApi";

const PAGE_SIZE = 10;

const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB"); } catch { return iso; }
};

const truncate = (str?: string | null, n = 14) =>
  str && str.length > n ? str.slice(0, n) + "…" : (str || "—");

function EscrowStatusPill({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  let style = { color: "#6B7280", background: "#F9FAFB", border: "1px solid #E5E7EB" };
  if (["released", "paid", "completed"].includes(s))
    style = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
  else if (["holding", "pending", "held"].includes(s))
    style = { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" };
  else if (["disputed", "failed"].includes(s))
    style = { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  return (
    <span style={{ ...style, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status ?? "—"}
    </span>
  );
}

export default function EscrowReleasesTab() {
  const dispatch = useAppDispatch();
  const { escrows, escrowsStatus, escrowsError, escrowsMeta } = useAppSelector((s) => s.payments);

  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  useEffect(() => {
    if (escrowsStatus === "idle") dispatch(fetchEscrows());
  }, [dispatch, escrowsStatus]);

  const filtered = escrows.filter((e: ApiEscrow) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.id?.toLowerCase().includes(q)       ||
      e.userId?.toLowerCase().includes(q)   ||
      e.expertId?.toLowerCase().includes(q) ||
      e.provider?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <style>{`
        .escrow-table-wrap { display: none; }
        .escrow-cards      { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .escrow-pgn        { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 768px) {
          .escrow-table-wrap { display: block; }
          .escrow-cards      { display: none; }
          .escrow-pgn        { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div style={{ borderRadius: "16px", border: "1px solid #E5E7EB", backgroundColor: "#fff", overflow: "hidden" }}>

        {/* Search */}
        <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input type="text" placeholder="Search by ID, user, expert, provider..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Loading */}
        {escrowsStatus === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "#9CA3AF" }}>
            <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading escrows...</span>
          </div>
        )}

        {escrowsStatus === "failed" && (
          <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>{escrowsError}</p>
        )}

        {escrowsStatus === "succeeded" && (
          <>
            {/* Desktop table */}
            <div className="escrow-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                    {["Date", "ID", "Client ID", "Expert ID", "Amount", "Escrow Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>No escrows found.</td></tr>
                  ) : paginated.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#6B7280", whiteSpace: "nowrap" }}>{fmt(e.createdAt)}</td>
                      <td style={{ padding: "16px 20px", fontSize: "12px", fontFamily: "monospace", color: "#6B7280" }} title={e.id}>{truncate(e.id)}</td>
                      <td style={{ padding: "16px 20px", fontSize: "12px", fontFamily: "monospace", color: "#6B7280" }} title={e.userId}>{truncate(e.userId)}</td>
                      <td style={{ padding: "16px 20px", fontSize: "12px", fontFamily: "monospace", color: "#6B7280" }} title={e.expertId ?? ""}>{truncate(e.expertId)}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 500, color: "#111827", whiteSpace: "nowrap" }}>₦{Number(e.amount).toLocaleString()}</td>
                      <td style={{ padding: "16px 20px" }}><EscrowStatusPill status={e.escrowStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="escrow-cards" style={{ backgroundColor: "#F9FAFB" }}>
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF" }}>No escrows found.</p>
              ) : paginated.map((e) => (
                <div key={e.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontFamily: "monospace", color: "#6B7280", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.id}</p>
                      <p style={{ fontSize: "12px", color: "#6B7280" }}>Client: {truncate(e.userId, 12)}</p>
                      <p style={{ fontSize: "12px", color: "#6B7280" }}>Expert: {truncate(e.expertId, 12)}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>₦{Number(e.amount).toLocaleString()}</p>
                      <EscrowStatusPill status={e.escrowStatus} />
                    </div>
                  </div>
                  <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #F3F4F6" }}>
                    {fmt(e.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="escrow-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
          <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
            {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${escrowsMeta.total || filtered.length} results`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#16a34a" : "#fff", color: p === page ? "#fff" : "#6B7280", cursor: "pointer", fontWeight: p === page ? 600 : 400 }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
          </div>
        </div>

      </div>
    </>
  );
}