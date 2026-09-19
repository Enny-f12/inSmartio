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

function StatCard({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <div className="min-w-35 flex-1 rounded-[14px] border border-border bg-surface px-5 py-4 transition-shadow duration-150 hover:shadow-sm">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
      {loading ? (
        <p className="animate-pulse text-xl font-bold tracking-widest text-text-main">•••</p>
      ) : (
        <>
          <p className="mb-1 text-xl font-bold leading-tight text-text-main">{value}</p>
          {sub && <p className="m-0 text-xs text-text-muted">{sub}</p>}
        </>
      )}
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
  const b = balancesStatus === "succeeded" ? balances : null;
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
    <div className="flex flex-1 flex-col">
      <Topbar title="Payments & Payouts" />

      <main className="flex flex-1 flex-col gap-5 overflow-y-auto bg-background px-4 py-3 sm:gap-6 sm:px-8 sm:py-5">

        {/* Stat cards */}
        <div>
          <div className="mb-4 flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] font-semibold text-text-main">Transaction Overview</p>
            <button
              onClick={handleExport}
              disabled={downloading}
              className="btn-primary flex items-center gap-2 rounded-xl! px-4.5 py-2 text-[13px]"
            >
              {downloading ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={15} /> Export</>}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Escrow"  value={fmt(b?.balance)} sub="Held"       loading={loading} />
            <StatCard label="Payouts" value={fmt(b?.payout)}  sub="Processed"  loading={loading} />
            <StatCard label="Revenue" value={fmt(b?.revenue)} sub="Platform"   loading={loading} />
            <StatCard label="Pending" value={fmt(b?.pending)} sub="To Release" loading={loading} />
          </div>
        </div>

        {/* Tabs */}
        <div className="scrollbar-none mt-1 overflow-x-auto [-webkit-overflow-scrolling:touch] sm:overflow-x-visible [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {PAY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  tab === activeTab
                    ? "btn-primary rounded-xl! whitespace-nowrap px-4.5 py-2 text-[13px]"
                    : "whitespace-nowrap rounded-xl border border-border bg-surface px-4.5 py-2 text-[13px] font-semibold text-text-muted transition-colors duration-150 hover:border-primary/40 hover:bg-background hover:text-text-main"
                }
              >
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