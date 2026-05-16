// components/report/ReportControls.tsx
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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Row 1: Report Type + Format + Export ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {/* Report Type */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", whiteSpace: "nowrap" }}>
            Report Type:
          </span>
          <FilterDropdown
            value={reportType}
            options={REPORT_TYPES}
            onChange={(v) => onReportType(v as ReportType)}
          />
        </div>

        {/* Format */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", whiteSpace: "nowrap" }}>
            Format:
          </span>
          <FilterDropdown
            value={format}
            options={FORMATS}
            onChange={(v) => onFormat(v as FormatType)}
          />
        </div>

        {/* Export — pushed far right */}
        <button
          onClick={onExport}
          className="btn-primary"
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          <Download size={15} />
          Export
        </button>
      </div>

      {/* ── Row 2: Date Range + Generate ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", whiteSpace: "nowrap" }}>
          Date Range:
        </span>

        <FilterDropdown
          value={dateFrom}
          options={DATE_FROM_OPTIONS}
          onChange={onDateFrom}
        />

        <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>to</span>

        <FilterDropdown
          value={dateTo}
          options={DATE_TO_OPTIONS}
          onChange={onDateTo}
        />

        <button
          onClick={onGenerate}
          style={{ padding: "10px 32px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#F9A826", border: "none", cursor: "pointer" }}
        >
          Generate
        </button>
      </div>

    </div>
  );
}