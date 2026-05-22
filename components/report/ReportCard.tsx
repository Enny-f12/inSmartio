// components/report/ReportCard.tsx
"use client";

import { Download, Mail, Loader2 } from "lucide-react";
import LineChart from "./LineChart";
import DonutChart from "./DonutChart";
import type { ReportConfig } from "@/components/report/types";

interface Props {
  config:         ReportConfig;
  onDownloadPdf?: () => void;
  onDownloadCsv?: () => void;
  onEmail?:       () => void;
  isDownloading?: boolean;
}

export default function ReportCard({
  config, onDownloadPdf, onDownloadCsv, onEmail, isDownloading,
}: Props) {
  return (
    <>
      <style>{`
        .rc-card        { border-radius: 16px; border: 1px solid var(--color-border); background: #fff; padding: 16px; }
        .rc-summary-row { font-size: 13px; margin-bottom: 8px; }
        .rc-summary-lbl { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); margin-bottom: 2px; }
        .rc-summary-val { color: var(--color-text-main); }
        .rc-actions     { display: flex; flex-direction: column; gap: 8px; margin-top: 24px; }
        .rc-action-btn  { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 16px; border-radius: 12px; font-size: 13px; font-weight: 500; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-muted); cursor: pointer; transition: background 0.15s; }
        .rc-action-btn:hover { background: var(--color-background); }
        .rc-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (min-width: 480px) {
          .rc-summary-lbl { font-size: 13px; font-weight: 500; text-transform: none; letter-spacing: 0; display: inline-block; width: 200px; margin-bottom: 0; }
          .rc-summary-val { display: inline; }
          .rc-actions     { flex-direction: row; flex-wrap: wrap; }
          .rc-action-btn  { flex: none; }
        }
        @media (min-width: 640px) {
          .rc-card { padding: 32px; }
        }
      `}</style>

      <div className="rc-card">

        {/* Chart */}
        {config.chartType === "line" && config.weeks && config.weekLabels && (
          <LineChart
            data={config.weeks}
            labels={config.weekLabels}
            yLabel={config.yLabel ?? ""}
            title={config.title}
          />
        )}
        {config.chartType === "donut" && config.segments && (
          <DonutChart segments={config.segments} title={config.title} />
        )}

        {/* Summary stats */}
        {config.summary.length > 0 && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {config.summary.map((s) => (
              <div key={s.label} className="rc-summary-row">
                <p className="rc-summary-lbl">{s.label}</p>
                <p className="rc-summary-val">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="rc-actions">
          <button onClick={onDownloadPdf} disabled={isDownloading} className="rc-action-btn">
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download PDF
          </button>
          <button onClick={onDownloadCsv} className="rc-action-btn">
            <Download size={14} /> Download CSV
          </button>
          <button onClick={onEmail} className="rc-action-btn">
            <Mail size={14} /> Email Report
          </button>
        </div>

      </div>
    </>
  );
}