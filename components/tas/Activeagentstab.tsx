// components/tas/ActiveAgentsTab.tsx
"use client";

import { useState } from "react";
import { Search, Eye } from "lucide-react";
import type { ApiTas } from "@/lib/api/tasApi";
import AgentDetail from "./Agentdetail";
import { card, statusBadge, fmtMoney, TAS_TIERS } from "./shared";

interface Props {
  agents: ApiTas[];
}

export default function ActiveAgentsTab({ agents }: Props) {
  const [search,     setSearch]     = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedId) ?? null;

  if (selectedId && selectedAgent) {
    return (
      <AgentDetail
        agentId={selectedId}
        fallback={selectedAgent}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const filtered = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchTier   = tierFilter === "all" || String(a.tier) === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div style={card}>

      {/* Toolbar */}
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid #E5E7EB",
        display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "#9CA3AF",
          }} />
          <input
            type="text" placeholder="Search name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 12,
              paddingTop: 9, paddingBottom: 9, borderRadius: 10,
              border: "1px solid #E5E7EB", fontSize: 13, outline: "none",
              backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box",
            }}
          />
        </div>
        <select
          value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
          style={{
            padding: "9px 14px", borderRadius: 10, border: "1px solid #E5E7EB",
            fontSize: 13, color: "#374151", backgroundColor: "#fff",
            outline: "none", cursor: "pointer",
          }}>
          <option value="all">All Tiers</option>
          {TAS_TIERS.map((t) => (
            <option key={t.value} value={String(t.value)}>Tier {t.value}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
              {["Name", "TAS ID", "Tier", "Experts", "Earnings", "Status", "Actions"].map((h) => (
                <th key={h} style={{
                  textAlign: "left", padding: "12px 24px", fontSize: 12,
                  fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 48, fontSize: 13, color: "#9CA3AF" }}>
                  No active agents found.
                </td>
              </tr>
            ) : filtered.map((agent) => {
              const ext          = agent as Record<string, unknown>;
              const expertsObj   = (ext.expertCount ?? ext.experts) as { total?: number } | null;
              const expertsCount = expertsObj?.total ?? "—";
              const earnings     = fmtMoney(ext.totalEarnings as number | undefined);
              const tasId        = (ext.applicationCode as string) ?? agent.id;

              return (
                <tr key={agent.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "15px 24px", fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    {agent.name}
                  </td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>
                    {tasId}
                  </td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#374151" }}>
                    Tier {agent.tier ?? "—"}
                  </td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#374151" }}>
                    {expertsCount}
                  </td>
                  <td style={{ padding: "15px 24px", fontSize: 13, fontWeight: 500, color: "#111827" }}>
                    {earnings}
                  </td>
                  <td style={{ padding: "15px 24px" }}>
                    {statusBadge(agent.status ?? "active")}
                  </td>
                  <td style={{ padding: "15px 24px" }}>
                    <button
                      onClick={() => setSelectedId(agent.id)}
                      style={{
                        padding: 6, borderRadius: 8, border: "none",
                        background: "none", cursor: "pointer",
                        color: "#9CA3AF", display: "flex",
                      }}>
                      <Eye size={17} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
      }}>
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
          Showing {filtered.length} of {agents.length} results
        </p>
      </div>
    </div>
  );
}