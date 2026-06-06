"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MOCK_PAYOUTS, type PayoutRecord } from "@/components/bid/MockData";
import Topbar from "@/components/layout/Navbar";
// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₦${n.toLocaleString()}`;

const STATUS_MAP = {
  paid:    { label: "Paid",    icon: CheckCircle, cls: "bg-green-100 text-green-700", iconCls: "text-green-500" },
  pending: { label: "Pending", icon: Clock,        cls: "bg-amber-100 text-amber-700", iconCls: "text-amber-500" },
  failed:  { label: "Failed",  icon: XCircle,      cls: "bg-red-100 text-red-700",     iconCls: "text-red-500"   },
};

// ─── Payout Detail Modal ──────────────────────────────────────────────────────

function PayoutDetailModal({ record, onClose }: { record: PayoutRecord; onClose: () => void }) {
  const s = STATUS_MAP[record.payoutStatus];
  const Icon = s.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
     
      <div className="bg-surface rounded-2xl border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-main">
            Expert Payout – {record.jobId}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${s.cls} border`}>
            <Icon className={`w-6 h-6 ${s.iconCls}`} />
            <div>
              <p className="font-semibold text-sm">Payout {s.label}</p>
              {record.payoutDate && (
                <p className="text-xs opacity-80">Paid on {record.payoutDate}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Job ID</span>
              <span className="font-medium">{record.jobId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Expert</span>
              <span className="font-medium">{record.expertName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Expert ID</span>
              <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-border">{record.expertId}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-blue-700">
              <span className="font-semibold">Cancellation Fee Payout</span>
              <span className="font-bold text-base">{fmt(record.cancellationFee)}</span>
            </div>
          </div>

          {/* Transaction */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Payout Method</span>
              <span className="font-medium">{record.payoutMethod}</span>
            </div>
            {record.transactionId && (
              <div className="flex justify-between">
                <span className="text-text-muted">Transaction ID</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{record.transactionId}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {record.payoutStatus === "paid" && (
              <button className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                View Payout Receipt
              </button>
            )}
            {record.payoutStatus === "failed" && (
              <button className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                <RefreshCw className="w-4 h-4" /> Reprocess Payout
              </button>
            )}
            {record.payoutStatus === "pending" && (
              <button className="flex-1 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                <RefreshCw className="w-4 h-4" /> Process Now
              </button>
            )}
            <button onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExpertPayoutTrackingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PayoutRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  const filtered = statusFilter === "all"
    ? MOCK_PAYOUTS
    : MOCK_PAYOUTS.filter((p) => p.payoutStatus === statusFilter);

  const totals = {
    total: MOCK_PAYOUTS.reduce((s, p) => s + p.cancellationFee, 0),
    paid: MOCK_PAYOUTS.filter((p) => p.payoutStatus === "paid").length,
    pending: MOCK_PAYOUTS.filter((p) => p.payoutStatus === "pending").length,
    failed: MOCK_PAYOUTS.filter((p) => p.payoutStatus === "failed").length,
  };

  return (
    <div>
      <Topbar title="Expert Payout Tracking" />
    <div className="min-h-screen bg-background p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/bid/cancellations")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">Expert Payout Tracking</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Cancellation fee payouts to experts (Situation B2)
            </p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Total Paid Out</p>
          <p className="text-2xl font-bold text-text-main mt-1">{fmt(totals.total)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Paid</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{totals.paid}</p>
        </div>
        <div className="bg-surface rounded-xl border border-amber-200 p-4">
          <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{totals.pending}</p>
        </div>
        <div className="bg-surface rounded-xl border border-red-200 p-4">
          <p className="text-xs text-red-600 uppercase tracking-wide font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{totals.failed}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-text-muted font-medium">Filter:</span>
        {(["all", "paid", "pending", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
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
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Job ID</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Expert</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Expert ID</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Fee Amount</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Payout Date</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Method</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Transaction ID</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const s = STATUS_MAP[record.payoutStatus];
                const Icon = s.icon;
                return (
                  <tr key={record.jobId} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{record.jobId}</td>
                    <td className="px-4 py-3">{record.expertName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{record.expertId}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(record.cancellationFee)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                        <Icon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{record.payoutDate ?? "—"}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{record.payoutMethod}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                      {record.transactionId ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelected(record)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <PayoutDetailModal record={selected} onClose={() => setSelected(null)} />}
    </div>
    </div>
  );
}