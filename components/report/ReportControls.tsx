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
    <>
      <style>{`
        .rc-wrap   { display: flex; flex-direction: column; gap: 12px; border-radius: 16px; border: 1px solid var(--color-border); background: #fff; padding: 16px; }
        .rc-row1   { display: flex; flex-direction: column; gap: 10px; }
        .rc-field  { display: flex; align-items: center; gap: 10px; }
        .rc-label  { font-size: 13px; font-weight: 600; color: var(--color-text-main); white-space: nowrap; min-width: 88px; }
        .rc-row2   { display: flex; flex-direction: column; gap: 10px; }
        .rc-date-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .rc-actions  { display: flex; gap: 10px; }
        .rc-generate { flex: 1; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 600; color: #fff; background: #F9A826; border: none; cursor: pointer; }
        .rc-export   { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }

        @media (min-width: 640px) {
          .rc-wrap   { padding: 20px 24px; gap: 16px; }
          .rc-row1   { flex-direction: row; align-items: center; }
          .rc-label  { min-width: auto; }
          .rc-row2   { flex-direction: row; align-items: center; }
          .rc-date-row { flex-wrap: nowrap; }
          .rc-actions  { margin-left: auto; }
          .rc-generate { flex: none; padding: 10px 32px; }
          .rc-export   { flex: none; padding: 10px 20px; }
        }
      `}</style>

      <div className="rc-wrap">

        {/* Row 1: Report Type + Format */}
        <div className="rc-row1">
          <div className="rc-field">
            <span className="rc-label">Report Type:</span>
            <FilterDropdown value={reportType} options={REPORT_TYPES} onChange={(v) => onReportType(v as ReportType)} />
          </div>
          <div className="rc-field">
            <span className="rc-label">Format:</span>
            <FilterDropdown value={format} options={FORMATS} onChange={(v) => onFormat(v as FormatType)} />
          </div>
        </div>

        {/* Row 2: Date Range + Generate + Export */}
        <div className="rc-row2">
          <div className="rc-date-row">
            <span className="rc-label">Date Range:</span>
            <FilterDropdown value={dateFrom} options={DATE_FROM_OPTIONS} onChange={onDateFrom} />
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>to</span>
            <FilterDropdown value={dateTo} options={DATE_TO_OPTIONS} onChange={onDateTo} />
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