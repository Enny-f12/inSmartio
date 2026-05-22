"use client";

import { useEffect } from "react";
import { Users, ShieldCheck, DollarSign, TrendingUp } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import DashboardLineChart from "@/components/dashboard/DashboardLineChart";
import DonutChart from "@/components/report/DonutChart";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchAdminStats } from "@/lib/redux/usersSlice";

// ── Realistic rise-and-fall data ──────────────────────────
const userGrowthData = {
  title:  "Monthly User Growth",
  yLabel: "Total Users",
  color:  "#7C3AED",
  data:   [980, 1450, 2100, 1200,  1750, 4100, 3200, 2800,  6400, 3600, 5200, 4800,],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  xLabel: "Month",
};

const revenueData = {
  title:  "Revenue Trend",
  yLabel: "Revenue (₦)",
  color:  "#2563eb",
  data:   [420000, 890000,  1200000, 650000, 980000, 1800000, 1550000, 1100000, 1750000,  1400000, 2100000,  2600000],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  xLabel: "Month",
};

const donutSegments = [
  { label: "Auto Repair",           value: 32, color: "#2563eb" },
  { label: "Creativity",            value: 27, color: "#F9A826" },
  { label: "Repair & Construction", value: 23, color: "#2E7D32" },
  { label: "Housekeeping",          value: 18, color: "#7B3F9E" },
];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { adminStats, statsStatus } = useAppSelector((s) => s.users);

  useEffect(() => {
    if (statsStatus === "idle") dispatch(fetchAdminStats());
  }, [dispatch, statsStatus]);

  const isLoading = statsStatus === "loading" || statsStatus === "idle";
  const s = adminStats as {
    totalUsers?: number;
    verifiedExperts?: number;
    revenue?: number;
    growthRate?: number;
  } | null;

  const stats = [
    { label: "Total Users",      value: isLoading ? "—" : String(s?.totalUsers ?? "—"),                         icon: Users,       iconColor: "#2563eb", iconBg: "#EFF6FF" },
    { label: "Verified Experts", value: isLoading ? "—" : String(s?.verifiedExperts ?? "—"),                    icon: ShieldCheck, iconColor: "#16a34a", iconBg: "#F0FDF4" },
    { label: "Revenue",          value: isLoading ? "—" : `₦${Number(s?.revenue ?? 0).toLocaleString()}`,       icon: DollarSign,  iconColor: "#d97706", iconBg: "#FFFBEB" },
    { label: "Growth",           value: isLoading ? "—" : `+${s?.growthRate ?? 0}%`,                            icon: TrendingUp,  iconColor: "#7c3aed", iconBg: "#F5F3FF" },
  ];

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    padding: "20px 24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", backgroundColor: "#F4F5F7" }}>
      <Topbar title="Dashboard" />

      <style>{`
        .db-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 640px) { .db-stats { grid-template-columns: repeat(4, 1fr); gap: 16px; } }

        .db-stat-card {
          background: #ffffff; border: 1px solid #E5E7EB; border-radius: 16px;
          padding: 20px 16px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center; gap: 6px;
        }
        .db-stat-icon  { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
        .db-stat-value { font-size: 28px; font-weight: 700; color: #111827; line-height: 1.1; }
        .db-stat-label { font-size: 13px; font-weight: 400; color: #6B7280; }

        .db-charts { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 768px) { .db-charts { grid-template-columns: 1fr 1fr; } }

        .db-donut-desktop { display: none; }
        .db-donut-mobile  { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        @media (min-width: 768px) { .db-donut-desktop { display: block; } .db-donut-mobile { display: none; } }

        .db-main { padding: 16px; }
        @media (min-width: 768px) { .db-main { padding: 24px 32px; } }

        @media (max-width: 380px) {
          .db-stat-value { font-size: 22px; }
          .db-stat-label { font-size: 11px; }
          .db-stat-icon  { width: 36px; height: 36px; }
        }
      `}</style>

      <main className="db-main" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Stat Cards */}
        <div className="db-stats">
          {stats.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
            <div key={label} className="db-stat-card">
              <div className="db-stat-icon" style={{ backgroundColor: iconBg }}>
                <Icon size={20} color={iconColor} strokeWidth={1.8} />
              </div>
              <p className="db-stat-value">{value}</p>
              <p className="db-stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Line Charts */}
        <div className="db-charts">
          <div style={cardStyle}>
            <DashboardLineChart
              {...userGrowthData}
              statValue={`${userGrowthData.data[userGrowthData.data.length - 1].toLocaleString()} users`}
            />
          </div>
          <div style={cardStyle}>
            <DashboardLineChart
              {...revenueData}
              statValue={`₦${revenueData.data[revenueData.data.length - 1].toLocaleString()}`}
            />
          </div>
        </div>

        {/* Donut Chart */}
        <div style={{ ...cardStyle, padding: "20px" }}>
          <div className="db-donut-desktop">
            <DonutChart segments={donutSegments} title="Top Service Category" size={280} />
          </div>
          <div className="db-donut-mobile">
            <DonutSVGOnly segments={donutSegments} size={200} />
            <div style={{ width: "100%" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "12px", textAlign: "center" }}>
                Top Service Category
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {donutSegments.map((seg) => (
                  <div key={seg.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: seg.color, flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontWeight: 500, color: "#111827" }}>{seg.label}</span>
                    </div>
                    <span style={{ color: "#6B7280" }}>{seg.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

function DonutSVGOnly({ segments, size = 200 }: { segments: typeof donutSegments; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.375, r = size * 0.2167;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const startAngles = segments.map((_, i) =>
    segments.slice(0, i).reduce((sum, s) => sum + (s.value / 100) * 360, -90)
  );
  const arcs = segments.map((seg, i) => {
    const start = startAngles[i];
    const sweep = (seg.value / 100) * 360;
    const end = start + sweep;
    const large = sweep > 180 ? 1 : 0;
    const x1  = cx + R * Math.cos(toRad(start)), y1  = cy + R * Math.sin(toRad(start));
    const x2  = cx + R * Math.cos(toRad(end)),   y2  = cy + R * Math.sin(toRad(end));
    const xi1 = cx + r * Math.cos(toRad(start)), yi1 = cy + r * Math.sin(toRad(start));
    const xi2 = cx + r * Math.cos(toRad(end)),   yi2 = cy + r * Math.sin(toRad(end));
    const mid = start + sweep / 2;
    const lr  = (R + r) / 2;
    return { ...seg, d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`, lx: cx + lr * Math.cos(toRad(mid)), ly: cy + lr * Math.sin(toRad(mid)) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc) => (
        <g key={arc.label}>
          <path d={arc.d} fill={arc.color} />
          <text x={arc.lx} y={arc.ly + 4} textAnchor="middle" fontSize={11} fontWeight="600" fill="#fff">{arc.value}%</text>
        </g>
      ))}
    </svg>
  );
}