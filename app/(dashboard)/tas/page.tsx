// app/(dashboard)/tas/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import ApplicationsTab from "@/components/tas/Applicationstab";
import ActiveAgentsTab from "@/components/tas/Activeagentstab";
import AgentDetail from "@/components/tas/Agentdetail";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchTas, selectTas, clearSelectedTas } from "@/lib/redux/tasSlice";
import type { ApiTas } from "@/lib/api/tasApi";
import type { TASTab, ActiveAgent, AgentStatus } from "@/components/tas/types";

const TABS: TASTab[] = ["Applications", "Active TAS Agents"];

// ── Parse tier from API ────────────────────────────────────
// API returns a number (1, 2, 3) or occasionally a string like
// "Tier 2 (Senior, +5% bonus)" — handle both safely.
const parseTier = (tier?: string | number): { num: number; label: string; bonus: string } => {
  if (tier === undefined || tier === null) return { num: 1, label: "Bronze", bonus: "—" };

  // If it's already a number just use it directly
  if (typeof tier === "number") {
    return { num: tier, label: `Tier ${tier}`, bonus: "—" };
  }

  // String path
  const tierStr    = String(tier);
  const numMatch   = tierStr.match(/\d+/);
  const num        = numMatch ? parseInt(numMatch[0]) : 1;
  const bonusMatch = tierStr.match(/\+[\d.]+%[^)"]*/);
  const bonus      = bonusMatch ? bonusMatch[0].trim() : "—";
  const labelMatch = tierStr.match(/\(([^,)]+)/);
  const label      = labelMatch ? labelMatch[1].trim() : `Tier ${num}`;
  return { num, label, bonus };
};

// ── Map real ApiTas → ActiveAgent UI shape ─────────────────
const toActiveAgent = (t: ApiTas): ActiveAgent => {
  const { num, label, bonus } = parseTier(t.tier as string | number | undefined);
  const bank = t.bankDetails as { bankName?: string; accountNo?: string } | null;
  const loc  = t.location as Record<string, string> | undefined;
  const doc  = t.document as Record<string, string> | undefined;

  return {
    id:               t.id,
    name:             t.name ?? "—",
    fullName:         t.name ?? "—",
    tasId:            t.username ?? t.id.slice(0, 8).toUpperCase(),
    phone:            t.phone ?? "—",
    email:            t.email ?? "—",
    tier:             num,
    tierLabel:        label,
    bonus:            bonus,
    joined:           t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GB") : "—",
    status:           (t.status === "suspended" ? "Suspended" : "Active") as AgentStatus,
    experts:          0,
    activeExperts:    0,
    earnings:         "—",
    totalEarnings:    "—",
    thisMonth:        "—",
    availableBalance: "—",
    pendingBalance:   "—",
    recruitedExperts: [],
    // real API fields
    verified:         t.verify,
    dob:              t.dateOfBirth,
    category:         Array.isArray(t.category) ? (t.category as string[]).join(", ") : undefined,
    location:         loc,
    document:         doc,
    bankName:         bank?.bankName,
    accountNo:        bank?.accountNo,
    applicationCode:  t.applicationCode,
  };
};

export default function TASManagementPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected } = useAppSelector((s) => s.tas);

  const [activeTab,       setActiveTab]       = useState<TASTab>("Applications");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchTas());
  }, [dispatch, listStatus]);

  const allAgents = useMemo(() =>
    listStatus === "succeeded" ? list.map(toActiveAgent) : [],
  [listStatus, list]);

  // Applications = not yet verified (verify: false)
  const applicationAgents = useMemo(() =>
    allAgents.filter((a) => !a.verified),
  [allAgents]);

  // Active = verified agents (verify: true)
  const activeAgents = useMemo(() =>
    allAgents.filter((a) => a.verified),
  [allAgents]);

  // Keep selected in sync with freshly fetched list (e.g. after tier adjust)
  const displayAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    if (selected?.id === selectedAgentId) return toActiveAgent(selected);
    return allAgents.find((a) => a.id === selectedAgentId) ?? null;
  }, [selectedAgentId, selected, allAgents]);

  const handleSelectAgent = (agent: ActiveAgent) => {
    setSelectedAgentId(agent.id);
    dispatch(selectTas(agent.id));
  };

  const handleBack = () => {
    setSelectedAgentId(null);
    dispatch(clearSelectedTas());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="TAS Management" />

      <style>{`
        .tas-outer { padding: 12px; }
        .tas-tabs  { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .tas-tabs::-webkit-scrollbar { display: none; }
        .tas-tabs-inner { display: flex; gap: 8px; width: max-content; }
        @media (min-width: 640px) {
          .tas-outer { padding: 20px 32px; }
          .tas-tabs  { overflow-x: visible; }
          .tas-tabs-inner { width: auto; flex-wrap: wrap; }
        }
      `}</style>

      <div className="tas-outer" style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--color-background)" }}>

        {displayAgent ? (
          <AgentDetail agent={displayAgent} onBack={handleBack} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Tabs */}
            <div className="tas-tabs">
              <div className="tas-tabs-inner">
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={tab === activeTab ? "btn-primary" : ""}
                    style={{
                      padding: "8px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                      border: tab === activeTab ? "none" : "1px solid var(--color-border)",
                      backgroundColor: tab === activeTab ? undefined : "transparent",
                      color: tab === activeTab ? undefined : "var(--color-text-muted)",
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}>
                    {tab}
                    {listStatus === "succeeded" && (
                      <span style={{
                        marginLeft: "6px", fontSize: "11px", fontWeight: 700,
                        backgroundColor: tab === activeTab ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                        color: tab === activeTab ? "#fff" : "#6B7280",
                        padding: "1px 7px", borderRadius: "999px",
                      }}>
                        {tab === "Applications" ? applicationAgents.length : activeAgents.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {listStatus === "loading" && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                <Loader2 size={16} className="animate-spin" /> Loading TAS data...
              </div>
            )}
            {listStatus === "failed" && (
              <p style={{ fontSize: "13px", color: "#ef4444" }}>{listError}</p>
            )}

            {activeTab === "Applications"      && <ApplicationsTab agents={applicationAgents} onSelectAgent={handleSelectAgent} />}
            {activeTab === "Active TAS Agents" && <ActiveAgentsTab agents={activeAgents}      onSelectAgent={handleSelectAgent} />}
          </div>
        )}
      </div>
    </div>
  );
}