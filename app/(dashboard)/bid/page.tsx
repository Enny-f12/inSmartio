"use client";

import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Search,
  Flag,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { fetchBids, fetchBidKPISummary, setFilters, setPage } from "@/lib/redux/bidSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store"; 
import type { BidStep, Bid } from "@/components/bid/types"; 
import Topbar from "@/components/layout/Navbar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(0)}k`
    : `₦${n}`;

const statusColor: Record<string, string> = {
  active_bid: "bg-blue-100 text-blue-700",
  selected: "bg-purple-100 text-purple-700",
  price_negotiation: "bg-amber-100 text-amber-700",
  price_rejected: "bg-red-100 text-red-700",
  price_accepted: "bg-green-100 text-green-700",
  confirmed: "bg-green-100 text-green-700",
  en_route: "bg-cyan-100 text-cyan-700",
  on_site_inspection: "bg-indigo-100 text-indigo-700",
  on_site_price_lower: "bg-teal-100 text-teal-700",
  on_site_price_higher: "bg-orange-100 text-orange-700",
  cancelled_fee_applied: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
  cancelled_no_fee: "bg-gray-100 text-gray-600",
  expired: "bg-gray-100 text-gray-600",
  reopened: "bg-yellow-100 text-yellow-700",
  open_for_bids: "bg-slate-100 text-slate-700",
};

const flagColor = (priority?: string) => {
  if (priority === "HIGH") return "text-red-500";
  if (priority === "MEDIUM") return "text-amber-400";
  return "text-green-500";
};

const stepLabel = (step: BidStep) =>
  step === "site" ? "Site" : `Step ${step}`;

const STEP_FILTERS: { label: string; value: BidStep | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Step 1", value: 1 },
  { label: "Step 2", value: 2 },
  { label: "Step 3", value: 3 },
  { label: "Step 4", value: 4 },
  { label: "Step 5", value: 5 },
  { label: "Step 6", value: 6 },
  { label: "Step 7", value: 7 },
  { label: "Site", value: "site" },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string | number;
  delta: number;
  alert?: boolean;
  alertMsg?: string;
}

function KPICard({ label, value, delta, alert, alertMsg }: KPICardProps) {
  const up = delta >= 0;
  return (
    <div
      className={`bg-surface rounded-xl border p-4 flex flex-col gap-1 relative ${
        alert ? "border-red-300 bg-red-50" : "border-border"
      }`}
    >
      {alert && (
        <div className="absolute top-3 right-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
      )}
      <span className="text-xs text-text-muted font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold text-text-main">{value}</span>
      <div className="flex items-center gap-1 text-xs">
        {up ? (
          <TrendingUp className="w-3 h-3 text-green-500" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-500" />
        )}
        <span className={up ? "text-green-600" : "text-red-600"}>
          {up ? "+" : ""}
          {delta}%
        </span>
        <span className="text-text-muted">vs last period</span>
      </div>
      {alert && alertMsg && (
        <p className="text-xs text-red-600 mt-1">{alertMsg}</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BidManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { bids, total, totalPages, filters, listLoading, kpi, kpiLoading } =
    useSelector((s: RootState) => s.bids);

  const load = useCallback(() => {
    dispatch(fetchBids(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchBidKPISummary());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStepFilter = (step: BidStep | "all") => {
    dispatch(setFilters({ step }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleView = (bid: Bid) => {
    router.push(`/bid/${bid.id}`);
  };

  const topFlag = (bid: Bid) =>
    bid.flags.find((f) => f.status === "open") ?? null;

  return (
    <div>
        <Topbar title="Bid Management" />
    
    <div className="min-h-screen bg-background p-6 space-y-6">
        
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Bid Management</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Monitor and manage all bids across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/bid/cancellations")}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-main hover:bg-gray-50 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Cancellation Fees
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-main hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiLoading || !kpi ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse h-24" />
          ))
        ) : (
          <>
            <KPICard label="Total Bids" value={kpi.totalBids.toLocaleString()} delta={kpi.totalBidsDelta} />
            <KPICard label="Active Bids" value={kpi.activeBids.toLocaleString()} delta={kpi.activeBidsDelta} />
            <KPICard label="Price Requests" value={kpi.priceRequests.toLocaleString()} delta={kpi.priceRequestsDelta} />
            <KPICard label="Rejected" value={kpi.rejected.toLocaleString()} delta={kpi.rejectedDelta} />
            <KPICard
              label="Cancellation Fees"
              value={kpi.cancellationFees.toLocaleString()}
              delta={kpi.cancellationFeesDelta}
              alert={kpi.cancellationFeeRate > 10}
              alertMsg={
                kpi.cancellationFeeRate > 10
                  ? `${kpi.cancellationFeeRate}% of site arrivals — exceeds 10% threshold`
                  : undefined
              }
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        {/* Step filter tabs */}
        <div className="flex flex-wrap gap-2">
          {STEP_FILTERS.map((f) => (
            <button
              key={String(f.value)}
              onClick={() => handleStepFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filters.step === f.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-muted hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by Bid ID, Job ID, Expert, or Client..."
            value={filters.search ?? ""}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Bid ID</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Job</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Expert</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Client</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Amount</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Step</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Price Req</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Cancel Fee</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Flag</th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bids.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-text-muted">
                    No bids found
                  </td>
                </tr>
              ) : (
                bids.map((bid) => {
                  const flag = topFlag(bid);
                  return (
                    <tr
                      key={bid.id}
                      className="border-b border-border hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-text-muted">
                        {bid.id}
                      </td>
                      <td className="px-4 py-3 font-medium">{bid.jobId}</td>
                      <td className="px-4 py-3">{bid.expert.name}</td>
                      <td className="px-4 py-3 text-primary underline-offset-2 hover:underline cursor-pointer">
                        {bid.client.name}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {fmt(bid.originalBid)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                          {stepLabel(bid.step)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {bid.hasPriceRequest ? (
                          <span className="text-amber-600 font-medium text-xs">Yes</span>
                        ) : (
                          <span className="text-text-muted text-xs">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColor[bid.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {bid.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {bid.cancellationFee ? (
                          <span className="font-medium text-red-600">
                            {fmt(bid.cancellationFee)}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Flag
                          className={`w-4 h-4 mx-auto ${
                            flag ? flagColor(flag.priority) : "text-gray-200"
                          }`}
                          fill={flag ? "currentColor" : "none"}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleView(bid)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View
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
            <p className="text-sm text-text-muted">
              Showing {bids.length} of {total} bids
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => dispatch(setPage((filters.page ?? 1) - 1))}
                className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {filters.page} of {totalPages}
              </span>
              <button
                disabled={filters.page === totalPages}
                onClick={() => dispatch(setPage((filters.page ?? 1) + 1))}
                className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
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