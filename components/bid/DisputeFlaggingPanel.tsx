"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertTriangle, User, TrendingUp, Loader2 } from "lucide-react";
import { takeDisputeAction } from "@/lib/redux/cancellationfeeSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";

const fmt = (n: number) => `₦${n.toLocaleString()}`;

// ─── Expert Dispute Card ──────────────────────────────────────────────────────

function ExpertDisputeCard({
  dispute,
}: {
  dispute: RootState["cancellationFees"]["expertDisputes"][0];
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading } = useSelector((s: RootState) => s.cancellationFees);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const take = (action: "suspend" | "investigate" | "dismiss") => {
    dispatch(takeDisputeAction({ entityId: dispute.expertId, action }));
    if (action === "dismiss") setDismissed(true);
  };

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-main truncate">{dispute.expertName}</p>
            <p className="text-xs text-text-muted truncate">{dispute.expertId}</p>
          </div>
        </div>
        {dispute.exceedsThreshold && (
          <span className="shrink-0 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1 ml-2">
            <AlertTriangle className="w-3 h-3" />
            <span className="hidden sm:inline">HIGH</span>
          </span>
        )}
      </div>

      {/* History — scrollable on mobile */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Cancellation History
        </p>
        <div className="space-y-1">
          {dispute.cancellationHistory.map((h, i) => (
            <div
              key={i}
              className="grid grid-cols-2 sm:grid-cols-4 gap-1 py-1.5 border-b border-border/60 last:border-0 text-xs"
            >
              <span className="text-text-muted">{h.date}</span>
              <span className="font-medium">{h.jobId}</span>
              <span className="text-red-600 font-medium">{fmt(h.fee)}</span>
              <span className="text-text-muted col-span-2 sm:col-span-1 truncate">{h.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert banner */}
      {dispute.exceedsThreshold && (
        <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700">
              Expert received cancellation fees on {dispute.cancellationHistory.length} of last{" "}
              {dispute.totalSiteVisits} site visits
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {dispute.cancellationRate}% cancellation rate — exceeds threshold of 30%
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        <p className="text-xs text-text-muted">Recommended Action:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => take("suspend")}
            disabled={actionLoading}
            className="flex-1 sm:flex-none px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Suspend Expert
          </button>
          <button
            onClick={() => take("investigate")}
            disabled={actionLoading}
            className="flex-1 sm:flex-none px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            Investigate
          </button>
          <button
            onClick={() => take("dismiss")}
            disabled={actionLoading}
            className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 text-text-muted border border-border rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Dismiss Alert
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Client Dispute Card ──────────────────────────────────────────────────────

function ClientDisputeCard({
  dispute,
}: {
  dispute: RootState["cancellationFees"]["clientDisputes"][0];
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading } = useSelector((s: RootState) => s.cancellationFees);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const take = (action: "flag" | "require_prepayment" | "dismiss") => {
    dispatch(takeDisputeAction({ entityId: dispute.clientId, action }));
    if (action === "dismiss") setDismissed(true);
  };

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-main truncate">{dispute.clientName}</p>
            <p className="text-xs text-text-muted truncate">{dispute.clientId}</p>
          </div>
        </div>
        {dispute.exceedsThreshold && (
          <span className="shrink-0 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1 ml-2">
            <AlertTriangle className="w-3 h-3" />
            <span className="hidden sm:inline">MEDIUM</span>
          </span>
        )}
      </div>

      {/* History */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Rejection History
        </p>
        <div className="space-y-1">
          {dispute.cancellationHistory.map((h, i) => (
            <div
              key={i}
              className="grid grid-cols-2 sm:grid-cols-4 gap-1 py-1.5 border-b border-border/60 last:border-0 text-xs"
            >
              <span className="text-text-muted">{h.date}</span>
              <span className="font-medium">{h.jobId}</span>
              <span className="text-red-600 font-medium">{fmt(h.fee)}</span>
              <span className="text-text-muted col-span-2 sm:col-span-1 truncate">{h.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert banner */}
      {dispute.exceedsThreshold && (
        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700">
              Client rejected price increases on {dispute.cancellationHistory.length} of last{" "}
              {dispute.totalSiteVisits} site visits
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {dispute.rejectionRate}% rejection rate — exceeds threshold of 40%
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        <p className="text-xs text-text-muted">Recommended Action:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => take("flag")}
            disabled={actionLoading}
            className="flex-1 sm:flex-none px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Flag Client
          </button>
          <button
            onClick={() => take("require_prepayment")}
            disabled={actionLoading}
            className="flex-1 sm:flex-none px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            Require Pre-payment
          </button>
          <button
            onClick={() => take("dismiss")}
            disabled={actionLoading}
            className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 text-text-muted border border-border rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Dismiss Alert
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function DisputeFlaggingPanel() {
  const { expertDisputes, clientDisputes, disputesLoading } = useSelector(
    (s: RootState) => s.cancellationFees
  );

  if (disputesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasDisputes = expertDisputes.length > 0 || clientDisputes.length > 0;

  return (
    <div className="space-y-5">
      {!hasDisputes && (
        <div className="bg-surface rounded-xl border border-border p-10 text-center">
          <TrendingUp className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-text-muted text-sm">No excessive cancellation patterns detected</p>
        </div>
      )}

      {expertDisputes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-main mb-3">
            Expert Patterns ({expertDisputes.length})
          </h3>
          <div className="space-y-4">
            {expertDisputes.map((d) => (
              <ExpertDisputeCard key={d.expertId} dispute={d} />
            ))}
          </div>
        </div>
      )}

      {clientDisputes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-main mb-3">
            Client Patterns ({clientDisputes.length})
          </h3>
          <div className="space-y-4">
            {clientDisputes.map((d) => (
              <ClientDisputeCard key={d.clientId} dispute={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}