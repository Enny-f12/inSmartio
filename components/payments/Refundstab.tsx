"use client";

import { useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { refundTransactionThunk } from "@/lib/redux/paymentSlice";

// ── Mock recent refunds for display ───────────────────────
const MOCK_REFUNDS = [
  { id: "TXN-001", originalAmount: 50000, refundAmount: 50000, reason: "Service not rendered",   status: "Completed", date: "20/03/2026" },
  { id: "TXN-002", originalAmount: 18500, refundAmount: 18500, reason: "Expert cancelled job",   status: "Completed", date: "18/03/2026" },
  { id: "TXN-003", originalAmount: 32000, refundAmount: 15000, reason: "Partial dispute resolution", status: "Pending", date: "22/03/2026" },
];

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    completed: { bg: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
    pending:   { bg: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" },
    failed:    { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
  };
  const c = styles[s] ?? { bg: "#F9FAFB", color: "#6B7280", border: "1px solid #E5E7EB" };
  return (
    <span style={{ ...c, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)",
  fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 500,
  color: "var(--color-text-main)", marginBottom: "6px",
};

export default function RefundsTab() {
  const dispatch  = useAppDispatch();
  const { mutateStatus } = useAppSelector((s) => s.payments);

  const [txnId,         setTxnId]         = useState("");
  const [refundAmount,  setRefundAmount]   = useState("");
  const [reason,        setReason]         = useState("");
  const [search,        setSearch]         = useState("");
  const [originalAmount, setOriginalAmount] = useState<number | null>(null);

  const isLoading = mutateStatus === "loading";

  // Simulate looking up a transaction
  const handleLookup = () => {
    if (!txnId.trim()) { toast.warning("Enter a Transaction ID"); return; }
    // TODO: fetch real transaction by ID to get original amount
    setOriginalAmount(50000); // mock
    toast.success("Transaction found");
  };

  const handleRefund = () => {
    if (!txnId.trim())          { toast.warning("Transaction ID is required"); return; }
    if (!refundAmount.trim())   { toast.warning("Refund amount is required"); return; }
    dispatch(refundTransactionThunk({
      id:      txnId.trim(),
      payload: reason.trim() ? { reason: reason.trim() } : undefined,
    }))
      .unwrap()
      .then(() => {
        toast.success("Refund processed successfully");
        setTxnId(""); setRefundAmount(""); setReason(""); setOriginalAmount(null);
      })
      .catch((err: string) => toast.error("Refund failed", { description: err }));
  };

  const handleCancel = () => {
    setTxnId(""); setRefundAmount(""); setReason(""); setOriginalAmount(null);
  };

  const filteredRefunds = MOCK_REFUNDS.filter((r) =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Process Refund card (spec 10.4) ── */}
      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>Process Refund</p>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Transaction ID lookup */}
          <div>
            <label style={lbl}>Transaction ID *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="e.g. TXN-001" value={txnId}
                onChange={(e) => { setTxnId(e.target.value); setOriginalAmount(null); }} />
              <button onClick={handleLookup}
                style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", cursor: "pointer", whiteSpace: "nowrap" }}>
                Look up
              </button>
            </div>
          </div>

          {/* Original Amount — shown after lookup */}
          {originalAmount !== null && (
            <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)", fontSize: "13px" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Original Amount: </span>
              <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>₦{originalAmount.toLocaleString()}</span>
            </div>
          )}

          {/* Refund Amount */}
          <div>
            <label style={lbl}>Refund Amount (₦) *</label>
            <input style={inp} type="number" min={0} placeholder="e.g. 50000" value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)} />
            {originalAmount !== null && refundAmount && Number(refundAmount) > originalAmount && (
              <p style={{ fontSize: "12px", color: "#dc2626", marginTop: 4 }}>Cannot exceed original amount of ₦{originalAmount.toLocaleString()}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label style={lbl}>
              Reason <span style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "12px" }}>(optional)</span>
            </label>
            <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={3}
              placeholder="Enter refund reason..." value={reason}
              onChange={(e) => setReason(e.target.value)} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleCancel}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
              <X size={14} /> Cancel
            </button>
            <button onClick={handleRefund} disabled={isLoading} className="btn-primary"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, border: "none", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : "Process Refund"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent Refunds table ── */}
      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#fff", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>Recent Refunds</p>
          <div style={{ position: "relative", minWidth: 180 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, borderRadius: 9, border: "1px solid var(--color-border)", fontSize: "13px", outline: "none", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                {["Transaction ID", "Original Amount", "Refund Amount", "Reason", "Status", "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, fontSize: 13, color: "var(--color-text-muted)" }}>No refunds found.</td></tr>
              ) : filteredRefunds.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "14px 20px", fontSize: 13, fontFamily: "monospace", color: "var(--color-text-main)", fontWeight: 600 }}>{r.id}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--color-text-muted)" }}>₦{r.originalAmount.toLocaleString()}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: "var(--color-text-main)" }}>₦{r.refundAmount.toLocaleString()}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--color-text-muted)", maxWidth: 200 }}>{r.reason}</td>
                  <td style={{ padding: "14px 20px" }}><StatusPill status={r.status} /></td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}