// components/payments/EscrowReleasetab.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchEscrows, releaseEscrowThunk, resetReleaseStatus } from "@/lib/redux/paymentSlice";
import type { ApiEscrow } from "@/lib/api/paymentApi";

const PAGE_SIZE = 10;

function StatusPill({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  let style = { color: "#6B7280", background: "#F9FAFB", border: "1px solid #E5E7EB" };
  if (["released", "completed", "success", "paid"].includes(s))
    style = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
  else if (["pending", "processing"].includes(s))
    style = { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" };
  else if (["disputed", "failed", "cancelled"].includes(s))
    style = { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  return (
    <span style={{ ...style, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status ?? "—"}
    </span>
  );
}

// ── Safe field accessor ───────────────────────────────────
const val = (item: ApiEscrow, ...keys: string[]): string => {
  for (const key of keys) {
    const v = (item as Record<string, unknown>)[key];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "—";
};

const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB"); } catch { return iso; }
};

// ── Detail panel ──────────────────────────────────────────
function EscrowDetail({ escrow, onClose }: { escrow: ApiEscrow; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { releaseStatus, releaseError } = useAppSelector((s) => s.payments);
  const isReleasing = releaseStatus === "loading";

  useEffect(() => () => { dispatch(resetReleaseStatus()); }, [dispatch]);

  const handleRelease = () => {
    dispatch(releaseEscrowThunk({ escrowId: escrow.id }))
      .unwrap()
      .then(() => { toast.success("Escrow released"); onClose(); })
      .catch((err: string) => toast.error("Failed to release", { description: err }));
  };

  // Build display rows from whatever fields the API returns
  const rows: [string, string][] = [
    ["Transaction ID", val(escrow, "id")],
    ["User ID",        val(escrow, "userId", "user_id", "clientId")],
    ["Provider",       val(escrow, "provider", "paymentProvider")],
    ["Amount",         escrow.amount ? `₦${Number(escrow.amount).toLocaleString()}` : val(escrow, "amount", "amountPaid")],
    ["Status",         val(escrow, "status")],
    ["Job ID",         val(escrow, "jobId", "job_id")],
    ["Expert",         val(escrow, "expertName", "expert", "expertId")],
    ["Client",         val(escrow, "clientName", "client", "clientId")],
    ["Created",        fmt(val(escrow, "createdAt", "created_at"))],
    ["Released At",    fmt(val(escrow, "releasedAt", "released_at"))],
  ].filter(([, v]) => v !== "—") as [string, string][];

  const status = val(escrow, "status");

  return (
    <div style={{ borderRadius: "16px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Transaction Detail</p>
        <button onClick={onClose} style={{ fontSize: "13px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
            <span style={{ minWidth: "120px", color: "#6B7280", flexShrink: 0 }}>{label}:</span>
            <span style={{ color: "#111827", wordBreak: "break-all" }}>
              {label === "Status" ? <StatusPill status={value} /> : value}
            </span>
          </div>
        ))}
      </div>

      {/* Raw debug — remove once field names confirmed */}
      <details style={{ fontSize: "11px" }}>
        <summary style={{ cursor: "pointer", color: "#9CA3AF" }}>Raw API fields</summary>
        <pre style={{ marginTop: "8px", padding: "10px", backgroundColor: "#F3F4F6", borderRadius: "8px", overflow: "auto", fontSize: "11px" }}>
          {JSON.stringify(escrow, null, 2)}
        </pre>
      </details>

      {releaseError && <p style={{ fontSize: "12px", color: "#dc2626" }}>{releaseError}</p>}

      {["pending", "processing"].includes(status.toLowerCase()) && (
        <button onClick={handleRelease} disabled={isReleasing}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: isReleasing ? "not-allowed" : "pointer", opacity: isReleasing ? 0.7 : 1 }}>
          {isReleasing
            ? <><Loader2 size={14} className="animate-spin" /> Releasing...</>
            : <><CheckCircle2 size={14} /> Release Escrow</>}
        </button>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────
export default function EscrowReleasesTab() {
  const dispatch = useAppDispatch();
  const { escrows, escrowsStatus, escrowsError } = useAppSelector((s) => s.payments);

  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<ApiEscrow | null>(null);

  useEffect(() => {
    if (escrowsStatus === "idle") dispatch(fetchEscrows());
  }, [dispatch, escrowsStatus]);

  const data = escrows; // use real API data only

  const filtered = data.filter((e) => {
    const q = search.toLowerCase();
    return (
      val(e, "id").toLowerCase().includes(q)         ||
      val(e, "userId").toLowerCase().includes(q)     ||
      val(e, "provider").toLowerCase().includes(q)   ||
      val(e, "jobId").toLowerCase().includes(q)      ||
      val(e, "expertName").toLowerCase().includes(q) ||
      val(e, "clientName").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  if (selected) return <EscrowDetail escrow={selected} onClose={() => setSelected(null)} />;

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

      <div style={{ borderRadius: "16px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", overflow: "hidden" }}>

        {/* Search */}
        <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input type="text" placeholder="Search by ID, user, provider..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Loading */}
        {escrowsStatus === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "#9CA3AF" }}>
            <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading transactions...</span>
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
                    {["ID", "User ID", "Provider", "Amount", "Status", "Date", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>No transactions found.</td></tr>
                  ) : paginated.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "16px 20px", fontSize: "12px", fontFamily: "monospace", color: "#6B7280", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.id}>{e.id.slice(0, 12)}…</td>
                      <td style={{ padding: "16px 20px", fontSize: "12px", fontFamily: "monospace", color: "#6B7280", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val(e, "userId").slice(0, 12)}…</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#374151", textTransform: "capitalize" }}>{val(e, "provider")}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                        {e.amount ? `₦${Number(e.amount).toLocaleString()}` : val(e, "amount", "amountPaid")}
                      </td>
                      <td style={{ padding: "16px 20px" }}><StatusPill status={val(e, "status")} /></td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#6B7280" }}>{fmt(val(e, "createdAt"))}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <button onClick={() => setSelected(e)}
                          style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF" }}>
                          <Eye size={16} strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="escrow-cards" style={{ backgroundColor: "#F9FAFB" }}>
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF" }}>No transactions found.</p>
              ) : paginated.map((e) => (
                <div key={e.id} onClick={() => setSelected(e)}
                  style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontFamily: "monospace", color: "#6B7280", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.id}</p>
                      <p style={{ fontSize: "12px", color: "#374151", textTransform: "capitalize" }}>{val(e, "provider")}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                        {e.amount ? `₦${Number(e.amount).toLocaleString()}` : "—"}
                      </p>
                      <StatusPill status={val(e, "status")} />
                    </div>
                  </div>
                  <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #F3F4F6" }}>
                    {fmt(val(e, "createdAt"))}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="escrow-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
          <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
            {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#16a34a" : "#ffffff", color: p === page ? "#fff" : "#6B7280", cursor: "pointer" }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}