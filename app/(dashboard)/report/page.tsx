// app/(dashboard)/report/page.tsx
"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/Navbar";
import ReportControls from "@/components/report/ReportControls";
import ReportCard from "@/components/report/ReportCard";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchUserGrowthThunk,
  fetchRevenueTrendThunk,
  fetchTopCategoriesThunk,
  fetchTopCitiesThunk,
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
} from "@/lib/api/reportApi";
import type { ApiReportType } from "@/lib/api/reportApi";

// ── Helpers ───────────────────────────────────────────────
const toCsv = (rows: unknown[]): string => {
  if (!rows.length) return "";
  const asRecords = rows as Record<string, unknown>[];
  const headers   = Object.keys(asRecords[0]);
  const lines     = [
    headers.join(","),
    ...asRecords.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
    ),
  ];
  return lines.join("\n");
};

const triggerCsvDownload = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const reportTypeToApi: Record<ReportType, ApiReportType> = {
  "User Growth Report":   "monthly-user-growth",
  "Revenue Trend Report": "revenue-trend",
  "Top Service Category": "top-service-category",
  "Top Cities":           "top-cities",
};

// Format "YYYY-MM-DD" → "DD/MM/YYYY" for display
const fmtDisplay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// ── Build live ReportConfig from API data ─────────────────
const buildConfig = (
  reportType:    ReportType,
  userGrowth:    MonthlyUserGrowthItem[],
  revenueTrend:  RevenueTrendItem[],
  topCitiesData: TopCitiesData | null,
  topCategories: { categories: { category: string; percentage: number }[] } | null,
  dateFrom: string,
  dateTo:   string,
): ReportConfig => {
  const mock = reportConfigs[reportType];
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
    case "Revenue Trend Report": {
      if (!revenueTrend.length) return mock;
      const total = revenueTrend.reduce((s, d) => s + d.revenue, 0);
      return {
        ...mock,
        title:      `Revenue Trend · ${range}`,
        weeks:      revenueTrend.map((d) => d.revenue),
        weekLabels: revenueTrend.map((d) => d.month.slice(0, 3)),
        summary:    [{ label: "Total Revenue:", value: `₦${total.toLocaleString()}` }],
      };
    }
    case "Top Service Category": {
      if (!topCategories?.categories.length) return mock;
      const COLORS = ["#2563eb","#F9A826","#2E7D32","#7B3F9E","#db2777","#0891b2"];
      return {
        ...mock,
        title:    "Top Service Category",
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
      const cities = topCitiesData?.cities ?? [];
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
  }
};

// ── Page ──────────────────────────────────────────────────
export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const report   = useAppSelector((s) => s.report);

  const [reportType, setReportType] = useState<ReportType>("User Growth Report");
  const [format,     setFormat]     = useState<FormatType>("PDF");
  // ISO dates — native date inputs use YYYY-MM-DD directly
  const [dateFrom,   setDateFrom]   = useState("2025-05-01");
  const [dateTo,     setDateTo]     = useState(new Date().toISOString().split("T")[0]);
  const [generated,  setGenerated]  = useState(false);

  const query = { fromDate: dateFrom, toDate: dateTo };

  const isLoading =
    report.userGrowthStatus    === "loading" ||
    report.revenueTrendStatus  === "loading" ||
    report.topCategoriesStatus === "loading" ||
    report.topCitiesStatus     === "loading";

  const handleGenerate = () => {
    setGenerated(true);
    switch (reportType) {
      case "User Growth Report":   dispatch(fetchUserGrowthThunk(query));    break;
      case "Revenue Trend Report": dispatch(fetchRevenueTrendThunk(query));  break;
      case "Top Service Category": dispatch(fetchTopCategoriesThunk(query)); break;
      case "Top Cities":           dispatch(fetchTopCitiesThunk(query));     break;
    }
  };

  const handleDownloadPdf = () => {
    dispatch(downloadReportThunk({
      reportType: reportTypeToApi[reportType],
      query,
      filename:   `${reportTypeToApi[reportType]}_${dateFrom}_${dateTo}.pdf`,
    }))
      .unwrap()
      .catch(() => toast.error("Failed to download PDF"));
  };

  const handleDownloadCsv = () => {
    const rows: unknown[] = (() => {
      switch (reportType) {
        case "User Growth Report":   return report.userGrowth;
        case "Revenue Trend Report": return report.revenueTrend;
        case "Top Service Category": return report.topCategories?.categories ?? [];
        case "Top Cities":           return report.topCitiesData?.cities ?? [];
      }
    })();
    if (!rows.length) { toast.warning("No data to export — generate the report first"); return; }
    triggerCsvDownload(toCsv(rows), `${reportTypeToApi[reportType]}_${dateFrom}_${dateTo}.csv`);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${reportType} — ${fmtDisplay(dateFrom)} to ${fmtDisplay(dateTo)}`);
    const body    = encodeURIComponent(
      `Please find the ${reportType} for the period ${fmtDisplay(dateFrom)} to ${fmtDisplay(dateTo)} below.\n\n` +
      `Report Type: ${reportType}\n` +
      `Date Range:  ${fmtDisplay(dateFrom)} – ${fmtDisplay(dateTo)}\n\n` +
      `Please download the attached report or visit the admin dashboard to view the full data.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleExport = () => {
    if (!generated) { toast.warning("Generate the report first"); return; }
    if (format === "PDF") handleDownloadPdf();
    else handleDownloadCsv();
  };

  const config = buildConfig(
    reportType,
    report.userGrowth,
    report.revenueTrend,
    report.topCitiesData ?? null,
    report.topCategories,
    dateFrom,
    dateTo,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Reports" />

      <style>{`
        .report-main { padding: 12px; gap: 12px; }
        @media (min-width: 640px) {
          .report-main { padding: 24px 32px; gap: 20px; }
        }
      `}</style>

      <main
        className="report-main"
        style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", backgroundColor: "var(--color-background)" }}
      >
        <ReportControls
          reportType={reportType}
          format={format}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onReportType={(v) => { setReportType(v); setGenerated(false); }}
          onFormat={setFormat}
          onDateFrom={(v) => { setDateFrom(v); setGenerated(false); }}
          onDateTo={(v)   => { setDateTo(v);   setGenerated(false); }}
          onGenerate={handleGenerate}
          onExport={handleExport}
        />

        {!generated ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "80px", gap: "12px", color: "#9CA3AF" }}>
            <TrendingUp size={40} strokeWidth={1.2} />
            <p style={{ fontSize: "14px", textAlign: "center" }}>
              Select a report type and date range, then click{" "}
              <strong style={{ color: "#111827" }}>Generate</strong>.
            </p>
          </div>
        ) : isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "80px", gap: "10px", color: "#9CA3AF", fontSize: "14px" }}>
            <span className="animate-spin" style={{ display: "inline-block", width: 20, height: 20, border: "2px solid #E5E7EB", borderTopColor: "#2563eb", borderRadius: "50%" }} />
            Generating report...
          </div>
        ) : (
          <ReportCard
            config={config}
            onDownloadPdf={handleDownloadPdf}
            onDownloadCsv={handleDownloadCsv}
            onEmail={handleEmail}
            isDownloading={report.downloadStatus === "loading"}
          />
        )}
      </main>
    </div>
  );
}