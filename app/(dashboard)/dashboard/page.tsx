"use client";

import { useEffect } from "react";
import { Users, ShieldCheck, DollarSign, TrendingUp } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import DashboardLineChart from "@/components/dashboard/DashboardLineChart";
import DonutChart from "@/components/report/DonutChart";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchUsers } from "@/lib/redux/usersSlice";

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
  const { list, listStatus } = useAppSelector((s) => s.users);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchUsers());
  }, [dispatch, listStatus]);

  // ── Real counts from API ─────────────────────────────────
  const isLoading  = listStatus === "loading" || listStatus === "idle";
  const totalUsers = listStatus === "succeeded" ? list.length.toLocaleString() : isLoading ? "..." : "—";

  const stats = [
    {
      label:     "Total Users",
      value:     totalUsers,           // ← real from GET /api/users
      change:    "+12% this month",
      icon:      Users,
      iconColor: "#2563eb",
      iconBg:    "#eff6ff",
      accent:    "#2563eb",
    },
    {
      label:     "Verified Experts",
      value:     "186",               // ← mock, no endpoint yet
      change:    "+4 this week",
      icon:      ShieldCheck,
      iconColor: "#16a34a",
      iconBg:    "#f0fdf4",
      accent:    "#16a34a",
    },
    {
      label:     "Revenue",
      value:     "₦2.4M",
      change:    "+18% vs last month",
      icon:      DollarSign,
      iconColor: "#d97706",
      iconBg:    "#fffbeb",
      accent:    "#d97706",
    },
    {
      label:     "Growth",
      value:     "+24%",
      change:    "vs last quarter",
      icon:      TrendingUp,
      iconColor: "#7c3aed",
      iconBg:    "#f5f3ff",
      accent:    "#7c3aed",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <Topbar title="Dashboard" />

      <main style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── 4 Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {stats.map(({ label, value, change, icon: Icon, iconColor, iconBg, accent }) => (
            <div
              key={label}
              style={{ ...card, borderTop: `3px solid ${accent}`, display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </p>
                <div style={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={17} color={iconColor} strokeWidth={1.8} />
                </div>
              </div>
              <p style={{ fontSize: "26px", fontWeight: 700, color: "var(--color-text-main)", lineHeight: 1 }}>
                {value}
              </p>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "#16a34a" }}>
                ▲ {change}
              </p>
            </div>
          ))}
        </div>

        {/* ── 2 Line charts side by side ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={card}>
            <DashboardLineChart {...userGrowthData} />
          </div>
          <div style={card}>
            <DashboardLineChart {...revenueData} />
          </div>
        </div>

        {/* ── Donut chart ── */}
        <div style={{ ...card, padding: "24px 32px" }}>
          <DonutChart segments={donutSegments} title="Top Service Category" size={280} />
        </div>

      </main>
    </div>
  );
}