"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Eye } from "lucide-react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { mockAgents, PAGE_SIZE } from "./types";
import type { ActiveAgent } from "./types";

const TIER_OPTIONS = [
  "All Tiers", "Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5", "Tier 6",
] as const;

interface ActiveAgentsTabProps {
  onSelectAgent: (agent: ActiveAgent) => void;
}

export default function ActiveAgentsTab({ onSelectAgent }: ActiveAgentsTabProps) {
  const [search,     setSearch]     = useState("");
  const [tierFilter, setTierFilter] = useState<typeof TIER_OPTIONS[number]>("All Tiers");
  const [page,       setPage]       = useState(1);

  const filtered = mockAgents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchTier   = tierFilter === "All Tiers" || `Tier ${a.tier}` === tierFilter;
    return matchSearch && matchTier;
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
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <FilterDropdown
            value={tierFilter}
            options={TIER_OPTIONS}
            onChange={v => { setTierFilter(v); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {["Name", "TAS ID", "Tier", "Experts", "Earnings", "Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-14 text-sm text-text-muted">
                  No results found.
                </td>
              </tr>
            ) : paginated.map(agent => (
              <tr key={agent.id} className="hover:bg-background transition-colors">
                <td className="px-5 py-4 text-[13.5px] font-semibold text-text-main">{agent.name}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{agent.tasId}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{agent.tier}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{agent.experts}</td>
                <td className="px-5 py-4 text-[13.5px] font-medium text-text-main">{agent.earnings}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => onSelectAgent(agent)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                    aria-label={`View ${agent.name}`}
                  >
                    <Eye size={18} strokeWidth={1.8} />
                  </button>
                </td>
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