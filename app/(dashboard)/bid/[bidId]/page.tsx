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
  Bell,
  FileText,
  Flag,
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

const STEPS: { label: string; sub: string; value: BidStep }[] = [
  { label: "Step 1", sub: "Posted", value: 1 },
  { label: "Step 2", sub: "Bids", value: 2 },
  { label: "Step 3", sub: "Selected", value: 3 },
  { label: "Step 4", sub: "Response", value: 4 },
  { label: "Step 5", sub: "Decision", value: 5 },
  { label: "Step 6", sub: "Confirm", value: 6 },
  { label: "Step 7", sub: "Travel", value: 7 },
  { label: "Site", sub: "Arrival", value: "site" },
];

function stepIndex(step: BidStep): number {
  if (step === "site") return 7;
  return (step as number) - 1;
}

// ─── Process Timeline ─────────────────────────────────────────────────────────

function ProcessTimeline({ currentStep }: { currentStep: BidStep }) {
  const current = stepIndex(currentStep);
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
        Process Timeline
      </h3>
      <div className="flex items-start gap-0">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <React.Fragment key={s.sub}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done
                      ? "bg-primary text-white"
                      : active
                      ? "bg-primary/20 border-2 border-primary text-primary"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1 > 7 ? "S" : i + 1}
                </div>
                <span
                  className={`text-xs text-center leading-tight ${
                    active ? "text-primary font-semibold" : done ? "text-text-muted" : "text-gray-300"
                  }`}
                >
                  {s.sub}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mt-4 mx-1 transition-all ${
                    i < current ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-xs text-text-muted whitespace-nowrap">{label}</span>
      <span className="text-xs font-medium text-text-main text-right">{value}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BidDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const bidId = params?.bidId as string;

  const { selectedBid: bid, detailLoading, detailError } = useSelector(
    (s: RootState) => s.bids
  );

  const [activeTab, setActiveTab] = useState<"overview" | "notifications">("overview");
  const [showWaive, setShowWaive] = useState(false);
  const [showFeeDetail, setShowFeeDetail] = useState(false);

  useEffect(() => {
    if (bidId) {
      dispatch(fetchBidDetail(bidId));
      dispatch(fetchNotificationLog(bidId));
    }
    return () => { dispatch(clearSelectedBid()); };
  }, [bidId, dispatch]);

  if (detailLoading || !bid) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-5 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-text-muted">{detailError}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 btn-primary text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const site = bid.siteArrivalDetails;
  const isCancelled = bid.status === "cancelled_fee_applied";
  const isB2 = site?.situation === "B2";

  return (
    <div>
    <Topbar title="Bid details" />
    <div className="min-h-screen bg-background p-6 space-y-5">
      {/* Header */}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/bid")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-main">
              Bid #{bid.id}
            </h1>
            <p className="text-sm text-text-muted">Job: {bid.jobId}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isB2 && (
            <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
              Situation B2 – Fee Applied
            </span>
          )}
          <span className="px-3 py-1.5 bg-gray-100 text-text-muted rounded-full text-xs font-medium capitalize">
            {bid.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["overview", "notifications"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === t
                ? "bg-surface shadow text-text-main"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {t === "notifications" ? "Notification Log" : "Overview"}
          </button>
        ))}
      </div>

      {activeTab === "notifications" ? (
        <NotificationLogPanel bidId={bid.id} />
      ) : (
        <>
          {/* Process Timeline */}
          <ProcessTimeline currentStep={bid.step} />

          {/* B2 Alert Banner */}
          {isB2 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Situation B2 – Cancellation Fee Applied
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Client rejected the price increase on site. Cancellation fee of{" "}
                  <strong>{fmt(site?.cancellationFee?.finalFee ?? 0)}</strong> has been
                  applied.
                </p>
              </div>
            </div>
          )}

          {/* Two-column: Expert + Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Expert */}
            <div className="bg-surface rounded-xl border border-border p-5 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-main">Expert Information</h3>
              </div>
              <InfoRow label="Name" value={bid.expert.name} />
              <InfoRow label="Expert ID" value={bid.expert.id} />
              <InfoRow
                label="Phone"
                value={
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {bid.expert.phone}
                  </span>
                }
              />
              <InfoRow
                label="Rating"
                value={
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {bid.expert.rating}
                  </span>
                }
              />
              <InfoRow label="Verification Tier" value={bid.expert.verificationTier} />
              <InfoRow
                label="Cancel Fees Received"
                value={
                  <span className={bid.expert.cancellationFeesReceived > 0 ? "text-red-600" : ""}>
                    {fmt(bid.expert.cancellationFeesReceived)}
                  </span>
                }
              />
            </div>

            {/* Client */}
            <div className="bg-surface rounded-xl border border-border p-5 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-main">Client Information</h3>
              </div>
              <InfoRow label="Name" value={bid.client.name} />
              <InfoRow label="Client ID" value={bid.client.id} />
              <InfoRow
                label="Phone"
                value={
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {bid.client.phone}
                  </span>
                }
              />
              <InfoRow label="Verification Tier" value={bid.client.verificationTier} />
              <InfoRow label="Jobs Completed" value={bid.client.jobsCompleted} />
              <InfoRow
                label="Cancel Fees Paid"
                value={
                  <span className={bid.client.cancellationFeesPaid > 0 ? "text-red-600" : ""}>
                    {fmt(bid.client.cancellationFeesPaid)}
                  </span>
                }
              />
            </div>
          </div>

          {/* Bid Information */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-main">Bid Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Original Bid</p>
                <p className="text-base font-bold text-text-main">{fmt(bid.originalBid)}</p>
              </div>
              {bid.requestedIncrease && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Requested Increase</p>
                  <p className="text-base font-bold text-amber-600">
                    {fmt(bid.requestedIncrease)}{" "}
                    <span className="text-xs">({bid.requestedIncreasePercent}%)</span>
                  </p>
                </div>
              )}
              {bid.finalAmount && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Final Amount</p>
                  <p className="text-base font-bold text-green-600">{fmt(bid.finalAmount)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-text-muted mb-1">Created At</p>
                <p className="text-sm text-text-main">{new Date(bid.createdAt).toLocaleString()}</p>
              </div>
              {bid.step4ResponseAt && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Step 4 Response</p>
                  <p className="text-sm text-text-main">{new Date(bid.step4ResponseAt).toLocaleString()}</p>
                </div>
              )}
              {bid.step5DecisionAt && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Step 5 Decision</p>
                  <p className="text-sm text-text-main">{new Date(bid.step5DecisionAt).toLocaleString()}</p>
                </div>
              )}
              {bid.siteArrivalAt && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Site Arrival</p>
                  <p className="text-sm text-text-main flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    {new Date(bid.siteArrivalAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Site Arrival & Cancellation Details — only when B2 */}
          {site && (
            <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-text-main">
                    Site Arrival & Cancellation Details
                  </h3>
                </div>
                <button
                  onClick={() => setShowFeeDetail(true)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View Full Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-0">
                  <InfoRow label="Arrival Time" value={new Date(site.arrivalTime).toLocaleString()} />
                  <InfoRow label="Inspection Completed" value={new Date(site.inspectionCompletedAt).toLocaleString()} />
                  <InfoRow label="Expert Assessment" value={site.expertAssessment} />
                  <InfoRow
                    label="Proposed New Price"
                    value={
                      <span className="text-amber-600 font-semibold">
                        {fmt(site.proposedNewPrice)} (+{site.proposedIncreasePercent}%)
                      </span>
                    }
                  />
                  <InfoRow
                    label="Client Response"
                    value={
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          site.clientResponse === "rejected"
                            ? "bg-red-100 text-red-700"
                            : site.clientResponse === "accepted"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {site.clientResponse}
                      </span>
                    }
                  />
                  {site.clientResponseAt && (
                    <InfoRow
                      label="Response Time"
                      value={new Date(site.clientResponseAt).toLocaleString()}
                    />
                  )}
                </div>

                {/* Fee Calculation Box */}
                {site.cancellationFee && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                      Cancellation Fee Calculation
                    </p>
                    <InfoRow
                      label="Original Job Value"
                      value={fmt(site.cancellationFee.originalJobValue)}
                    />
                    <InfoRow
                      label="25% Calculation"
                      value={fmt(site.cancellationFee.calculatedAmount)}
                    />
                    <InfoRow
                      label="Maximum Fee Cap"
                      value={fmt(site.cancellationFee.feeCap)}
                    />
                    <div className="border-t border-red-200 pt-2 mt-2">
                      <InfoRow
                        label="Final Cancellation Fee"
                        value={
                          <span className="text-red-700 font-bold text-sm">
                            {fmt(site.cancellationFee.finalFee)}
                          </span>
                        }
                      />
                      <InfoRow
                        label="Client Refund"
                        value={fmt(site.cancellationFee.clientRefund)}
                      />
                      <InfoRow
                        label="Expert Payout"
                        value={fmt(site.cancellationFee.expertPayout)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerts & Flags */}
          {bid.flags.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="w-4 h-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-main">Alerts & Flags</h3>
              </div>
              <div className="space-y-2">
                {bid.flags.map((flag) => (
                  <div
                    key={flag.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      flag.priority === "HIGH"
                        ? "bg-red-50 border border-red-200"
                        : flag.priority === "MEDIUM"
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        flag.priority === "HIGH"
                          ? "text-red-500"
                          : flag.priority === "MEDIUM"
                          ? "text-amber-500"
                          : "text-gray-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-main">{flag.reason}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(flag.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        flag.priority === "HIGH"
                          ? "bg-red-100 text-red-700"
                          : flag.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {flag.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-text-main mb-3">Admin Actions</h3>
            <div className="flex flex-wrap gap-2">
              {isCancelled && (
                <>
                  <button
                    onClick={() => setShowFeeDetail(true)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Review Fee Calculation
                  </button>
                  <button
                    onClick={() => setShowWaive(true)}
                    className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    Waive Cancellation Fee
                  </button>
                </>
              )}
              <button className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                Flag Bid
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className="px-4 py-2 bg-gray-50 text-text-muted border border-border rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <Bell className="w-4 h-4" />
                View Notifications
              </button>
              <button className="px-4 py-2 bg-gray-50 text-text-muted border border-border rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                Add Note
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
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
    </div>
  );
}