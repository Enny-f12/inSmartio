// components/Skeleton.tsx
"use client";

import { colors } from "./shared";

export function SkelBlock({
  width = "100%",
  height = "14px",
  radius = "6px",
  style = {},
}: {
  width?: string | number;
  height?: string | number;
  radius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="rp-skel"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkelKPICard() {
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: "14px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <SkelBlock width="70px" height="11px" />
      <SkelBlock width="90px" height="22px" />
      <SkelBlock width="50px" height="10px" />
    </div>
  );
}

export function SkelKPIRow({ count = 4 }: { count?: number }) {
  return (
    <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkelKPICard key={i} />
      ))}
    </div>
  );
}

export function SkelChart({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: "14px",
        padding: "18px 20px",
      }}
    >
      <SkelBlock width="160px" height="12px" style={{ marginBottom: "18px" }} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <SkelBlock
            key={i}
            width="100%"
            height={`${30 + ((i * 37) % 70)}%`}
            radius="4px 4px 0 0"
          />
        ))}
      </div>
    </div>
  );
}

export function SkelTableRows({
  rows = 6,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
          {Array.from({ length: cols }).map((__, c) => (
            <td
              key={c}
              style={{ padding: c === 0 ? "14px 20px 14px 24px" : "14px 20px 14px 0" }}
            >
              <SkelBlock width={c === 0 ? "70%" : `${50 + (c * 13) % 40}%`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkelCardRows({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: "14px 16px",
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <SkelBlock width="60%" height="13px" />
            <SkelBlock width="40%" height="11px" />
          </div>
        </div>
      ))}
    </div>
  );
}