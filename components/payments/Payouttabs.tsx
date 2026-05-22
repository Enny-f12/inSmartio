// components/payments/Payouttabs.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchPayouts, retryPayoutThunk, resetRetryStatus } from "@/lib/redux/paymentSlice";
import type { ApiPayout } from "@/lib/api/paymentApi";

// ── Mock data (max 3) — used until backend implements GET /api/admin/payouts ──
const MOCK_PAYOUTS: ApiPayout[] = [
  {
    id: "pay_001", recipientId: "exp_001",
    recipientName: "Adebayo S.", recipientType: "expert",
    amount: 16650, status: "paid",
    bankName: "Access Bank", accountNumber: "0123456789",
    paidAt: "2026-05-16T10:00:00Z", createdAt: "2026-05-16T09:00:00Z",
  },
  {
    id: "pay_002", recipientId: "tas_001",
    recipientName: "Chidi E.", recipientType: "tas",
    amount: 245000, status: "paid",
    bankName: "GTBank", accountNumber: "0234567890",
    paidAt: "2026-05-22T11:00:00Z", createdAt: "2026-05-22T10:00:00Z",
  },
  {
    id: "pay_003", recipientId: "exp_002",
    recipientName: "Mary K.", recipientType: "expert",
    amount: 45000, status: "failed",
    bankName: "Zenith Bank", accountNumber: "0345678901",
    createdAt: "2026-05-20T08:00:00Z",
  },
];

const PAGE_SIZE = 10;

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  let style = { color: "var(--color-text-muted)", background: "var(--color-background)", border: "1px solid var(--color-border)" };
  if (s === "paid")
    style = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
  else if (s === "pending")
    style = { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" };
  else if (s === "failed")
    style = { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  return (
    <span style={{ ...style, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: "expert" | "tas" }) {
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap", color: type === "tas" ? "#7c3aed" : "#2563eb", background: type === "tas" ? "#f5f3ff" : "#eff6ff", border: `1px solid ${type === "tas" ? "#ddd6fe" : "#bfdbfe"}` }}>
      {type.toUpperCase()}
    </span>
  );
}

// ── Detail panel ──────────────────────────────────────────
function PayoutDetail({ payout, onClose }: { payout: ApiPayout; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { retryStatus, retryError } = useAppSelector((s) => s.payments);
  const isRetrying = retryStatus === "loading";

  const handleRetry = () => {
    dispatch(retryPayoutThunk(payout.id))
      .unwrap()
      .then(() => { toast.success(`Payout retried for ${payout.recipientName}`); onClose(); })
      .catch((err: string) => toast.error("Failed to retry payout", { description: err }));
  };

  useEffect(() => {
    return () => { dispatch(resetRetryStatus()); };
  }, [dispatch]);

  return (
    <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>Payout Detail</p>
        <button onClick={onClose} style={{ fontSize: "13px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {([
          ["Payout ID",   payout.id],
          ["Recipient",   payout.recipientName],
          ["Type",        payout.recipientType],
          ["Amount",      `₦${Number(payout.amount).toLocaleString()}`],
          ["Status",      payout.status],
          ["Bank",        payout.bankName ?? "—"],
          ["Account No.", payout.accountNumber ?? "—"],
          ["Created",     new Date(payout.createdAt).toLocaleString("en-GB")],
          ["Paid At",     payout.paidAt ? new Date(payout.paidAt).toLocaleString("en-GB") : "—"],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
            <span style={{ minWidth: "120px", color: "var(--color-text-muted)", flexShrink: 0 }}>{label}:</span>
            <span style={{ color: "var(--color-text-main)", wordBreak: "break-all" }}>
              {label === "Status" ? <StatusPill status={value} />
                : label === "Type" ? <TypeBadge type={value as "expert" | "tas"} />
                : value}
            </span>
          </div>
        ))}
      </div>

      {retryError && (
        <p style={{ fontSize: "12px", color: "#dc2626" }}>{retryError}</p>
      )}

      {payout.status === "failed" && (
        <button onClick={handleRetry} disabled={isRetrying}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#2563eb", border: "none", cursor: isRetrying ? "not-allowed" : "pointer", opacity: isRetrying ? 0.7 : 1 }}>
          {isRetrying
            ? <><Loader2 size={14} className="animate-spin" /> Retrying...</>
            : <><RefreshCw size={14} /> Retry Payout</>}
        </button>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────
export default function PayoutsTab() {
  const dispatch = useAppDispatch();
  const { payouts, payoutsStatus, payoutsError } = useAppSelector((s) => s.payments);

  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expert" | "tas">("all");
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<ApiPayout | null>(null);

  useEffect(() => {
    if (payoutsStatus === "idle") dispatch(fetchPayouts());
  }, [dispatch, payoutsStatus]);

  // Use real data if available, else mock
  const data = payoutsStatus === "succeeded" && payouts.length > 0 ? payouts : MOCK_PAYOUTS;

  const filtered = data.filter((p) => {
    const matchSearch = p.recipientName.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || p.recipientType === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  if (selected) return <PayoutDetail payout={selected} onClose={() => setSelected(null)} />;

  return (
    <>
      <style>{`
        .payouts-toolbar    { flex-direction: column; gap: 8px; }
        .payouts-table-wrap { display: none; }
        .payouts-cards      { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .payouts-pagination { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 540px) { .payouts-toolbar { flex-direction: row; align-items: center; } }
        @media (min-width: 768px) {
          .payouts-table-wrap { display: block; }
          .payouts-cards      { display: none; }
          .payouts-pagination { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <div className="payouts-toolbar" style={{ display: "flex" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input type="text" placeholder="Search recipient..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["all", "expert", "tas"] as const).map((t) => (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                  style={{ padding: "8px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: typeFilter === t ? "none" : "1px solid var(--color-border)", backgroundColor: typeFilter === t ? "#2563eb" : "#ffffff", color: typeFilter === t ? "#fff" : "var(--color-text-muted)" }}>
                  {t === "all" ? "All" : t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {payoutsStatus === "loading" && payouts.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
            <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading payouts...</span>
          </div>
        )}

        {payoutsStatus === "failed" && (
          <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>{payoutsError}</p>
        )}

        {payoutsStatus !== "loading" && (
          <>
            {/* Desktop table */}
            <div className="payouts-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    {["Recipient", "Type", "Amount", "Bank", "Status", "Date", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No payouts found.</td></tr>
                  ) : paginated.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)" }}>{p.recipientName}</td>
                      <td style={{ padding: "16px 20px" }}><TypeBadge type={p.recipientType} /></td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)" }}>₦{Number(p.amount).toLocaleString()}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{p.bankName ?? "—"}</td>
                      <td style={{ padding: "16px 20px" }}><StatusPill status={p.status} /></td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{new Date(p.createdAt).toLocaleDateString("en-GB")}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <button onClick={() => setSelected(p)}
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
            <div className="payouts-cards" style={{ backgroundColor: "var(--color-background)" }}>
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No payouts found.</p>
              ) : paginated.map((p) => (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "8px" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>{p.recipientName}</p>
                      <TypeBadge type={p.recipientType} />
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>₦{Number(p.amount).toLocaleString()}</p>
                      <StatusPill status={p.status} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{new Date(p.createdAt).toLocaleDateString("en-GB")}</span>
                    {p.bankName && <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{p.bankName}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="payouts-pagination" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
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