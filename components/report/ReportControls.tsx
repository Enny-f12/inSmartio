// components/report/ReportControls.tsx
"use client";

import { Download, ChevronDown } from "lucide-react";
import type { FormatType } from "./types";

interface Props {
  reportType:   string;
  format:       FormatType;
  dateFrom:     string;
  dateTo:       string;
  reportTypes?: string[];
  onReportType: (v: string) => void;
  onFormat:     (v: FormatType) => void;
  onDateFrom:   (v: string) => void;
  onDateTo:     (v: string) => void;
  onGenerate:   () => void;
  onExport:     () => void;
}

const FORMAT_OPTIONS: FormatType[] = ["PDF", "CSV"];

function SelectBox({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ padding: "8px 36px 8px 14px", borderRadius: "10px",
            border: "1px solid #E5E7EB", backgroundColor: "#fff",
            fontSize: "13px", color: "#374151", outline: "none",
            appearance: "none", cursor: "pointer", minWidth: "160px" }}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} style={{ position: "absolute", right: "10px", top: "50%",
          transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

function DateBox({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "8px 36px 8px 14px", borderRadius: "10px",
          border: "1px solid #E5E7EB", backgroundColor: "#fff",
          fontSize: "13px", color: "#374151", outline: "none",
          cursor: "pointer", minWidth: "140px" }} />
      <ChevronDown size={13} style={{ position: "absolute", right: "10px", top: "50%",
        transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
    </div>
  );
}

export default function ReportControls({
  reportType, format, dateFrom, dateTo,
  reportTypes, onReportType, onFormat,
  onDateFrom, onDateTo, onGenerate, onExport,
}: Props) {
  const types = reportTypes ?? [
    "User Growth Report",
    "Revenue Report",
    "Top Service Category",
    "Top Cities",
    "Job Completion Report",
    "TAS Performance Report",
    "Dispute Analysis Report",
    "Verification Report",
  ];

  return (
    <div style={{ backgroundColor: "#F4F5F7", padding: "0" }}>
      <style>{`
        .rc-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
        @media(min-width:640px){ .rc-row { flex-wrap: nowrap; } }
      `}</style>

      {/* Row 1: Report Type | Format | Export */}
      <div className="rc-row" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <SelectBox
            label="Report Type:"
            value={reportType}
            options={types}
            onChange={onReportType}
          />
          <SelectBox
            label="Format:"
            value={format}
            options={FORMAT_OPTIONS}
            onChange={(v) => onFormat(v as FormatType)}
          />
        </div>

        {/* Export — top right, blue button */}
        <button onClick={onExport}
          style={{ display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 24px", borderRadius: "12px", border: "none",
            backgroundColor: "#2563EB", color: "#fff",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            flexShrink: 0 }}>
          <Download size={14} /> Export
        </button>
      </div>

      {/* Row 2: Date Range | Generate */}
      <div className="rc-row">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151", whiteSpace: "nowrap" }}>
            Date Range:
          </span>
          <DateBox value={dateFrom} onChange={onDateFrom} />
          <span style={{ fontSize: "13px", color: "#6B7280" }}>to</span>
          <DateBox value={dateTo} onChange={onDateTo} />
        </div>

        {/* Generate — orange/amber button */}
        <button onClick={onGenerate}
          style={{ padding: "10px 32px", borderRadius: "12px", border: "none",
            backgroundColor: "#F59E0B", color: "#fff",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            flexShrink: 0 }}>
          Generate
        </button>
      </div>
    </div>
  );
}