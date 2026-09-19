// components/ChartBits.tsx
// Trend/line charts now live in DashboardLineChart.tsx (tooltip + crosshair version).
// This file keeps the small dependency-free horizontal bar list used for
// breakdowns (verification by tier, rejection reasons, region growth, etc).
"use client";

import { colors } from "./shared";

export function HorizontalBarList({
  data,
  color = colors.textMain,
}: {
  data: { label: string; value: number; pct?: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: "88px",
              flexShrink: 0,
              fontSize: "12px",
              color: colors.textMuted,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {d.label}
          </span>
          <div style={{ flex: 1, backgroundColor: "#F3F4F6", borderRadius: "4px", height: "16px", overflow: "hidden" }}>
            <div
              style={{
                width: `${(d.value / max) * 100}%`,
                height: "100%",
                backgroundColor: color,
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, color: colors.textMain, width: "72px", textAlign: "right", flexShrink: 0 }}>
            {d.value.toLocaleString()}
            {d.pct != null ? ` (${d.pct}%)` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}