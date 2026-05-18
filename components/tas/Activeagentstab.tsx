// components/tas/Activeagentstab.tsx
"use client";

import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { mockAgents, PAGE_SIZE } from "./types";
import type { ActiveAgent } from "./types";

const TIER_OPTIONS = ["All Tiers", "Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5", "Tier 6"] as const;

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
    <>
      <style>{`
        .agents-filter-row { flex-direction: column; gap: 10px; }
        .agents-table { display: none; }
        .agents-cards { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .agents-pagination { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 640px) {
          .agents-filter-row { flex-direction: row; align-items: center; }
          .agents-table { display: block; }
          .agents-cards { display: none; }
          .agents-pagination { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <div className="agents-filter-row" style={{ display: "flex" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
              />
            </div>
            <FilterDropdown value={tierFilter} options={TIER_OPTIONS} onChange={v => { setTierFilter(v); setPage(1); }} />
          </div>
        </div>

        {/* Desktop table */}
        <div className="agents-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                {["Name", "TAS ID", "Tier", "Experts", "Earnings", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No results found.</td></tr>
              ) : paginated.map(agent => (
                <tr key={agent.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{agent.name}</td>
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{agent.tasId}</td>
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{agent.tier}</td>
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{agent.experts}</td>
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)" }}>{agent.earnings}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <button onClick={() => onSelectAgent(agent)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                      <Eye size={18} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="agents-cards">
          {paginated.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No results found.</p>
          ) : paginated.map(agent => (
            <div key={agent.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>{agent.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Tier {agent.tier}</span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{agent.experts} experts</span>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-main)" }}>{agent.earnings}</span>
                </div>
              </div>
              <button onClick={() => onSelectAgent(agent)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}>
                <Eye size={16} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="agents-pagination" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={p === page ? "btn-primary" : ""} style={p !== page ? { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" } : { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "none", cursor: "pointer" }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}