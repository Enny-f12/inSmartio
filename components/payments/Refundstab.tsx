"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { refundTransactionThunk } from "@/lib/redux/paymentSlice";

// ── Mock recent refunds for display ───────────────────────


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
  const []         = useState("");
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

      
    </div>
  );
}