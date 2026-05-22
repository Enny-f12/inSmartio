"use client";

import { useRef, useState, useCallback, useId } from "react";

interface DashboardLineChartProps {
  title:      string;
  yLabel:     string;
  xLabel?:    string;
  data:       number[];
  labels:     string[];
  color?:     string;
  statValue?: string;
}

interface Tooltip {
  x:     number;
  y:     number;
  label: string;
  value: number;
  idx:   number;
}

export default function DashboardLineChart({
  title, yLabel, xLabel, data, labels, color = "#2563eb", statValue,
}: DashboardLineChartProps) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const gradId  = useId().replace(/:/g, "");

  // ── SVG viewport ─────────────────────────────────────────
  const W = 500, H = 220;
  const PL = 52, PR = 28, PT = 16, PB = 36;   // wider left for y-labels, wider right so line doesn't clip
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const minV  = 0;
  const maxV  = Math.ceil(Math.max(...data) * 1.15) || 1;
  const range = maxV - minV;

  const xOf = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * chartW;
  const yOf = (v: number) => PT + chartH - ((v - minV) / range) * chartH;

  // ── Smooth cubic bezier path ──────────────────────────────
  const smooth = (pts: [number, number][]): string => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cpx = (x0 + x1) / 2;
      d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };

  const pts: [number, number][] = data.map((v, i) => [xOf(i), yOf(v)]);
  const linePath = smooth(pts);
  const areaPath = linePath
    + ` L ${xOf(data.length - 1)} ${PT + chartH}`
    + ` L ${xOf(0)} ${PT + chartH} Z`;

  // ── Y grid ticks ─────────────────────────────────────────
  const TICKS = 4;
  const yTicks = Array.from({ length: TICKS + 1 }, (_, i) => {
    const v = minV + (range / TICKS) * i;
    return { v, y: yOf(v) };
  });

  // ── Tooltip ───────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showTooltip = useCallback((i: number, e: React.MouseEvent<SVGRectElement>) => {
    const wrap = wrapRef.current;
    const svg  = svgRef.current;
    if (!wrap || !svg) return;
    const svgRect  = svg.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const scaleX   = svgRect.width  / W;
    const scaleY   = svgRect.height / H;
    const px = svgRect.left - wrapRect.left + xOf(i) * scaleX;
    const py = svgRect.top  - wrapRect.top  + yOf(data[i]) * scaleY;
    setTooltip({ x: px, y: py, label: labels[i], value: data[i], idx: i });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, labels]);

  const fmt = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`;
    return String(Math.round(v));
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", userSelect: "none" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 2px" }}>{yLabel}</p>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>{title}</p>
          {statValue && (
            <p style={{ fontSize: "22px", fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.1 }}>{statValue}</p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
          <span style={{ fontSize: "12px", color: "#6B7280" }}>Current</span>
        </div>
      </div>

      {/* Tooltip card */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: tooltip.x, top: tooltip.y,
          transform: "translate(-50%, calc(-100% - 14px))",
          backgroundColor: "#1E293B", color: "#fff",
          borderRadius: "10px", padding: "8px 14px",
          pointerEvents: "none", zIndex: 20,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)", minWidth: "110px",
        }}>
          <p style={{ fontSize: "11px", color: "#94A3B8", margin: "0 0 2px", fontWeight: 500 }}>{tooltip.label}</p>
          <p style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#fff" }}>
            {tooltip.value.toLocaleString()}
          </p>
          <span style={{
            position: "absolute", top: "100%", left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
            borderTop: "6px solid #1E293B",
          }} />
        </div>
      )}

      {/* SVG chart */}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={`grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
          <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Horizontal grid lines + Y labels */}
        {yTicks.map(({ v, y }, i) => (
          <g key={i}>
            <line x1={PL} y1={y} x2={PL + chartW} y2={y}
              stroke="#F1F5F9" strokeWidth={1} strokeDasharray={i === 0 ? "0" : "4 3"} />
            <text x={PL - 8} y={y + 4} textAnchor="end" fontSize={9} fill="#CBD5E1">
              {fmt(v)}
            </text>
          </g>
        ))}

        {/* Vertical crosshair on hover */}
        {tooltip && (
          <line
            x1={xOf(tooltip.idx)} y1={PT}
            x2={xOf(tooltip.idx)} y2={PT + chartH}
            stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4 3"
          />
        )}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#grad-${gradId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.8}
          strokeLinecap="round" strokeLinejoin="round"
          filter={`url(#glow-${gradId})`} />

        {/* Active dot */}
        {tooltip && (
          <>
            <circle cx={xOf(tooltip.idx)} cy={yOf(tooltip.value)} r={8}
              fill={color} fillOpacity={0.15} />
            <circle cx={xOf(tooltip.idx)} cy={yOf(tooltip.value)} r={4.5}
              fill="#fff" stroke={color} strokeWidth={2.5} />
          </>
        )}

        {/* Invisible hover zones */}
        {data.map((_, i) => {
          const cx    = xOf(i);
          const halfL = i === 0 ? 0 : (cx - xOf(i - 1)) / 2;
          const halfR = i === data.length - 1 ? 0 : (xOf(i + 1) - cx) / 2;
          return (
            <rect key={i}
              x={cx - halfL} y={PT} width={halfL + halfR || chartW / data.length} height={chartH}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={(e) => showTooltip(i, e)}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* X axis labels */}
        {labels.map((lbl, i) => (
          <text key={lbl} x={xOf(i)} y={H - 8}
            textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
            fontSize={9} fill={tooltip?.idx === i ? color : "#94A3B8"}
            fontWeight={tooltip?.idx === i ? 600 : 400}>
            {lbl}
          </text>
        ))}

        {xLabel && (
          <text x={PL + chartW / 2} y={H - 2} textAnchor="middle" fontSize={8} fill="#CBD5E1">
            {xLabel}
          </text>
        )}
      </svg>
    </div>
  );
}