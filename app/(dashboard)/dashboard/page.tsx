// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { Users, ShieldCheck, DollarSign, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import DashboardLineChart from "@/components/dashboard/DashboardLineChart";
import DonutChart from "@/components/report/DonutChart";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchAdminStats } from "@/lib/redux/usersSlice";
import {
  fetchUserGrowthThunk,
  fetchRevenueTrendThunk,
  fetchTopCategoriesThunk,
  fetchTopCitiesThunk,          // ← was missing from dispatch
} from "@/lib/redux/reportSlice";

const CHART_COLORS = ["#2563eb", "#F9A826", "#2E7D32", "#7B3F9E", "#db2777", "#0891b2"];

const FALLBACK_SEGMENTS = [
  { label: "Auto Repair",           value: 32, color: "#2563eb" },
  { label: "Creativity",            value: 27, color: "#F9A826" },
  { label: "Repair & Construction", value: 23, color: "#2E7D32" },
  { label: "Housekeeping",          value: 18, color: "#7B3F9E" },
];

const FALLBACK_CITIES = [
  { city: "Lagos",  pct: 42 },
  { city: "Abuja",  pct: 28 },
  { city: "PH",     pct: 16 },
  { city: "Ibadan", pct: 9  },
  { city: "Kano",   pct: 5  },
];

const today      = new Date().toISOString().split("T")[0];
const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
const query      = { fromDate: oneYearAgo, toDate: today };

// ── Static UI-only data (TODO-BACKEND: replace with real endpoints) ────────────

const RECENT_ACTIVITY = [
  { dot: "#16a34a", time: "10:30 AM", text: "New expert registered: Adebayo S." },
  { dot: "#F9A826", time: "10:15 AM", text: "Job completed: Plumbing in Ikeja – ₦25,000" },
  { dot: "#EF4444", time: "09:45 AM", text: "Dispute opened: CASE-2026-03-21" },
  { dot: "#16a34a", time: "09:30 AM", text: "TAS payout processed: Chidi E. – ₦245,000" },
  { dot: "#F9A826", time: "09:15 AM", text: "New TAS application: Bola A." },
  { dot: "#2563eb", time: "08:45 AM", text: "Payment received: ₦50,000 from client Funke" },
];

const PENDING_ALERTS = [
  { label: "Pending verifications", value: "156", sub: "45 Tier 1 · 32 Tier 2 · 12 Tier 3", color: "#7c3aed", bg: "#F5F3FF" },
  { label: "Open disputes",         value: "25",  sub: "12 new · 8 in progress · 5 in mediation", color: "#EF4444", bg: "#FEF2F2" },
  { label: "TAS applications",      value: "8",   sub: "Pending review",                    color: "#F9A826", bg: "#FFFBEB" },
  { label: "Pending payouts",       value: "3",   sub: "₦125,000 total",                    color: "#16a34a", bg: "#F0FDF4" },
];

// ── Top Cities bar (uses live data, falls back to static) ──────────────────────
function TopCitiesBar({ cities }: { cities: { city: string; pct: number }[] }) {
  return (
    <div style={{ padding: "4px 0" }}>
      {cities.map((c) => (
        <div key={c.city} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", color: "#6B7280", width: "56px", flexShrink: 0 }}>{c.city}</span>
          <div style={{ flex: 1, height: "8px", backgroundColor: "#F3F4F6", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${c.pct}%`, backgroundColor: "#2563eb", borderRadius: "4px" }} />
          </div>
          <span style={{ fontSize: "12px", color: "#374151", fontWeight: 600, width: "36px", textAlign: "right" }}>
            {c.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { adminStats, statsStatus } = useAppSelector((s) => s.users);
  const {
    userGrowth,     userGrowthStatus,
    revenueTrend,   revenueTrendStatus,
    topCategories,  topCategoriesStatus,
    topCitiesData,  topCitiesStatus,        // ← now consumed
  } = useAppSelector((s) => s.report);

  useEffect(() => {
    if (statsStatus          === "idle") dispatch(fetchAdminStats());
    if (userGrowthStatus     === "idle") dispatch(fetchUserGrowthThunk(query));
    if (revenueTrendStatus   === "idle") dispatch(fetchRevenueTrendThunk(query));
    if (topCategoriesStatus  === "idle") dispatch(fetchTopCategoriesThunk(query));
    if (topCitiesStatus      === "idle") dispatch(fetchTopCitiesThunk(query));   // ← was missing
  }, [dispatch, statsStatus, userGrowthStatus, revenueTrendStatus, topCategoriesStatus, topCitiesStatus]);

  // ── Stat cards ────────────────────────────────────────────────────────────
  const isStatsLoading = statsStatus === "loading" || statsStatus === "idle";
  const s = adminStats as {
    totalUsers?: number; verifiedExperts?: number;
    revenue?: number; growthRate?: number;
  } | null;

  const stats = [
    { label: "Total Users",      value: isStatsLoading ? "—" : String(s?.totalUsers ?? "—"),                   icon: Users,       iconColor: "#2563eb", iconBg: "#EFF6FF" },
    { label: "Verified Experts", value: isStatsLoading ? "—" : String(s?.verifiedExperts ?? "—"),              icon: ShieldCheck, iconColor: "#16a34a", iconBg: "#F0FDF4" },
    { label: "Revenue",          value: isStatsLoading ? "—" : `₦${Number(s?.revenue ?? 0).toLocaleString()}`, icon: DollarSign,  iconColor: "#d97706", iconBg: "#FFFBEB" },
    { label: "Growth",           value: isStatsLoading ? "—" : `+${s?.growthRate ?? 0}%`,                      icon: TrendingUp,  iconColor: "#7c3aed", iconBg: "#F5F3FF" },
  ];

  // ── User growth chart ─────────────────────────────────────────────────────
  const isGrowthLoading = userGrowthStatus === "loading" || userGrowthStatus === "idle";
  const MONTH_LABELS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const FLAT_DATA       = [0,0,0,0,0,0,0,0,0,0,0,0];
  const hasGrowthData   = userGrowth.length > 0 && userGrowth.some((d) => d.count > 0);
  const userGrowthChart = hasGrowthData
    ? { data: userGrowth.map((d) => d.count),   labels: userGrowth.map((d) => d.month.slice(0, 3)) }
    : { data: FLAT_DATA, labels: MONTH_LABELS };

  // ── Revenue trend chart ───────────────────────────────────────────────────
  const isRevenueLoading  = revenueTrendStatus === "loading" || revenueTrendStatus === "idle";
  const hasRevenueData    = revenueTrend.length > 0 && revenueTrend.some((d) => d.revenue > 0);
  const revenueTrendChart = hasRevenueData
    ? { data: revenueTrend.map((d) => d.revenue), labels: revenueTrend.map((d) => d.month.slice(0, 3)) }
    : { data: FLAT_DATA, labels: MONTH_LABELS };

  // ── Donut — Top Service Categories ───────────────────────────────────────
  const isDonutLoading = topCategoriesStatus === "loading" || topCategoriesStatus === "idle";
  const donutSegments  = topCategories?.categories?.length
    ? topCategories.categories.map((c, i) => ({
        label: c.category,
        value: Math.round(c.percentage),
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
    : FALLBACK_SEGMENTS;

  // ── Top Cities bar — live data from /report/top-cities ───────────────────
  const isCitiesLoading = topCitiesStatus === "loading" || topCitiesStatus === "idle";
  const cityBars = topCitiesData?.cities?.length
    ? topCitiesData.cities.map((c) => ({
        city: c.city,
        pct:  Math.round(c.totalUsersInCityPercentageOfOverall),
      }))
    : FALLBACK_CITIES;

  // ── Shared card style ─────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    padding: "20px 24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", backgroundColor: "#F4F5F7" }}>
      <Topbar title="Dashboard" />

      <style>{`
        .db-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        @media(min-width:640px){ .db-stats{ grid-template-columns:repeat(4,1fr); gap:16px; } }
        .db-stat-card { background:#fff; border:1px solid #E5E7EB; border-radius:16px; padding:20px 16px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:6px; }
        .db-stat-icon { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:2px; }
        .db-stat-value { font-size:28px; font-weight:700; color:#111827; line-height:1.1; }
        .db-stat-label { font-size:13px; color:#6B7280; }
        .db-2col { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:768px){ .db-2col{ grid-template-columns:1fr 1fr; } }
        .db-main { padding:16px; }
        @media(min-width:768px){ .db-main{ padding:24px 32px; } }
        .db-spin { width:18px; height:18px; border-radius:50%; border:2px solid #E5E7EB; border-top-color:#2563eb; animation:dbspin 0.8s linear infinite; }
        .db-skeleton { display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:13px; gap:8px; }
        @keyframes dbspin { to{ transform:rotate(360deg); } }
        .activity-row:hover { background:#F9FAFB; }
        .alert-pill { border-radius:12px; padding:16px; display:flex; gap:14px; align-items:flex-start; }
        .section-title { font-size:13px; font-weight:700; color:#111827; margin:0 0 14px; display:flex; align-items:center; gap:8px; }
        .view-all { font-size:12px; color:#2563eb; font-weight:500; background:none; border:none; cursor:pointer; padding:0; }
      `}</style>

      <main className="db-main" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── Stat Cards ── */}
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

        {/* ── Line Charts ── */}
        <div className="db-2col">
          <div style={card}>
            {isGrowthLoading ? (
              <div className="db-skeleton" style={{ height: 200 }}><div className="db-spin" /> Loading user growth…</div>
            ) : (
              <DashboardLineChart
                title="Monthly User Growth" yLabel="Total Users" color="#7C3AED"
                data={userGrowthChart.data} labels={userGrowthChart.labels}
                xLabel="Month" statValue={`${Number(s?.totalUsers ?? 0).toLocaleString()} users`}
              />
            )}
          </div>
          <div style={card}>
            {isRevenueLoading ? (
              <div className="db-skeleton" style={{ height: 200 }}><div className="db-spin" /> Loading revenue…</div>
            ) : (
              <DashboardLineChart
                title="Revenue Trend" yLabel="Revenue (₦)" color="#2563eb"
                data={revenueTrendChart.data} labels={revenueTrendChart.labels}
                xLabel="Month" statValue={`₦${Number(s?.revenue ?? 0).toLocaleString()}`}
              />
            )}
          </div>
        </div>

        {/* ── Donut + Top Cities ── */}
        <div className="db-2col">
          {/* Top Service Categories — /report/top-service-category */}
          <div style={card}>
            {isDonutLoading ? (
              <div className="db-skeleton" style={{ height: 280 }}><div className="db-spin" /> Loading top categories…</div>
            ) : (
              <DonutChart segments={donutSegments} title="Top Service Categories" size={260} />
            )}
          </div>

          {/* Top Cities — /report/top-cities */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p className="section-title" style={{ margin: 0 }}>Top Cities</p>
            </div>
            {isCitiesLoading ? (
              <div className="db-skeleton" style={{ height: 160 }}><div className="db-spin" /> Loading cities…</div>
            ) : (
              <TopCitiesBar cities={cityBars} />
            )}
          </div>
        </div>

        {/* ── Recent Activity + Pending Alerts ── */}
        {/* TODO-BACKEND: both sections are static — see backend request */}
        <div className="db-2col">

          {/* Recent Activity */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <p className="section-title" style={{ margin: 0 }}>
                <Activity size={15} color="#374151" />
                Recent Activity
              </p>
              <button className="view-all">View all</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="activity-row"
                  style={{ display: "flex", alignItems: "flex-start", gap: "10px",
                    padding: "9px 8px", borderRadius: "8px", transition: "background 0.15s" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%",
                    backgroundColor: item.dot, flexShrink: 0, marginTop: "3px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", color: "#374151", margin: 0, lineHeight: 1.5 }}>{item.text}</p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#9CA3AF", flexShrink: 0 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Alerts */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <p className="section-title" style={{ margin: 0 }}>
                <AlertTriangle size={15} color="#F9A826" />
                Pending Alerts
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {PENDING_ALERTS.map((alert) => (
                <div key={alert.label} className="alert-pill" style={{ backgroundColor: alert.bg }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px",
                    backgroundColor: alert.color, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{alert.value}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{alert.label}</p>
                    <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>{alert.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}