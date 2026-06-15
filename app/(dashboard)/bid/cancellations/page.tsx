"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  RefreshCw,
  Eye,
  RotateCcw,
  Banknote,
} from "lucide-react";
import {
  fetchCancellationFees,
  fetchCancellationFeeSummary,
  fetchExcessiveCancellations,
  setFeeFilters,
  setFeePage,
} from "@/lib/redux/cancellationfeeSlice";
import CancellationFeeDetailModal from "@/components/bid/CancellationFeeDetailModal";
import ExportModal from "@/components/bid/ExportModal";
import DisputeFlaggingPanel from "@/components/bid/DisputeFlaggingPanel";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { CancellationFeeRecord } from "@/components/bid/types";
import Topbar from "@/components/layout/Navbar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : `₦${n.toLocaleString()}`;

const DATE_FILTERS = [
  { label: "Last 30 days", value: "last_30" as const },
  { label: "Last 90 days", value: "last_90" as const },
  { label: "All time", value: "all" as const },
];

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-text-main mt-1">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "pending" | "processed" | "paid" | "failed" }) {
  const map = {
    pending: "bg-amber-100 text-amber-700",
    processed: "bg-green-100 text-green-700",
    paid: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CancellationFeeMonitoringPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const {
    fees,
    total,
    totalPages,
    filters,
    listLoading,
    summary,
    summaryLoading,
    expertDisputes,
    clientDisputes,
  } = useSelector((s: RootState) => s.cancellationFees);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState<"fees" | "disputes">("fees");

  const load = useCallback(() => {
    dispatch(fetchCancellationFees(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchCancellationFeeSummary());
    dispatch(fetchExcessiveCancellations());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const alertCount =
    expertDisputes.filter((e) => e.exceedsThreshold).length +
    clientDisputes.filter((c) => c.exceedsThreshold).length;

  return (
    <div>
      <Topbar title="Cancellation Fee Monitoring" />
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/bid")}
              className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-main">
                Cancellation Fee Monitoring
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                Track and manage all Situation B2 cancellation fees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => router.push("/bid/client-refund")}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-text-main hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-green-600" />
              <span className="hidden sm:inline">Client Refunds</span>
            </button>

            <button
              onClick={() => router.push("/bid/expert-payout")}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-text-main hover:bg-gray-50 transition-colors"
            >
              <Banknote className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Expert Payouts</span>
            </button>

            <button
              onClick={load}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setShowExport(true)}
              className="btn-primary flex items-center gap-2 text-sm px-3 py-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryLoading || !summary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface rounded-xl border border-border p-4 animate-pulse h-20"
            />
          ))
        ) : (
          <>
            <SummaryCard
              label="Total Cancellations (B2)"
              value={summary.totalCancellations.toString()}
            />
            <SummaryCard
              label="Total Fees Collected"
              value={fmt(summary.totalFeesCollected)}
            />
            <SummaryCard
              label="Average Fee"
              value={fmt(summary.averageFee)}
            />
            <SummaryCard
              label="Top Reason"
              value={summary.topReasons[0]?.reason ?? "—"}
              sub={
                summary.topReasons[0]?.percentage
                  ? `${summary.topReasons[0].percentage}% of cases`
                  : undefined
              }
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("fees")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "fees"
              ? "bg-surface shadow text-text-main"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Fee Records
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "disputes"
              ? "bg-surface shadow text-text-main"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Dispute Flagging
          {alertCount > 0 && (
            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "disputes" ? (
        <DisputeFlaggingPanel />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-surface rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-text-muted font-medium shrink-0">Filter:</span>

            <select
              value={filters.dateRange ?? "last_30"}
              onChange={(e) => dispatch(setFeeFilters({ dateRange: e.target.value as "last_30" | "last_90" | "all" }))}
              className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {DATE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            <select
              value={filters.expertId ?? ""}
              onChange={(e) => dispatch(setFeeFilters({ expertId: e.target.value || undefined }))}
              className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">Expert</option>
              {Array.from(new Set(fees.map((f) => f.expert.name))).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <select
              value={filters.clientId ?? ""}
              onChange={(e) => dispatch(setFeeFilters({ clientId: e.target.value || undefined }))}
              className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-main bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">Client</option>
              {Array.from(new Set(fees.map((f) => f.client.name))).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {(filters.expertId || filters.clientId || filters.dateRange !== "last_30") && (
              <button
                onClick={() => dispatch(setFeeFilters({ expertId: undefined, clientId: undefined, dateRange: "last_30" }))}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="text-left px-4 py-3 text-text-muted font-medium">Job ID</th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium">Expert</th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium">Client</th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium">Orig. Amount</th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium">Requested</th>
                    <th className="text-center px-4 py-3 text-text-muted font-medium">Increase</th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium">Fee Applied</th>
                    <th className="text-center px-4 py-3 text-text-muted font-medium">Refund</th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium">Date</th>
                    <th className="text-center px-4 py-3 text-text-muted font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : fees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-text-muted">
                        No cancellation fee records found
                      </td>
                    </tr>
                  ) : (
                    fees.map((fee: CancellationFeeRecord) => (
                      <tr
                        key={fee.jobId}
                        className="border-b border-border hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{fee.jobId}</td>
                        <td className="px-4 py-3">{fee.expert.name}</td>
                        <td className="px-4 py-3">{fee.client.name}</td>
                        <td className="px-4 py-3 text-right">{fmt(fee.originalAmount)}</td>
                        <td className="px-4 py-3 text-right text-amber-600 font-medium">
                          {fmt(fee.requestedAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="flex items-center justify-center gap-1 text-amber-600">
                            <TrendingUp className="w-3 h-3" />
                            {fee.increasePercent}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">
                          {fmt(fee.feeApplied)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={fee.refundStatus} />
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">{fee.date}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedJobId(fee.jobId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-text-muted">
                  Showing {fees.length} of {total} records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={filters.page === 1}
                    onClick={() => dispatch(setFeePage((filters.page ?? 1) - 1))}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-text-muted">
                    Page {filters.page} of {totalPages}
                  </span>
                  <button
                    disabled={filters.page === totalPages}
                    onClick={() => dispatch(setFeePage((filters.page ?? 1) + 1))}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {selectedJobId && (
        <CancellationFeeDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      </div>
    </div>
    </div>
  );
}