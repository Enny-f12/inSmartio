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
import { MOCK_REFUNDS, type RefundRecord } from "@/components/bid/MockData";
import Topbar from "@/components/layout/Navbar";
// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₦${n.toLocaleString()}`;

const STATUS_MAP = {
  processed: { label: "Processed", icon: CheckCircle, cls: "bg-green-100 text-green-700", iconCls: "text-green-500" },
  pending:   { label: "Pending",   icon: Clock,        cls: "bg-amber-100 text-amber-700", iconCls: "text-amber-500" },
  failed:    { label: "Failed",    icon: XCircle,      cls: "bg-red-100 text-red-700",     iconCls: "text-red-500"   },
};

// ─── Refund Detail Modal ──────────────────────────────────────────────────────

function RefundDetailModal({ record, onClose }: { record: RefundRecord; onClose: () => void }) {
  const s = STATUS_MAP[record.refundStatus];
  const Icon = s.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
     
      <div className="bg-surface rounded-2xl border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-main">
            Refund Tracking – {record.jobId}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${s.cls} bg-opacity-30 border border-current border-opacity-20`}>
            <Icon className={`w-6 h-6 ${s.iconCls}`} />
            <div>
              <p className="font-semibold text-sm">Refund {s.label}</p>
              {record.refundDate && (
                <p className="text-xs opacity-80">Processed on {record.refundDate}</p>
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Job ID</span>
              <span className="font-medium">{record.jobId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Client</span>
              <span className="font-medium">{record.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Original Escrow</span>
              <span className="font-medium">{fmt(record.originalEscrow)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Cancellation Fee</span>
              <span className="font-medium">– {fmt(record.cancellationFee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-green-700">
              <span className="font-semibold">Client Refund</span>
              <span className="font-bold text-base">{fmt(record.clientRefund)}</span>
            </div>
          </div>

          {/* Transaction details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Refund Method</span>
              <span className="font-medium">{record.refundMethod}</span>
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
            {record.refundStatus === "processed" && (
              <button className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                View Refund Receipt
              </button>
            )}
            {record.refundStatus === "failed" && (
              <button className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                <RefreshCw className="w-4 h-4" /> Resend Refund
              </button>
            )}
            {record.refundStatus === "pending" && (
              <button className="flex-1 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                Issue Manual Refund
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

export default function ClientRefundTrackingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<RefundRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processed" | "failed">("all");

  const filtered = statusFilter === "all"
    ? MOCK_REFUNDS
    : MOCK_REFUNDS.filter((r) => r.refundStatus === statusFilter);

  const totals = {
    total: MOCK_REFUNDS.reduce((s, r) => s + r.clientRefund, 0),
    processed: MOCK_REFUNDS.filter((r) => r.refundStatus === "processed").length,
    pending: MOCK_REFUNDS.filter((r) => r.refundStatus === "pending").length,
    failed: MOCK_REFUNDS.filter((r) => r.refundStatus === "failed").length,
  };

  return (
    <div>
      <Topbar title="Refund Tracking" />
    <div className="min-h-screen bg-background p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/bid/cancellations")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">Client Refund Tracking</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Refunds issued after cancellation fee deduction (Situation B2)
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
          <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Total Refunded</p>
          <p className="text-2xl font-bold text-text-main mt-1">{fmt(totals.total)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Processed</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{totals.processed}</p>
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
        {(["all", "processed", "pending", "failed"] as const).map((f) => (
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
                <th className="text-left px-4 py-3 text-text-muted font-medium">Client</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Original Escrow</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Cancel Fee</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Client Refund</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Refund Date</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Method</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const s = STATUS_MAP[record.refundStatus];
                const Icon = s.icon;
                return (
                  <tr key={record.jobId} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{record.jobId}</td>
                    <td className="px-4 py-3">{record.clientName}</td>
                    <td className="px-4 py-3 text-right">{fmt(record.originalEscrow)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">– {fmt(record.cancellationFee)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(record.clientRefund)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                        <Icon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{record.refundDate ?? "—"}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{record.refundMethod}</td>
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

      {selected && <RefundDetailModal record={selected} onClose={() => setSelected(null)} />}
    </div>
    </div>
  );
}