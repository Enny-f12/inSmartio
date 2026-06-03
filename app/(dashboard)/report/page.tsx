"use client";

import { useState } from "react";
import { TrendingUp, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/Navbar";
import ReportControls from "@/components/report/ReportControls";
import DashboardLineChart from "@/components/dashboard/DashboardLineChart";
import DonutChart from "@/components/report/DonutChart";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import ScheduledReportsSection from "@/components/report/ScheduledReportSection";
import ReportTemplatesSection  from "@/components/report/ReportTemplatesSection";
import {
  fetchUserGrowthThunk,
  fetchRevenueTrendThunk,
  fetchTopCategoriesThunk,
  fetchTopCitiesThunk,
  fetchTasPerformanceThunk,
  fetchExpertPerformanceThunk,
  fetchJobCompletionThunk,
  fetchDisputeAnalysisThunk,
  downloadReportThunk,
} from "@/lib/redux/reportSlice";
import {
  reportConfigs,
  type ReportType,
  type FormatType,
  type ReportConfig,
} from "@/components/report/types";
import type {
  MonthlyUserGrowthItem,
  RevenueTrendItem,
  TopCitiesData,
  JobCompletionData,
  DisputeAnalysisData,
  DownloadReportType,
} from "@/lib/api/reportApi";

// ── Report type lists ─────────────────────────────────────
export const ALL_REPORT_TYPES: ReportType[] = [
  "User Growth Report",
  "Revenue Report",
  "Top Service Category",
  "Top Cities",
  "Job Completion Report",
  "TAS Performance Report",
  "Dispute Analysis Report",
  "Verification Report",
  
];

// Have a chart endpoint — show chart + summary
const LIVE_REPORT_TYPES: ReportType[] = [
  "User Growth Report",
  "Revenue Report",
  "Top Service Category",
  "Top Cities",
  "Job Completion Report",
  "TAS Performance Report",
  "Dispute Analysis Report",
  "Verification Report",
];

// No chart — clicking Generate triggers PDF download immediately
const DOWNLOAD_ONLY_TYPES: ReportType[] = [
  "Users Report",
  "Jobs Report",
  "Escrow Report",
  "Disputes Report",
];

const DONUT_TYPES: ReportType[] = ["Top Service Category"];

const reportTypeToDownload: Record<ReportType, DownloadReportType> = {
  "User Growth Report":       "user-growth",
  "Revenue Report":           "revenue-trend",
  "Top Service Category":     "service-category",
  "Top Cities":               "cities",
  "Job Completion Report":    "job-completion-report",
  "TAS Performance Report":   "tas-performance-report",
  "Dispute Analysis Report":  "dispute-analysis-report",
  "Verification Report":      "expert-verification",
  "Users Report":             "users",
  "Jobs Report":              "jobs",
  "Escrow Report":            "escrows",
  "Disputes Report":          "dispute",
};

const reportTypeToSlug: Record<ReportType, string> = {
  "User Growth Report":       "user-growth",
  "Revenue Report":           "revenue-trend",
  "Top Service Category":     "service-category",
  "Top Cities":               "top-cities",
  "Job Completion Report":    "job-completion",
  "TAS Performance Report":   "tas-performance",
  "Dispute Analysis Report":  "dispute-analysis",
  "Verification Report":      "verification",
  "Users Report":             "users",
  "Jobs Report":              "jobs",
  "Escrow Report":            "escrow",
  "Disputes Report":          "disputes",
};

// ── Helpers ───────────────────────────────────────────────
const toCsv = (rows: unknown[]): string => {
  if (!rows.length) return "";
  const r = rows as Record<string, unknown>[];
  const h = Object.keys(r[0]);
  return [h.join(","), ...r.map((row) => h.map((k) => JSON.stringify(row[k] ?? "")).join(","))].join("\n");
};

const triggerCsvDownload = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const fmtDisplay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const COLORS = ["#2563eb", "#F9A826", "#2E7D32", "#7B3F9E", "#db2777", "#0891b2"];

// ── Build config from API data ────────────────────────────
const buildConfig = (
  reportType:        ReportType,
  userGrowth:        MonthlyUserGrowthItem[],
  revenueTrend:      RevenueTrendItem[],
  topCategories:     { categories: { category: string; percentage: number }[] } | null,
  topCitiesData:     TopCitiesData | null,
  tasPerformance:    Record<string, unknown>[],
  expertPerformance: Record<string, unknown>[],
  jobCompletion:     JobCompletionData | null,
  disputeAnalysis:   DisputeAnalysisData | null,
  dateFrom:          string,
  dateTo:            string,
): ReportConfig => {
  const mock  = reportConfigs[reportType];
  const range = `${fmtDisplay(dateFrom)} – ${fmtDisplay(dateTo)}`;

  switch (reportType) {

    case "User Growth Report": {
      if (!userGrowth.length) return mock;
      const total = userGrowth.reduce((s, d) => s + d.count, 0);
      return {
        ...mock,
        title:      `User Growth · ${range}`,
        weeks:      userGrowth.map((d) => d.count),
        weekLabels: userGrowth.map((d) => d.month.slice(0, 3)),
        summary:    [{ label: "Total New Users:", value: total.toLocaleString() }],
      };
    }

    case "Revenue Report": {
      if (!revenueTrend.length) return mock;
      const total = revenueTrend.reduce((s, d) => s + d.revenue, 0);
      return {
        ...mock,
        title:      `Revenue Report · ${range}`,
        weeks:      revenueTrend.map((d) => d.revenue),
        weekLabels: revenueTrend.map((d) => d.month.slice(0, 3)),
        summary:    [{ label: "Total Revenue:", value: `₦${total.toLocaleString()}` }],
      };
    }

    case "Top Service Category": {
      if (!topCategories?.categories.length) return mock;
      return {
        ...mock,
        title:    `Top Service Category · ${range}`,
        segments: topCategories.categories.map((c, i) => ({
          label: c.category,
          value: Math.round(c.percentage),
          color: COLORS[i % COLORS.length],
        })),
        summary: topCategories.categories.map((c) => ({
          label: `${c.category}:`,
          value: `${Math.round(c.percentage)}%`,
        })),
      };
    }

    case "Top Cities": {
      const cities  = topCitiesData?.cities ?? [];
      const overall = topCitiesData?.overall;
      if (!cities.length) return mock;
      return {
        ...mock,
        title:      `Top Cities · ${range}`,
        weeks:      cities.map((c) => c.totalUsersInCity),
        weekLabels: cities.map((c) => c.city),
        summary: [
          ...(overall ? [
            { label: "Total Users:", value: overall.totalUsers.toLocaleString() },
            { label: "Clients:",     value: `${overall.clients.count.toLocaleString()} (${overall.clients.percentage.toFixed(0)}%)` },
            { label: "Experts:",     value: `${overall.experts.count.toLocaleString()} (${overall.experts.percentage.toFixed(0)}%)` },
            { label: "TAS:",         value: `${overall.tas.count.toLocaleString()} (${overall.tas.percentage.toFixed(0)}%)` },
          ] : []),
          ...cities.map((c) => ({
            label: `${c.city}:`,
            value: `${c.totalUsersInCity.toLocaleString()} (${c.totalUsersInCityPercentageOfOverall.toFixed(0)}%)`,
          })),
        ],
      };
    }

    case "Job Completion Report": {
      if (!jobCompletion) return mock;
      const { summary, monthly } = jobCompletion;
      return {
        ...mock,
        title:      `Job Completion · ${range}`,
        weeks:      monthly.map((m) => m.completed),
        weekLabels: monthly.map((m) => m.month.slice(0, 3)),
        summary: [
          { label: "Total Jobs:",   value: summary.totalJobs.toLocaleString() },
          { label: "Completed:",    value: `${summary.completedJobs.toLocaleString()} (${summary.completionRate.toFixed(1)}%)` },
          { label: "Cancelled:",    value: summary.cancelledJobs.toLocaleString() },
          { label: "Disputed:",     value: summary.disputedJobs.toLocaleString() },
        ],
      };
    }

    case "Dispute Analysis Report": {
      if (!disputeAnalysis) return mock;
      const { summary, monthly, topReasons } = disputeAnalysis;
      return {
        ...mock,
        title:      `Dispute Analysis · ${range}`,
        weeks:      monthly.map((m) => m.total),
        weekLabels: monthly.map((m) => m.month.slice(0, 3)),
        summary: [
          { label: "Total Disputes:", value: summary.totalDisputes.toLocaleString() },
          { label: "Resolved:",       value: `${summary.resolved} (${summary.resolutionRate.toFixed(1)}%)` },
          { label: "In Progress:",    value: summary.inProgress.toLocaleString() },
          { label: "Escalated:",      value: summary.escalated.toLocaleString() },
          ...topReasons.map((r) => ({
            label: r.reason + ":",
            value: `${r.count} (${r.percentage.toFixed(1)}%)`,
          })),
        ],
      };
    }

    case "TAS Performance Report": {
      if (!tasPerformance.length) return { ...mock, weeks: [0], weekLabels: ["No data"], summary: [{ label: "Total TAS:", value: "0" }] };
      return {
        ...mock,
        title:      `TAS Performance · ${range}`,
        weeks:      tasPerformance.map((_, i) => i + 1),
        weekLabels: tasPerformance.map((t, i) => String(t.name ?? `TAS ${i + 1}`).slice(0, 8)),
        summary:    tasPerformance.slice(0, 5).map((t) => ({
          label: String(t.name ?? "TAS") + ":",
          value: String(t.earnings ?? t.totalEarnings ?? "—"),
        })),
      };
    }

    case "Verification Report": {
      if (!expertPerformance.length) return { ...mock, weeks: [0], weekLabels: ["No data"], summary: [{ label: "Total Verifications:", value: "0" }] };
      return {
        ...mock,
        title:      `Verification Report · ${range}`,
        weeks:      expertPerformance.map((e) => Number(e.jobsCompleted ?? e.verificationsCompleted ?? 0)),
        weekLabels: expertPerformance.map((e, i) => String(e.name ?? `Expert ${i + 1}`).slice(0, 8)),
        summary:    expertPerformance.slice(0, 5).map((e) => ({
          label: String(e.name ?? "Expert") + ":",
          value: `${e.jobsCompleted ?? e.verificationsCompleted ?? 0} verifications`,
        })),
      };
    }

    default:
      return mock;
  }
};

// ── Inline Report Card ────────────────────────────────────
interface InlineReportCardProps {
  config:        ReportConfig;
  isDonut:       boolean;
  onDownloadPdf: () => void;
  onDownloadCsv: () => void;
  onEmail:       () => void;
  isDownloading: boolean;
}

function InlineReportCard({ config, isDonut, onDownloadPdf, onDownloadCsv, onEmail, isDownloading }: InlineReportCardProps) {
  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "10px 18px", borderRadius: "10px", fontSize: "13px",
    fontWeight: 500, cursor: "pointer", border: "1px solid #E5E7EB",
    backgroundColor: "#fff", color: "#374151",
  };
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
        {isDonut && config.segments?.length ? (
          <DonutChart segments={config.segments} title={config.title} size={260} />
        ) : (
          <DashboardLineChart
            title={config.title} yLabel="" xLabel="Months"
            data={config.weeks ?? []} labels={config.weekLabels ?? []} color="#2563eb"
          />
        )}
      </div>
      {config.summary.length > 0 && (
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #E5E7EB" }}>
          {config.summary.map((s) => (
            <div key={s.label} style={{ display: "flex", gap: "12px", fontSize: "13px", marginBottom: "8px" }}>
              <span style={{ minWidth: "160px", color: "#6B7280", flexShrink: 0 }}>{s.label}</span>
              <span style={{ fontWeight: 500, color: "#111827" }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "16px 28px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={onDownloadPdf} disabled={isDownloading} style={btnBase}><Download size={13} /> Download PDF</button>
        <button onClick={onDownloadCsv} style={btnBase}><Download size={13} /> Download CSV</button>
        <button onClick={onEmail} style={btnBase}><Mail size={13} /> Email Report</button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const report   = useAppSelector((s) => s.report);

  const [reportType, setReportType] = useState<ReportType>("User Growth Report");
  const [format,     setFormat]     = useState<FormatType>("PDF");
  const [dateFrom,   setDateFrom]   = useState("2025-05-01");
  const [dateTo,     setDateTo]     = useState(new Date().toISOString().split("T")[0]);
  const [generated,  setGenerated]  = useState(false);

  const query          = { fromDate: dateFrom, toDate: dateTo };
  const isLive         = LIVE_REPORT_TYPES.includes(reportType);
  const isDownloadOnly = DOWNLOAD_ONLY_TYPES.includes(reportType);
  const isDonut        = DONUT_TYPES.includes(reportType);

  const isLoading =
    report.userGrowthStatus        === "loading" ||
    report.revenueTrendStatus      === "loading" ||
    report.topCategoriesStatus     === "loading" ||
    report.topCitiesStatus         === "loading" ||
    report.tasPerformanceStatus    === "loading" ||
    report.expertPerformanceStatus === "loading" ||
    report.jobCompletionStatus     === "loading" ||
    report.disputeAnalysisStatus   === "loading";

  const handleDownloadPdf = () => {
    dispatch(downloadReportThunk({
      payload:  { reportType: reportTypeToDownload[reportType], type: "pdf", fromDate: dateFrom, toDate: dateTo },
      filename: `${reportTypeToSlug[reportType]}_${dateFrom}_${dateTo}.pdf`,
    })).unwrap().catch(() => toast.error("Failed to download PDF"));
  };

  const handleGenerate = () => {
    setGenerated(true);
    if (isDownloadOnly) {
      handleDownloadPdf();
      return;
    }
    switch (reportType) {
      case "User Growth Report":      dispatch(fetchUserGrowthThunk(query));      break;
      case "Revenue Report":          dispatch(fetchRevenueTrendThunk(query));     break;
      case "Top Service Category":    dispatch(fetchTopCategoriesThunk(query));    break;
      case "Top Cities":              dispatch(fetchTopCitiesThunk(query));        break;
      case "Job Completion Report":   dispatch(fetchJobCompletionThunk(query));    break;
      case "TAS Performance Report":  dispatch(fetchTasPerformanceThunk({}));      break;
      case "Dispute Analysis Report": dispatch(fetchDisputeAnalysisThunk(query));  break;
      case "Verification Report":     dispatch(fetchExpertPerformanceThunk({}));   break;
    }
  };

  const handleDownloadCsv = () => {
    if (isDownloadOnly) { toast.info("Use Download PDF for this report type"); return; }
    const rows: unknown[] = (() => {
      switch (reportType) {
        case "User Growth Report":      return report.userGrowth;
        case "Revenue Report":          return report.revenueTrend;
        case "Top Service Category":    return report.topCategories?.categories ?? [];
        case "Top Cities":              return report.topCitiesData?.cities ?? [];
        case "Job Completion Report":   return report.jobCompletion?.monthly ?? [];
        case "Dispute Analysis Report": return report.disputeAnalysis?.monthly ?? [];
        default:                        return [];
      }
    })();
    if (!rows.length) { toast.warning("No data — generate the report first"); return; }
    triggerCsvDownload(toCsv(rows), `${reportTypeToSlug[reportType]}_${dateFrom}_${dateTo}.csv`);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${reportType} — ${fmtDisplay(dateFrom)} to ${fmtDisplay(dateTo)}`);
    const body    = encodeURIComponent(`${reportType}\n${fmtDisplay(dateFrom)} – ${fmtDisplay(dateTo)}\n\nSee admin dashboard for full data.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleExport = () => {
    if (!generated) { toast.warning("Generate the report first"); return; }
    if (format === "PDF") handleDownloadPdf(); else handleDownloadCsv();
  };

  const config = buildConfig(
    reportType,
    report.userGrowth,
    report.revenueTrend,
    report.topCategories,
    report.topCitiesData ?? null,
    (report.tasPerformance   ?? []) as Record<string, unknown>[],
    (report.expertPerformance ?? []) as Record<string, unknown>[],
    report.jobCompletion   ?? null,
    report.disputeAnalysis ?? null,
    dateFrom,
    dateTo,
  );

  const showLoading = generated && !isDownloadOnly && isLive && isLoading;
  const showCard    = generated && !isDownloadOnly && isLive && !isLoading;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Reports and Analytics" />

      <style>{`
        .report-main { padding: 12px; gap: 16px; }
        @media(min-width:640px){ .report-main { padding: 24px 32px; gap: 20px; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <main className="report-main" style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", backgroundColor: "#F4F5F7" }}>

        <ReportControls
          reportType={reportType} format={format} dateFrom={dateFrom} dateTo={dateTo}
          reportTypes={ALL_REPORT_TYPES}
          onReportType={(v: string) => { setReportType(v as ReportType); setGenerated(false); }}
          onFormat={setFormat}
          onDateFrom={(v: string) => { setDateFrom(v); setGenerated(false); }}
          onDateTo={(v: string)   => { setDateTo(v);   setGenerated(false); }}
          onGenerate={handleGenerate}
          onExport={handleExport}
        />

        {/* Empty state */}
        {!generated && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "60px", gap: "12px", color: "#9CA3AF" }}>
            <TrendingUp size={40} strokeWidth={1.2} />
            <p style={{ fontSize: "14px", textAlign: "center" }}>
              Select a report type and date range, then click <strong style={{ color: "#111827" }}>Generate</strong>.
            </p>
          </div>
        )}

        {/* Download-only confirmation */}
        {generated && isDownloadOnly && (
          <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <Download size={32} strokeWidth={1.4} color="#2563eb" />
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>{reportType}</p>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Your PDF download has started.</p>
            <button onClick={handleDownloadPdf} disabled={report.downloadStatus === "loading"}
              style={{ marginTop: "8px", padding: "10px 24px", borderRadius: "10px", border: "none", backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {report.downloadStatus === "loading" ? "Downloading…" : "Download Again"}
            </button>
          </div>
        )}

        {/* Loading */}
        {showLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "60px", gap: "10px", color: "#9CA3AF", fontSize: "14px" }}>
            <span style={{ display: "inline-block", width: 20, height: 20, border: "2px solid #E5E7EB", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Generating report...
          </div>
        )}

        {/* Chart card */}
        {showCard && (
          <InlineReportCard
            config={config} isDonut={isDonut}
            onDownloadPdf={handleDownloadPdf}
            onDownloadCsv={handleDownloadCsv}
            onEmail={handleEmail}
            isDownloading={report.downloadStatus === "loading"}
          />
        )}

        <ScheduledReportsSection />
        <ReportTemplatesSection />

      </main>
    </div>
  );
}