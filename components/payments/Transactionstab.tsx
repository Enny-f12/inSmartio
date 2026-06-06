"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchTransactions } from "@/lib/redux/paymentSlice";

const PAGE_SIZE = 10;

const fmt = (iso: string) => {
  try { return new Date(iso).toLocaleDateString("en-GB"); } catch { return iso; }
};

const truncateRef = (ref: string) => {
  if (!ref || ref === "—") return ref;
  const parts = ref.split("_");
  return parts.slice(0, 3).join("_");
};

const MOCK_TRANSACTIONS = [
  { id: "m1", createdAt: "2026-03-15T00:00:00Z", resourceType: "Escrow In",  userId: "Funke A.",   amount: 18500,  status: "Held",     reference: "INV" },
  { id: "m2", createdAt: "2026-03-18T00:00:00Z", resourceType: "Escrow Out", userId: "Adebayo S.", amount: 16650,  status: "Released", reference: "PAY" },
  { id: "m3", createdAt: "2026-03-20T00:00:00Z", resourceType: "Commission", userId: "Platform",   amount: 1850,   status: "Revenue",  reference: "—"   },
  { id: "m4", createdAt: "2026-03-22T00:00:00Z", resourceType: "TAS Payout", userId: "Chidi E.",   amount: 245000, status: "Paid",     reference: "TAS" },
];

function StatusPill({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase();
  let style = { color: "#6B7280", background: "#F9FAFB", border: "1px solid #E5E7EB" };
  if (["paid", "success", "completed", "released", "revenue"].includes(s))
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

export default function TransactionsTab() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listMeta } = useAppSelector((s) => s.payments);

  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [amountMin,    setAmountMin]    = useState("");
  const [amountMax,    setAmountMax]    = useState("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [page,         setPage]         = useState(1);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchTransactions());
  }, [dispatch, listStatus]);

  const isLoading = listStatus === "idle" || listStatus === "loading";
  const data = listStatus === "succeeded" && list.length > 0 ? list : MOCK_TRANSACTIONS;

  const hasFilters = !!(search || amountMin || amountMax || dateFrom || dateTo || typeFilter || statusFilter);

  const clear = () => {
    setSearch(""); setTypeFilter(""); setStatusFilter("");
    setAmountMin(""); setAmountMax(""); setDateFrom(""); setDateTo(""); setPage(1);
  };

  const filtered = data.filter((t) => {
    const rec = t as Record<string, unknown>;
    if (search) {
      const q    = search.toLowerCase();
      const user = String(rec.userId      ?? "").toLowerCase();
      const ref  = String(rec.reference   ?? "").toLowerCase();
      const type = String(rec.resourceType ?? "").toLowerCase();
      if (!user.includes(q) && !ref.includes(q) && !type.includes(q) && !t.id?.toLowerCase().includes(q)) return false;
    }
    if (typeFilter   && !String(rec.resourceType ?? "").toLowerCase().includes(typeFilter)) return false;
    if (statusFilter && String(rec.status ?? "").toLowerCase() !== statusFilter)            return false;
    if (amountMin && Number(t.amount) < Number(amountMin)) return false;
    if (amountMax && Number(t.amount) > Number(amountMax)) return false;
    if (dateFrom && new Date(t.createdAt) < new Date(dateFrom))               return false;
    if (dateTo   && new Date(t.createdAt) > new Date(dateTo + "T23:59:59"))   return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <style>{`
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

        {/* ── Toolbar ── */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <SlidersHorizontal size={14} style={{ color: "var(--color-text-muted)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)" }}>Filter Transactions</span>
            </div>
            {hasFilters && (
              <button onClick={clear}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}>
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          {/* Row 1: User search + Type + Status */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>

            {/* Search */}
            <div style={{ position: "relative", flex: "2 1 200px", minWidth: "160px" }}>
              <Search size={14} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search user, type, reference…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{
                  width: "100%", paddingLeft: "38px", paddingRight: "14px",
                  paddingTop: "9px", paddingBottom: "9px",
                  borderRadius: "10px", fontSize: "13px", outline: "none",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text-main)", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Type dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              style={{
                flex: "1 1 130px", minWidth: "120px",
                padding: "9px 12px", borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-main)",
                fontSize: "13px", outline: "none", cursor: "pointer",
              }}>
              <option value="">All Types</option>
              <option value="escrow in">Escrow In</option>
              <option value="escrow out">Escrow Out</option>
              <option value="commission">Commission</option>
              <option value="tas payout">TAS Payout</option>
            </select>

            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{
                flex: "1 1 130px", minWidth: "120px",
                padding: "9px 12px", borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-main)",
                fontSize: "13px", outline: "none", cursor: "pointer",
              }}>
              <option value="">All Statuses</option>
              <option value="held">Held</option>
              <option value="released">Released</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>

          {/* Row 2: Amount + Date + Search/Reset buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>

            {/* Amount range */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "1 1 220px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>Amount:</span>
              <input type="number" placeholder="Min" value={amountMin}
                onChange={(e) => { setAmountMin(e.target.value); setPage(1); }}
                style={{ width: "80px", padding: "8px 10px", borderRadius: "10px", border: "1px solid var(--color-border)", fontSize: "13px", outline: "none", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }} />
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>to</span>
              <input type="number" placeholder="Max" value={amountMax}
                onChange={(e) => { setAmountMax(e.target.value); setPage(1); }}
                style={{ width: "80px", padding: "8px 10px", borderRadius: "10px", border: "1px solid var(--color-border)", fontSize: "13px", outline: "none", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }} />
            </div>

            {/* Date range */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "1 1 260px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>Date:</span>
              <input type="date" value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                style={{ flex: 1, minWidth: "110px", padding: "8px 10px", borderRadius: "10px", border: "1px solid var(--color-border)", fontSize: "13px", outline: "none", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }} />
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>to</span>
              <input type="date" value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                style={{ flex: 1, minWidth: "110px", padding: "8px 10px", borderRadius: "10px", border: "1px solid var(--color-border)", fontSize: "13px", outline: "none", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }} />
            </div>

            {/* Search + Reset buttons */}
            <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
              <button
                onClick={() => setPage(1)}
                style={{
                  padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                  border: "none", backgroundColor: "#16a34a", color: "#fff",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                  whiteSpace: "nowrap",
                }}>
                <Search size={13} /> Search
              </button>
              {hasFilters && (
                <button onClick={clear}
                  style={{
                    padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
                    border: "1px solid var(--color-border)", backgroundColor: "#fff",
                    color: "var(--color-text-muted)", cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Loading / Error ── */}
        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
            <Loader2 size={18} className="animate-spin" />
            <span style={{ fontSize: "13px" }}>Loading transactions...</span>
          </div>
        )}
        {listStatus === "failed" && (
          <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>Failed to load transactions.</p>
        )}

        {!isLoading && (
          <>
            {/* ── Desktop table ── */}
            <div className="txn-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    {["Date", "Type", "User", "Amount", "Status", "Ref"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No transactions found.</td></tr>
                  ) : paginated.map((t) => {
                    const rec = t as Record<string, unknown>;
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "15px 20px", fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{fmt(t.createdAt)}</td>
                        <td style={{ padding: "15px 20px", fontSize: "13px", color: "var(--color-text-main)", textTransform: "capitalize" }}>{String(rec.resourceType ?? "—")}</td>
                        <td style={{ padding: "15px 20px", fontSize: "13px", color: "var(--color-text-main)", fontWeight: 500 }}>{String(rec.userId ?? "—")}</td>
                        <td style={{ padding: "15px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", whiteSpace: "nowrap" }}>₦{Number(t.amount).toLocaleString()}</td>
                        <td style={{ padding: "15px 20px" }}><StatusPill status={String(rec.status ?? "—")} /></td>
                        <td style={{ padding: "15px 20px", fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                          {truncateRef(String(rec.reference ?? "—"))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="txn-cards" style={{ backgroundColor: "var(--color-background)" }}>
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No transactions found.</p>
              ) : paginated.map((t) => {
                const rec = t as Record<string, unknown>;
                return (
                  <div key={t.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "2px" }}>{String(rec.userId ?? "—")}</p>
                        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{String(rec.resourceType ?? "—")}</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>₦{Number(t.amount).toLocaleString()}</p>
                        <StatusPill status={String(rec.status ?? "—")} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{fmt(t.createdAt)}</span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                        Ref: {truncateRef(String(rec.reference ?? "—"))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Pagination ── */}
        {!isLoading && (
          <div className="txn-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
              {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${listMeta?.total || filtered.length} results`}
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