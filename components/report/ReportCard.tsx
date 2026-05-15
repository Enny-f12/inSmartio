// components/reports/ReportCard.tsx
"use client";

import { Download, Mail } from "lucide-react";
import LineChart from "./LineChart";
import DonutChart from "./DonutChart";
import type { ReportConfig } from "@/components/report/types";

interface Props {
  config: ReportConfig;
}

export default function ReportCard({ config }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8">

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
      <div className="mt-6 space-y-1.5">
        {config.summary.map((s) => (
          <div key={s.label} className="flex gap-3 text-[13px]">
            <span className="w-48 shrink-0 font-medium text-text-muted">{s.label}</span>
            <span className="text-text-main">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-6 flex-wrap">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
          <Download size={14} /> Download PDF
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
          <Download size={14} /> Download CSV
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
          <Mail size={14} /> Email Report
        </button>
      </div>

    </div>
  );
}