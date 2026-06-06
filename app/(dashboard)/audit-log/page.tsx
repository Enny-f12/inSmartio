/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, ChevronDown, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/Navbar";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchAuditLogs, exportAuditLogsThunk,
  setFilters, setPage, resetExportStatus,
} from "@/lib/redux/auditlogSlice";
import type { AuditAction, AuditLog, AuditLogsParams } from "@/lib/api/auditlogApi";

// ── Mock data (flip USE_MOCK=false once backend is ready) ─
const MOCK_LOGS: AuditLog[] = [
  { id:"LOG-001", timestamp:"2026-03-25T10:30:00.000Z", adminId:"admin",        adminName:"John Smith",    adminEmail:"john@adm.com",  action:"USER_SUSPENDED",    details:"User: EXP-001",                              targetId:"EXP-001",  targetType:"user",    ipAddress:"1.2.3.4" },
  { id:"LOG-002", timestamp:"2026-03-25T09:15:00.000Z", adminId:"verification", adminName:"Mary Johnson",  adminEmail:"mary@adm.com",  action:"TAS_TIER_ADJUSTED", details:"TAS: TAS-001",                               targetId:"TAS-001",  targetType:"tas",     ipAddress:"1.2.4.5" },
  { id:"LOG-003", timestamp:"2026-03-24T14:00:00.000Z", adminId:"finance",      adminName:"David Okafor",  adminEmail:"david@adm.com", action:"PAYOUT_PROCESSED",  details:"Amount: ₦1.2M",                              targetId:"PAY-009",  targetType:"payout",  ipAddress:"1.2.5.6" },
  { id:"LOG-004", timestamp:"2026-03-24T11:20:00.000Z", adminId:"admin",        adminName:"John Smith",    adminEmail:"john@adm.com",  action:"USER_CREATED",      details:"User: CLT-045 created",                      targetId:"CLT-045",  targetType:"user",    ipAddress:"1.2.3.4" },
  { id:"LOG-005", timestamp:"2026-03-23T16:45:00.000Z", adminId:"verification", adminName:"Mary Johnson",  adminEmail:"mary@adm.com",  action:"EXPERT_VERIFIED",   details:"Expert EXP-022 verified (Tier 2)",           targetId:"EXP-022",  targetType:"user",    ipAddress:"1.2.4.5" },
  { id:"LOG-006", timestamp:"2026-03-23T09:00:00.000Z", adminId:"support",      adminName:"Tunde Balogun", adminEmail:"tunde@adm.com", action:"ADMIN_LOGIN",       details:"Admin logged in",                            targetId:undefined,  targetType:undefined, ipAddress:"1.2.5.6" },
  { id:"LOG-007", timestamp:"2026-03-22T13:30:00.000Z", adminId:"admin",        adminName:"John Smith",    adminEmail:"john@adm.com",  action:"USER_DELETED",      details:"User CLT-012 deleted",                       targetId:"CLT-012",  targetType:"user",    ipAddress:"1.2.3.4" },
  { id:"LOG-008", timestamp:"2026-03-22T10:10:00.000Z", adminId:"admin",        adminName:"John Smith",    adminEmail:"john@adm.com",  action:"ROLE_UPDATED",      details:"Role updated for ADM-004",                   targetId:"ADM-004",  targetType:"admin",   ipAddress:"1.2.4.5" },
  { id:"LOG-009", timestamp:"2026-03-21T15:00:00.000Z", adminId:"support",      adminName:"Tunde Balogun", adminEmail:"tunde@adm.com", action:"DISPUTE_RESOLVED",  details:"Dispute DSP-007 resolved in favour of client",targetId:"DSP-007", targetType:"dispute", ipAddress:"1.2.3.4" },
  { id:"LOG-010", timestamp:"2026-03-21T08:55:00.000Z", adminId:"finance",      adminName:"David Okafor",  adminEmail:"david@adm.com", action:"PAYOUT_REJECTED",   details:"Payout PAY-010 rejected — insufficient docs",targetId:"PAY-010",  targetType:"payout",  ipAddress:"1.2.5.6" },
];

const USE_MOCK = true;

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

// ── Admin roles matching your role map ────────────────────
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

const PAGE_SIZE = 10;

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
  const reduxState = useAppSelector((s) => s.auditLogs);

  const [actionFilter,  setActionFilter]  = useState<AuditAction | "">("");
  const [adminFilter,   setAdminFilter]   = useState("");
  const [datePresetIdx, setDatePresetIdx] = useState(0);
  const [exporting,     setExporting]     = useState(false);
  const [page,          setLocalPage]     = useState(1);

  const useMock    = USE_MOCK;
  const rawLogs    = useMock ? MOCK_LOGS : reduxState.logs;
  const listStatus = useMock ? "succeeded" as const : reduxState.listStatus;
  const listError  = useMock ? null                 : reduxState.listError;
  const expStatus  = useMock ? "idle"    as const   : reduxState.exportStatus;

  useEffect(() => {
    if (!useMock && reduxState.listStatus === "idle")
      dispatch(fetchAuditLogs(reduxState.activeFilters));
  }, [dispatch, useMock, reduxState.listStatus, reduxState.activeFilters]);

  useEffect(() => {
    if (expStatus === "succeeded") { toast.success("Audit logs exported"); dispatch(resetExportStatus()); setExporting(false); }
    if (expStatus === "failed")    { toast.error("Export failed");         dispatch(resetExportStatus()); setExporting(false); }
  }, [expStatus, dispatch]);

  // Client-side filter on mock data
  const filtered = rawLogs.filter((log) => {
    if (actionFilter && log.action  !== actionFilter) return false;
    if (adminFilter  && log.adminId !== adminFilter)  return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  useEffect(() => { setLocalPage(1); }, [actionFilter, adminFilter, datePresetIdx]);

  const handleActionChange = (v: string) => {
    setActionFilter(v as AuditAction | "");
    if (!useMock) dispatch(setFilters({ action: v as AuditAction | "" } as AuditLogsParams));
  };
  const handleAdminChange = (v: string) => {
    setAdminFilter(v);
    if (!useMock) dispatch(setFilters({ adminId: v } as AuditLogsParams));
  };
  const handleDateChange = (idx: number) => {
    setDatePresetIdx(idx);
    if (!useMock) {
      const days = DATE_OPTIONS[idx].days;
      dispatch(setFilters({ fromDate: isoDate(days), toDate: isoDate(0) } as AuditLogsParams));
    }
  };
  const handleExport = async (format: "csv" | "pdf") => {
    if (useMock) { toast.success(`Mock export as ${format.toUpperCase()}`); return; }
    setExporting(true);
    const result = await dispatch(exportAuditLogsThunk({ ...reduxState.activeFilters, format }));
    if (exportAuditLogsThunk.fulfilled.match(result)) {
      const a = document.createElement("a");
      a.href = result.payload; a.download = `audit-logs-${isoDate(0)}.${format}`; a.click();
      URL.revokeObjectURL(result.payload);
    }
  };
  const handlePageChange = (p: number) => { setLocalPage(p); if (!useMock) dispatch(setPage(p)); };

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

        {/* ── Single card — Filter header + table ── */}
        <div style={{ backgroundColor:"#fff", borderRadius:"16px",
          border:"1px solid #E5E7EB", overflow:"hidden" }}>

          {/* Card header row: "Filter" label + controls + Export */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6",
            display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>

            {/* Left: Filter label + icon */}
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginRight:"4px" }}>
              <SlidersHorizontal size={14} color="#6B7280" />
              <span style={{ fontSize:"13px", fontWeight:600, color:"#374151" }}>Filter</span>
            </div>

            {/* Search box — stretches */}
            <div style={{ position:"relative", flex:1, minWidth:"180px" }}>
              <svg style={{ position:"absolute", left:"13px", top:"50%",
                transform:"translateY(-50%)", color:"#9CA3AF" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search name..."
                style={{ width:"100%", paddingLeft:"36px", paddingRight:"14px",
                  paddingTop:"9px", paddingBottom:"9px", borderRadius:"10px",
                  fontSize:"13px", border:"1px solid #E5E7EB", backgroundColor:"#F9FAFB",
                  outline:"none", color:"#111827", boxSizing:"border-box" }} />
            </div>

            {/* Action dropdown */}
            <NativeSelect
              value={actionFilter}
              onChange={handleActionChange}
              options={ACTION_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />

            {/* Admin role dropdown */}
            <NativeSelect
              value={adminFilter}
              onChange={handleAdminChange}
              options={ADMIN_OPTIONS}
            />

            {/* Date dropdown */}
            <NativeSelect
              value={String(datePresetIdx)}
              onChange={(v) => handleDateChange(Number(v))}
              options={DATE_OPTIONS.map((o, i) => ({ label: o.label, value: String(i) }))}
            />

            {/* Export button — right-most, matches users page style */}
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
            <p style={{ textAlign:"center", padding:"48px", fontSize:"13px", color:"#ef4444" }}>
              {listError ?? "Failed to load audit logs."}
            </p>
          )}

          {listStatus === "succeeded" && (
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
                    {paginated.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign:"center", padding:"56px",
                        fontSize:"14px", color:"#9CA3AF" }}>No audit logs found.</td></tr>
                    ) : paginated.map((log) => (
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
                {paginated.length === 0 ? (
                  <p style={{ textAlign:"center", padding:"40px",
                    fontSize:"13px", color:"#9CA3AF" }}>No audit logs found.</p>
                ) : paginated.map((log) => (
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

                {/* Spec footer links */}
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
                    {filtered.length === 0 ? "No results" : `${from}–${to} of ${filtered.length}`}
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