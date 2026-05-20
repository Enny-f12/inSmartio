// components/payments/Transactionstab.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, SlidersHorizontal, Loader2, Eye } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchTransactions, fetchTransactionById, clearSelectedTransaction } from "@/lib/redux/paymentSlice";
import type { ApiTransaction } from "@/lib/api/paymentApi";

const MOCK_TRANSACTIONS: ApiTransaction[] = [
  { id: "txn_001", reference: "PAY-2026-001", amount: 75000,  type: "payment",    status: "success",  userId: "user_emeka",  jobId: "job_001", description: "Plumbing repair",     createdAt: "2026-05-01T10:00:00Z" },
  { id: "txn_002", reference: "PAY-2026-002", amount: 50000,  type: "escrow",     status: "pending",  userId: "user_ngozi",  jobId: "job_002", description: "Electrician service", createdAt: "2026-05-03T14:22:00Z" },
  { id: "txn_003", reference: "PAY-2026-003", amount: 120000, type: "payout",     status: "success",  userId: "user_chidi",  jobId: "job_003", description: "Expert payout",       createdAt: "2026-05-05T09:10:00Z" },
  { id: "txn_004", reference: "PAY-2026-004", amount: 30000,  type: "refund",     status: "refunded", userId: "user_peter",  jobId: "job_004", description: "Service cancelled",   createdAt: "2026-05-07T16:45:00Z" },
  { id: "txn_005", reference: "PAY-2026-005", amount: 200000, type: "payment",    status: "success",  userId: "user_mary",   jobId: "job_005", description: "AC installation",     createdAt: "2026-05-08T11:30:00Z" },
  { id: "txn_006", reference: "PAY-2026-006", amount: 45000,  type: "escrow",     status: "pending",  userId: "user_john",   jobId: "job_006", description: "Carpentry work",      createdAt: "2026-05-10T08:15:00Z" },
  { id: "txn_007", reference: "PAY-2026-007", amount: 90000,  type: "withdrawal", status: "success",  userId: "user_james",  jobId: "job_007", description: "TAS withdrawal",      createdAt: "2026-05-12T13:00:00Z" },
  { id: "txn_008", reference: "PAY-2026-008", amount: 15000,  type: "payment",    status: "failed",   userId: "user_mayowa", jobId: "job_008", description: "Payment declined",    createdAt: "2026-05-14T17:20:00Z" },
  { id: "txn_009", reference: "PAY-2026-009", amount: 60000,  type: "payout",     status: "success",  userId: "user_adebayo",jobId: "job_009", description: "Expert payout",       createdAt: "2026-05-16T10:45:00Z" },
  { id: "txn_010", reference: "PAY-2026-010", amount: 180000, type: "escrow",     status: "success",  userId: "user_fatima", jobId: "job_010", description: "Home renovation",     createdAt: "2026-05-18T12:00:00Z" },
];

const PAGE_SIZE = 10;

function MiniDropdown({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "12px", fontSize: "13px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", color: "var(--color-text-muted)", cursor: "pointer", whiteSpace: "nowrap" }}>
        <span style={{ flex: 1, textAlign: "left" }}>{value || placeholder}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, borderRadius: "12px", overflow: "hidden", padding: "4px 0", backgroundColor: "#ffffff", border: "1px solid var(--color-border)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: "120px" }}>
          {options.map((opt) => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              style={{ width: "100%", padding: "8px 16px", fontSize: "13px", textAlign: "left", color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer" }}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  let style = { color: "var(--color-text-muted)", background: "var(--color-background)", border: "1px solid var(--color-border)" };
  if (["completed", "success", "released", "paid"].includes(s))
    style = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
  else if (["pending", "held"].includes(s))
    style = { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" };
  else if (["failed", "rejected"].includes(s))
    style = { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  else if (s === "refunded")
    style = { color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe" };
  return (
    <span style={{ ...style, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ── Transaction detail panel ───────────────────────────────
function TransactionDetail({ txn, onClose }: { txn: ApiTransaction; onClose: () => void }) {
  return (
    <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>Transaction Detail</p>
        <button onClick={onClose} style={{ fontSize: "13px", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          ["ID",          txn.id],
          ["Reference",   txn.reference ?? "—"],
          ["Type",        txn.type],
          ["Status",      txn.status],
          ["Amount",      `₦${Number(txn.amount).toLocaleString()}`],
          ["Description", txn.description ?? "—"],
          ["User ID",     txn.userId ?? "—"],
          ["Job ID",      txn.jobId ?? "—"],
          ["Date",        new Date(txn.createdAt).toLocaleString("en-GB")],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
            <span style={{ minWidth: "120px", color: "var(--color-text-muted)", flexShrink: 0 }}>{label}:</span>
            <span style={{ color: "var(--color-text-main)", wordBreak: "break-all" }}>
              {label === "Status" ? <StatusPill status={String(value)} /> : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TransactionsTab() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus } = useAppSelector((s) => s.payments);

  const [search,   setSearch]   = useState("");
  const [searchBy, setSearchBy] = useState("Type");
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchTransactions());
  }, [dispatch, listStatus]);

  // Use real data if available, else mock
  const transactions = listStatus === "succeeded" && list.length > 0 ? list : MOCK_TRANSACTIONS;

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const field = searchBy === "Type" ? t.type : searchBy === "User" ? (t.userId ?? "") : t.status;
    return field?.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  // Show detail panel
  if (selectedStatus === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
      <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading transaction...</span>
    </div>
  );
  if (selectedStatus === "succeeded" && selected) return (
    <TransactionDetail txn={selected} onClose={() => dispatch(clearSelectedTransaction())} />
  );

  return (
    <>
      <style>{`
        .txn-toolbar-row1 { display: flex; flex-direction: column; gap: 8px; }
        .txn-table-wrap   { display: none; }
        .txn-cards        { display: flex; flex-direction: column; gap: 10px; padding: 12px 0; }
        .txn-pagination   { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 540px) { .txn-toolbar-row1 { flex-direction: row; align-items: center; } }
        @media (min-width: 768px) {
          .txn-table-wrap { display: block; }
          .txn-cards      { display: none; }
          .txn-pagination { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <SlidersHorizontal size={15} style={{ color: "var(--color-text-muted)" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>Filter</span>
          </div>
          <div className="txn-toolbar-row1">
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input type="text" placeholder="Search..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
              />
            </div>
            <MiniDropdown options={["Type", "User", "Status"]} value={searchBy} onChange={setSearchBy} placeholder="Search By" />
          </div>
        </div>

        {/* Loading */}
        {listStatus === "loading" && list.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
            <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading transactions...</span>
          </div>
        )}

        {listStatus === "failed" && (
          <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
        )}

        {(listStatus === "succeeded" || listStatus === "loading" || listStatus === "idle") && (
          <>
            {/* Desktop table */}
            <div className="txn-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    {["Date", "Type", "User ID", "Amount", "Status", "Ref", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No transactions found.</td></tr>
                  ) : paginated.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{new Date(t.createdAt).toLocaleDateString("en-GB")}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)" }}>{t.type}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.userId ?? "—"}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)" }}>₦{Number(t.amount).toLocaleString()}</td>
                      <td style={{ padding: "16px 20px" }}><StatusPill status={t.status} /></td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{t.reference ?? "—"}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <button onClick={() => dispatch(fetchTransactionById(t.id))}
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
            <div className="txn-cards" style={{ backgroundColor: "var(--color-background)", padding: "12px" }}>
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No transactions found.</p>
              ) : paginated.map((t) => (
                <div key={t.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}
                  onClick={() => dispatch(fetchTransactionById(t.id))}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "8px" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "2px" }}>{t.type}</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.userId ?? "—"}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>₦{Number(t.amount).toLocaleString()}</p>
                      <StatusPill status={t.status} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{new Date(t.createdAt).toLocaleDateString("en-GB")}</span>
                    {t.reference && <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Ref: {t.reference}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {(listStatus === "succeeded" || listStatus === "loading" || listStatus === "idle") && (
          <div className="txn-pagination" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
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
        )}
      </div>
    </>
  );
}