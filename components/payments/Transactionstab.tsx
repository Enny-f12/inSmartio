"use client";

import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { mockTransactions, PAGE_SIZE } from "./types";
import type { Transaction } from "./types";

// ── Shared table primitives ────────────────────────────────
function TH({ children }: { children: string }) {
  return (
    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </th>
  );
}

function TD({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <td className={`px-5 py-4 text-[13.5px] ${bold ? "font-semibold text-text-main" : "text-text-muted"}`}>
      {children}
    </td>
  );
}

// ── Amount / Date mini dropdown ────────────────────────────
const AMOUNT_MIN_OPTS = ["₦0", "₦1,000", "₦5,000", "₦10,000", "₦50,000"] as const;
const AMOUNT_MAX_OPTS = ["₦10,000", "₦50,000", "₦100,000", "₦500,000"] as const;
const DATE_FROM_OPTS  = ["01/03/2026", "01/02/2026", "01/01/2026"] as const;
const DATE_TO_OPTS    = ["31/03/2026", "28/02/2026", "31/01/2026"] as const;
const SEARCH_BY_OPTS  = ["Type", "User", "Status"] as const;

// Inline search-by dropdown (blue button style)
function SearchByDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-r-xl text-[13px] font-semibold btn-primary"
      >
        Search By <ChevronDown size={13} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-hidden py-1 bg-surface border border-border shadow-lg min-w-32.5">
          {SEARCH_BY_OPTS.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-left text-text-main hover:bg-background transition-colors"
            >
              {opt === value
                ? <Check size={12} className="text-primary" />
                : <span className="w-3" />}
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
  const [searchBy, setSearchBy] = useState<typeof SEARCH_BY_OPTS[number]>("User");
  const [amtMin,   setAmtMin]   = useState<string>(AMOUNT_MIN_OPTS[0]);
  const [amtMax,   setAmtMax]   = useState<string>(AMOUNT_MAX_OPTS[AMOUNT_MAX_OPTS.length - 1]);
  const [dateFrom, setDateFrom] = useState<string>(DATE_FROM_OPTS[0]);
  const [dateTo,   setDateTo]   = useState<string>(DATE_TO_OPTS[0]);
  const [page,     setPage]     = useState(1);

  const filtered: Transaction[] = mockTransactions.filter(t => {
    if (!search) return true;
    if (searchBy === "User")   return t.user.toLowerCase().includes(search.toLowerCase());
    if (searchBy === "Type")   return t.type.toLowerCase().includes(search.toLowerCase());
    if (searchBy === "Status") return t.status.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">

      {/* Toolbar */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={15} className="text-text-muted" />
          <span className="text-sm font-semibold text-text-main">Filter</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search + Search By */}
          <div className="flex items-stretch flex-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search user..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-l-xl text-[13px] outline-none border border-border border-r-0 bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <SearchByDropdown value={searchBy} onChange={v => setSearchBy(v as typeof SEARCH_BY_OPTS[number])} />
          </div>

          {/* Amount range */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[12px] text-text-muted whitespace-nowrap">Amount:</span>
            <FilterDropdown value={amtMin} options={AMOUNT_MIN_OPTS} onChange={setAmtMin} placeholder="enter min" />
            <span className="text-[13px] text-text-muted">To</span>
            <FilterDropdown value={amtMax} options={AMOUNT_MAX_OPTS} onChange={setAmtMax} placeholder="enter max" />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[12px] text-text-muted whitespace-nowrap">Date Range:</span>
            <FilterDropdown value={dateFrom} options={DATE_FROM_OPTS} onChange={setDateFrom} />
            <span className="text-[13px] text-text-muted">To</span>
            <FilterDropdown value={dateTo} options={DATE_TO_OPTS} onChange={setDateTo} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              <TH>Date</TH>
              <TH>Type</TH>
              <TH>User</TH>
              <TH>Amount</TH>
              <TH>Status</TH>
              <TH>Ref</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-14 text-sm text-text-muted">
                  No results found.
                </td>
              </tr>
            ) : paginated.map(t => (
              <tr key={t.id} className="hover:bg-background transition-colors">
                <TD>{t.date}</TD>
                <TD bold>{t.type}</TD>
                <TD>{t.user}</TD>
                <TD bold>{t.amount}</TD>
                <TD>{t.status}</TD>
                <TD>{t.ref}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-background">
        <p className="text-[12px] text-text-muted">
          {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all ${
                p === page
                  ? "btn-primary"
                  : "border border-border bg-surface text-text-muted hover:bg-background"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}