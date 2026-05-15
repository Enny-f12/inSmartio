// components/dashboard/DashboardLineChart.tsx

interface DashboardLineChartProps {
  title: string;
  yLabel: string;
  xLabel?: string;
  data: number[];
  labels: string[];
  color?: string;
}

const fmtY = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${Math.round(v / 1000) * 1000 === v ? v / 1000 : Math.round(v / 1000)}K`;
  return String(Math.round(v));
};

export default function DashboardLineChart({
  title, yLabel, xLabel, data, labels, color = "#2563eb",
}: DashboardLineChartProps) {
  const W = 500, H = 280;
  const padL = 64, padR = 20, padT = 28, padB = 52;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const minV  = Math.floor(Math.min(...data) * 0.85);
  const maxV  = Math.ceil(Math.max(...data) * 1.05);
  const range = maxV - minV || 1;
  const yTicks = 5;

  const xOf = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const yOf = (v: number) => padT + chartH - ((v - minV) / range) * chartH;

  const polyline = data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");

  return (
    <div>
      <p className="text-[13px] font-semibold text-center text-text-main mb-3">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>

        {/* Grid + Y ticks */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = minV + (range / yTicks) * i;
          const y   = yOf(val);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {fmtY(Math.round(val))}
              </text>
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={12} y={padT + chartH / 2}
          textAnchor="middle" fontSize={9} fill="#9ca3af"
          transform={`rotate(-90, 12, ${padT + chartH / 2})`}
        >
          {yLabel}
        </text>

        {/* X labels */}
        {labels.map((lbl, i) => (
          <text key={lbl} x={xOf(i)} y={H - 22} textAnchor="middle" fontSize={9} fill="#9ca3af">
            {lbl}
          </text>
        ))}

        {/* X-axis title */}
        {xLabel && (
          <text x={padL + chartW / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">
            {xLabel}
          </text>
        )}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#e5e7eb" strokeWidth={1} />
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#e5e7eb" strokeWidth={1} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {data.map((v, i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r={4} fill={color} />
        ))}
      </svg>
    </div>
  );
}