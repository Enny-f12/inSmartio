// app/(dashboard)/dashboard/page.tsx
"use client";

import { Users, ShieldCheck, DollarSign, TrendingUp } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import DashboardLineChart from "@/components/dashboard/DashboardLineChart";
import DonutChart from "@/components/report/DonutChart";

// ── Stat cards ───────────────────────────────────────────────
const stats = [
  {
    label: "Total Users",
    value: "2,451",
    icon: Users,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
  },
  {
    label: "Verified Experts",
    value: "186",
    icon: ShieldCheck,
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
  },
  {
    label: "Revenue",
    value: "₦2.4M",
    icon: DollarSign,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
  },
  {
    label: "Growth",
    value: "+24%",
    icon: TrendingUp,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50",
  },
];

// ── Chart data ───────────────────────────────────────────────
const userGrowthData = {
  title: "Monthly User Growth",
  yLabel: "Total Users",
  color: "#7C3AED",
  data:   [1200, 2000, 3500, 4500, 6200, 8000, 9800, 12100],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  xLabel: "Month",
};

const revenueData = {
  title: "Revenue Trend Report",
  yLabel: "Revenue (₦)",
  color: "#2563eb",
  data:   [800, 2000, 3000, 4500, 5000, 6000, 7500, 8500, 9500, 10500, 11500, 12200],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  xLabel: "Month",
};

const donutSegments = [
  { label: "Auto Repair",           value: 32, color: "#2563eb" },
  { label: "Creativity",            value: 27, color: "#F9A826" },
  { label: "Repair & Construction", value: 23, color: "#2E7D32" },
  { label: "Housekeeping",          value: 18, color: "#7B3F9E" },
];

// ── Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Dashboard" />

      <main className="flex-1 px-8 py-6 space-y-6">

        {/* ── Stat cards ── */}
        <div className="flex gap-4">
          {stats.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
            <div
              key={label}
              className="flex-1 rounded-2xl border border-border bg-surface px-6 py-5 flex flex-col items-center gap-1"
            >
              <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center mb-1`}>
                <Icon size={18} className={iconColor} strokeWidth={1.8} />
              </div>
              <p className="text-[22px] font-bold text-text-main">{value}</p>
              <p className="text-[12px] text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Two line charts side by side ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-surface px-6 py-5">
            <DashboardLineChart {...userGrowthData} />
          </div>
          <div className="rounded-2xl border border-border bg-surface px-6 py-5">
            <DashboardLineChart {...revenueData} />
          </div>
        </div>

        {/* ── Donut chart + legend ── */}
        <div className="rounded-2xl border border-border bg-surface px-8 py-6">
          <DonutChart segments={donutSegments} title="Top Service Category" size={280} />
        </div>

      </main>
    </div>
  );
}