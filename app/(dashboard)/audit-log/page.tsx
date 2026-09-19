/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Download, ChevronDown, SlidersHorizontal } from "lucide-react";
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

const actionColor = (action: string): { color: string; bg: string; border: string } => {
  if (action.includes("DELETED")    || action.includes("REJECTED"))
    return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
  if (action.includes("SUSPENDED"))
    return { color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  if (action.includes("CREATED")    || action.includes("ACTIVATED")
    || action.includes("PROCESSED") || action.includes("VERIFIED"))
    return { color: "#16a34a", bg: "#f0fdf4", border: "#86efac" };
  if (action.includes("LOGIN")      || action.includes("LOGOUT"))
    return { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  if (action.includes("UPDATED")    || action.includes("ADJUSTED") || action.includes("RESOLVED"))
    return { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" };
  return { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" };
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

// ── Styles ────────────────────────────────────────────────

const TH: React.CSSProperties = {
  textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 700,
  color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em",
  borderBottom: "2px solid #E5E7EB", whiteSpace: "nowrap", backgroundColor: "#F9FAFB",
};
const TD: React.CSSProperties = {
  padding: "14px 20px", fontSize: "13px", color: "#374151",
  borderBottom: "1px solid #F3F4F6", verticalAlign: "middle",
};

// ── Sub-components ────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const { color, bg, border } = actionColor(action);
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px",
      borderRadius: "20px", whiteSpace: "nowrap", display: "inline-block",
      color, backgroundColor: bg, border: `1px solid ${border}` }}>
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
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: "9px 36px 9px 14px", borderRadius: "10px", fontSize: "13px",
          border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#374151",
          outline: "none", appearance: "none", cursor: "pointer" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: "11px", top: "50%",
        transform: "translateY(-50%)", color: "#6B7280", pointerEvents: "none" }} />
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
    <div style={{ display:"flex", flexDirection:"column", flex:1, backgroundColor:"#F9FAFB" }}>
      <Topbar title="Audit Logs" />

      <style>{`
        .al-wrap    { padding: 20px 16px; }
        @media (min-width:640px) { .al-wrap { padding: 24px 32px; } }
        .al-mobile  { display: flex; flex-direction: column; gap: 10px; }
        .al-desktop { display: none; }
        @media (min-width:860px) { .al-desktop { display:block; } .al-mobile { display:none; } }
      `}</style>

      <div className="al-wrap" style={{ flex:1 }}>

        {/* ── Page header ── */}
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:"20px" }}>
          <p style={{ fontSize:"13px", color:"#6B7280", margin:0 }}>
            All admin activity on the platform
          </p>
        </div>

        {/* ── Single card ── */}
        <div style={{ backgroundColor:"#fff", borderRadius:"16px",
          border:"1px solid #E5E7EB", overflow:"hidden" }}>

          {/* Card header: filters + export */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6",
            display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>

            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginRight:"4px" }}>
              <SlidersHorizontal size={14} color="#6B7280" />
              <span style={{ fontSize:"13px", fontWeight:600, color:"#374151" }}>Filter</span>
            </div>

            <div style={{ position:"relative", flex:1, minWidth:"180px" }}>
              <svg style={{ position:"absolute", left:"13px", top:"50%",
                transform:"translateY(-50%)", color:"#9CA3AF" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width:"100%", paddingLeft:"36px", paddingRight:"14px",
                  paddingTop:"9px", paddingBottom:"9px", borderRadius:"10px",
                  fontSize:"13px", border:"1px solid #E5E7EB", backgroundColor:"#F9FAFB",
                  outline:"none", color:"#111827", boxSizing:"border-box" }}
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

            <button onClick={() => handleExport("csv")} disabled={exporting}
              style={{ display:"flex", alignItems:"center", gap:"6px",
                padding:"9px 16px", borderRadius:"10px", fontSize:"13px", fontWeight:500,
                border:"1px solid #E5E7EB", backgroundColor:"#F9FAFB", color:"#374151",
                cursor:"pointer", opacity: exporting ? 0.7 : 1, whiteSpace:"nowrap",
                marginLeft:"auto" }}>
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Export
            </button>
          </div>

          {/* ── States ── */}
          {listStatus === "loading" && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
              padding:"64px", gap:"10px", color:"#9CA3AF" }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize:"13px" }}>Loading audit logs...</span>
            </div>
          )}
          {listStatus === "failed" && (
            <div style={{ textAlign:"center", padding:"48px" }}>
              <p style={{ fontSize:"13px", color:"#ef4444", marginBottom:"12px" }}>
                {listError ?? "Failed to load audit logs."}
              </p>
              <button
                onClick={() => dispatch(fetchAuditLogs(activeFilters))}
                style={{ padding:"8px 18px", borderRadius:"8px", fontSize:"13px",
                  border:"1px solid #E5E7EB", backgroundColor:"#fff",
                  color:"#374151", cursor:"pointer" }}>
                Retry
              </button>
            </div>
          )}

          {(listStatus === "succeeded" || listStatus === "idle") && (
            <>
              {/* Desktop table */}
              <div className="al-desktop" style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={TH}>Timestamp</th>
                      <th style={TH}>Admin</th>
                      <th style={TH}>Action</th>
                      <th style={TH}>Details</th>
                      <th style={TH}>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reversedLogs.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign:"center", padding:"56px",
                        fontSize:"14px", color:"#9CA3AF" }}>No audit logs found.</td></tr>
                    ) : reversedLogs.map((log: AuditLog) => (
                      <tr key={log.id}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                        <td style={{ ...TD, color:"#6B7280", fontSize:"12px",
                          whiteSpace:"nowrap", minWidth:"130px" }}>
                          {fmtTimestamp(log.timestamp)}
                        </td>
                        <td style={{ ...TD, minWidth:"140px" }}>
                          <p style={{ fontWeight:600, color:"#111827", fontSize:"13px", margin:0 }}>
                            {log.adminEmail.split("@")[0]}@
                          </p>
                          <p style={{ fontSize:"11px", color:"#9CA3AF", margin:0 }}>
                            {log.adminName}
                          </p>
                        </td>
                        <td style={{ ...TD, minWidth:"150px" }}>
                          <ActionBadge action={log.action} />
                        </td>
                        <td style={{ ...TD, fontSize:"12px", color:"#374151",
                          lineHeight:1.6, maxWidth:"300px" }}>
                          {log.details}
                        </td>
                        <td style={{ ...TD, fontSize:"12px", color:"#6B7280",
                          fontFamily:"monospace", whiteSpace:"nowrap" }}>
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="al-mobile" style={{ padding:"12px", backgroundColor:"#F9FAFB" }}>
                {reversedLogs.length === 0 ? (
                  <p style={{ textAlign:"center", padding:"40px",
                    fontSize:"13px", color:"#9CA3AF" }}>No audit logs found.</p>
                ) : reversedLogs.map((log: AuditLog) => (
                  <div key={log.id} style={{ padding:"14px 16px", borderRadius:"12px",
                    border:"1px solid #E5E7EB", backgroundColor:"#fff" }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"flex-start", marginBottom:"8px" }}>
                      <div>
                        <p style={{ fontWeight:600, fontSize:"13px", color:"#111827", margin:"0 0 2px" }}>
                          {log.adminName}
                        </p>
                        <p style={{ fontSize:"11px", color:"#9CA3AF", margin:0 }}>
                          {fmtTimestamp(log.timestamp)}
                        </p>
                      </div>
                      <ActionBadge action={log.action} />
                    </div>
                    <p style={{ fontSize:"12px", color:"#374151", margin:"0 0 8px", lineHeight:1.5 }}>
                      {log.details}
                    </p>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      paddingTop:"8px", borderTop:"1px solid #F3F4F6",
                      fontSize:"11px", color:"#9CA3AF" }}>
                      <span>{log.targetId ?? "—"}</span>
                      <span style={{ fontFamily:"monospace" }}>{log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding:"12px 20px", borderTop:"1px solid #F3F4F6",
                display:"flex", flexWrap:"wrap", alignItems:"center",
                justifyContent:"space-between", gap:"10px" }}>

                <div style={{ display:"flex", gap:"16px" }}>
                  {(["Export Logs","Filter by User","Filter by Action"] as const).map((lbl) => (
                    <button key={lbl}
                      onClick={() => lbl === "Export Logs" && handleExport("csv")}
                      style={{ fontSize:"12px", color:"#2563eb", background:"none",
                        border:"none", cursor:"pointer", padding:0, fontWeight:500 }}>
                      [{lbl}]
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <span style={{ fontSize:"12px", color:"#6B7280" }}>
                    {total === 0 ? "No results" : `${from}–${to} of ${total}`}
                  </span>
                  <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                    style={{ padding:"5px 12px", borderRadius:"7px", fontSize:"12px",
                      border:"1px solid #E5E7EB", backgroundColor:"#fff", color:"#6B7280",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      opacity: page === 1 ? 0.4 : 1 }}>‹</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => handlePageChange(p)}
                      style={{ width:"30px", height:"30px", borderRadius:"7px", fontSize:"12px",
                        fontWeight: p === page ? 700 : 400,
                        border: p === page ? "none" : "1px solid #E5E7EB",
                        backgroundColor: p === page ? "#2563eb" : "#fff",
                        color: p === page ? "#fff" : "#6B7280", cursor:"pointer" }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
                    style={{ padding:"5px 12px", borderRadius:"7px", fontSize:"12px",
                      border:"1px solid #E5E7EB", backgroundColor:"#fff", color:"#6B7280",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                      opacity: page === totalPages ? 0.4 : 1 }}>›</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}