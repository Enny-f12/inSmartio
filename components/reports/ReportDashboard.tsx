// components/ReportDashboard.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Users, Briefcase, Wallet, UserCog, Download, ChevronDown, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { colors, kpiCard, kpiLabel, kpiValue, kpiDelta, card, exportBtn, fmtNaira } from "./shared";
import { SkelKPIRow, SkelChart, SkelCardRows } from "./Skeleton";
import DashboardLineChart from "./DashboardLineChart";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDashboard } from "@/lib/redux/reportDetailSlice";
import { downloadDetailedReport } from "@/lib/api/detailedReportApi";
import type { DashboardRange, QuickReportItem, ReportType, ReportFormat } from "@/lib/api/detailedReportApi";
import type { ReportKey } from "./ReportPicker";

// Every downloadable report type — used to build "Export All" as a
// sequential loop over /reports/detailed/{reportType}/download, since the
// API has no single "export everything" endpoint.
const ALL_REPORT_TYPES: ReportType[] = [
  "transactions",
  "user-growth",
  "expert-details",
  "verification",
  "revenue",
  "job-completion",
  "tas-performance",
  "dispute-analysis",
];

const RANGE_OPTIONS: { label: string; value: DashboardRange }[] = [
  { label: "Last 7 Days",  value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "This Month",   value: "month" },
  { label: "Last Quarter", value: "quarter" },
  { label: "Custom",       value: "custom" },
];

const toISODate = (d: Date) => d.toISOString().split("T")[0];

/**
 * The download endpoint only accepts fromDate/toDate, not the dashboard's
 * "range" shorthand (7d/30d/month/quarter/custom) — so exports need dates
 * computed the same way the dashboard's own range picker implies.
 */
function rangeToDates(
  range: DashboardRange,
  customFrom: string,
  customTo: string
): { fromDate?: string; toDate?: string } {
  const today = new Date();
  const toDate = toISODate(today);

  switch (range) {
    case "7d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { fromDate: toISODate(from), toDate };
    }
    case "30d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { fromDate: toISODate(from), toDate };
    }
    case "month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { fromDate: toISODate(from), toDate };
    }
    case "quarter": {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const from = new Date(today.getFullYear(), quarterStartMonth, 1);
      return { fromDate: toISODate(from), toDate };
    }
    case "custom":
      return customFrom && customTo ? { fromDate: customFrom, toDate: customTo } : {};
    default:
      return {};
  }
}

/** Triggers a browser download from an object URL, then frees it. */
function downloadBlobUrl(objectUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Small CSV/PDF dropdown, styled to match exportBtn() used elsewhere on this page. */
function ExportDropdownButton({
  label,
  onExport,
  exporting,
  variant = "ghost",
}: {
  label: string;
  onExport: (format: ReportFormat) => void;
  exporting: boolean;
  variant?: "ghost" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        style={{ ...exportBtn(variant), padding: "5px 10px" }}
        onClick={() => setOpen((o) => !o)}
        disabled={exporting}
      >
        <Download size={13} /> {exporting ? "Exporting…" : label} <ChevronDown size={12} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 20,
            backgroundColor: "#fff", border: `1px solid ${colors.border}`, borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)", minWidth: "110px", overflow: "hidden",
          }}
        >
          {(["csv", "pdf"] as ReportFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => { setOpen(false); onExport(f); }}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                fontSize: "12.5px", fontWeight: 500, color: colors.textMain,
                background: "none", border: "none", cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportDashboard({ onNavigate }: { onNavigate: (key: ReportKey) => void }) {
  const dispatch = useAppDispatch();
  const { dashboard, dashboardStatus } = useAppSelector((s) => s.reportDetail);

  const [range, setRange] = useState<DashboardRange>("30d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loading = dashboardStatus === "loading" || dashboardStatus === "idle";

  const [exportingAll, setExportingAll] = useState(false);
  const [exportingRevenue, setExportingRevenue] = useState(false);

  // "Export All" — there's no single export-everything endpoint, so this
  // loops the real per-report-type download call across every report type,
  // staggered slightly so the browser doesn't block back-to-back downloads.
  const handleExportAll = async (format: ReportFormat) => {
    setExportingAll(true);
    try {
      const { fromDate: f, toDate: t } = rangeToDates(range, fromDate, toDate);
      const today = new Date().toISOString().split("T")[0];
      for (const reportType of ALL_REPORT_TYPES) {
        try {
          const url = await downloadDetailedReport({ reportType, format, fromDate: f, toDate: t });
          downloadBlobUrl(url, `${reportType}_${today}.${format}`);
        } catch {
          // Skip a single failed report type rather than aborting the whole batch.
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setExportingAll(false);
    }
  };

  // "Export" on the revenue chart — downloads just the revenue report for
  // the dashboard's currently selected range.
  const handleExportRevenue = async (format: ReportFormat) => {
    setExportingRevenue(true);
    try {
      const { fromDate: f, toDate: t } = rangeToDates(range, fromDate, toDate);
      const url = await downloadDetailedReport({ reportType: "revenue", format, fromDate: f, toDate: t });
      downloadBlobUrl(url, `revenue_${new Date().toISOString().split("T")[0]}.${format}`);
    } finally {
      setExportingRevenue(false);
    }
  };

  useEffect(() => {
    if (range === "custom") {
      if (fromDate && toDate) dispatch(fetchDashboard({ range, fromDate, toDate }));
      return;
    }
    dispatch(fetchDashboard({ range }));
  }, [dispatch, range, fromDate, toDate]);

  const kpis = dashboard
    ? [
        { label: "Total Users", icon: <Users size={13} />, value: dashboard.cards.totalUsers.value, delta: dashboard.cards.totalUsers.changePercent, fmt: (v: number) => v.toLocaleString() },
        { label: "Jobs", icon: <Briefcase size={13} />, value: dashboard.cards.jobs.value, delta: dashboard.cards.jobs.changePercent, fmt: (v: number) => v.toLocaleString() },
        { label: "Revenue", icon: <Wallet size={13} />, value: dashboard.cards.revenue.value, delta: dashboard.cards.revenue.changePercent, fmt: (v: number) => fmtNaira(v) },
        { label: "TAS Agents", icon: <UserCog size={13} />, value: dashboard.cards.tasAgents.value, delta: dashboard.cards.tasAgents.changePercent, fmt: (v: number) => v.toLocaleString() },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Range + actions */}
      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            className="rp-select"
            value={range}
            onChange={(e) => setRange(e.target.value as DashboardRange)}
          >
            {RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {range === "custom" && (
            <>
              <input type="date" className="rp-select" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input type="date" className="rp-select" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <ExportDropdownButton label="Export All" onExport={handleExportAll} exporting={exportingAll} />
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
      ) : dashboard && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px 0" }}>
            <ExportDropdownButton label="Export" onExport={handleExportRevenue} exporting={exportingRevenue} />
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <DashboardLineChart
              title={dashboard.revenueTrend.title || `Revenue Trends (${RANGE_OPTIONS.find((o) => o.value === range)?.label ?? range})`}
              yLabel="Revenue"
              xLabel="Day"
              color={colors.primary}
              data={dashboard.revenueTrend.series.map((p) => p.value)}
              labels={dashboard.revenueTrend.series.map((_, i) =>
                (i + 1) % 5 === 0 ? String(i + 1) : ""
              )}
              yStep={computeYStep(dashboard.revenueTrend.series.map((p) => p.value))}
              yFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`}
              statValue={fmtNaira(dashboard.revenueTrend.total)}
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
              {(dashboard?.quickReports ?? []).map((r) => (
                <button
                  key={r.key}
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
                  {r.label}
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
              {(dashboard?.recentActivity ?? []).slice(0, 7).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: activityDotColor(a.type), marginTop: "6px", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", color: colors.textMain, margin: 0 }}>{a.message}</p>
                    <p style={{ fontSize: "12px", color: colors.textMuted, margin: "2px 0 0", fontWeight: 600 }}>{formatRelativeTime(a.timestamp)}</p>
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

/**
 * Picks a "nice" round y-axis step (1/2/5 × a power of ten) so the chart
 * gets roughly 4-5 gridlines no matter how small or large the data is.
 * A hardcoded step (e.g. 50000) breaks whenever real values are much
 * smaller than that, since only one gridline (0) ends up visible.
 */
function computeYStep(values: number[]): number {
  const max = Math.max(0, ...values);
  if (max <= 0) return 1000;

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

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function activityDotColor(type: string): string {
  const map: Record<string, string> = {
    new_tas:          colors.primary,
    expert_verified:  "#16A34A", // green
    escrow_released:  "#F59E0B", // amber
  };
  return map[type] ?? colors.primary;
}

// Keys ReportsPage actually switches on — app/(dashboard)/reports/page.tsx
const VALID_REPORT_KEYS: ReportKey[] = [
  "dashboard",
  "transactions",
  "user-growth",
  "experts",
  "verification",
  "tas-performance",
  "scheduled",
  "templates",
];

function isReportKey(key: string): key is ReportKey {
  return (VALID_REPORT_KEYS as string[]).includes(key);
}

function mapQuickReport(item: QuickReportItem): ReportKey {
  // Prefer the API's own key when it already matches a known ReportKey.
  if (isReportKey(item.key)) return item.key;

  // Fall back to matching on the display label for report types that
  // don't have a dedicated screen yet (e.g. "Revenue Summary" -> dashboard).
  const byLabel: Record<string, ReportKey> = {
    "User Growth": "user-growth",
    "Expert Details": "experts",
    "Verification Queue": "verification",
    "Revenue Summary": "dashboard",
    "Job Completion": "dashboard",
    "TAS Performance": "tas-performance",
    "Dispute Analysis": "dashboard",
  };
  return byLabel[item.label] ?? "dashboard";
}