// app/(dashboard)/reports/components/UserGrowthReport.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus, TrendingUp, TrendingDown, Users, Eye } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDetailedReport, downloadReport, setReportType, clearDownloadUrl } from "@/lib/redux/reportDetailSlice";
import { getDetailedReport, getReportTrend } from "@/lib/api/detailedReportApi";
import type { ReportType, ReportFormat, ReportSummary, ReportTrendPoint } from "@/lib/api/detailedReportApi";
import { colors, card, kpiCard, kpiLabel, kpiValue, th, thFirst, td, tdFirst } from "./shared";
import { ExportMenuButton } from "./ExportMenuButton";
import { SkelKPIRow, SkelChart, SkelTableRows, SkelCardRows } from "./Skeleton";
import DashboardLineChart from "./DashboardLineChart";
import { HorizontalBarList } from "./ChartBits";
import { pick, pickSummary, matchesFilter } from "./rowUtils";
import { userGrowthByRegion } from "./mockData";
import { RowDetailModal } from "./RowDetailModal";

// This screen genuinely needs two different live endpoints:
//   - user-growth   -> KPI stats only (newUsers/growthRate/churnRate/activeUsers)
//   - expert-details -> the table rows (name/tier/paymentModel/category/region/status/joined)
// The table's redux slice (reportDetail) stays wired to expert-details, same
// as before. The KPI stats and the trend chart are fetched separately,
// straight from the API module, so they don't clobber the table's
// summary/rows in the shared slice.
const TABLE_REPORT_TYPE: ReportType = "expert-details";
const STATS_REPORT_TYPE: ReportType = "user-growth";

type Row = Record<string, unknown>;

const PERIOD_OPTIONS = ["July 2026", "June 2026", "May 2026", "Q2 2026"];
const USER_TYPE_OPTIONS = ["All User Types", "Clients", "Experts", "TAS"];
const TIER_OPTIONS = ["All Tiers", "Tier 1", "Tier 2", "Tier 3"];

/**
 * Labels every 5th point by its position in the series (1, 5, 10, 15...)
 * rather than a calendar date. Calendar-day-of-month labeling breaks when
 * the series crosses a month boundary (e.g. day 30 followed by day 5 of the
 * next month reads as if the axis went backwards) — position-based labels
 * always read in a straight, increasing line regardless of date range.
 */
function buildIndexLabels(length: number, every = 5): string[] {
  return Array.from({ length }, (_, i) => ((i + 1) % every === 0 ? String(i + 1) : ""));
}

/**
 * Picks a "nice" round y-axis step (1/2/5 × a power of ten) so the chart
 * gets roughly 4-5 gridlines no matter how small or large the data is.
 */
function computeYStep(values: number[]): number {
  const max = Math.max(0, ...values);
  if (max <= 0) return 1;

  const rawStep = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;

  let niceResidual: number;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;

  return niceResidual * magnitude;
}

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

/** "protected" -> "Model 1", "unprotected" -> "Model 2". Falls back to raw value (or "—") for anything unexpected. */
function formatPaymentModel(model: unknown) {
  const m = String(model ?? "").toLowerCase();
  if (m === "protected") return "Model 1";
  if (m === "unprotected") return "Model 2";
  return model ? String(model) : "—";
}

export default function UserGrowthReport() {
  const dispatch = useAppDispatch();
  const { rows, listStatus, downloadStatus } = useAppSelector((s) => s.reportDetail);

  // Table data — unchanged, still the expert-details fetch via the shared slice.
  useEffect(() => {
    dispatch(setReportType(TABLE_REPORT_TYPE));
    dispatch(fetchDetailedReport({ reportType: TABLE_REPORT_TYPE }));
  }, [dispatch]);

  // KPI stats — separate fetch straight from the API module, since these
  // come from a different endpoint (user-growth) than the table rows.
  const [stats, setStats] = useState<ReportSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatsLoading(true);
    getDetailedReport({ reportType: STATS_REPORT_TYPE })
      .then((res) => { if (!cancelled) setStats(res.summary); })
      .catch(() => { if (!cancelled) setStats(null); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Trend chart — real data from GET /reports/detailed/user-growth/trend,
  // replacing the previous hardcoded illustrative series.
  const [trend, setTrend] = useState<ReportTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrendLoading(true);
    getReportTrend({ reportType: STATS_REPORT_TYPE, groupBy: "day" })
      .then((res) => { if (!cancelled) setTrend(Array.isArray(res) ? res : []); })
      .catch(() => { if (!cancelled) setTrend([]); })
      .finally(() => { if (!cancelled) setTrendLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const [period, setPeriod] = useState("July 2026");
  const [userType, setUserType] = useState("All User Types");
  const [region, setRegion] = useState("All Regions");
  const [tier, setTier] = useState("All Tiers");
  const [selected, setSelected] = useState<Row | null>(null);

  const loading = listStatus === "loading" || listStatus === "idle";

  const handleExport = async (format: ReportFormat) => {
    const action = await dispatch(downloadReport({ reportType: TABLE_REPORT_TYPE, format }));
    if (downloadReport.fulfilled.match(action)) {
      const a = document.createElement("a");
      a.href = action.payload;
      a.download = `expert-details_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      dispatch(clearDownloadUrl());
    }
  };

  // Region options built from whatever's actually in the loaded expert rows
  // — the field is real now (confirmed in the expert-details response), so
  // this replaces the old hardcoded MN-W/IS-E placeholder list.
  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows as Row[]) {
      const v = pick(r, ["region"]);
      if (v && v !== "—") set.add(v.trim());
    }
    return ["All Regions", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = (rows as Row[]).filter((r) => {
    if (userType !== "All User Types" && !matchesFilter(pick(r, ["userType", "type"]), userType)) return false;
    if (region !== "All Regions" && !matchesFilter(pick(r, ["region"]), region)) return false;
    if (tier !== "All Tiers" && !matchesFilter(pick(r, ["tier"]), tier.replace("Tier ", ""))) return false;
    return true;
  });

  // Confirmed keys from the user-growth summary response.
  const kpiNewUsers = pickSummary(stats ?? undefined, ["newUsers"]);
  const kpiGrowthRate = pickSummary(stats ?? undefined, ["growthRate"]);
  const kpiChurnRate = pickSummary(stats ?? undefined, ["churnRate"]);
  const kpiActiveUsers = pickSummary(stats ?? undefined, ["activeUsers"]);

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
            {regionOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="rp-select" value={tier} onChange={(e) => setTier(e.target.value)}>
            {TIER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
          <ExportMenuButton onExport={handleExport} exporting={downloadStatus === "loading"} />
        </div>
      </div>

      {/* KPIs — from the user-growth endpoint, independent of the table's data source */}
      {statsLoading ? (
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

      {/* Trend chart — real data from /reports/detailed/user-growth/trend */}
      {trendLoading ? (
        <SkelChart height={170} />
      ) : (
        <div style={card}>
          <div style={{ padding: "20px 20px 20px" }}>
            {trend.length === 0 ? (
              <p style={{ fontSize: "12.5px", color: colors.textFaint, margin: 0 }}>No trend data for this period.</p>
            ) : (
              <DashboardLineChart
                title="User Growth Trends"
                yLabel="New Users"
                xLabel="Day"
                color={colors.primary}
                data={trend.map((p) => p.value)}
                labels={buildIndexLabels(trend.length)}
                yStep={computeYStep(trend.map((p) => p.value))}
              />
            )}
          </div>
        </div>
      )}

      {/* Expert details table */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0 }}>Expert Details — New Experts</p>
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
                  <td style={td}>{formatPaymentModel(pick(e, ["paymentModel", "model"]))}</td>
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
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{pick(e, ["category"])} · {pick(e, ["region"])} · Tier {pick(e, ["tier"])} · {formatPaymentModel(pick(e, ["paymentModel", "model"]))}</p>
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