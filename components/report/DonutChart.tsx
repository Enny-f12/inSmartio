// components/reports/DonutChart.tsx
import type { DonutSegment } from "@/components/report/types";

interface DonutChartProps {
  segments: DonutSegment[];
  title: string;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

function buildArcs(segments: DonutSegment[]) {
  const SIZE = 240;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R  = 90;
  const r  = 52;

  // Pre-compute cumulative start angles immutably
  const startAngles = segments.reduce<number[]>((acc, seg, i) => {
    const prev  = i === 0 ? -90 : acc[i - 1] + (segments[i - 1].value / 100) * 360;
    return [...acc, i === 0 ? -90 : prev];
  }, []);

  return segments.map((seg, i) => {
    const startAngle = startAngles[i];
    const sweep      = (seg.value / 100) * 360;
    const endAngle   = startAngle + sweep;
    const large      = sweep > 180 ? 1 : 0;

    const x1  = cx + R * Math.cos(toRad(startAngle));
    const y1  = cy + R * Math.sin(toRad(startAngle));
    const x2  = cx + R * Math.cos(toRad(endAngle));
    const y2  = cy + R * Math.sin(toRad(endAngle));
    const xi1 = cx + r * Math.cos(toRad(startAngle));
    const yi1 = cy + r * Math.sin(toRad(startAngle));
    const xi2 = cx + r * Math.cos(toRad(endAngle));
    const yi2 = cy + r * Math.sin(toRad(endAngle));

    const midAngle = startAngle + sweep / 2;
    const labelR   = (R + r) / 2;
    const lx = cx + labelR * Math.cos(toRad(midAngle));
    const ly = cy + labelR * Math.sin(toRad(midAngle));

    const d = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
      `L ${xi2} ${yi2}`,
      `A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1}`,
      "Z",
    ].join(" ");

    return { ...seg, d, lx, ly };
  });
}

export default function DonutChart({ segments, title }: DonutChartProps) {
  const SIZE = 240;
  const arcs = buildArcs(segments);

  return (
    <div className="flex items-center gap-10">
      {/* Donut */}
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        {arcs.map((arc) => (
          <g key={arc.label}>
            <path d={arc.d} fill={arc.color} />
            <text
              x={arc.lx} y={arc.ly + 4}
              textAnchor="middle" fontSize={11}
              fontWeight="600" fill="#fff"
            >
              {arc.value}%
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div>
        <p className="text-[15px] font-semibold text-text-main mb-4">{title}</p>
        <div className="space-y-3">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-8 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
                <span className="text-text-main">{seg.label}:</span>
              </div>
              <span className="font-semibold text-text-main">{seg.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}