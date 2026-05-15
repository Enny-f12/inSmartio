// app/(dashboard)/report/page.tsx
"use client";

import { useState } from "react";
import Topbar from "@/components/layout/Navbar";
import ReportControls from "@/components/report/ReportControls";
import ReportCard from "@/components/report/ReportCard";
import type { ReportType, FormatType } from "@/components/report/types";
import { reportConfigs } from "@/components/report/types";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("User Growth Report");
  const [format,     setFormat]     = useState<FormatType>("PDF");
  const [dateFrom,   setDateFrom]   = useState("01/03/2026");
  const [dateTo,     setDateTo]     = useState("31/03/2026");
  const [generated,  setGenerated]  = useState(true);

  const handleReportType = (v: ReportType) => {
    setReportType(v);
    setGenerated(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Reports" />

      <main className="flex-1 px-8 py-6 space-y-6">

        <ReportControls
          reportType={reportType}
          format={format}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onReportType={handleReportType}
          onFormat={setFormat}
          onDateFrom={setDateFrom}
          onDateTo={setDateTo}
          onGenerate={() => setGenerated(true)}
          onExport={() => console.log("export")}
        />

        {generated ? (
          <ReportCard config={reportConfigs[reportType]} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-16 flex items-center justify-center">
            <p className="text-[14px] text-text-muted">
              Select a report type and date range, then click{" "}
              <strong className="text-text-main">Generate</strong>.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}