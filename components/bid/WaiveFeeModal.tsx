"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { waiveFeeThunk, clearActionState } from "@/lib/redux/cancellationfeeSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";

const WAIVE_REASONS = [
  "Expert error – job description was inaccurate",
  "Client was cooperative but had valid reason",
  "System error",
  "Mutual agreement between parties",
];

interface Props {
  jobId: string;
  bidId: string;
  expertName: string;
  clientName: string;
  feeAmount: number;
  onClose: () => void;
}

export default function WaiveFeeModal({
  jobId,
  expertName,
  clientName,
  feeAmount,
  onClose,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading, actionSuccess, actionError } = useSelector(
    (s: RootState) => s.cancellationFees
  );

  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => { dispatch(clearActionState()); onClose(); }, 1500);
      return () => clearTimeout(t);
    }
  }, [actionSuccess, dispatch, onClose]);

  const effectiveReason = reason === "Other" ? otherReason : reason;

  const handleSubmit = () => {
    if (!effectiveReason || !note) return;
    dispatch(waiveFeeThunk({ jobId, reason: effectiveReason, note }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-main">
            Waive Cancellation Fee
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Job info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-text-muted">Job ID</p>
              <p className="font-medium">{jobId}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Current Fee</p>
              <p className="font-bold text-red-600">₦{feeAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Expert</p>
              <p className="font-medium">{expertName}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Client</p>
              <p className="font-medium">{clientName}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-sm font-medium text-text-main block mb-2">
              Reason for waiving fee <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {WAIVE_REASONS.map((r) => (
                <label key={r} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="waive_reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-sm text-text-main">{r}</span>
                </label>
              ))}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="waive_reason"
                  value="Other"
                  checked={reason === "Other"}
                  onChange={() => setReason("Other")}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-text-main">Other (specify):</span>
              </label>
              {reason === "Other" && (
                <input
                  type="text"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Specify reason..."
                  className="ml-6 w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-text-main block mb-2">
              Note (required) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide additional context for this waiver..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Impact warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 space-y-1">
                <p className="font-semibold">This action will:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Cancel the cancellation fee of ₦{feeAmount.toLocaleString()}</li>
                  <li>Refund the full escrow amount (₦{feeAmount.toLocaleString()}) to client</li>
                  <li>Expert will receive no cancellation fee</li>
                  <li>Both parties will be notified</li>
                  <li>Action will be logged in audit trail</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {actionSuccess && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{actionError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={actionLoading || !effectiveReason || !note}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Waiver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}