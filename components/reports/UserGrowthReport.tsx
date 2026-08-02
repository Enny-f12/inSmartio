// components/UserGrowthReport.tsx
"use client";

import { useState } from "react";
import { UserPlus, TrendingUp, TrendingDown, Users, Download, Eye, Pencil } from "lucide-react";
import { colors, card, kpiCard, kpiLabel, kpiValue, kpiDelta, th, thFirst, td, tdFirst, exportBtn } from "./shared";
import { SkelKPIRow, SkelChart, SkelTableRows, SkelCardRows } from "./Skeleton";
import DashboardLineChart from "./DashboardLineChart";
import { HorizontalBarList } from "./ChartBits";
import { useSimulatedLoad } from "./useSimulatedLoad";
import { experts, userGrowthKPIs, userGrowthByRegion } from "./mockData";

const PERIOD_OPTIONS = ["July 2026", "June 2026", "May 2026", "Q2 2026"];
const USER_TYPE_OPTIONS = ["All User Types", "Clients", "Experts", "TAS"];
const REGION_OPTIONS = ["All Regions", "MN-W", "IS-E", "MN-N", "MN-E", "IS-N"];
const TIER_OPTIONS = ["All Tiers", "Tier 1", "Tier 2", "Tier 3"];

const growthTrend = [30, 55, 60, 65, 68, 90, 112];
const growthTrendLabels = ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];

function statusPill(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    Active: { bg: colors.greenBg, fg: colors.green },
    Pending: { bg: colors.amberBg, fg: colors.amber },
    Suspended: { bg: colors.redBg, fg: colors.red },
  };
  const c = map[status] ?? { bg: "#F3F4F6", fg: colors.textMuted };
  return <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

export default function UserGrowthReport() {
  const [period, setPeriod] = useState("July 2026");
  const [userType, setUserType] = useState("All User Types");
  const [region, setRegion] = useState("All Regions");
  const [tier, setTier] = useState("All Tiers");
  const loading = useSimulatedLoad([period, userType, region, tier]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
        <span style={{ fontSize: "12px", color: colors.textFaint, alignSelf: "center" }}>Compared to previous period</span>
      </div>

      {/* KPIs */}
      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><UserPlus size={13} /> New Users</span>
            <span style={kpiValue}>{userGrowthKPIs.newUsers.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 18%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><TrendingUp size={13} /> Growth Rate</span>
            <span style={kpiValue}>+{userGrowthKPIs.growthRate}%</span>
            <span style={kpiDelta(true)}>↑ 5%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><TrendingDown size={13} /> Churn Rate</span>
            <span style={kpiValue}>{userGrowthKPIs.churnRate}%</span>
            <span style={kpiDelta(false)}>↓ 2%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Users size={13} /> Active Users</span>
            <span style={kpiValue}>{userGrowthKPIs.activeUsers.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 15%</span>
          </div>
        </div>
      )}

      {/* Trend chart */}
      {loading ? (
        <SkelChart height={170} />
      ) : (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "14px 20px 0", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px", fontSize: "11.5px", color: colors.textMuted, alignItems: "center" }}>
              <Legend color={colors.primary} label="Clients" />
              <Legend color="#10B981" label="Experts" />
              <Legend color="#F59E0B" label="TAS" />
            </div>
            <button style={{ ...exportBtn("ghost"), padding: "5px 10px" }}><Download size={12} /> Export</button>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <DashboardLineChart
              title="User Growth Trends (Last 30 Days)"
              yLabel="New Users"
              xLabel="Day"
              color={colors.primary}
              data={growthTrend}
              labels={growthTrendLabels}
              statValue={`${userGrowthKPIs.newUsers.toLocaleString()} users`}
            />
          </div>
        </div>
      )}

      {/* New experts table */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0 }}>Expert Details — New Experts ({period})</p>
          <button style={exportBtn()}><Download size={13} /> Export</button>
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
              ) : experts.map((e) => (
                <tr key={e.email} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>{e.name}</td>
                  <td style={td}>{e.phone}</td>
                  <td style={td}>{e.email}</td>
                  <td style={td}>{e.tier}</td>
                  <td style={td}>{e.model}</td>
                  <td style={td}>{e.category}</td>
                  <td style={td}>{e.region}</td>
                  <td style={td}>{e.joined}</td>
                  <td style={td}>{statusPill(e.status)}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Eye size={15} style={{ color: colors.textFaint, cursor: "pointer" }} />
                      <Pencil size={14} style={{ color: colors.textFaint, cursor: "pointer" }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : experts.map((e) => (
            <div key={e.email} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{e.name}</span>
                {statusPill(e.status)}
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{e.category} · {e.region} · Tier {e.tier}</p>
            </div>
          ))}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to 7 of 876 new experts
          </div>
        )}
      </div>

      {/* Growth by region */}
      {loading ? <SkelChart height={140} /> : (
        <div style={card}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 14px" }}>
            User Growth by Region ({period})
          </p>
          <div style={{ padding: "0 20px 20px" }}>
            <HorizontalBarList data={userGrowthByRegion} color={colors.primary} />
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: color }} />
      {label}
    </span>
  );
}