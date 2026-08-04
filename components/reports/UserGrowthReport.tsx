// app/(dashboard)/reports/components/UserGrowthReport.tsx
"use client";

import { useEffect, useState } from "react";
import { UserPlus, TrendingUp, TrendingDown, Users, Eye } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDetailedReport, downloadReport, setReportType, clearDownloadUrl } from "@/lib/redux/reportDetailSlice";
import type { ReportType, ReportFormat } from "@/lib/api/detailedReportApi";
import { colors, card, kpiCard, kpiLabel, kpiValue, th, thFirst, td, tdFirst } from "./shared";
import { ExportMenuButton } from "./ExportMenuButton";
import { SkelKPIRow, SkelChart, SkelTableRows, SkelCardRows } from "./Skeleton";
import DashboardLineChart from "./DashboardLineChart";
import { HorizontalBarList } from "./ChartBits";
import { pick, pickSummary, matchesFilter } from "./rowUtils";
import { userGrowthByRegion } from "./mockData";
import { RowDetailModal } from "./RowDetailModal";

const REPORT_TYPE: ReportType = "user-growth";

type Row = Record<string, unknown>;

const PERIOD_OPTIONS = ["July 2026", "June 2026", "May 2026", "Q2 2026"];
const USER_TYPE_OPTIONS = ["All User Types", "Clients", "Experts", "TAS"];
const REGION_OPTIONS = ["All Regions", "MN-W", "IS-E", "MN-N", "MN-E", "IS-N"];
const TIER_OPTIONS = ["All Tiers", "Tier 1", "Tier 2", "Tier 3"];

// Illustrative until the API exposes a trends endpoint (no time-series data in the confirmed response).
const growthTrend = [30, 55, 60, 65, 68, 90, 112];
const growthTrendLabels = ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];

function statusPill(status: string) {
  const s = status.toLowerCase();
  const map: Record<string, { bg: string; fg: string }> = {
    active: { bg: colors.greenBg, fg: colors.green },
    pending: { bg: colors.amberBg, fg: colors.amber },
    suspended: { bg: colors.redBg, fg: colors.red },
  };
  const c = map[s] ?? { bg: "#F3F4F6", fg: colors.textMuted };
  return <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

export default function UserGrowthReport() {
  const dispatch = useAppDispatch();
  const { summary, rows, listStatus, downloadStatus } = useAppSelector((s) => s.reportDetail);

  useEffect(() => {
    dispatch(setReportType(REPORT_TYPE));
    dispatch(fetchDetailedReport({ reportType: REPORT_TYPE }));
  }, [dispatch]);

  const [period, setPeriod] = useState("July 2026");
  const [userType, setUserType] = useState("All User Types");
  const [region, setRegion] = useState("All Regions");
  const [tier, setTier] = useState("All Tiers");
  const [selected, setSelected] = useState<Row | null>(null);

  const loading = listStatus === "loading" || listStatus === "idle";

  const handleExport = async (format: ReportFormat) => {
    const action = await dispatch(downloadReport({ reportType: REPORT_TYPE, format }));
    if (downloadReport.fulfilled.match(action)) {
      const a = document.createElement("a");
      a.href = action.payload;
      a.download = `user-growth_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      dispatch(clearDownloadUrl());
    }
  };

  const filtered = (rows as Row[]).filter((r) => {
    if (userType !== "All User Types" && !matchesFilter(pick(r, ["userType", "type"]), userType)) return false;
    if (region !== "All Regions" && !matchesFilter(pick(r, ["region"]), region)) return false;
    if (tier !== "All Tiers" && !matchesFilter(pick(r, ["tier"]), tier.replace("Tier ", ""))) return false;
    return true;
  });

  // growthRate / churnRate / activeUsers are confirmed NOT present in this
  // endpoint's summary yet — shown as "—" until the backend adds them,
  // same pattern as every other report screen's KPI cards.
  const kpiNewUsers = pickSummary(summary, ["newUsers"]);
  const kpiGrowthRate = pickSummary(summary, ["growthRate"]);
  const kpiChurnRate = pickSummary(summary, ["churnRate"]);
  const kpiActiveUsers = pickSummary(summary, ["activeUsers"]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {selected && (
        <RowDetailModal title="User Detail" row={selected} onClose={() => setSelected(null)} />
      )}

      {/* Controls */}
      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select className="rp-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="rp-select" value={userType} onChange={(e) => setUserType(e.target.value)}>
            {USER_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="rp-select" value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="rp-select" value={tier} onChange={(e) => setTier(e.target.value)}>
            {TIER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: colors.textFaint }}>Compared to previous period</span>
          <ExportMenuButton onExport={handleExport} exporting={downloadStatus === "loading"} />
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><UserPlus size={13} /> New Users</span>
            <span style={kpiValue}>{kpiNewUsers != null ? kpiNewUsers.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><TrendingUp size={13} /> Growth Rate</span>
            <span style={kpiValue}>{kpiGrowthRate != null ? `${kpiGrowthRate}%` : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><TrendingDown size={13} /> Churn Rate</span>
            <span style={kpiValue}>{kpiChurnRate != null ? `${kpiChurnRate}%` : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Users size={13} /> Active Users</span>
            <span style={kpiValue}>{kpiActiveUsers != null ? kpiActiveUsers.toLocaleString() : "—"}</span>
          </div>
        </div>
      )}

      {/* Trend chart — illustrative until a trends endpoint exists */}
      {loading ? (
        <SkelChart height={170} />
      ) : (
        <div style={card}>
          <div style={{ padding: "20px 20px 20px" }}>
            <DashboardLineChart
              title="User Growth Trends (Last 30 Days)"
              yLabel="New Users"
              xLabel="Day"
              color={colors.primary}
              data={growthTrend}
              labels={growthTrendLabels}
              yStep={50}
            />
          </div>
        </div>
      )}

      {/* New users table */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0 }}>Expert Details — New Experts ({period})</p>
        </div>

        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["Name", "Phone", "Email", "Tier", "Model", "Category", "Region", "Joined", "Status", "Actions"].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={7} cols={10} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: colors.textFaint }}>No new users in this period.</td></tr>
              ) : filtered.map((e, i) => (
                <tr key={pick(e, ["id", "_id", "email"], String(i))} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>{pick(e, ["name", "fullName"])}</td>
                  <td style={td}>{pick(e, ["phone", "phoneNumber"])}</td>
                  <td style={td}>{pick(e, ["email"])}</td>
                  <td style={td}>{pick(e, ["tier"])}</td>
                  <td style={td}>{pick(e, ["paymentModel", "model"])}</td>
                  <td style={td}>{pick(e, ["category"])}</td>
                  <td style={td}>{pick(e, ["region"])}</td>
                  <td style={td}>{pick(e, ["joined", "createdAt"])}</td>
                  <td style={td}>{statusPill(pick(e, ["status"]))}</td>
                  <td style={td}>
                    <Eye size={15} style={{ color: colors.textFaint, cursor: "pointer" }} onClick={() => setSelected(e)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : filtered.map((e, i) => (
            <div key={pick(e, ["id", "_id", "email"], String(i))} onClick={() => setSelected(e)} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{pick(e, ["name", "fullName"])}</span>
                {statusPill(pick(e, ["status"]))}
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{pick(e, ["category"])} · {pick(e, ["region"])} · Tier {pick(e, ["tier"])}</p>
            </div>
          ))}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to {filtered.length} of {filtered.length} new experts
          </div>
        )}
      </div>

      {/* Growth by region — no backend aggregation exists yet; kept as an illustrative placeholder. */}
      {loading ? <SkelChart height={140} /> : (
        <div style={card}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 4px" }}>
            User Growth by Region ({period})
          </p>
          <p style={{ fontSize: "11.5px", color: colors.textFaint, margin: "0 20px 10px" }}>Illustrative — pending a backend region breakdown.</p>
          <div style={{ padding: "0 20px 20px" }}>
            <HorizontalBarList data={userGrowthByRegion} color={colors.primary} />
          </div>
        </div>
      )}
    </div>
  );
}