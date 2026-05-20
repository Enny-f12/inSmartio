// components/payments/Refundstab.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function RefundsTab() {
  const txnId   = "TXN-001";
  const origAmt = "₦50,000";

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    /* Sections directly layout separated and securely bound with custom parameters */
    <div className="max-w-5xl" style={{ padding: "20px", borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>

      {/* Transaction meta */}
      <div className="text-[13px] mb-5 space-y-1">
        <p className="text-text-muted">
          Transaction ID:{" "}
          <span className="font-medium text-text-main">{txnId}</span>
        </p>
        <p className="text-text-muted">
          Original Amount:{" "}
          <span className="font-medium text-text-main">{origAmt}</span>
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border bg-background p-6 space-y-4 mb-5">
        {/* Refund Amount */}
        <div>
          <label className="block text-[13px] font-medium text-text-main mb-1.5">
            Refund Amount (₦):
          </label>
          <input
            type="text"
            placeholder="enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[13px] outline-none border border-border bg-surface text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-[13px] font-medium text-text-main mb-1.5">
            Reason:
          </label>
          <textarea
            rows={4}
            placeholder="Enter refund reason...."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none border border-border bg-surface text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Actions — equal width, side by side */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setAmount(""); setReason(""); }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors"
        >
          <X size={14} /> Cancel
        </button>
        <button className="flex-1 btn-primary py-2.5 rounded-xl text-[13px] font-semibold">
          Process Refund
        </button>
      </div>
    </div>
  );
}