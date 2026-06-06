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
      {/* Expert header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">{dispute.expertName}</p>
            <p className="text-xs text-text-muted">{dispute.expertId}</p>
          </div>
        </div>
        {dispute.exceedsThreshold && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> HIGH
          </span>
        )}
      </div>

      {/* History */}
      <div className="px-5 py-3 space-y-1">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Cancellation History
        </p>
        {dispute.cancellationHistory.map((h, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/60 last:border-0">
            <span className="text-text-muted text-xs">{h.date}</span>
            <span className="font-medium">{h.jobId}</span>
            <span className="text-red-600 font-medium">{fmt(h.fee)}</span>
            <span className="text-text-muted text-xs">{h.reason}</span>
          </div>
        ))}
      </div>

      {/* Alert */}
      {dispute.exceedsThreshold && (
        <div className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700">
              Expert has received cancellation fees on {dispute.cancellationHistory.length} of last{" "}
              {dispute.totalSiteVisits} site visits
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {dispute.cancellationRate}% cancellation rate – exceeds threshold of 30%
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-4 flex flex-wrap gap-2">
        <p className="text-xs text-text-muted w-full">Recommended Action:</p>
        <button
          onClick={() => take("suspend")}
          disabled={actionLoading}
          className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
        >
          {actionLoading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Suspend Expert"}
        </button>
        <button
          onClick={() => take("investigate")}
          disabled={actionLoading}
          className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
        >
          Investigate
        </button>
        <button
          onClick={() => take("dismiss")}
          disabled={actionLoading}
          className="px-3 py-1.5 bg-gray-50 text-text-muted border border-border rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
        >
          Dismiss Alert
        </button>
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
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
            <User className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">{dispute.clientName}</p>
            <p className="text-xs text-text-muted">{dispute.clientId}</p>
          </div>
        </div>
        {dispute.exceedsThreshold && (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> MEDIUM
          </span>
        )}
      </div>

      <div className="px-5 py-3 space-y-1">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Rejection History
        </p>
        {dispute.cancellationHistory.map((h, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/60 last:border-0">
            <span className="text-text-muted text-xs">{h.date}</span>
            <span className="font-medium">{h.jobId}</span>
            <span className="text-red-600 font-medium">{fmt(h.fee)}</span>
            <span className="text-text-muted text-xs">{h.reason}</span>
          </div>
        ))}
      </div>

      {dispute.exceedsThreshold && (
        <div className="mx-5 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700">
              Client has rejected price increases on {dispute.cancellationHistory.length} of last{" "}
              {dispute.totalSiteVisits} site visits
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {dispute.rejectionRate}% rejection rate – exceeds threshold of 40%
            </p>
          </div>
        </div>
      )}

      <div className="px-5 pb-4 flex flex-wrap gap-2">
        <p className="text-xs text-text-muted w-full">Recommended Action:</p>
        <button
          onClick={() => take("flag")}
          disabled={actionLoading}
          className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
        >
          Flag Client
        </button>
        <button
          onClick={() => take("require_prepayment")}
          disabled={actionLoading}
          className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
        >
          Require Pre-payment
        </button>
        <button
          onClick={() => take("dismiss")}
          disabled={actionLoading}
          className="px-3 py-1.5 bg-gray-50 text-text-muted border border-border rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
        >
          Dismiss Alert
        </button>
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
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
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