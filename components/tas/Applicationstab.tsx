// components/tas/Applicationstab.tsx
// Shows unverified TAS (verify: false) — pending approval
"use client";

import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import ApplicationModal from "./Applicationmodal";
import { PAGE_SIZE } from "./types";
import type { ActiveAgent } from "./types";

const FILTER_OPTIONS = ["All", "Active", "Suspended"] as const;

interface ApplicationsTabProps {
  agents:        ActiveAgent[];
  onSelectAgent: (agent: ActiveAgent) => void;
}

export default function ApplicationsTab({ agents }: ApplicationsTabProps) {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<typeof FILTER_OPTIONS[number]>("All");
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<ActiveAgent | null>(null);

  const filtered = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <style>{`
        .apptab-desktop { display: none !important; }
        .apptab-mobile  { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }
        .apptab-pgn { flex-direction: column; gap: 8px; align-items: flex-start; }
        .apptab-row:hover { background: #F9FAFB; }
        @media (min-width: 640px) {
          .apptab-desktop { display: block !important; }
          .apptab-mobile  { display: none !important; }
          .apptab-pgn { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
            <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input type="text" placeholder="Search name..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
            />
          </div>
          <FilterDropdown value={filter} options={FILTER_OPTIONS} onChange={(v) => { setFilter(v); setPage(1); }} />
        </div>

        {/* Empty state */}
        {agents.length === 0 && (
          <p style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF", margin: 0 }}>
            No pending applications.
          </p>
        )}

        {agents.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="apptab-desktop" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                    {["Name", "Username", "Email", "Phone", "Submitted", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "12px", fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>No results found.</td></tr>
                  ) : paginated.map((agent) => (
                    <tr key={agent.id} className="apptab-row" style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}>
                      <td style={{ padding: "16px 20px", fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>{agent.name}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#6B7280" }}>{agent.tasId}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#6B7280" }}>{agent.email}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#6B7280" }}>{agent.phone}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#6B7280" }}>{agent.joined}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <button onClick={() => setSelected(agent)}
                          style={{ fontSize: "13px", fontWeight: 500, padding: "6px 14px", borderRadius: "8px", border: "none", backgroundColor: "#EFF6FF", color: "#2563eb", cursor: "pointer" }}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="apptab-mobile">
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No results found.</p>
              ) : paginated.map((agent) => (
                <div key={agent.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{agent.name}</p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px" }}>{agent.email}</p>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>{agent.joined}</span>
                  </div>
                  <button onClick={() => setSelected(agent)}
                    style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}>
                    <Eye size={16} strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="apptab-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
              <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#2563eb" : "#ffffff", color: p === page ? "#ffffff" : "#6B7280", cursor: "pointer" }}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Application detail modal */}
      {selected && (
        <ApplicationModal agent={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}