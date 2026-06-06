"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Image, Video, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import {
  fetchCancellationFeeDetail,
  confirmFeeThunk,
  adjustFeeThunk,
  clearSelectedFee,
  clearActionState,
} from "@/lib/redux/cancellationfeeSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₦${n.toLocaleString()}`;

interface Props {
  jobId: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CancellationFeeDetailModal({ jobId, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const { selectedFee: fee, detailLoading, actionLoading, actionSuccess, actionError } =
    useSelector((s: RootState) => s.cancellationFees);

  const [verifyMode, setVerifyMode] = useState<"correct" | "adjust" | null>(null);
  const [adjustedAmount, setAdjustedAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  useEffect(() => {
    dispatch(fetchCancellationFeeDetail(jobId));
    return () => { dispatch(clearSelectedFee()); };
  }, [jobId, dispatch]);

  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => { dispatch(clearActionState()); onClose(); }, 1500);
      return () => clearTimeout(t);
    }
  }, [actionSuccess, dispatch, onClose]);

  const handleConfirm = () => dispatch(confirmFeeThunk(jobId));
  const handleAdjust = () => {
    if (!adjustedAmount || !adjustReason) return;
    dispatch(adjustFeeThunk({ jobId, adjustedAmount: Number(adjustedAmount), reason: adjustReason }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-base font-semibold text-text-main">
            Cancellation Fee Details – {jobId}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {detailLoading || !fee ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Site Inspection Details */}
            <section>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                Site Inspection Details
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-sm text-text-main">
                  <span className="font-medium">Expert Notes:</span> {fee.siteInspectionNotes}
                </p>
                {fee.evidenceUrls.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-text-muted">Evidence:</span>
                    {fee.evidenceUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-white border border-border rounded-lg text-xs text-primary hover:bg-blue-50 transition-colors"
                      >
                        {url.includes("video") ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <Image className="w-3 h-3" />
                        )}
                        View {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Fee Calculation */}
            <section>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                Cancellation Fee Calculation
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Original Job Value</span>
                  <span className="font-medium">{fmt(fee.originalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">
                    25% Calculation ({fmt(fee.originalAmount)} × 25%)
                  </span>
                  <span className="font-medium">
                    {fmt(Math.round(fee.originalAmount * 0.25))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Fee Cap Applied (Maximum ₦10,000)</span>
                  <span className="font-medium text-amber-600">Cap applied</span>
                </div>
                <div className="border-t border-red-200 pt-2 mt-1 flex justify-between">
                  <span className="font-semibold text-red-700">Final Cancellation Fee</span>
                  <span className="font-bold text-red-700 text-base">{fmt(fee.feeApplied)}</span>
                </div>

                {fee.adminAdjustedAmount && (
                  <div className="flex justify-between border-t border-red-200 pt-2 text-blue-700">
                    <span className="font-medium">Admin Adjusted Fee</span>
                    <span className="font-bold">{fmt(fee.adminAdjustedAmount)}</span>
                  </div>
                )}

                <div className="border-t border-red-200 pt-2 space-y-1 mt-1">
                  <div className="flex justify-between text-green-700">
                    <span>Client Refund</span>
                    <span className="font-medium">{fmt(fee.originalAmount - fee.feeApplied)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>Expert Payout</span>
                    <span className="font-medium">{fmt(fee.feeApplied)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Admin Verification */}
            <section>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                Admin Verification
              </h3>
              <div className="border border-border rounded-xl p-4 space-y-4">
                {fee.adminVerified ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Fee verified by admin</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text-main">
                      Is the cancellation fee calculation correct?
                    </p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="verify"
                          checked={verifyMode === "correct"}
                          onChange={() => setVerifyMode("correct")}
                          className="accent-primary"
                        />
                        <span className="text-sm">Yes, fee is correct</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="verify"
                          checked={verifyMode === "adjust"}
                          onChange={() => setVerifyMode("adjust")}
                          className="accent-primary"
                        />
                        <span className="text-sm">No, needs adjustment</span>
                      </label>
                    </div>

                    {verifyMode === "adjust" && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-text-muted block mb-1">
                            Adjusted amount (₦)
                          </label>
                          <input
                            type="number"
                            value={adjustedAmount}
                            onChange={(e) => setAdjustedAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted block mb-1">
                            Reason for adjustment
                          </label>
                          <textarea
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="Explain why the fee is being adjusted..."
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Success / Error feedback */}
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
              </div>
            </section>

            {/* Action Buttons */}
            {!fee.adminVerified && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {verifyMode === "correct" && (
                  <button
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Fee
                  </button>
                )}
                {verifyMode === "adjust" && (
                  <button
                    onClick={handleAdjust}
                    disabled={actionLoading || !adjustedAmount || !adjustReason}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Adjust Fee
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}