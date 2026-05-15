// app/(dashboard)/payment/page.tsx
"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import Topbar            from "@/components/layout/Navbar";
import TransactionsTab   from "@/components/payments/Transactionstab";
import EscrowReleasesTab from "@/components/payments/EscrowReleasetab";
import PayoutsTab        from "@/components/payments/Payouttabs";
import RefundsTab        from "@/components/payments/Refundstab";
import type { PayTab }   from "@/components/payments/types";
import { PAY_TABS }      from "@/components/payments/types";

// ── Stat card — sits inside shared container with dividers ──
function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex-1 min-w-0 px-6 py-5 text-center">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-text-muted">{label}</p>
      <p className="text-[22px] font-bold text-text-main">{value}</p>
      <p className="text-[12px] mt-0.5 text-text-muted">{sub}</p>
    </div>
  );
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<PayTab>("Transactions");

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Payments & Payouts" />

      <main className="flex-1 px-8 py-6 space-y-5 bg-background overflow-y-auto">

        {/* Transaction Overview — only on Transactions tab */}
        {activeTab === "Transactions" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-semibold text-text-main">Transaction Overview</p>
              <button className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold">
                <Download size={15} /> Export
              </button>
            </div>

            {/* Shared container with vertical dividers between cards */}
            <div className="flex rounded-2xl border border-border bg-surface divide-x divide-border">
              <StatCard label="Escrow"  value="₦4.2M" sub="Held"        />
              <StatCard label="Payouts" value="₦3.8M" sub="Processed"   />
              <StatCard label="Revenue" value="₦420K" sub="Platform"    />
              <StatCard label="Pending" value="₦125K" sub="To Release"  />
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          {PAY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                tab === activeTab
                  ? "btn-primary"
                  : "bg-transparent border border-border text-text-muted hover:bg-surface"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "Transactions"    && <TransactionsTab />}
        {activeTab === "Escrow Releases" && <EscrowReleasesTab />}
        {activeTab === "Payouts"         && <PayoutsTab />}
        {activeTab === "Refunds"         && <RefundsTab />}

      </main>
    </div>
  );
}