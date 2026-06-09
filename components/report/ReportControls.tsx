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
    <div style={{ backgroundColor: "#ffffff", padding: 0 }}>
      <style>{`
        .rc-field { display: flex; flex-direction: column; gap: 6px; width: 100%; margin-bottom: 14px; }
        .rc-field:last-child { margin-bottom: 0; }
        .rc-field label { font-size: 12px; font-weight: 600; color: #6B7280; }
        .rc-field select, .rc-field input[type="date"] {
          width: 100%; padding: 9px 36px 9px 14px; border-radius: 10px;
          border: 1px solid #E5E7EB; background-color: #fff;
          font-size: 13px; color: #374151; outline: none;
          appearance: none; cursor: pointer; box-sizing: border-box;
        }
        .rc-field select:focus, .rc-field input[type="date"]:focus {
          border-color: #2563EB;
        }
        .rc-date-row { display: flex; align-items: center; gap: 8px; }
        .rc-date-row > div { flex: 1; }
        .rc-date-row input[type="date"] { width: 100%; padding: 9px 14px; border-radius: 10px;
          border: 1px solid #E5E7EB !important; background: #fff !important; font-size: 13px; color: #374151;
          outline: none; cursor: pointer; box-sizing: border-box; display: block; }
        .rc-date-row input[type="date"]:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .rc-btn-row { display: flex; gap: 10px; margin-top: 18px; }
        .rc-btn-row button { flex: 1; padding: 11px 0; border-radius: 12px; border: none;
          font-size: 13px; font-weight: 600; cursor: pointer; }
        @media(min-width:640px){
          .rc-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .rc-btn-row button { flex: unset; padding: 11px 28px; }
          .rc-btn-row { justify-content: flex-end; }
        }
      `}</style>

      {/* Report Type + Format */}
      <div className="rc-two-col">
        <div className="rc-field">
          <label>Report Type</label>
          <div style={{ position: "relative" }}>
            <select value={reportType} onChange={(e) => onReportType(e.target.value)}>
              {types.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          </div>
        </div>

        <div className="rc-field">
          <label>Format</label>
          <div style={{ position: "relative" }}>
            <select value={format} onChange={(e) => onFormat(e.target.value as FormatType)}>
              {FORMAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="rc-field" style={{ marginTop: 4 }}>
        <label>Date Range</label>
        <div className="rc-date-row">
          <div>
            <input type="date" value={dateFrom} onChange={(e) => onDateFrom(e.target.value)} />
          </div>
          <span style={{ fontSize: 13, color: "#9CA3AF", flexShrink: 0 }}>to</span>
          <div>
            <input type="date" value={dateTo} onChange={(e) => onDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="rc-btn-row">
        <button onClick={onGenerate}
          style={{ backgroundColor: "#F59E0B", color: "#fff" }}>
          Generate
        </button>
        <button onClick={onExport}
          style={{ backgroundColor: "#2563EB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Download size={14} /> Export
        </button>
      </div>
    </div>
  );
}