"use client";

import { useEffect } from "react";
import { Users, ShieldCheck, DollarSign, TrendingUp } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import DashboardLineChart from "@/components/dashboard/DashboardLineChart";
import DonutChart from "@/components/report/DonutChart";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchUsers, fetchAdminStats } from "@/lib/redux/usersSlice";

const userGrowthData = {
  title: "Monthly User Growth",
  yLabel: "Total Users",
  color: "#7C3AED",
  data: [1200, 2000, 3500, 4500, 6200, 8000, 9800, 12100],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  xLabel: "Month",
};

const revenueData = {
  title: "Revenue Trend Report",
  yLabel: "Revenue (₦)",
  color: "#2563eb",
  data: [800, 2000, 3000, 4500, 5000, 6000, 7500, 8500, 9500, 10500, 11500, 12200],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  xLabel: "Month",
};

const donutSegments = [
  { label: "Auto Repair",           value: 32, color: "#2563eb" },
  { label: "Creativity",            value: 27, color: "#F9A826" },
  { label: "Repair & Construction", value: 23, color: "#2E7D32" },
  { label: "Housekeeping",          value: 18, color: "#7B3F9E" },
];

const card: React.CSSProperties = {
  borderRadius: "16px",
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface)",
  padding: "20px 24px",
};

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, adminStats, statsStatus } = useAppSelector((s) => s.users);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchUsers());
  }, [dispatch, listStatus]);

  useEffect(() => {
    if (statsStatus === "idle") dispatch(fetchAdminStats());
  }, [dispatch, statsStatus]);

  // Log real shape so we can map fields properly
  useEffect(() => {
    if (statsStatus === "succeeded" && adminStats) {
      console.log("📊 Admin stats shape:", adminStats);
    }
  }, [statsStatus, adminStats]);

  const isLoading  = listStatus === "loading" || listStatus === "idle";
  const totalUsers = listStatus === "succeeded" ? list.length.toLocaleString() : isLoading ? "..." : "—";

  // Pull from adminStats once we know the shape — using flexible key access
  const s = adminStats as Record<string, unknown> | null;
  const statRevenue  = s ? (s.totalRevenue ?? s.revenue ?? s.totalEarnings ?? "₦2.4M") as string : "₦2.4M";
  const statExperts  = s ? (s.verifiedExperts ?? s.experts ?? s.totalExperts ?? "186") as string : "186";
  const statGrowth   = s ? (s.growth ?? s.growthRate ?? s.userGrowth ?? "+24%") as string : "+24%";

  const stats = [
    { label: "Total Users",      value: totalUsers,                            change: "+12% this month",    icon: Users,       iconColor: "#2563eb", iconBg: "#eff6ff", accent: "#2563eb" },
    { label: "Verified Experts", value: String(statExperts),                   change: "+4 this week",       icon: ShieldCheck, iconColor: "#16a34a", iconBg: "#f0fdf4", accent: "#16a34a" },
    { label: "Revenue",          value: String(statRevenue),                   change: "+18% vs last month", icon: DollarSign,  iconColor: "#d97706", iconBg: "#fffbeb", accent: "#d97706" },
    { label: "Growth",           value: String(statGrowth),                    change: "vs last quarter",    icon: TrendingUp,  iconColor: "#7c3aed", iconBg: "#f5f3ff", accent: "#7c3aed" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <Topbar title="Dashboard" />

      {/* Inject responsive CSS */}
      <style>{`
        .db-stats  { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .db-charts { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .db-donut-desktop { display: none; }
        .db-donut-mobile  { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        @media (min-width: 768px) {
          .db-stats  { grid-template-columns: repeat(4, 1fr); gap: 16px; }
          .db-charts { grid-template-columns: 1fr 1fr; }
          .db-donut-desktop { display: block; }
          .db-donut-mobile  { display: none; }
          .db-main { padding: 24px 32px !important; gap: 20px !important; }
        }
      `}</style>

      <main className="db-main" style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── Stat cards ── */}
        <div className="db-stats">
          {stats.map(({ label, value, change, icon: Icon, iconColor, iconBg, accent }) => (
            <div key={label} style={{ ...card, borderTop: `3px solid ${accent}`, display: "flex", flexDirection: "column", gap: "8px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </p>
                <div style={{ width: 32, height: 32, borderRadius: "8px", backgroundColor: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={15} color={iconColor} strokeWidth={1.8} />
                </div>
              </div>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-main)", lineHeight: 1 }}>
                {value}
              </p>
              <p style={{ fontSize: "10px", fontWeight: 500, color: "#16a34a" }}>▲ {change}</p>
            </div>
          ))}
        </div>

        {/* ── Line charts ── */}
        <div className="db-charts">
          <div style={card}><DashboardLineChart {...userGrowthData} /></div>
          <div style={card}><DashboardLineChart {...revenueData} /></div>
        </div>

        {/* ── Donut chart ── */}
        <div style={{ ...card, padding: "20px" }}>

          {/* Desktop — original side-by-side layout from DonutChart */}
          <div className="db-donut-desktop">
            <DonutChart segments={donutSegments} title="Top Service Category" size={280} />
          </div>

          {/* Mobile — SVG donut only (no built-in legend), legend rendered below */}
          <div className="db-donut-mobile">
            {/* Donut SVG only — we reproduce the arc here manually */}
            <DonutSVGOnly segments={donutSegments} size={200} />
            <div style={{ width: "100%" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "12px", textAlign: "center" }}>
                Top Service Category
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {donutSegments.map((seg) => (
                  <div key={seg.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: seg.color, flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontWeight: 500, color: "var(--color-text-main)" }}>{seg.label}</span>
                    </div>
                    <span style={{ color: "var(--color-text-muted)" }}>{seg.value}%</span>
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

// ── Donut SVG only (no legend) for mobile ────────────────────
function DonutSVGOnly({ segments, size = 200 }: { segments: typeof donutSegments; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.375, r = size * 0.2167;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Pre-compute start angles without mutation
  const startAngles = segments.map((_, i) =>
    segments.slice(0, i).reduce((sum, s) => sum + (s.value / 100) * 360, -90)
  );

  const arcs = segments.map((seg, i) => {
    const start    = startAngles[i];
    const sweep    = (seg.value / 100) * 360;
    const end      = start + sweep;
    const large    = sweep > 180 ? 1 : 0;
    const x1  = cx + R * Math.cos(toRad(start));  const y1  = cy + R * Math.sin(toRad(start));
    const x2  = cx + R * Math.cos(toRad(end));    const y2  = cy + R * Math.sin(toRad(end));
    const xi1 = cx + r * Math.cos(toRad(start));  const yi1 = cy + r * Math.sin(toRad(start));
    const xi2 = cx + r * Math.cos(toRad(end));    const yi2 = cy + r * Math.sin(toRad(end));
    const mid = start + sweep / 2;
    const lr  = (R + r) / 2;
    const d   = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
    return { ...seg, d, lx: cx + lr * Math.cos(toRad(mid)), ly: cy + lr * Math.sin(toRad(mid)) };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc) => (
        <g key={arc.label}>
          <path d={arc.d} fill={arc.color} />
          <text x={arc.lx} y={arc.ly + 4} textAnchor="middle" fontSize={11} fontWeight="600" fill="#fff">
            {arc.value}%
          </text>
        </g>
      ))}
    </svg>
  );
}