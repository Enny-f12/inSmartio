"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  MapPin,
  User,
  Phone,
  Star,
  ChevronRight,
  FileText,
  Flag,
  Bell,
  Loader2,
} from "lucide-react";
import { fetchBidDetail, clearSelectedBid } from "@/lib/redux/bidSlice";
import { fetchNotificationLog } from "@/lib/redux/cancellationfeeSlice";
import WaiveFeeModal from "@/components/bid/WaiveFeeModal";
import CancellationFeeDetailModal from "@/components/bid/CancellationFeeDetailModal";
import NotificationLogPanel from "@/components/bid/NotificationLogPanel";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { BidStep } from "@/components/bid/types";
import Topbar from "@/components/layout/Navbar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(0)}k`
    : `₦${n.toLocaleString()}`;

// ─── Steps — exactly 7 nodes matching spec ────────────────────────────────────

const STEPS: { sub: string }[] = [
  { sub: "Posted"   },
  { sub: "Bids"     },
  { sub: "Selected" },
  { sub: "Response" },
  { sub: "Decision" },
  { sub: "Confirm"  },
  { sub: "Site"     },
];

function stepIndex(step: BidStep): number {
  if (step === "site") return 6;
  const n = Number(step);
  return isNaN(n) ? 0 : Math.min(n - 1, 6);
}

// ─── Process Timeline ─────────────────────────────────────────────────────────

function ProcessTimeline({ currentStep }: { currentStep: BidStep }) {
  const current = stepIndex(currentStep);

  return (
    <div className="bg-surface rounded-xl border border-border p-4 md:p-5">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
        Process Timeline
      </p>

      {/* Desktop — 7 nodes */}
      <div className="hidden sm:flex items-start">
        {STEPS.map((s, i) => {
          const done   = i < current;
          const active = i === current;
          const isLast = i === STEPS.length - 1;
          return (
            <React.Fragment key={s.sub}>
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${done   ? "bg-primary border-primary text-white"
                  : active ? "bg-primary/10 border-primary text-primary"
                           : "bg-gray-100 border-gray-200 text-gray-400"}`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] text-center font-medium leading-tight
                  ${active ? "text-primary" : done ? "text-text-muted" : "text-gray-300"}`}>
                  {s.sub}
                </span>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 mt-4 mx-0.5 rounded-full transition-all
                  ${i < current ? "bg-primary" : "bg-gray-200"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile — progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-main">
            Step {current + 1} of 7
          </span>
          <span className="text-xs text-text-muted">{STEPS[current]?.sub}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((current + 1) / 7) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-text-muted">Posted</span>
          <span className="text-[10px] text-text-muted">Site</span>
        </div>
      </div>

      {/* Site arrival banner */}
      {currentStep === "site" && (
        <div className="mt-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs font-medium text-primary">SITE ARRIVAL: Complete</p>
        </div>
      )}
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-text-main text-right">{value}</span>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children, action }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-text-main">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BidDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const params   = useParams();
  const bidId    = params?.bidId as string;

  const { selectedBid: bid, detailLoading, detailError } = useSelector(
    (s: RootState) => s.bids
  );

  const [activeTab,     setActiveTab]     = useState<"overview" | "notifications">("overview");
  const [showWaive,     setShowWaive]     = useState(false);
  const [showFeeDetail, setShowFeeDetail] = useState(false);
  const [showActions,   setShowActions]   = useState(false);

  useEffect(() => {
    if (bidId) {
      dispatch(fetchBidDetail(bidId));
      dispatch(fetchNotificationLog(bidId));
    }
    return () => { dispatch(clearSelectedBid()); };
  }, [bidId, dispatch]);

  // ── Loading ──────────────────────────────────────────────
  if (detailLoading || !bid) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="Bid Details" />
        <div className="flex items-center justify-center flex-1 gap-2 text-text-muted p-10">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading bid...</span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (detailError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="Bid Details" />
        <div className="flex items-center justify-center flex-1 p-10">
          <div className="text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-text-muted mb-4">{detailError}</p>
            <button onClick={() => router.back()} className="btn-primary text-sm">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const site        = bid.siteArrivalDetails;
  const isCancelled = bid.status === "cancelled_fee_applied";
  const isB2        = site?.situation === "B2";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="Bid Details" />

      <div className="flex-1 overflow-y-auto bg-background p-4 md:p-6 space-y-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/bid")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-text-main leading-tight">
                Bid #{bid.id}
              </h1>
              <p className="text-xs text-text-muted mt-0.5">Job: {bid.jobId}</p>
            </div>
          </div>

          {/* Actions dropdown */}
          <div className="relative shrink-0">
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              onClick={() => setShowActions((v) => !v)}
            >
              Actions
              <ChevronRight className={`w-4 h-4 transition-transform ${showActions ? "rotate-90" : ""}`} />
            </button>
            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg z-20 min-w-[210px] py-1 overflow-hidden">

                {/* ── Base actions — always shown for all steps ── */}
                <button
                  onClick={() => { setShowFeeDetail(true); setShowActions(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-text-main hover:bg-gray-50 transition-colors"
                >
                  View Cancellation Policy
                </button>

                <button
                  className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  onClick={() => setShowActions(false)}
                >
                  <Flag className="w-3 h-3" /> Flag Bid
                </button>

                <button
                  className="w-full text-left px-4 py-2.5 text-xs text-text-main hover:bg-gray-50 transition-colors"
                  onClick={() => setShowActions(false)}
                >
                  Add Note
                </button>

                <button
                  onClick={() => { setActiveTab("notifications"); setShowActions(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-text-main hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Bell className="w-3 h-3" /> Notification Log
                </button>

                {/* ── Site step actions — only when on site ── */}
                {bid.step === "site" && (
                  <>
                    <div className="border-t border-border my-1" />
                    <p className="px-4 py-1 text-[10px] text-text-muted uppercase tracking-wide font-medium">
                      Site Actions
                    </p>
                    <button
                      onClick={() => { setShowFeeDetail(true); setShowActions(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs text-text-main hover:bg-gray-50 transition-colors"
                    >
                      Review Fee Calculation
                    </button>
                    {isCancelled && (
                      <button
                        onClick={() => { setShowWaive(true); setShowActions(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        Waive Cancellation Fee
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-surface shadow text-text-main"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "notifications"
                ? "bg-surface shadow text-text-main"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notification Log
          </button>
        </div>

        {/* ── Notification Log Tab ── */}
        {activeTab === "notifications" ? (
          <NotificationLogPanel bidId={bid.id} />
        ) : (
          <>
            {/* ── Process Timeline ── */}
            <ProcessTimeline currentStep={bid.step} />

            {/* ── B2 Alert Banner ── */}
            {isB2 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Situation B2 – Client rejected price increase
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Cancellation Fee Applied:{" "}
                    <strong>{fmt(site?.cancellationFee?.finalFee ?? 0)}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* ── Bid Information ── */}
            <SectionCard
              icon={<FileText className="w-4 h-4 text-text-muted" />}
              title="Bid Information"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <InfoRow label="Bid ID"       value={<span className="font-mono text-[10px]">{bid.id}</span>} />
                  <InfoRow label="Job ID"       value={bid.jobId} />
                  <InfoRow label="Original Bid" value={<span className="font-bold">{fmt(bid.originalBid)}</span>} />
                  {bid.requestedIncrease && (
                    <InfoRow
                      label="Requested Increase"
                      value={<span className="text-amber-600 font-semibold">{fmt(bid.requestedIncrease)} ({bid.requestedIncreasePercent}%)</span>}
                    />
                  )}
                  {bid.finalAmount && (
                    <InfoRow label="Final Amount" value={<span className="text-green-600 font-bold">{fmt(bid.finalAmount)}</span>} />
                  )}
                </div>
                <div>
                  <InfoRow
                    label="Status"
                    value={
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 capitalize">
                        {bid.status.replace(/_/g, " ")}
                      </span>
                    }
                  />
                  <InfoRow label="Created" value={new Date(bid.createdAt).toLocaleString()} />
                  {bid.step4ResponseAt && (
                    <InfoRow label="Step 4 Response" value={new Date(bid.step4ResponseAt).toLocaleString()} />
                  )}
                  {bid.step5DecisionAt && (
                    <InfoRow label="Step 5 Decision" value={new Date(bid.step5DecisionAt).toLocaleString()} />
                  )}
                  {bid.siteArrivalAt && (
                    <InfoRow
                      label="Site Arrival"
                      value={
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary" />
                          {new Date(bid.siteArrivalAt).toLocaleString()}
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            </SectionCard>

            {/* ── Expert + Client ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard icon={<User className="w-4 h-4 text-text-muted" />} title="Expert Information">
                <InfoRow label="Name"      value={bid.expert.name} />
                <InfoRow label="Expert ID" value={<span className="font-mono text-[10px]">{bid.expert.id}</span>} />
                <InfoRow label="Phone"     value={<span className="flex items-center gap-1"><Phone className="w-3 h-3" />{bid.expert.phone}</span>} />
                <InfoRow label="Rating"    value={<span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{bid.expert.rating}</span>} />
                <InfoRow label="Verification Tier" value={bid.expert.verificationTier} />
                <InfoRow
                  label="Cancellation Fees Received"
                  value={
                    <span className={bid.expert.cancellationFeesReceived > 0 ? "text-red-600 font-semibold" : ""}>
                      {fmt(bid.expert.cancellationFeesReceived)}
                    </span>
                  }
                />
              </SectionCard>

              <SectionCard icon={<User className="w-4 h-4 text-text-muted" />} title="Client Information">
                <InfoRow label="Name"      value={bid.client.name} />
                <InfoRow label="Client ID" value={<span className="font-mono text-[10px]">{bid.client.id}</span>} />
                <InfoRow label="Phone"     value={<span className="flex items-center gap-1"><Phone className="w-3 h-3" />{bid.client.phone}</span>} />
                <InfoRow label="Verification Tier" value={bid.client.verificationTier} />
                <InfoRow label="Jobs Completed" value={bid.client.jobsCompleted} />
                <InfoRow
                  label="Cancellation Fees Paid"
                  value={
                    <span className={bid.client.cancellationFeesPaid > 0 ? "text-red-600 font-semibold" : ""}>
                      {fmt(bid.client.cancellationFeesPaid)}
                    </span>
                  }
                />
              </SectionCard>
            </div>

            {/* ── Site Arrival & Cancellation Details ── */}
            {site && (
              <SectionCard
                icon={<MapPin className="w-4 h-4 text-primary" />}
                title="Site Arrival & Cancellation Details"
                
              >
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-2">
                  Per Cancellation Fee Policy
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <InfoRow label="Site Arrival Time"    value={new Date(site.arrivalTime).toLocaleString()} />
                    <InfoRow label="Inspection Completed" value={new Date(site.inspectionCompletedAt).toLocaleString()} />
                    <InfoRow label="Expert's Assessment"  value={site.expertAssessment} />
                    <InfoRow
                      label="Proposed New Price"
                      value={<span className="text-amber-600 font-semibold">{fmt(site.proposedNewPrice)} (+{site.proposedIncreasePercent}%)</span>}
                    />
                    <InfoRow
                      label="Client Response"
                      value={
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                          ${site.clientResponse === "rejected" ? "bg-red-100 text-red-700"
                          : site.clientResponse === "accepted" ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"}`}>
                          {site.clientResponse === "rejected"
                            ? `REJECTED at ${site.clientResponseAt ? new Date(site.clientResponseAt).toLocaleString() : ""}`
                            : site.clientResponse}
                        </span>
                      }
                    />
                  </div>

                  {site.cancellationFee && (
                    <div className="mt-4 md:mt-0">
                      <div className="bg-gray-50 border border-border rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">
                          Cancellation Fee Calculation
                        </p>
                        <InfoRow label="Original Job Value" value={fmt(site.cancellationFee.originalJobValue)} />
                        <InfoRow
                          label="25% Calculation"
                          value={`${fmt(site.cancellationFee.originalJobValue)} × 25% = ${fmt(site.cancellationFee.calculatedAmount)}`}
                        />
                        <InfoRow label="Maximum Fee Cap" value={fmt(site.cancellationFee.feeCap)} />
                        <div className="border-t border-border mt-1 pt-1">
                          <InfoRow
                            label="Final Cancellation Fee"
                            value={<span className="text-red-600 font-bold">{fmt(site.cancellationFee.finalFee)}</span>}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <InfoRow label="Fee Applied To" value={`Expert ${bid.expert.name}`} />
                        <InfoRow
                          label="Client Refund"
                          value={`${fmt(site.cancellationFee.clientRefund)} (original ${fmt(site.cancellationFee.originalJobValue)} − ${fmt(site.cancellationFee.finalFee)} fee)`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* ── Alerts & Flags ── */}
            {bid.flags.length > 0 && (
              <SectionCard icon={<Flag className="w-4 h-4 text-text-muted" />} title="Alerts & Flags">
                <div className="space-y-2">
                  {bid.flags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`flex items-start gap-3 p-3 rounded-lg
                        ${flag.priority === "HIGH"   ? "bg-red-50 border border-red-200"
                        : flag.priority === "MEDIUM" ? "bg-amber-50 border border-amber-200"
                                                     : "bg-gray-50 border border-gray-200"}`}
                    >
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5
                        ${flag.priority === "HIGH"   ? "text-red-500"
                        : flag.priority === "MEDIUM" ? "text-amber-500"
                                                     : "text-gray-400"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-main">{flag.reason}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {new Date(flag.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Admin Actions section — always visible at bottom ── */}
            <div className="bg-surface rounded-xl border border-border p-4 md:p-5">
              <h3 className="text-sm font-semibold text-text-main mb-3">Admin Actions</h3>
              <div className="flex flex-wrap gap-2">
                {/* Base actions — all steps */}
                <button
                  onClick={() => setShowFeeDetail(true)}
                  className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  View Cancellation Policy
                </button>
                <button
                  className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" /> Flag
                </button>
                <button
                  className="px-3 py-2 bg-gray-50 text-text-muted border border-border rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Add Note
                </button>

                {/* Site step actions */}
                {bid.step === "site" && (
                  <>
                    <button
                      onClick={() => setShowFeeDetail(true)}
                      className="px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      Review Fee Calculation
                    </button>
                    {isCancelled && (
                      <button
                        onClick={() => setShowWaive(true)}
                        className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-amber-100 transition-colors"
                      >
                        Waive Cancellation Fee
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── Modals ── */}
      {showWaive && bid && (
        <WaiveFeeModal
          jobId={bid.jobId}
          bidId={bid.id}
          expertName={bid.expert.name}
          clientName={bid.client.name}
          feeAmount={site?.cancellationFee?.finalFee ?? 0}
          onClose={() => setShowWaive(false)}
        />
      )}
      {showFeeDetail && bid && (
        <CancellationFeeDetailModal
          jobId={bid.jobId}
          onClose={() => setShowFeeDetail(false)}
        />
      )}
    </div>
  );
}