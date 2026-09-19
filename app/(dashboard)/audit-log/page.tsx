/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Download, ChevronDown, SlidersHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/Navbar";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchAuditLogs, exportAuditLogsThunk,
  setFilters, setPage, resetExportStatus,
} from "@/lib/redux/auditlogSlice";
import type { AuditAction, AuditLog, AuditLogsParams } from "@/lib/api/auditlogApi";

// ── Constants ─────────────────────────────────────────────

const ACTION_OPTIONS: { label: string; value: AuditAction | "" }[] = [
  { label: "All Actions",       value: "" },
  { label: "User Created",      value: "USER_CREATED" },
  { label: "User Deleted",      value: "USER_DELETED" },
  { label: "User Suspended",    value: "USER_SUSPENDED" },
  { label: "User Activated",    value: "USER_ACTIVATED" },
  { label: "User Updated",      value: "USER_UPDATED" },
  { label: "Expert Verified",   value: "EXPERT_VERIFIED" },
  { label: "TAS Tier Adjusted", value: "TAS_TIER_ADJUSTED" },
  { label: "Payout Processed",  value: "PAYOUT_PROCESSED" },
  { label: "Payout Rejected",   value: "PAYOUT_REJECTED" },
  { label: "Admin Login",       value: "ADMIN_LOGIN" },
  { label: "Admin Logout",      value: "ADMIN_LOGOUT" },
  { label: "Admin Created",     value: "ADMIN_CREATED" },
  { label: "Admin Deleted",     value: "ADMIN_DELETED" },
  { label: "Role Updated",      value: "ROLE_UPDATED" },
  { label: "Report Exported",   value: "REPORT_EXPORTED" },
  { label: "Settings Updated",  value: "SETTINGS_UPDATED" },
  { label: "Job Deleted",       value: "JOB_DELETED" },
  { label: "Job Flagged",       value: "JOB_FLAGGED" },
  { label: "Dispute Resolved",  value: "DISPUTE_RESOLVED" },
];

const ADMIN_OPTIONS = [
  { label: "All Admins",           value: ""             },
  { label: "Super Admin",          value: "admin"        },
  { label: "Verification Officer", value: "verification" },
  { label: "Finance Admin",        value: "finance"      },
  { label: "Support Admin",        value: "support"      },
  { label: "View Only",            value: "view"         },
];

const DATE_OPTIONS = [
  { label: "Last 30 days", days: 30 },
  { label: "Today",        days: 0  },
  { label: "Last 7 days",  days: 7  },
  { label: "Last 90 days", days: 90 },
];

// ── Helpers ───────────────────────────────────────────────

const actionColorClasses = (action: string): string => {
  if (action.includes("DELETED") || action.includes("REJECTED"))
    return "text-red-600 bg-red-50 border-red-200";
  if (action.includes("SUSPENDED"))
    return "text-amber-600 bg-amber-50 border-amber-200";
  if (
    action.includes("CREATED") ||
    action.includes("ACTIVATED") ||
    action.includes("PROCESSED") ||
    action.includes("VERIFIED")
  )
    return "text-green-600 bg-green-50 border-green-200";
  if (action.includes("LOGIN") || action.includes("LOGOUT"))
    return "text-blue-600 bg-blue-50 border-blue-200";
  if (action.includes("UPDATED") || action.includes("ADJUSTED") || action.includes("RESOLVED"))
    return "text-violet-600 bg-violet-50 border-violet-200";
  return "text-text-muted bg-background border-border";
};

const fmtAction = (a: string) =>
  a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const fmtTimestamp = (ts: string) =>
  new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const isoDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split("T")[0];
};

// ── Sub-components ────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors duration-150 ${actionColorClasses(
        action
      )}`}
    >
      {fmtAction(action)}
    </span>
  );
}

function NativeSelect({ value, onChange, options }: {
  value:    string;
  onChange: (v: string) => void;
  options:  { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-[10px] border border-border bg-background py-2.25l-3.5 pr-9 text-[13px] text-text-main outline-none transition-colors duration-150 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.75 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function AuditLogsPage() {
  const dispatch   = useAppDispatch();
  const {
    logs, pagination, listStatus, listError,
    exportStatus, activeFilters,
  } = useAppSelector((s) => s.auditLogs);

  // Reverse once here so we never mutate the Redux state array
  const reversedLogs = [...logs].reverse();

  const [search,    setSearch]    = useState(activeFilters.search ?? "");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    dispatch(fetchAuditLogs(activeFilters));
  }, [dispatch, activeFilters]);

  useEffect(() => {
    if (exportStatus === "succeeded") {
      toast.success("Audit logs exported");
      dispatch(resetExportStatus());
      setExporting(false);
    }
    if (exportStatus === "failed") {
      toast.error("Export failed");
      dispatch(resetExportStatus());
      setExporting(false);
    }
  }, [exportStatus, dispatch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ search } as AuditLogsParams));
    }, 400);
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  const handleActionChange = useCallback((v: string) => {
    dispatch(setFilters({ action: v as AuditAction | "" } as AuditLogsParams));
  }, [dispatch]);

  const handleAdminChange = useCallback((v: string) => {
    dispatch(setFilters({ adminId: v } as AuditLogsParams));
  }, [dispatch]);

  const handleDateChange = useCallback((idx: number) => {
    const days = DATE_OPTIONS[idx].days;
    dispatch(setFilters({
      fromDate: isoDate(days),
      toDate:   isoDate(0),
    } as AuditLogsParams));
  }, [dispatch]);

  const handlePageChange = useCallback((p: number) => {
    dispatch(setPage(p));
  }, [dispatch]);

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(true);
    const result = await dispatch(exportAuditLogsThunk({ ...activeFilters, format }));
    if (exportAuditLogsThunk.fulfilled.match(result)) {
      const a = document.createElement("a");
      a.href = result.payload;
      a.download = `audit-logs-${isoDate(0)}.${format}`;
      a.click();
      URL.revokeObjectURL(result.payload);
    }
  };

  const page       = activeFilters.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const total      = pagination?.total ?? 0;
  const limit      = activeFilters.limit ?? 20;
  const from       = total === 0 ? 0 : (page - 1) * limit + 1;
  const to         = Math.min(page * limit, total);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <Topbar title="Audit Logs" />

      <div className="flex-1 px-4 py-5 sm:px-8 sm:py-6">

        {/* ── Page header ── */}
        <div className="mb-5 flex items-center justify-between">
          <p className="m-0 text-[13px] text-text-muted">
            All admin activity on the platform
          </p>
        </div>

        {/* ── Single card ── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">

          {/* Card header: filters + export */}
          <div className="flex flex-wrap items-center gap-2.5 border-b border-border/70 px-5 py-3.5">

            <div className="mr-1 flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-text-muted" />
              <span className="text-[13px] font-semibold text-text-main">Filter</span>
            </div>

            <div className="relative min-w-45 flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-background py-2.25 pl-9 pr-3.5 text-[13px] text-text-main outline-none transition-colors duration-150 placeholder:text-gray-400 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <NativeSelect
              value={activeFilters.action ?? ""}
              onChange={handleActionChange}
              options={ACTION_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />

            <NativeSelect
              value={activeFilters.adminId ?? ""}
              onChange={handleAdminChange}
              options={ADMIN_OPTIONS}
            />

            <NativeSelect
              value="0"
              onChange={(v) => handleDateChange(Number(v))}
              options={DATE_OPTIONS.map((o, i) => ({ label: o.label, value: String(i) }))}
            />

            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-border bg-background px-4 py-2.25 text-[13px] font-medium text-text-main transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Export
            </button>
          </div>

          {/* ── States ── */}
          {listStatus === "loading" && (
            <div className="flex items-center justify-center gap-2.5 px-16 py-16 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[13px]">Loading audit logs...</span>
            </div>
          )}
          {listStatus === "failed" && (
            <div className="px-12 py-12 text-center">
              <p className="mb-3 text-[13px] text-red-500">
                {listError ?? "Failed to load audit logs."}
              </p>
              <button
                onClick={() => dispatch(fetchAuditLogs(activeFilters))}
                className="rounded-lg border border-border bg-surface px-4.5 py-2 text-[13px] text-text-main transition-colors duration-150 hover:bg-background active:scale-[0.97]"
              >
                Retry
              </button>
            </div>
          )}

          {(listStatus === "succeeded" || listStatus === "idle") && (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Timestamp", "Admin", "Action", "Details", "IP"].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap border-b-2 border-border bg-background px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reversedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center text-sm text-gray-400">
                          No audit logs found.
                        </td>
                      </tr>
                    ) : reversedLogs.map((log: AuditLog) => (
                      <tr
                        key={log.id}
                        className="transition-colors duration-150 hover:bg-gray-50/80"
                      >
                        <td className="min-w-32.5 whitespace-nowrap border-b border-gray-100 px-5 py-3.5 text-[12px] text-text-muted">
                          {fmtTimestamp(log.timestamp)}
                        </td>
                        <td className="min-w-35 border-b border-gray-100 px-5 py-3.5">
                          <p className="m-0 text-[13px] font-semibold text-text-main">
                            {log.adminEmail.split("@")[0]}@
                          </p>
                          <p className="m-0 text-[11px] text-gray-400">
                            {log.adminName}
                          </p>
                        </td>
                        <td className="min-w-37.5 border-b border-gray-100 px-5 py-3.5">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="max-w-75 border-b border-gray-100 px-5 py-3.5 text-[12px] leading-relaxed text-text-main">
                          {log.details}
                        </td>
                        <td className="whitespace-nowrap border-b border-gray-100 px-5 py-3.5 font-mono text-[12px] text-text-muted">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-2.5 bg-background p-3 md:hidden">
                {reversedLogs.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[13px] text-gray-400">
                    No audit logs found.
                  </p>
                ) : reversedLogs.map((log: AuditLog) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-border bg-surface px-4 py-3.5 transition-shadow duration-150 hover:shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="m-0 mb-0.5 text-[13px] font-semibold text-text-main">
                          {log.adminName}
                        </p>
                        <p className="m-0 text-[11px] text-gray-400">
                          {fmtTimestamp(log.timestamp)}
                        </p>
                      </div>
                      <ActionBadge action={log.action} />
                    </div>
                    <p className="m-0 mb-2 text-[12px] leading-relaxed text-text-main">
                      {log.details}
                    </p>
                    <div className="flex justify-between border-t border-gray-100 pt-2 text-[11px] text-gray-400">
                      <span>{log.targetId ?? "—"}</span>
                      <span className="font-mono">{log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-gray-100 px-5 py-3">

                <div className="flex gap-4">
                  {(["Export Logs", "Filter by User", "Filter by Action"] as const).map((lbl) => (
                    <button
                      key={lbl}
                      onClick={() => lbl === "Export Logs" && handleExport("csv")}
                      className="border-none bg-transparent p-0 text-[12px] font-medium text-primary transition-opacity duration-150 hover:opacity-70"
                    >
                      [{lbl}]
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-text-muted">
                    {total === 0 ? "No results" : `${from}–${to} of ${total}`}
                  </span>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="rounded-[7px] border border-border bg-surface px-3 py-1 text-[12px] text-text-muted transition-all duration-150 hover:bg-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface"
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`h-7.5 w-7.5 rounded-[7px] text-[12px] transition-all duration-150 ${
                        p === page
                          ? "bg-primary font-bold text-white"
                          : "border border-border bg-surface font-normal text-text-muted hover:bg-background"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="rounded-[7px] border border-border bg-surface px-3 py-1 text-[12px] text-text-muted transition-all duration-150 hover:bg-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}