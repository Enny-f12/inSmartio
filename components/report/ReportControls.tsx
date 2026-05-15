// components/reports/ReportControls.tsx
"use client";

import { Download } from "lucide-react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import type { ReportType, FormatType } from "@/components/report/types";
import { REPORT_TYPES, FORMATS, DATE_FROM_OPTIONS, DATE_TO_OPTIONS } from "@/components/report/types";

interface Props {
  reportType: ReportType;
  format: FormatType;
  dateFrom: string;
  dateTo: string;
  onReportType: (v: ReportType) => void;
  onFormat: (v: FormatType) => void;
  onDateFrom: (v: string) => void;
  onDateTo: (v: string) => void;
  onGenerate: () => void;
  onExport: () => void;
}

export default function ReportControls({
  reportType, format, dateFrom, dateTo,
  onReportType, onFormat, onDateFrom, onDateTo,
  onGenerate, onExport,
}: Props) {
  return (
    <div className="space-y-4">

      {/* Row 1: Report Type + Format + Export */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-text-main whitespace-nowrap">Report Type:</span>
          <FilterDropdown
            value={reportType}
            options={REPORT_TYPES}
            onChange={(v) => onReportType(v as ReportType)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-text-main">Format:</span>
          <FilterDropdown
            value={format}
            options={FORMATS}
            onChange={(v) => onFormat(v as FormatType)}
          />
        </div>

        {/* Export — pushed to far right */}
        <button
          onClick={onExport}
          className="btn-primary ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold"
        >
          <Download size={15} />
          Export
        </button>
      </div>

      {/* Row 2: Date Range + Generate */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[13px] font-semibold text-text-main whitespace-nowrap">Date Range:</span>

        <FilterDropdown
          value={dateFrom}
          options={DATE_FROM_OPTIONS}
          onChange={onDateFrom}
        />

        <span className="text-[13px] text-text-muted">to</span>

        <FilterDropdown
          value={dateTo}
          options={DATE_TO_OPTIONS}
          onChange={onDateTo}
        />

        <button
          onClick={onGenerate}
          className="px-8 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
        >
          Generate
        </button>
      </div>

    </div>
  );
}