// components/payments/Refundstab.tsx
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { refundTransactionThunk } from "@/lib/redux/paymentSlice";

export default function RefundsTab() {
  const dispatch = useAppDispatch();
  const { mutateStatus } = useAppSelector((s) => s.payments);

  const [txnId,  setTxnId]  = useState("");
  const [reason, setReason] = useState("");
  const isLoading = mutateStatus === "loading";

  const handleRefund = () => {
    if (!txnId.trim()) { toast.warning("Transaction ID is required"); return; }
    dispatch(refundTransactionThunk({
      id: txnId.trim(),
      payload: reason.trim() ? { reason: reason.trim() } : undefined,
    }))
      .unwrap()
      .then(() => { toast.success("Refund processed successfully"); setTxnId(""); setReason(""); })
      .catch((err: string) => toast.error("Refund failed", { description: err }));
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)",
    fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "6px",
  };

  return (
    <div style={{ maxWidth: "520px", padding: "20px", borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>
      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "16px" }}>Process Refund</p>

      <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", padding: "16px", display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>
        <div>
          <label style={lbl}>Transaction ID *</label>
          <input style={inp} placeholder="e.g. txn_abc123" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Find the ID from the Transactions tab
          </p>
        </div>
        <div>
          <label style={lbl}>Reason <span style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "12px" }}>(optional)</span></label>
          <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={4}
            placeholder="Enter refund reason..." value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={() => { setTxnId(""); setReason(""); }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
          <X size={14} /> Cancel
        </button>
        <button onClick={handleRefund} disabled={isLoading} className="btn-primary"
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : "Process Refund"}
        </button>
      </div>
    </div>
  );
}