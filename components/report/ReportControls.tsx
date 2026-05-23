// components/report/ReportControls.tsx
"use client";

import { Download } from "lucide-react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import type { ReportType, FormatType } from "@/components/report/types";
import { REPORT_TYPES, FORMATS } from "@/components/report/types";

interface Props {
  reportType: ReportType;
  format:     FormatType;
  dateFrom:   string;   // "YYYY-MM-DD"
  dateTo:     string;   // "YYYY-MM-DD"
  onReportType: (v: ReportType) => void;
  onFormat:     (v: FormatType) => void;
  onDateFrom:   (v: string) => void;
  onDateTo:     (v: string) => void;
  onGenerate:   () => void;
  onExport:     () => void;
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid #E5E7EB",
  fontSize: "13px",
  color: "#111827",
  backgroundColor: "#F9FAFB",
  outline: "none",
  cursor: "pointer",
};

export default function ReportControls({
  reportType, format, dateFrom, dateTo,
  onReportType, onFormat, onDateFrom, onDateTo,
  onGenerate, onExport,
}: Props) {
  return (
    <>
      <style>{`
        .rc-wrap   { display: flex; flex-direction: column; gap: 12px; border-radius: 16px; border: 1px solid #E5E7EB; background: #fff; padding: 16px; }
        .rc-row    { display: flex; flex-direction: column; gap: 10px; }
        .rc-field  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rc-label  { font-size: 13px; font-weight: 600; color: #374151; white-space: nowrap; min-width: 100px; }
        .rc-actions { display: flex; gap: 10px; }
        .rc-generate { flex: 1; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 600; color: #fff; background: #F9A826; border: none; cursor: pointer; }
        .rc-export   { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
        @media (min-width: 640px) {
          .rc-wrap    { padding: 20px 24px; gap: 16px; }
          .rc-row     { flex-direction: row; align-items: center; flex-wrap: wrap; }
          .rc-label   { min-width: auto; }
          .rc-actions { margin-left: auto; }
          .rc-generate { flex: none; padding: 10px 32px; }
          .rc-export   { flex: none; padding: 10px 20px; }
        }
      `}</style>

      <div className="rc-wrap">

        {/* Row 1: Report Type + Format */}
        <div className="rc-row">
          <div className="rc-field">
            <span className="rc-label">Report Type:</span>
            <FilterDropdown value={reportType} options={REPORT_TYPES} onChange={(v) => onReportType(v as ReportType)} />
          </div>
          <div className="rc-field">
            <span className="rc-label">Format:</span>
            <FilterDropdown value={format} options={FORMATS} onChange={(v) => onFormat(v as FormatType)} />
          </div>
        </div>

        {/* Row 2: Date Range (native date inputs) + actions */}
        <div className="rc-row">
          <div className="rc-field">
            <span className="rc-label">Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => onDateFrom(e.target.value)}
              style={inputStyle}
            />
            <span style={{ fontSize: "13px", color: "#9CA3AF" }}>to</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => onDateTo(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="rc-actions">
            <button onClick={onGenerate} className="rc-generate">Generate</button>
            <button onClick={onExport} className="btn-primary rc-export">
              <Download size={15} /> Export
            </button>
          </div>
        </div>

      </div>
    </>
  );
}