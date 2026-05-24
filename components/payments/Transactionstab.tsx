// components/payments/Transactionstab.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchTransactions } from "@/lib/redux/paymentSlice";

const PAGE_SIZE = 10;

const fmt = (iso: string) => {
  try { return new Date(iso).toLocaleDateString("en-GB"); } catch { return iso; }
};

const truncate = (str: string, n = 14) =>
  str && str.length > n ? str.slice(0, n) + "…" : (str || "—");

function StatusPill({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase();
  let style = { color: "#6B7280", background: "#F9FAFB", border: "1px solid #E5E7EB" };
  if (["paid", "success", "completed", "released"].includes(s))
    style = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
  else if (["pending", "holding", "held"].includes(s))
    style = { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" };
  else if (["failed", "rejected", "disputed"].includes(s))
    style = { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  else if (s === "refunded")
    style = { color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe" };
  return (
    <span style={{ ...style, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function AmountInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input type="number" min={0} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "8px 28px 8px 12px", borderRadius: "12px", fontSize: "13px", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-main)", outline: "none", width: "110px" }}
      />
      <ChevronDown size={12} style={{ position: "absolute", right: "10px", color: "var(--color-text-muted)", pointerEvents: "none" }} />
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: "8px 28px 8px 12px", borderRadius: "12px", fontSize: "13px", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-main)", outline: "none", width: "140px" }}
      />
      <ChevronDown size={12} style={{ position: "absolute", right: "10px", color: "var(--color-text-muted)", pointerEvents: "none" }} />
    </div>
  );
}

export default function TransactionsTab() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listMeta } = useAppSelector((s) => s.payments);

  const [search,    setSearch]    = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchTransactions());
  }, [dispatch, listStatus]);

  const isLoading = listStatus === "idle" || listStatus === "loading";

  const filtered = list.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.userId?.toLowerCase().includes(q) &&
        !t.id?.toLowerCase().includes(q) &&
        !t.resourceType?.toLowerCase().includes(q) &&
        !t.reference?.toLowerCase().includes(q)
      ) return false;
    }
    if (amountMin && Number(t.amount) < Number(amountMin)) return false;
    if (amountMax && Number(t.amount) > Number(amountMax)) return false;
    if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(t.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from         = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to           = Math.min(page * PAGE_SIZE, filtered.length);
  const hasFilters   = search || amountMin || amountMax || dateFrom || dateTo;
  const clearFilters = () => { setSearch(""); setAmountMin(""); setAmountMax(""); setDateFrom(""); setDateTo(""); setPage(1); };

  return (
    <>
      <style>{`
        .txn-filters    { display: flex; flex-direction: column; gap: 10px; }
        .txn-filter-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .txn-table-wrap { display: none; }
        .txn-cards      { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .txn-pgn        { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 768px) {
          .txn-table-wrap { display: block; }
          .txn-cards      { display: none; }
          .txn-pgn        { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#fff", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <SlidersHorizontal size={15} style={{ color: "var(--color-text-muted)" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>Filter</span>
            {hasFilters && (
              <button onClick={clearFilters}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                <X size={12} /> Clear
              </button>
            )}
          </div>
          <div className="txn-filters">
            <div className="txn-filter-row">
              <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
                <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input type="text" placeholder="Search user..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
                />
              </div>
              <button style={{ padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", backgroundColor: "#2563eb", color: "#fff", cursor: "pointer" }}>
                Search By
              </button>
            </div>
            <div className="txn-filter-row">
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>Amount:</span>
              <AmountInput placeholder="enter min" value={amountMin} onChange={(v) => { setAmountMin(v); setPage(1); }} />
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>To</span>
              <AmountInput placeholder="enter max" value={amountMax} onChange={(v) => { setAmountMax(v); setPage(1); }} />
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap", marginLeft: "8px" }}>Date Range:</span>
              <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} />
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>To</span>
              <DateInput value={dateTo}   onChange={(v) => { setDateTo(v);   setPage(1); }} />
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
            <Loader2 size={18} className="animate-spin" />
            <span style={{ fontSize: "13px" }}>Loading transactions...</span>
          </div>
        )}

        {listStatus === "failed" && (
          <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>Failed to load transactions.</p>
        )}

        {!isLoading && listStatus === "succeeded" && (
          <>
            {/* Desktop table */}
            <div className="txn-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    {["Date", "ID", "Type", "Amount", "Status", "Reference"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No transactions found.</td></tr>
                  ) : paginated.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{fmt(t.createdAt)}</td>
                      <td style={{ padding: "16px 20px", fontSize: "12px", fontFamily: "monospace", color: "var(--color-text-muted)" }} title={t.id}>{truncate(t.id)}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-main)", textTransform: "capitalize" }}>{String(t.resourceType ?? "—")}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", whiteSpace: "nowrap" }}>₦{Number(t.amount).toLocaleString()}</td>
                      <td style={{ padding: "16px 20px" }}><StatusPill status={t.status} /></td>
                      <td style={{ padding: "16px 20px", fontSize: "12px", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{t.reference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="txn-cards" style={{ backgroundColor: "var(--color-background)" }}>
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No transactions found.</p>
              ) : paginated.map((t) => (
                <div key={t.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--color-text-muted)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.id}</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-main)", textTransform: "capitalize" }}>{String(t.resourceType ?? "—")}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>₦{Number(t.amount).toLocaleString()}</p>
                      <StatusPill status={t.status} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{fmt(t.createdAt)}</span>
                    {t.reference && <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>Ref: {String(t.reference)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!isLoading && (
          <div className="txn-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
              {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${listMeta.total || filtered.length} results`}
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
        )}

      </div>
    </>
  );
}