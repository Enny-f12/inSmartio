// components/report/LineChart.tsx

interface LineChartProps {
  data: number[];
  labels: string[];
  yLabel: string;
  title: string;
}

export default function LineChart({ data, labels, yLabel, title }: LineChartProps) {
  const W = 600, H = 300;
  const padL = 72, padR = 32, padT = 32, padB = 56;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const minV  = Math.floor(Math.min(...data) * 0.85);
  const maxV  = Math.ceil(Math.max(...data) * 1.05);
  const range = maxV - minV || 1;
  const yTicks = 5;

  const xOf = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const yOf = (v: number) => padT + chartH - ((v - minV) / range) * chartH;

  const polyline = data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");

  const fmtY = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${Math.round(v / 1000)}K`;
    return String(Math.round(v));
  };

  return (
    <div>
      <p style={{ fontSize: "14px", fontWeight: 600, textAlign: "center", color: "var(--color-text-main)", marginBottom: "16px" }}>
        {title}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", margin: "0 auto" }}
      >
        {/* Grid + Y ticks */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = minV + (range / yTicks) * i;
          const y   = yOf(val);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#6b7280">
                {fmtY(Math.round(val))}
              </text>
            </g>
          );
        })}

        {/* Vertical grid lines */}
        {data.map((_, i) => (
          <line
            key={i}
            x1={xOf(i)} y1={padT}
            x2={xOf(i)} y2={padT + chartH}
            stroke="#e5e7eb" strokeWidth={1}
          />
        ))}

        {/* Y-axis label */}
        <text
          x={14} y={padT + chartH / 2}
          textAnchor="middle" fontSize={10} fill="#6b7280"
          transform={`rotate(-90, 14, ${padT + chartH / 2})`}
        >
          {yLabel}
        </text>

        {/* X labels */}
        {labels.map((lbl, i) => (
          <text key={lbl} x={xOf(i)} y={H - 24} textAnchor="middle" fontSize={10} fill="#6b7280">
            {lbl}
          </text>
        ))}

        {/* X axis title */}
        <text x={padL + chartW / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#6b7280">
          Weeks
        </text>

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#e5e7eb" strokeWidth={1} />
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#e5e7eb" strokeWidth={1} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {data.map((v, i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r={5} fill="#2563eb" />
        ))}
      </svg>
    </div>
  );
}