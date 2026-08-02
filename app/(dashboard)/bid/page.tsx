"use client";

import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, RefreshCw, Download,
  Search, Flag, Eye, AlertTriangle,
} from "lucide-react";
import { fetchBids, fetchBidKPISummary, setFilters, setPage } from "@/lib/redux/bidSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { BidStep, Bid } from "@/components/bid/types";
import Topbar from "@/components/layout/Navbar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}k`
  : `₦${n}`;

const getStatusLabel = (status: string) => {
  if (status.includes("reject") || status.includes("cancelled") || status.includes("expired"))
    return { label: "Reject", cls: "bg-red-100 text-red-700" };
  return { label: "Active", cls: "bg-green-100 text-green-700" };
};

const stepLabel = (step: BidStep) => step === "site" ? "Site" : `${step}`;

const STEP_FILTERS: { label: string; value: BidStep | "all" }[] = [
  { label: "All",    value: "all"  },
  { label: "Step 1", value: 1     },
  { label: "Step 2", value: 2     },
  { label: "Step 3", value: 3     },
  { label: "Step 4", value: 4     },
  { label: "Step 5", value: 5     },
  { label: "Step 6", value: 6     },
  { label: "Step 7", value: 7     },
  { label: "Site",   value: "site"},
];

// ─── Bid flag helpers ─────────────────────────────────────────────────────────

/** Returns { flagged, priority } from bid.flagData.
 *
 * The API does NOT return a `status` field on flagData — presence of
 * `flagData.reason` or `flagData.flaggedAt` is enough to know it's flagged.
 * Also checks the nested `flags[]` array as a fallback.
 */
function getFlagState(bid: Bid): { flagged: boolean; priority: "HIGH" | "MEDIUM" | "LOW" | null } {
  const fd = bid.flagData;
  if (!fd) return { flagged: false, priority: null };

  // Top-level: reason or flaggedAt present → flagged
  if (fd.reason || fd.flaggedAt) {
    return { flagged: true, priority: fd.priority ?? null };
  }

  // Nested flags array fallback
  if (Array.isArray(fd.flags) && fd.flags.length > 0) {
    const first = fd.flags[0];
    return { flagged: true, priority: first.priority ?? null };
  }

  return { flagged: false, priority: null };
}

function FlagCell({ bid }: { bid: Bid }) {
  const { flagged, priority } = getFlagState(bid);

  if (!flagged) {
    return <Flag className="w-4 h-4 mx-auto text-gray-300" fill="none" />;
  }

  const color =
    priority === "HIGH"   ? "text-red-500"
    : priority === "MEDIUM" ? "text-amber-400"
    : "text-gray-400";

  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <Flag className={`w-4 h-4 mx-auto ${color}`} fill="currentColor" />
      {priority && (
        <span className={`text-[9px] font-semibold leading-none ${
          priority === "HIGH" ? "text-red-500" : priority === "MEDIUM" ? "text-amber-500" : "text-gray-400"
        }`}>
          {priority}
        </span>
      )}
    </span>
  );
}

function getCancelFee(bid: Bid): number | null {
  return bid.cancellationData?.feeAmount ?? null;
}

function getClient(bid: Bid) {
  return bid.job?.client ?? null;
}

function hasPriceRequest(bid: Bid): boolean {
  return bid.negotiationData != null;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, delta, alert, alertMsg }: {
  label: string; value: string | number; delta: number; alert?: boolean; alertMsg?: string;
}) {
  const up = delta >= 0;
  return (
    <div className={`bg-surface rounded-xl border p-4 flex flex-col gap-1 relative ${alert ? "border-red-300 bg-red-50" : "border-border"}`}>
      {alert && <div className="absolute top-3 right-3"><AlertTriangle className="w-4 h-4 text-red-500" /></div>}
      <span className="text-xs text-text-muted font-medium uppercase tracking-wide pr-5">{label}</span>
      <span className="text-2xl font-bold text-text-main">{value}</span>
      <div className="flex items-center gap-1 text-xs">
        {up ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
        <span className={up ? "text-green-600" : "text-red-600"}>{up ? "+" : ""}{delta}%</span>
        <span className="text-text-muted">vs last period</span>
      </div>
      {alert && alertMsg && <p className="text-xs text-red-600 mt-1">{alertMsg}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BidManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();

  const { bids, total, totalPages, filters, listLoading, kpi, kpiLoading } =
    useSelector((s: RootState) => s.bids);

  const load = useCallback(() => { dispatch(fetchBids(filters)); }, [dispatch, filters]);
  useEffect(() => { dispatch(fetchBidKPISummary()); }, [dispatch]);
  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="Bid Management" />

      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 space-y-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-main">Bid Management</h1>
            <p className="text-sm text-text-muted mt-0.5">Monitor and manage all bids across the platform</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/bid/cancellations")}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-text-main hover:bg-gray-50 transition-colors">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Cancellation Fees
            </button>
            <button onClick={load}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpiLoading || !kpi ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse h-24" />
            ))
          ) : (
            <>
              <KPICard label="Total Bids"   value={kpi.totalBids.toLocaleString()}   delta={kpi.totalBidsDelta} />
              <KPICard label="Active Bids"  value={kpi.activeBids.toLocaleString()}  delta={kpi.activeBidsDelta} />
              <KPICard label="Price Req"    value={kpi.priceRequests.toLocaleString()} delta={kpi.priceRequestsDelta} />
              <KPICard label="Rejected"     value={kpi.rejected.toLocaleString()}    delta={kpi.rejectedDelta} />
              <KPICard label="Cancellation" value={kpi.cancellationFees.toLocaleString()} delta={kpi.cancellationFeesDelta}
                alert={kpi.cancellationFeeRate > 10}
                alertMsg={kpi.cancellationFeeRate > 10 ? `${kpi.cancellationFeeRate}% of site arrivals — exceeds 10% threshold` : undefined} />
            </>
          )}
        </div>

        {/* ── Filters + Search ── */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div>
            <p className="text-xs text-text-muted font-medium mb-2">PROCESS STAGE FILTERS:</p>
            <div className="flex flex-wrap gap-2">
              {STEP_FILTERS.map((f) => (
                <button key={String(f.value)} onClick={() => dispatch(setFilters({ step: f.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.step === f.value ? "bg-primary text-white" : "bg-gray-100 text-text-muted hover:bg-gray-200"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Search by Bid ID, Job ID, Expert, or Client..."
              value={filters.search ?? ""}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-xs">
                  <th className="text-left px-4 py-3 text-text-muted font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Job</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Expert</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Client</th>
                  <th className="text-right px-4 py-3 text-text-muted font-medium">Amount</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Step</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">PriceReq</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-text-muted font-medium">CancelFee</th>
                  {/* Flag column — shows filled flag + priority label when flagged */}
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Flag</th>
                  <th className="text-center px-4 py-3 text-text-muted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : bids.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12 text-text-muted text-sm">No bids found</td></tr>
                ) : (
                  bids.map((bid) => {
                    const cancelFee = getCancelFee(bid);
                    const client    = getClient(bid);
                    const priceReq  = hasPriceRequest(bid);
                    const status    = getStatusLabel(bid.status);

                    return (
                      <tr key={bid.id} className="border-b border-border hover:bg-gray-50 transition-colors text-xs">
                        <td className="px-4 py-3 font-mono text-text-muted whitespace-nowrap">{bid.id}</td>
                        <td className="px-4 py-3 font-medium">{bid.jobId ?? "-"}</td>
                        <td className="px-4 py-3">{bid.expert?.name ?? "-"}</td>
                        <td className="px-4 py-3">{client?.name ?? "-"}</td>
                        <td className="px-4 py-3 text-right font-medium">{bid.bidAmount != null ? fmt(bid.bidAmount) : "-"}</td>
                        <td className="px-4 py-3 text-center">{bid.step != null ? stepLabel(bid.step) : "-"}</td>
                        <td className="px-4 py-3 text-center">
                          {priceReq
                            ? <span className="text-text-main font-medium">Yes</span>
                            : <span className="text-text-muted">No</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {cancelFee != null
                            ? <span className="font-medium text-red-600">{fmt(cancelFee)}</span>
                            : <span className="text-text-muted">-</span>}
                        </td>
                        {/* Flag cell — shows filled flag + priority label */}
                        <td className="px-4 py-3 text-center">
                          <FlagCell bid={bid} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => router.push(`/bid/${bid.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-text-muted">Showing {bids.length} of {total} bids</p>
              <div className="flex items-center gap-2">
                <button disabled={filters.page === 1} onClick={() => dispatch(setPage((filters.page ?? 1) - 1))}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
                  Previous
                </button>
                <span className="text-sm text-text-muted">Page {filters.page} of {totalPages}</span>
                <button disabled={filters.page === totalPages} onClick={() => dispatch(setPage((filters.page ?? 1) + 1))}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}