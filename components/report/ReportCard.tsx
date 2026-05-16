// components/report/ReportCard.tsx
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
    <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "32px", marginTop: "24px" }}>

      {/* ── Chart ── */}
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

      {/* ── Summary stats — hidden for donut (legend already shows it) ── */}
      {config.chartType === "line" && (
        <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {config.summary.map((s) => (
            <div key={s.label} style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
              <span style={{ width: "200px", flexShrink: 0, fontWeight: 500, color: "var(--color-text-muted)" }}>
                {s.label}
              </span>
              <span style={{ color: "var(--color-text-main)" }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
        <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
          <Download size={14} /> Download PDF
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
          <Download size={14} /> Download CSV
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
          <Mail size={14} /> Email Report
        </button>
      </div>

    </div>
  );
}