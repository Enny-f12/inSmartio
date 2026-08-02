// components/TASPerformanceReport.tsx
"use client";

import { useState } from "react";
import { UserCog, Users, Wallet, Gauge, Download, Eye, Pencil } from "lucide-react";
import { colors, card, kpiCard, kpiLabel, kpiValue, kpiDelta, th, thFirst, td, tdFirst, exportBtn, fmtNaira } from "./shared";
import { SkelKPIRow, SkelTableRows, SkelCardRows } from "./Skeleton";
import { useSimulatedLoad } from "./useSimulatedLoad";
import { tasAgents, tasKPIs } from "./mockData";

const PERIOD_OPTIONS = ["July 2026", "June 2026", "Q2 2026"];
const TIER_OPTIONS = ["All Tiers", "1", "2", "3", "4", "5"];
const ZONE_OPTIONS = ["All Zones", "MN-W", "IS-E", "MN-E", "MN-N", "IS-N", "MN-S"];

export default function TASPerformanceReport() {
  const [period, setPeriod] = useState("July 2026");
  const [tier, setTier] = useState("All Tiers");
  const [zone, setZone] = useState("All Zones");
  const loading = useSimulatedLoad([period, tier, zone]);

  const filtered = tasAgents.filter((a) => {
    if (tier !== "All Tiers" && String(a.tier) !== tier) return false;
    if (zone !== "All Zones" && a.zone !== zone) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select className="rp-select" value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={tier} onChange={(e) => setTier(e.target.value)}>{TIER_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={zone} onChange={(e) => setZone(e.target.value)}>{ZONE_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
        </div>
        <button style={exportBtn()}><Download size={13} /> Export</button>
      </div>

      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><UserCog size={13} /> Total TAS Agents</span>
            <span style={kpiValue}>{tasKPIs.totalAgents}</span>
            <span style={kpiDelta(true)}>↑ 22%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Users size={13} /> Experts Recruited</span>
            <span style={kpiValue}>{tasKPIs.expertsRecruited.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 34%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Wallet size={13} /> Total Earnings</span>
            <span style={kpiValue}>{fmtNaira(tasKPIs.totalEarnings)}</span>
            <span style={kpiDelta(true)}>↑ 28%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Gauge size={13} /> Avg. Earnings</span>
            <span style={kpiValue}>{fmtNaira(tasKPIs.avgEarnings)}</span>
            <span style={kpiDelta(true)}>↑ 15%</span>
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <button style={exportBtn()}><Download size={13} /> CSV</button>
          <button style={exportBtn()}><Download size={13} /> PDF</button>
          <button style={exportBtn("primary")}><Download size={13} /> Excel</button>
        </div>

        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["TAS Name", "Phone", "Email", "Tier", "Experts", "Active", "Earnings", "Zone", "Joined", "Actions"].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={6} cols={10} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: colors.textFaint }}>No TAS agents match your filter.</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.email} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>{a.name}</td>
                  <td style={td}>{a.phone}</td>
                  <td style={td}>{a.email}</td>
                  <td style={td}>{a.tier}</td>
                  <td style={td}>{a.expertsRecruited}</td>
                  <td style={td}>{a.active}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtNaira(a.earnings)}</td>
                  <td style={td}>{a.zone}</td>
                  <td style={td}>{a.joined}</td>
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
          {loading ? <SkelCardRows rows={4} /> : filtered.map((a) => (
            <div key={a.email} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{a.name}</span>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>{fmtNaira(a.earnings)}</span>
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>Tier {a.tier} · {a.zone} · {a.active} active experts</p>
            </div>
          ))}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to {filtered.length} of 156 results
          </div>
        )}
      </div>
    </div>
  );
}