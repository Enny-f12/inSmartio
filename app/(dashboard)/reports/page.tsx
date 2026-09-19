// app/(dashboard)/reports/page.tsx
"use client";

import { useState } from "react";
import Topbar from "@/components/layout/Navbar";
import { ReportPicker, REPORT_ITEMS, type ReportKey } from "@/components/reports/ReportPicker";
import { sharedResponsiveCSS } from "@/components/reports/shared";

import ReportDashboard from "@/components/reports/ReportDashboard";
import TransactionDetailReport from "@/components/reports/TransactionDetailReport";
import UserGrowthReport from "@/components/reports/UserGrowthReport";
import ExpertDetailsReport from "@/components/reports/ExpertDetailsReport";
import VerificationReport from "@/components/reports/VerificationReport";
import TASPerformanceReport from "@/components/reports/TASPerformanceReport";
import ScheduledReports from "@/components/reports/ScheduledReport";
import ReportTemplates from "@/components/reports/ReportTemplates";

export default function ReportsPage() {
  const [active, setActive] = useState<ReportKey>("dashboard");
  const current = REPORT_ITEMS.find((i) => i.key === active) ?? REPORT_ITEMS[0];

  return (
    <div className="flex flex-col flex-1" style={{ backgroundColor: "#F4F5F7" }}>
      <Topbar title="Reports" />

      <style>{sharedResponsiveCSS}</style>

      {/* ── Sub-header: title + report picker ── */}
      <div
        className="rp-header flex items-center justify-between"
        style={{ gap: "12px", flexWrap: "wrap" }}
      >
        <div>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>
            {current.label}
          </p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "2px 0 0" }}>
            Numbers tell you what. Details tell you who.
          </p>
        </div>

        <ReportPicker value={active} onChange={setActive} />
      </div>

      <main className="rp-main flex-1">
        {active === "dashboard" && <ReportDashboard onNavigate={setActive} />}
        {active === "transactions" && <TransactionDetailReport />}
        {active === "user-growth" && <UserGrowthReport />}
        {active === "experts" && <ExpertDetailsReport />}
        {active === "verification" && <VerificationReport />}
        {active === "tas-performance" && <TASPerformanceReport />}
        {active === "scheduled" && <ScheduledReports />}
        {active === "templates" && <ReportTemplates />}
      </main>
    </div>
  );
}