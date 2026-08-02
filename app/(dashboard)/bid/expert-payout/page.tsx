"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckCircle, Clock, XCircle, RefreshCw, Download, Eye, ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchExpertPayouts, setPayoutStatusFilter } from "@/lib/redux/expertpayoutSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { PayoutRecord } from "@/components/bid/MockData";
import Topbar from "@/components/layout/Navbar";

const fmt = (n: number) => `₦${n.toLocaleString()}`;

type PayoutStatus = PayoutRecord["payoutStatus"];

const STATUS_MAP: Record<PayoutStatus, { label: string; icon: React.ElementType; cls: string }> = {
  paid:    { label: "Paid",    icon: CheckCircle, cls: "bg-green-100 text-green-700" },
  pending: { label: "Pending", icon: Clock,       cls: "bg-amber-100 text-amber-700" },
  failed:  { label: "Failed",  icon: XCircle,     cls: "bg-red-100 text-red-700"     },
};

// ─── Payout Detail Modal ──────────────────────────────────────────────────────

function PayoutDetailModal({ record, onClose }: { record: PayoutRecord; onClose: () => void }) {
  const s    = STATUS_MAP[record.payoutStatus];
  const Icon = s.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-main">Expert Cancellation Fee Payout</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="text-text-muted text-xs">Expert</p>
              <p className="font-medium">{record.expertName} ({record.expertId})</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Cancellation Fee</p>
              <p className="font-bold text-blue-700">{fmt(record.cancellationFee)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Job ID</p>
              <p className="font-medium">{record.jobId}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Date</p>
              <p className="font-medium">{record.payoutDate ?? "—"}</p>
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs w-28 shrink-0">Payout Status</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                <Icon className="w-3 h-3" /> {s.label}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-text-muted text-xs w-28 shrink-0">Payout Date</span>
              <span className="font-medium">{record.payoutDate ?? "—"}</span>
              {record.payoutMethod && (
                <>
                  <span className="text-text-muted text-xs ml-4 shrink-0">Method</span>
                  <span className="font-medium">{record.payoutMethod}</span>
                </>
              )}
            </div>
            {record.transactionId && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs w-28 shrink-0">Transaction ID</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{record.transactionId}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
            <button disabled={record.payoutStatus !== "paid"} className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40">
              View Payout Receipt
            </button>
            <button disabled={record.payoutStatus === "paid"} className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              {record.payoutStatus === "pending" ? "Process Now" : "Reprocess Payout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExpertPayoutTrackingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const [selected, setSelected] = useState<PayoutRecord | null>(null);

  const { records, totalPaidOut, paid, pending, failed, loading, statusFilter } =
    useSelector((s: RootState) => s.expertPayout);

  useEffect(() => {
    dispatch(fetchExpertPayouts({}));
  }, [dispatch]);

  const filtered: PayoutRecord[] =
    statusFilter === "all" ? records : records.filter((r: PayoutRecord) => r.payoutStatus === statusFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="Expert Payout Tracking" />

      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/bid/cancellations")} className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-main">Expert Payout Tracking</h1>
              <p className="text-sm text-text-muted mt-0.5">Cancellation fee payouts to experts (Situation B2)</p>
            </div>
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm px-3 py-2 shrink-0">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse h-20" />
            ))
          ) : (
            <>
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Total Paid Out</p>
                <p className="text-xl sm:text-2xl font-bold text-text-main mt-1">{fmt(totalPaidOut)}</p>
              </div>
              <div className="bg-surface rounded-xl border border-green-200 p-4">
                <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Paid</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700 mt-1">{paid}</p>
              </div>
              <div className="bg-surface rounded-xl border border-amber-200 p-4">
                <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">{pending}</p>
              </div>
              <div className="bg-surface rounded-xl border border-red-200 p-4">
                <p className="text-xs text-red-600 uppercase tracking-wide font-medium">Failed</p>
                <p className="text-xl sm:text-2xl font-bold text-red-700 mt-1">{failed}</p>
              </div>
            </>
          )}
        </div>

        {/* Filter */}
        <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-text-muted font-medium shrink-0">Filter:</span>
          {(["all", "paid", "pending", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => dispatch(setPayoutStatusFilter(f))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                statusFilter === f ? "bg-primary text-white" : "bg-gray-100 text-text-muted hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-xs">
                  <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium">Job ID</th>
                  <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium">Expert</th>
                  <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium hidden md:table-cell">Expert ID</th>
                  <th className="text-right px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium">Fee Amount</th>
                  <th className="text-center px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium">Status</th>
                  <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium hidden sm:table-cell">Payout Date</th>
                  <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium hidden lg:table-cell">Method</th>
                  <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium hidden lg:table-cell">Transaction ID</th>
                  <th className="text-center px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-text-muted">No payout records found</td></tr>
                ) : (
                  filtered.map((record: PayoutRecord) => {
                    const s    = STATUS_MAP[record.payoutStatus];
                    const Icon = s.icon;
                    return (
                      <tr key={record.jobId} className="border-b border-border hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-xs sm:text-sm">{record.jobId}</td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">{record.expertName}</td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 font-mono text-xs text-text-muted hidden md:table-cell">{record.expertId}</td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-right font-bold text-blue-700 text-xs sm:text-sm">{fmt(record.cancellationFee)}</td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                            <Icon className="w-3 h-3" /><span className="hidden sm:inline">{s.label}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-text-muted text-xs hidden sm:table-cell">{record.payoutDate ?? "—"}</td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-text-muted text-xs hidden lg:table-cell">{record.payoutMethod}</td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 font-mono text-xs text-text-muted hidden lg:table-cell">{record.transactionId ?? "—"}</td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                          <button onClick={() => setSelected(record)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
                            <Eye className="w-3 h-3" /><span className="hidden sm:inline">View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {selected && <PayoutDetailModal record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}