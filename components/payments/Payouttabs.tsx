"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Eye, RefreshCw, Download, Bell } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchPayouts, retryPayoutThunk, resetRetryStatus } from "@/lib/redux/paymentSlice";
import type { ApiPayout } from "@/lib/api/paymentApi";

const PAGE_SIZE = 10;

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  let style = { color: "var(--color-text-muted)", background: "var(--color-background)", border: "1px solid var(--color-border)" };
  if (s === "paid")    style = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
  if (s === "pending") style = { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" };
  if (s === "failed")  style = { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  return (
    <span style={{ ...style, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function fmt(n?: number) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString()}`;
}

// ── Payout Detail panel ───────────────────────────────────────────────────────
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

  useEffect(() => () => { dispatch(resetRetryStatus()); }, [dispatch]);

  return (
    <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>Payout Detail</p>
        <button onClick={onClose} style={{ fontSize: "13px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {([
          ["Payout ID",    payout.id],
          ["TAS Name",     payout.recipientName],
          ["TAS ID",       payout.tasId ?? payout.recipientId],
          ["Experts",      String(payout.experts ?? "—")],
          ["Model 2",      fmt(payout.model2Amount)],
          ["Model 1",      fmt(payout.model1Amount)],
          ["Total",        fmt(payout.totalAmount ?? payout.amount)],
          ["Status",       payout.status],
          ["Bank",         payout.bankName ?? "—"],
          ["Account No.",  payout.accountNumber ?? "—"],
          ["Account Name", payout.accountName ?? "—"],
          ["Paid At",      payout.paidAt ? new Date(payout.paidAt).toLocaleDateString("en-GB") : "—"],
          ["Created",      new Date(payout.createdAt).toLocaleDateString("en-GB")],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
            <span style={{ minWidth: "120px", color: "var(--color-text-muted)", flexShrink: 0 }}>{label}:</span>
            <span style={{ color: "var(--color-text-main)", wordBreak: "break-all" }}>
              {label === "Status" ? <StatusPill status={value} /> : value}
            </span>
          </div>
        ))}
      </div>
      {retryError && <p style={{ fontSize: "12px", color: "#dc2626" }}>{retryError}</p>}
      {payout.status === "failed" && (
        <button onClick={handleRetry} disabled={isRetrying}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#2563eb", border: "none", cursor: isRetrying ? "not-allowed" : "pointer", opacity: isRetrying ? 0.7 : 1 }}>
          {isRetrying ? <><Loader2 size={14} className="animate-spin" /> Retrying...</> : <><RefreshCw size={14} /> Retry Payout</>}
        </button>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function PayoutsTab() {
  const dispatch = useAppDispatch();
  const { payouts, payoutSummary, payoutsStatus, payoutsError } = useAppSelector((s) => s.payments);

  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<ApiPayout | null>(null);

  useEffect(() => {
    if (payoutsStatus === "idle") dispatch(fetchPayouts());
  }, [dispatch, payoutsStatus]);

  const filtered = payouts.filter((p) =>
    p.recipientName.toLowerCase().includes(search.toLowerCase()) ||
    (p.tasId ?? p.recipientId).toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  if (selected) return <PayoutDetail payout={selected} onClose={() => setSelected(null)} />;

  const handleProcessPayouts = () => toast.info("Process Payouts — backend endpoint needed");
  const handleExportCsv      = () => toast.info("Export CSV — backend endpoint needed");
  const handleNotify         = () => toast.info("Send Notifications — backend endpoint needed");

  // ── Summary values — from API or zeros while loading ─────────────────────
  const summary = payoutSummary ?? {
    totalTasToPay:     0,
    totalPayoutAmount: 0,
    averagePerTas:     0,
    paymentDate:       "—",
  };

  const summaryItems = [
    { label: "Total TAS to Pay",     value: String(summary.totalTasToPay) },
    { label: "Total Payout Amount",  value: `₦${Number(summary.totalPayoutAmount).toLocaleString()}` },
    { label: "Average per TAS",      value: `₦${Number(summary.averagePerTas).toLocaleString()}` },
    { label: "Payment Date",         value: summary.paymentDate },
  ];

  return (
    <>
      <style>{`
        .payouts-table-wrap { display: none; }
        .payouts-cards      { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .payouts-pagination { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 768px) {
          .payouts-table-wrap { display: block; }
          .payouts-cards      { display: none; }
          .payouts-pagination { flex-direction: row; align-items: center; }
        }
        .payout-row:hover td { background: #f9fafb; }
      `}</style>

      {/* ── Summary card ── */}
      <div style={{ backgroundColor: "#fff", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "20px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "16px" }}>
          {summaryItems.map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "0 0 2px" }}>{label}</p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                {payoutsStatus === "loading" ? "—" : value}
              </p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={handleProcessPayouts}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: "10px", border: "none", backgroundColor: "#2563eb", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} /> Process Payouts
          </button>
          <button onClick={handleExportCsv}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-main)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handleNotify}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-main)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <Bell size={14} /> Send Notifications
          </button>
        </div>
      </div>

      {/* ── Table card ── */}
      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Search TAS name or ID…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Loading */}
        {payoutsStatus === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
            <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading payouts...</span>
          </div>
        )}
        {payoutsStatus === "failed" && (
          <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>{payoutsError}</p>
        )}

        {payoutsStatus !== "loading" && (
          <>
            {/* Desktop table — matches 10.3: TAS Name | TAS ID | Experts | Model 2 | Model 1 | Total | Status */}
            <div className="payouts-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    {["TAS Name", "TAS ID", "Experts", "Model 2", "Model 1", "Total", "Status", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No payouts found.</td></tr>
                  ) : paginated.map((p) => (
                    <tr key={p.id} className="payout-row" style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", whiteSpace: "nowrap" }}>{p.recipientName}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>{p.tasId ?? p.recipientId}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-main)", textAlign: "center" }}>{p.experts ?? "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-main)", whiteSpace: "nowrap" }}>{fmt(p.model2Amount)}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-main)", whiteSpace: "nowrap" }}>{fmt(p.model1Amount)}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "var(--color-text-main)", whiteSpace: "nowrap" }}>{fmt(p.totalAmount ?? p.amount)}</td>
                      <td style={{ padding: "14px 20px" }}><StatusPill status={p.status} /></td>
                      <td style={{ padding: "14px 20px" }}>
                        <button onClick={() => setSelected(p)}
                          style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
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
                  style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#fff", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "8px" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", margin: "0 0 2px" }}>{p.recipientName}</p>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace", margin: 0 }}>{p.tasId ?? p.recipientId}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 4px" }}>{fmt(p.totalAmount ?? p.amount)}</p>
                      <StatusPill status={p.status} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
                    <div>
                      <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: "0 0 2px" }}>Experts</p>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>{p.experts ?? "—"}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: "0 0 2px" }}>Model 2</p>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>{fmt(p.model2Amount)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: "0 0 2px" }}>Model 1</p>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>{fmt(p.model1Amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="payouts-pagination" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: p === page ? "none" : "1px solid var(--color-border)", backgroundColor: p === page ? "#2563eb" : "#fff", color: p === page ? "#fff" : "var(--color-text-muted)", cursor: "pointer", fontWeight: p === page ? 600 : 400 }}>
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