// components/report/DonutChart.tsx
import type { DonutSegment } from "@/components/report/types";

interface DonutChartProps {
  segments: DonutSegment[];
  title:    string;
  size?:    number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

function buildArcs(segments: DonutSegment[], SIZE: number) {
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R  = SIZE * 0.375;
  const r  = SIZE * 0.2167;

  // Build cumulative start angles without mutation
  const startAngles = segments.reduce<number[]>((acc, seg, i) => {
    if (i === 0) return [-90];
    const prev = acc[i - 1] + (segments[i - 1].value / 100) * 360;
    return [...acc, prev];
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

export default function DonutChart({ segments, title, size = 240 }: DonutChartProps) {
  const mobileSize  = 180;
  const desktopSize = size;

  return (
    <>
      <style>{`
        .donut-wrap        { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .donut-svg-mobile  { display: block; }
        .donut-svg-desktop { display: none; }
        .donut-legend      { width: 100%; }
        .donut-title       { font-size: 15px; font-weight: 600; color: var(--color-text-main); margin-bottom: 14px; text-align: center; }
        .donut-legend-rows { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
        .donut-legend-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; }
        .donut-legend-label { display: flex; align-items: center; gap: 6px; font-weight: 500; color: var(--color-text-main); }
        .donut-legend-val  { color: var(--color-text-muted); flex-shrink: 0; }
        @media (min-width: 560px) {
          .donut-wrap        { flex-direction: row; align-items: center; gap: 32px; }
          .donut-svg-mobile  { display: none; }
          .donut-svg-desktop { display: block; }
          .donut-legend      { width: auto; flex: 1; }
          .donut-title       { text-align: left; }
          .donut-legend-rows { grid-template-columns: 1fr; gap: 12px; }
          .donut-legend-item { justify-content: space-between; gap: 24px; }
        }
      `}</style>

      <div className="donut-wrap">
        {/* Mobile */}
        <svg className="donut-svg-mobile" width={mobileSize} height={mobileSize} viewBox={`0 0 ${mobileSize} ${mobileSize}`} style={{ flexShrink: 0 }}>
          {buildArcs(segments, mobileSize).map((arc) => (
            <g key={arc.label}>
              <path d={arc.d} fill={arc.color} />
              <text x={arc.lx} y={arc.ly + 4} textAnchor="middle" fontSize={10} fontWeight="600" fill="#fff">
                {arc.value}%
              </text>
            </g>
          ))}
        </svg>

        {/* Desktop */}
        <svg className="donut-svg-desktop" width={desktopSize} height={desktopSize} viewBox={`0 0 ${desktopSize} ${desktopSize}`} style={{ flexShrink: 0 }}>
          {buildArcs(segments, desktopSize).map((arc) => (
            <g key={arc.label}>
              <path d={arc.d} fill={arc.color} />
              <text x={arc.lx} y={arc.ly + 4} textAnchor="middle" fontSize={desktopSize > 240 ? 13 : 11} fontWeight="600" fill="#fff">
                {arc.value}%
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="donut-legend">
          <p className="donut-title">{title}</p>
          <div className="donut-legend-rows">
            {segments.map((seg) => (
              <div key={seg.label} className="donut-legend-item">
                <div className="donut-legend-label">
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: seg.color, flexShrink: 0, display: "inline-block" }} />
                  {seg.label}:
                </div>
                <span className="donut-legend-val">{seg.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}