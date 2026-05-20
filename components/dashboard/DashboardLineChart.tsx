"use client";

import { useRef, useState, useCallback } from "react";

interface DashboardLineChartProps {
  title: string;
  yLabel: string;
  xLabel?: string;
  data: number[];
  labels: string[];
  color?: string;
}

interface TooltipState {
  svgX: number;
  svgY: number;
  label: string;
  value: string;
}

export default function DashboardLineChart({
  title,
  yLabel,
  xLabel,
  data,
  labels,
  color = "#2563eb",
}: DashboardLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const W = 500;
  const H = 280;
  const padL = 72;
  const padR = 20;
  const padT = 28;
  const padB = 52;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const minV = Math.floor(Math.min(...data) * 0.85);
  const maxV = Math.ceil(Math.max(...data) * 1.05);
  const range = maxV - minV || 1;
  const yTicks = 5;

  const xOf = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const yOf = (v: number) => padT + chartH - ((v - minV) / range) * chartH;

  const polyline = data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");

  const toPixel = useCallback((svgX: number, svgY: number) => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return { px: 0, py: 0 };
    const svgRect = svg.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const scaleX = svgRect.width / W;
    const scaleY = svgRect.height / H;
    return {
      px: svgRect.left - wrapRect.left + svgX * scaleX,
      py: svgRect.top - wrapRect.top + svgY * scaleY,
    };
  }, []);

  const handleEnter = (i: number) => {
    const v = data[i];
    setTooltip({
      svgX: xOf(i),
      svgY: yOf(v),
      label: labels[i],
      value: v.toLocaleString(),
    });
  };

  // eslint-disable-next-line react-hooks/refs
  const tipPos = tooltip ? toPixel(tooltip.svgX, tooltip.svgY) : null;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <p
        style={{
          fontSize: "13px",
          fontWeight: 600,
          textAlign: "center",
          color: "#111827",
          marginBottom: "12px",
        }}
      >
        {title}
      </p>

      {tooltip && tipPos && (
        <div
          style={{
            position: "absolute",
            left: tipPos.px,
            top: tipPos.py,
            transform: "translate(-50%, calc(-100% - 10px))",
            background: "#1F2937",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 600,
            padding: "5px 10px",
            borderRadius: "7px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          {tooltip.label}: {tooltip.value}
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #1F2937",
            }}
          />
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block" }}
      >
        {/* Grid + Y ticks — full numbers */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = minV + (range / yTicks) * i;
          const y = yOf(val);
          const rounded = Math.round(val);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {rounded.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={10}
          y={padT + chartH / 2}
          textAnchor="middle"
          fontSize={9}
          fill="#9ca3af"
          transform={`rotate(-90, 10, ${padT + chartH / 2})`}
        >
          {yLabel}
        </text>

        {/* X labels */}
        {labels.map((lbl, i) => (
          <text key={lbl} x={xOf(i)} y={H - 22} textAnchor="middle" fontSize={9} fill="#9ca3af">
            {lbl}
          </text>
        ))}

        {xLabel && (
          <text x={padL + chartW / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">
            {xLabel}
          </text>
        )}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#e5e7eb" strokeWidth={1} />
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#e5e7eb" strokeWidth={1} />

        {/* Crosshair */}
        {tooltip && (
          <line
            x1={tooltip.svgX} y1={padT}
            x2={tooltip.svgX} y2={padT + chartH}
            stroke="#D1D5DB" strokeWidth={1} strokeDasharray="4 3"
          />
        )}

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots + hit zones */}
        {data.map((v, i) => {
          const cx = xOf(i);
          const cy = yOf(v);
          const halfL = i === 0 ? padL : (cx - xOf(i - 1)) / 2;
          const halfR = i === data.length - 1 ? padR + 4 : (xOf(i + 1) - cx) / 2;
          const isActive = tooltip?.label === labels[i];
          return (
            <g key={i}>
              <rect
                x={cx - halfL} y={padT}
                width={halfL + halfR} height={chartH}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => handleEnter(i)}
                onMouseLeave={() => setTooltip(null)}
              />
              <circle
                cx={cx} cy={cy}
                r={isActive ? 6 : 4}
                fill={color}
                stroke={isActive ? "#fff" : "none"}
                strokeWidth={2.5}
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}