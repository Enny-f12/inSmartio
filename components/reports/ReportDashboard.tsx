// components/ReportDashboard.tsx
"use client";

import { useState } from "react";
import { Users, Briefcase, Wallet, UserCog, Download, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { colors, kpiCard, kpiLabel, kpiValue, kpiDelta, card, exportBtn, fmtNaira } from "./shared";
import { SkelKPIRow, SkelChart, SkelCardRows } from "./Skeleton";
import DashboardLineChart from "./DashboardLineChart";
import { useSimulatedLoad } from "./useSimulatedLoad";
import { dashboardKPIs, revenueTrend, revenueTrendLabels, quickReports, recentActivity } from "./mockData";
import type { ReportKey } from "./ReportPicker";

const RANGE_OPTIONS = ["Last 7 Days", "Last 30 Days", "This Month", "Last Quarter", "Custom"];

export default function ReportDashboard({ onNavigate }: { onNavigate: (key: ReportKey) => void }) {
  const [range, setRange] = useState("Last 30 Days");
  const loading = useSimulatedLoad([range]);

  const kpis = [
    { label: "Total Users", icon: <Users size={13} />, ...dashboardKPIs.totalUsers, fmt: (v: number) => v.toLocaleString() },
    { label: "Jobs", icon: <Briefcase size={13} />, ...dashboardKPIs.jobs, fmt: (v: number) => v.toLocaleString() },
    { label: "Revenue", icon: <Wallet size={13} />, ...dashboardKPIs.revenue, fmt: (v: number) => fmtNaira(v) },
    { label: "TAS Agents", icon: <UserCog size={13} />, ...dashboardKPIs.tasAgents, fmt: (v: number) => v.toLocaleString() },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Range + actions */}
      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
        <select
          className="rp-select"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {RANGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={exportBtn("ghost")}><Download size={13} /> Export All</button>
          <button style={exportBtn("primary")}><Plus size={13} /> New Report</button>
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          {kpis.map((k) => (
            <div key={k.label} style={kpiCard}>
              <span style={kpiLabel}>{k.icon} {k.label}</span>
              <span style={kpiValue}>{k.fmt(k.value)}</span>
              <span style={kpiDelta(k.delta >= 0)}>
                {k.delta >= 0 ? <ArrowUp size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> : <ArrowDown size={11} style={{ display: "inline", verticalAlign: "-1px" }} />}
                {" "}{Math.abs(k.delta)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Revenue trend */}
      {loading ? (
        <SkelChart height={180} />
      ) : (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px 0" }}>
            <button style={{ ...exportBtn("ghost"), padding: "5px 10px" }}><Download size={12} /> Export</button>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <DashboardLineChart
              title={`Revenue Trends (${range})`}
              yLabel="Revenue"
              xLabel="Day"
              color={colors.primary}
              data={revenueTrend}
              labels={revenueTrendLabels}
              statValue={fmtNaira(dashboardKPIs.revenue.value)}
            />
          </div>
        </div>
      )}

      {/* Quick reports + recent activity */}
      <div className="rp-two-col" style={{ display: "grid", gap: "16px" }}>
        <div style={card}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 10px" }}>
            Quick Reports
          </p>
          {loading ? (
            <SkelCardRows rows={5} />
          ) : (
            <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
              {quickReports.map((r) => (
                <button
                  key={r}
                  onClick={() => onNavigate(mapQuickReport(r))}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: "8px", border: "none",
                    background: "none", cursor: "pointer", fontSize: "13px",
                    color: colors.textMain, fontWeight: 500, textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {r}
                  <span style={{ color: colors.textFaint, fontSize: "12px" }}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 10px" }}>
            Recent Activity
          </p>
          {loading ? (
            <SkelCardRows rows={5} />
          ) : (
            <div style={{ padding: "4px 20px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: colors.primary, marginTop: "6px", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", color: colors.textMain, margin: 0 }}>{a.text}</p>
                    {a.meta && <p style={{ fontSize: "12px", color: colors.textMuted, margin: "2px 0 0", fontWeight: 600 }}>{a.meta}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function mapQuickReport(label: string): ReportKey {
  const map: Record<string, ReportKey> = {
    "User Growth": "user-growth",
    "Expert Details": "experts",
    "Verification Queue": "verification",
    "Revenue Summary": "dashboard",
    "Job Completion": "dashboard",
    "TAS Performance": "tas-performance",
    "Dispute Analysis": "dashboard",
  };
  return map[label] ?? "dashboard";
}