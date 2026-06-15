"use client";

// components/dashboard/AuditLogsWidget.tsx
// Drop this into your dashboard page alongside your stats cards.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, ArrowRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchRecentAuditLogs } from "@/lib/redux/auditlogSlice";

// ── Helpers ───────────────────────────────────────────────

const actionColor = (action: string): { color: string; bg: string } => {
  if (action.includes("DELETED")  || action.includes("REJECTED"))
    return { color: "#dc2626", bg: "#fef2f2" };
  if (action.includes("SUSPENDED"))
    return { color: "#d97706", bg: "#fffbeb" };
  if (action.includes("CREATED")  || action.includes("ACTIVATED")
    || action.includes("PROCESSED") || action.includes("VERIFIED"))
    return { color: "#16a34a", bg: "#f0fdf4" };
  if (action.includes("LOGIN")    || action.includes("LOGOUT"))
    return { color: "#2563eb", bg: "#eff6ff" };
  return { color: "#6B7280", bg: "#F9FAFB" };
};

const fmtAction = (a: string) =>
  a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const fmtTime = (ts: string) =>
  new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

// ── Widget ────────────────────────────────────────────────

export default function AuditLogsWidget() {
  const dispatch    = useAppDispatch();
  const router      = useRouter();
  const { recentLogs, recentStatus } = useAppSelector((s) => s.auditLogs);

  useEffect(() => {
    if (recentStatus === "idle") dispatch(fetchRecentAuditLogs());
  }, [dispatch, recentStatus]);

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "16px",
      border: "1px solid #E5E7EB", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: 30, height: 30, borderRadius: "8px", backgroundColor: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={15} color="#2563eb" />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>Recent Activity</span>
        </div>
        <button onClick={() => router.push("/audit-logs")}
          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px",
            fontWeight: 500, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
          View All <ArrowRight size={13} />
        </button>
      </div>

      {/* Body */}
      {recentStatus === "loading" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          padding: "40px", gap: "8px", color: "#9CA3AF" }}>
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontSize: "13px" }}>Loading...</span>
        </div>
      )}

      {recentStatus === "failed" && (
        <p style={{ textAlign: "center", padding: "32px",
          fontSize: "13px", color: "#ef4444" }}>Failed to load recent activity.</p>
      )}

      {recentStatus === "succeeded" && (
        <div>
          {recentLogs.length === 0 ? (
            <p style={{ textAlign: "center", padding: "32px",
              fontSize: "13px", color: "#9CA3AF" }}>No recent activity.</p>
          ) : recentLogs.map((log, i) => {
            const { color, bg } = actionColor(log.action);
            return (
              <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "14px 20px",
                borderBottom: i < recentLogs.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                {/* Dot */}
                <div style={{ width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: color, flexShrink: 0, marginTop: "5px" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px",
                      borderRadius: "20px", color, backgroundColor: bg, whiteSpace: "nowrap" }}>
                      {fmtAction(log.action)}
                    </span>
                    <span style={{ fontSize: "11px", color: "#9CA3AF",
                      whiteSpace: "nowrap", flexShrink: 0 }}>
                      {fmtTime(log.timestamp)}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#374151", margin: "0 0 2px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.details}
                  </p>
                  <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>
                    by {log.adminName}
                    {log.ipAddress && <span style={{ marginLeft: "6px", fontFamily: "monospace" }}>· {log.ipAddress}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}