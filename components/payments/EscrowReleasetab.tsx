// components/payments/EscrowReleasetab.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchEscrows, releaseEscrowThunk, resetReleaseStatus } from "@/lib/redux/paymentSlice";
import type { ApiEscrow } from "@/lib/api/paymentApi";

// ── Mock data (max 3) — used until backend implements GET /api/admin/escrows ──
const MOCK_ESCROWS: ApiEscrow[] = [
  {
    id: "esc_001", jobId: "JOB-001", expertId: "exp_001",
    expertName: "Adebayo S.", clientName: "Funke A.",
    amount: 18500, status: "released",
    releasedAt: "2026-05-16T10:00:00Z", createdAt: "2026-05-15T08:00:00Z",
  },
  {
    id: "esc_002", jobId: "JOB-002", expertId: "exp_002",
    expertName: "Peter O.", clientName: "Ngozi E.",
    amount: 22500, status: "pending",
    createdAt: "2026-05-18T14:00:00Z",
  },
  {
    id: "esc_003", jobId: "JOB-003", expertId: "exp_003",
    expertName: "John D.", clientName: "Mary K.",
    amount: 10800, status: "disputed",
    createdAt: "2026-05-19T09:30:00Z",
  },
];

const PAGE_SIZE = 10;

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  let style = { color: "var(--color-text-muted)", background: "var(--color-background)", border: "1px solid var(--color-border)" };
  if (["released", "completed"].includes(s))
    style = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
  else if (s === "pending")
    style = { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" };
  else if (s === "disputed")
    style = { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  return (
    <span style={{ ...style, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ── Detail panel ──────────────────────────────────────────
function EscrowDetail({ escrow, onClose }: { escrow: ApiEscrow; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { releaseStatus, releaseError } = useAppSelector((s) => s.payments);
  const isReleasing = releaseStatus === "loading";

  const handleRelease = () => {
    dispatch(releaseEscrowThunk({ escrowId: escrow.id }))
      .unwrap()
      .then(() => { toast.success(`Escrow for ${escrow.jobId} released`); onClose(); })
      .catch((err: string) => toast.error("Failed to release escrow", { description: err }));
  };

  useEffect(() => {
    return () => { dispatch(resetReleaseStatus()); };
  }, [dispatch]);

  return (
    <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>Escrow Detail</p>
        <button onClick={onClose} style={{ fontSize: "13px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {([
          ["Escrow ID",   escrow.id],
          ["Job ID",      escrow.jobId],
          ["Expert",      escrow.expertName],
          ["Client",      escrow.clientName],
          ["Amount",      `₦${Number(escrow.amount).toLocaleString()}`],
          ["Status",      escrow.status],
          ["Created",     new Date(escrow.createdAt).toLocaleString("en-GB")],
          ["Released At", escrow.releasedAt ? new Date(escrow.releasedAt).toLocaleString("en-GB") : "—"],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
            <span style={{ minWidth: "120px", color: "var(--color-text-muted)", flexShrink: 0 }}>{label}:</span>
            <span style={{ color: "var(--color-text-main)", wordBreak: "break-all" }}>
              {label === "Status" ? <StatusPill status={value} /> : value}
            </span>
          </div>
        ))}
      </div>

      {releaseError && (
        <p style={{ fontSize: "12px", color: "#dc2626" }}>{releaseError}</p>
      )}

      {escrow.status === "pending" && (
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

  // Use real data if available, else mock
  const data = escrowsStatus === "succeeded" && escrows.length > 0 ? escrows : MOCK_ESCROWS;

  const filtered = data.filter((e) =>
    e.expertName.toLowerCase().includes(search.toLowerCase()) ||
    e.jobId.toLowerCase().includes(search.toLowerCase()) ||
    e.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  if (selected) return <EscrowDetail escrow={selected} onClose={() => setSelected(null)} />;

  return (
    <>
      <style>{`
        .escrow-table-wrap  { display: none; }
        .escrow-cards       { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .escrow-pagination  { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 768px) {
          .escrow-table-wrap { display: block; }
          .escrow-cards      { display: none; }
          .escrow-pagination { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>

        {/* Search */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Search expert, client or job ID..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Loading */}
        {escrowsStatus === "loading" && escrows.length === 0 && (
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
            <div className="escrow-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    {["Job ID", "Expert", "Client", "Amount", "Status", "Created", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No escrow records found.</td></tr>
                  ) : paginated.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)" }}>{e.jobId}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{e.expertName}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{e.clientName}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)" }}>₦{Number(e.amount).toLocaleString()}</td>
                      <td style={{ padding: "16px 20px" }}><StatusPill status={e.status} /></td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{new Date(e.createdAt).toLocaleDateString("en-GB")}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <button onClick={() => setSelected(e)}
                          style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                          <Eye size={16} strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="escrow-cards" style={{ backgroundColor: "var(--color-background)" }}>
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No escrow records found.</p>
              ) : paginated.map((e) => (
                <div key={e.id} onClick={() => setSelected(e)}
                  style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "8px" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "2px" }}>{e.jobId}</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{e.expertName} → {e.clientName}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>₦{Number(e.amount).toLocaleString()}</p>
                      <StatusPill status={e.status} />
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
                    {new Date(e.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="escrow-pagination" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={p === page ? "btn-primary" : ""}
                style={p !== page ? { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", color: "var(--color-text-muted)", cursor: "pointer" } : { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "none", cursor: "pointer" }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", color: "var(--color-text-muted)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
          </div>
        </div>

      </div>
    </>
  );
}