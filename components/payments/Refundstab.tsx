"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function RefundsTab() {
  const txnId   = "TXN-001";
  const origAmt = "₦50,000";

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 max-w-3xl">

      {/* Transaction meta — label + value inline */}
      <div className="text-[13px] mb-5 space-y-1">
        <p className="text-text-muted">
          Transaction ID:{" "}
          <span className="text-text-main font-medium">{txnId}</span>
        </p>
        <p className="text-text-muted">
          Original Amount:{" "}
          <span className="text-text-main font-medium">{origAmt}</span>
        </p>
      </div>

      {/* Refund Amount */}
      <div className="mb-4">
        <label className="block text-[13px] font-medium text-text-main mb-1.5">
          Refund Amount (₦):
        </label>
        <input
          type="text"
          placeholder="enter amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Reason */}
      <div className="mb-8">
        <label className="block text-[13px] font-medium text-text-main mb-1.5">
          Reason:
        </label>
        <textarea
          rows={4}
          placeholder="Enter refund reason...."
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Actions — Cancel outlined, Process Refund filled */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setAmount(""); setReason(""); }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors"
        >
          <X size={14} /> Cancel
        </button>
        <button className="btn-primary px-6 py-2.5 rounded-xl text-[13px]">
          Process Refund
        </button>
      </div>
    </div>
  );
}