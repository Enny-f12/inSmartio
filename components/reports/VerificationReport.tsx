// components/VerificationReport.tsx
"use client";

import { useState } from "react";
import { FileClock, ShieldCheck, ShieldAlert, ClipboardList, Download, Eye, Clock } from "lucide-react";
import { colors, card, kpiCard, kpiLabel, kpiValue, kpiDelta, th, thFirst, td, tdFirst, exportBtn } from "./shared";
import { SkelKPIRow, SkelTableRows, SkelChart, SkelCardRows } from "./Skeleton";
import { HorizontalBarList } from "./ChartBits";
import DashboardLineChart from "./DashboardLineChart";
import { useSimulatedLoad } from "./useSimulatedLoad";
import {
  verificationQueue, verificationKPIs, verificationByTier,
  rejectionReasons, officerWorkload,
} from "./mockData";

const PERIOD_OPTIONS = ["July 2026", "June 2026", "May 2026"];
const TIER_OPTIONS = ["All Tiers", "Tier 1", "Tier 2", "Tier 3"];
const STATUS_OPTIONS = ["All Status", "Pending", "Approved", "Rejected"];
const OFFICER_OPTIONS = ["All Officers", "Chioma", "Olu", "Unassigned"];

const verificationTrend = [80, 120, 110, 160, 150, 170, 190];
const verificationTrendLabels = ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];

export default function VerificationReport() {
  const [period, setPeriod] = useState("July 2026");
  const [tier, setTier] = useState("All Tiers");
  const [status, setStatus] = useState("All Status");
  const [officer, setOfficer] = useState("All Officers");
  const loading = useSimulatedLoad([period, tier, status, officer]);

  const filtered = verificationQueue.filter((v) => {
    if (tier !== "All Tiers" && `Tier ${v.tier}` !== tier) return false;
    if (officer !== "All Officers" && v.officer !== officer) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select className="rp-select" value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={tier} onChange={(e) => setTier(e.target.value)}>{TIER_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={officer} onChange={(e) => setOfficer(e.target.value)}>{OFFICER_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
        </div>
        <button style={exportBtn()}><Download size={13} /> Export</button>
      </div>

      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><ClipboardList size={13} /> Total Submissions</span>
            <span style={kpiValue}>{verificationKPIs.total.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 22%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><FileClock size={13} /> Pending Verifications</span>
            <span style={kpiValue}>{verificationKPIs.pending}</span>
            <span style={kpiDelta(false)}>↓ 8%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldCheck size={13} /> Approved</span>
            <span style={kpiValue}>{verificationKPIs.approved.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 25%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldAlert size={13} /> Rejected</span>
            <span style={kpiValue}>{verificationKPIs.rejected}</span>
            <span style={kpiDelta(true)}>↑ 12%</span>
          </div>
        </div>
      )}

      {loading ? <SkelChart height={160} /> : (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px 0" }}>
            <button style={{ ...exportBtn("ghost"), padding: "5px 10px" }}><Download size={12} /> Export</button>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <DashboardLineChart
              title="Verification Trends (Last 30 Days)"
              yLabel="Submissions"
              xLabel="Day"
              color={colors.primary}
              data={verificationTrend}
              labels={verificationTrendLabels}
              statValue={`${verificationKPIs.total.toLocaleString()} submissions`}
            />
          </div>
        </div>
      )}

      {/* Pending queue */}
      <div style={card}>
        <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px" }}>
          Verification Queue — Pending Verifications
        </p>
        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["Name", "Phone", "Email", "Tier", "Docs", "Submitted", "Days Pending", "Officer", "Status", "Actions"].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={6} cols={10} />
              ) : filtered.map((v) => (
                <tr key={v.email} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>{v.name}</td>
                  <td style={td}>{v.phone}</td>
                  <td style={td}>{v.email}</td>
                  <td style={td}>{v.tier}</td>
                  <td style={td}>{v.docs}</td>
                  <td style={td}>{v.submitted}</td>
                  <td style={td}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: v.daysPending >= 6 ? colors.red : colors.textMain, fontWeight: v.daysPending >= 6 ? 600 : 400 }}>
                      <Clock size={12} /> {v.daysPending} day{v.daysPending === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td style={td}>
                    <span style={{ color: v.officer === "Unassigned" ? colors.red : colors.textMain, fontWeight: v.officer === "Unassigned" ? 600 : 400 }}>{v.officer}</span>
                  </td>
                  <td style={td}>
                    <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: colors.amberBg, color: colors.amber }}>{v.status}</span>
                  </td>
                  <td style={td}><Eye size={15} style={{ color: colors.textFaint, cursor: "pointer" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : filtered.map((v) => (
            <div key={v.email} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{v.name}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: v.daysPending >= 6 ? colors.red : colors.textMuted }}>{v.daysPending}d pending</span>
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>Tier {v.tier} · Docs {v.docs} · {v.officer}</p>
            </div>
          ))}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to {filtered.length} of 156 pending
          </div>
        )}
      </div>

      {/* Breakdown charts */}
      <div className="rp-two-col" style={{ display: "grid", gap: "16px" }}>
        {loading ? <SkelChart height={110} /> : (
          <div style={card}>
            <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 14px" }}>Verification Summary by Tier ({period})</p>
            <div style={{ padding: "0 20px 20px" }}><HorizontalBarList data={verificationByTier} color={colors.primary} /></div>
          </div>
        )}
        {loading ? <SkelChart height={110} /> : (
          <div style={card}>
            <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 14px" }}>Verification Officer Workload ({period})</p>
            <div style={{ padding: "0 20px 20px" }}><HorizontalBarList data={officerWorkload} color="#10B981" /></div>
          </div>
        )}
      </div>

      {loading ? <SkelChart height={110} /> : (
        <div style={card}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 14px" }}>Rejection Reasons ({period})</p>
          <div style={{ padding: "0 20px 20px" }}><HorizontalBarList data={rejectionReasons} color={colors.red} /></div>
        </div>
      )}
    </div>
  );
}