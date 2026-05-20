// app/(dashboard)/payment/page.tsx
"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import Topbar           from "@/components/layout/Navbar";
import TransactionsTab   from "@/components/payments/Transactionstab";
import EscrowReleasesTab from "@/components/payments/EscrowReleasetab";
import PayoutsTab        from "@/components/payments/Payouttabs";
import RefundsTab        from "@/components/payments/Refundstab";
import type { PayTab }   from "@/components/payments/types";
import { PAY_TABS }      from "@/components/payments/types";

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="stat-card">
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", marginBottom: "6px" }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-main)", lineHeight: 1.2 }}>{value}</p>
      <p style={{ fontSize: "12px", marginTop: "2px", color: "var(--color-text-muted)" }}>{sub}</p>
    </div>
  );
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<PayTab>("Transactions");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Payments & Payouts" />

      <style>{`
        .pay-main     { padding: 12px; gap: 20px; }
        .pay-overview-header { flex-direction: column; align-items: flex-start; gap: 10px; }
        .stat-cards   { display: grid; grid-template-columns: repeat(2, 1fr); border-radius: 16px; border: 1px solid var(--color-border); background: #ffffff; overflow: hidden; }
        .stat-card    { padding: 14px 16px; border-right: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
        .stat-card:nth-child(2n) { border-right: none; }
        .stat-card:nth-last-child(-n+2) { border-bottom: none; }
        .pay-tabs     { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; margin-top: 4px; }
        .pay-tabs::-webkit-scrollbar { display: none; }
        .pay-tabs-inner { display: flex; gap: 8px; width: max-content; }

        @media (min-width: 640px) {
          .pay-main     { padding: 20px 32px; gap: 24px; }
          .pay-overview-header { flex-direction: row; align-items: center; }
          .stat-cards   { display: flex; }
          .stat-card    { flex: 1; text-align: center; border-right: 1px solid var(--color-border); border-bottom: none; }
          .stat-card:last-child { border-right: none; }
          .pay-tabs     { overflow-x: visible; }
          .pay-tabs-inner { width: auto; flex-wrap: wrap; }
        }
      `}</style>

      <main className="pay-main" style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "var(--color-background)", overflowY: "auto" }}>

        {/* Transaction Overview Section */}
        <div style={{ padding: "20px", borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>
          <div className="pay-overview-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-main)" }}>Transaction Overview</p>
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
              <Download size={15} /> Export
            </button>
          </div>
          <div className="stat-cards">
            <StatCard label="Escrow"  value="₦4.2M" sub="Held"       />
            <StatCard label="Payouts" value="₦3.8M" sub="Processed"  />
            <StatCard label="Revenue" value="₦420K" sub="Platform"   />
            <StatCard label="Pending" value="₦125K" sub="To Release" />
          </div>
        </div>

        {/* Tab Switcher Wrapper Row */}
        <div className="pay-tabs">
          <div className="pay-tabs-inner">
            {PAY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={tab === activeTab ? "btn-primary" : ""}
                style={{
                  padding: "8px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                  border: tab === activeTab ? "none" : "1px solid var(--color-border)",
                  backgroundColor: tab === activeTab ? undefined : "#ffffff",
                  color: tab === activeTab ? undefined : "var(--color-text-muted)",
                  cursor: "pointer", whiteSpace: "nowrap",
                  boxShadow: tab === activeTab ? "none" : "0 1px 2px rgba(0,0,0,0.02)"
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Render View Tabs Target Sections */}
        {activeTab === "Transactions"    && <TransactionsTab />}
        {activeTab === "Escrow Releases" && <EscrowReleasesTab />}
        {activeTab === "Payouts"         && <PayoutsTab />}
        {activeTab === "Refunds"         && <RefundsTab />}

      </main>
    </div>
  );
}