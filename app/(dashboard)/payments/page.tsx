"use client";

import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Topbar            from "@/components/layout/Navbar";
import TransactionsTab   from "@/components/payments/Transactionstab";
import EscrowReleasesTab from "@/components/payments/EscrowReleasetab";
import PayoutsTab        from "@/components/payments/Payouttabs";
import RefundsTab        from "@/components/payments/Refundstab";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchBalances } from "@/lib/redux/paymentSlice";
import { downloadReport } from "@/lib/api/reportApi";
import type { PayTab } from "@/components/payments/types";
import { PAY_TABS }    from "@/components/payments/types";

const MOCK_BALANCES = {
  paystackBalance:        4200000,
  korapayBalance:         1850000,
  paystackEscrowsBalance: 980000,
  korapayEscrowsBalance:  320000,
};

function StatCard({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <div style={{ backgroundColor: "#ffffff", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "16px 20px", flex: 1, minWidth: "140px" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", marginBottom: "8px" }}>{label}</p>
      {loading
        ? <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-main)", letterSpacing: "0.1em" }}>•••</p>
        : <>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-main)", lineHeight: 1.2, marginBottom: "4px" }}>{value}</p>
            {sub && <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>{sub}</p>}
          </>
      }
    </div>
  );
}

export default function PaymentsPage() {
  const dispatch = useAppDispatch();
  const { balances, balancesStatus } = useAppSelector((s) => s.payments);
  const [activeTab,   setActiveTab]   = useState<PayTab>("Transactions");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (balancesStatus === "idle") dispatch(fetchBalances());
  }, [dispatch, balancesStatus]);

  const loading = balancesStatus === "loading" || balancesStatus === "idle";
  const b = (balancesStatus === "succeeded" && balances)
    ? balances as { paystackBalance?: number; korapayBalance?: number; paystackEscrowsBalance?: number; korapayEscrowsBalance?: number }
    : MOCK_BALANCES;
  const fmt = (v?: number) => v != null ? `₦${Number(v).toLocaleString()}` : "—";

  const handleExport = async () => {
    setDownloading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const url   = await downloadReport({ reportType: "escrows", type: "pdf", fromDate: "2026-05-15", toDate: today });
      const a = document.createElement("a");
      a.href = url; a.download = `payments_report_${today}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Payments report downloaded");
    } catch {
      toast.error("Failed to download payments report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Payments & Payouts" />

      <style>{`
        .pay-main { padding: 12px 16px; gap: 20px; }
        .pay-stat-cards { display: flex; flex-wrap: wrap; gap: 12px; }
        .pay-overview-header { flex-direction: column; align-items: flex-start; gap: 10px; }
        .pay-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; margin-top: 4px; }
        .pay-tabs::-webkit-scrollbar { display: none; }
        .pay-tabs-inner { display: flex; gap: 8px; width: max-content; }
        @media (min-width: 640px) {
          .pay-main { padding: 20px 32px; gap: 24px; }
          .pay-overview-header { flex-direction: row; align-items: center; }
          .pay-tabs { overflow-x: visible; }
          .pay-tabs-inner { width: auto; flex-wrap: wrap; }
        }
      `}</style>

      <main className="pay-main" style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "var(--color-background)", overflowY: "auto" }}>

        {/* Stat cards */}
        <div>
          <div className="pay-overview-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-main)" }}>Transaction Overview</p>
            <button onClick={handleExport} disabled={downloading} className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: downloading ? "not-allowed" : "pointer", opacity: downloading ? 0.7 : 1 }}>
              {downloading ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={15} /> Export</>}
            </button>
          </div>
          <div className="pay-stat-cards">
            <StatCard label="Escrow"          value={fmt(b?.paystackEscrowsBalance)} sub="Held"       loading={loading} />
            <StatCard label="Payouts"          value={fmt(b?.paystackBalance)}        sub="Processed"  loading={loading} />
            <StatCard label="Revenue"          value={fmt(b?.korapayBalance)}         sub="Platform"   loading={loading} />
            <StatCard label="Pending"          value={fmt(b?.korapayEscrowsBalance)}  sub="To Release" loading={loading} />
          </div>
        </div>

        {/* Tabs */}
        <div className="pay-tabs">
          <div className="pay-tabs-inner">
            {PAY_TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={tab === activeTab ? "btn-primary" : ""}
                style={{ padding: "8px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: tab === activeTab ? "none" : "1px solid var(--color-border)", backgroundColor: tab === activeTab ? undefined : "#ffffff", color: tab === activeTab ? undefined : "var(--color-text-muted)", cursor: "pointer", whiteSpace: "nowrap" }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Transactions"    && <TransactionsTab />}
        {activeTab === "Escrow Releases" && <EscrowReleasesTab />}
        {activeTab === "Payouts"         && <PayoutsTab />}
        {activeTab === "Refunds"         && <RefundsTab />}
      </main>
    </div>
  );
}