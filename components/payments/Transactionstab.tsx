// components/payments/TransactionsTab.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { mockTransactions } from "./types";

const SEARCH_BY_OPTIONS = ["Type", "User", "Status"];
const PAGE_SIZE = 10;

function MiniDropdown({
  options, value, onChange, placeholder,
}: {
  options: string[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] border border-border bg-background text-text-muted hover:bg-surface transition-colors min-w-[110px]"
      >
        <span className="flex-1 text-left">{value || placeholder}</span>
        <ChevronDown size={13} className="text-text-muted" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-hidden py-1 bg-surface border border-border shadow-lg min-w-[130px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full px-4 py-2 text-[13px] text-left text-text-main hover:bg-background transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TransactionsTab() {
  const [search,   setSearch]   = useState("");
  const [searchBy, setSearchBy] = useState("Type");
  const [amtMin,   setAmtMin]   = useState("");
  const [amtMax,   setAmtMax]   = useState("");
  const [dateFrom, setDateFrom] = useState("01/03/2026");
  const [dateTo,   setDateTo]   = useState("31/03/2026");
  const [page,     setPage]     = useState(1);

  const filtered = mockTransactions.filter((t) => {
    if (!search) return true;
    const field = searchBy === "Type" ? t.type : searchBy === "User" ? t.user : t.status;
    return field.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">

      {/* Filter toolbar */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={15} className="text-text-muted" />
          <span className="text-sm font-semibold text-text-main">Filter</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search + Search By */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <MiniDropdown
            options={SEARCH_BY_OPTIONS}
            value={searchBy}
            onChange={setSearchBy}
            placeholder="Search By"
          />

          {/* Amount range */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-text-muted whitespace-nowrap">Amount:</span>
            <MiniDropdown options={["₦0", "₦5K", "₦10K", "₦50K"]} value={amtMin} onChange={setAmtMin} placeholder="enter min" />
            <span className="text-[12px] text-text-muted">To</span>
            <MiniDropdown options={["₦10K", "₦50K", "₦100K", "₦500K"]} value={amtMax} onChange={setAmtMax} placeholder="enter max" />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-text-muted whitespace-nowrap">Date Range:</span>
            <MiniDropdown
              options={["01/03/2026", "01/02/2026", "01/01/2026"]}
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="from"
            />
            <span className="text-[12px] text-text-muted">To</span>
            <MiniDropdown
              options={["31/03/2026", "28/02/2026", "31/01/2026"]}
              value={dateTo}
              onChange={setDateTo}
              placeholder="to"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {["Date", "Type", "User", "Amount", "Status", "Ref"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-14 text-sm text-text-muted">No transactions found.</td></tr>
            ) : paginated.map((t) => (
              <tr key={t.id} className="hover:bg-background transition-colors">
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{t.date}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-main">{t.type}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{t.user}</td>
                <td className="px-5 py-4 text-[13.5px] font-medium text-text-main">{t.amount}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{t.status}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{t.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-background">
        <p className="text-[12px] text-text-muted">Showing 1 to {Math.min(PAGE_SIZE, filtered.length)} of 100 results</p>
        <div className="flex items-center gap-1.5">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all ${p === page ? "btn-primary" : "border border-border bg-surface text-text-muted hover:bg-background"}`}>{p}</button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>
  );
}