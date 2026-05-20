// app/(dashboard)/tas/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import ApplicationsTab from "@/components/tas/Applicationstab";
import ActiveAgentsTab from "@/components/tas/Activeagentstab";
import AgentDetail from "@/components/tas/Agentdetail";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchTas, fetchTasById, clearSelectedTas } from "@/lib/redux/tasSlice";
import type { ApiTas } from "@/lib/api/tasApi";
import type { TASTab, ActiveAgent, AgentStatus } from "@/components/tas/types";

const TABS: TASTab[] = ["Applications", "Active TAS Agents"];

// ── Map ApiTas → ActiveAgent UI shape ─────────────────────
const toActiveAgent = (t: ApiTas): ActiveAgent => ({
  id:              t.id,
  name:            t.name ?? "—",
  fullName:        t.name ?? "—",
  tasId:           (t.username ?? t.id.slice(0, 8).toUpperCase()) as string,
  phone:           t.phone ?? "—",
  email:           t.email ?? "—",
  tier:            Number(t.tier ?? 1) as number,
  tierLabel:       `Tier ${t.tier ?? 1}`,
  bonus:           "—",
  joined:          t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GB") : "—",
  status:          (t.status === "suspended" ? "Suspended" : "Active") as AgentStatus,
  experts:         0,
  activeExperts:   0,
  totalEarnings:   "—",
  thisMonth:       "—",
  availableBalance:"—",
  pendingBalance:  "—",
  earnings:        "—",
  recruitedExperts:[],
});

// ── Mock data fallback ─────────────────────────────────────
const MOCK_AGENTS: ActiveAgent[] = [
  {
    id: "m1", name: "Adebayo T.", fullName: "Adebayo Tunde", tasId: "TAS-0012",
    phone: "+234 801 234 5678", email: "adebayo@email.com",
    tier: 3, tierLabel: "Gold", bonus: "12%", joined: "01/01/2026",
    status: "Active" as AgentStatus, experts: 24, activeExperts: 18,
    totalEarnings: "₦480,000", thisMonth: "₦62,000",
    availableBalance: "₦120,000", pendingBalance: "₦40,000", earnings: "₦480,000",
    recruitedExperts: [
      { name: "Chidi O.", earningsHistory: "₦80,000", subTas: "Active" as AgentStatus, payouts: "₦60,000", notes: "" },
      { name: "Ngozi E.", earningsHistory: "₦50,000", subTas: "Active" as AgentStatus, payouts: "₦40,000", notes: "" },
    ],
  },
  {
    id: "m2", name: "Fatima A.", fullName: "Fatima Aliyu", tasId: "TAS-0021",
    phone: "+234 802 345 6789", email: "fatima@email.com",
    tier: 2, tierLabel: "Silver", bonus: "8%", joined: "15/02/2026",
    status: "Active" as AgentStatus, experts: 10, activeExperts: 7,
    totalEarnings: "₦200,000", thisMonth: "₦28,000",
    availableBalance: "₦60,000", pendingBalance: "₦15,000", earnings: "₦200,000",
    recruitedExperts: [
      { name: "Peter O.", earningsHistory: "₦40,000", subTas: "Active" as AgentStatus, payouts: "₦30,000", notes: "New recruit" },
    ],
  },
  {
    id: "m3", name: "Emeka J.", fullName: "Emeka James", tasId: "TAS-0034",
    phone: "+234 803 456 7890", email: "emeka@email.com",
    tier: 1, tierLabel: "Bronze", bonus: "5%", joined: "20/03/2026",
    status: "Active" as AgentStatus, experts: 3, activeExperts: 2,
    totalEarnings: "₦45,000", thisMonth: "₦12,000",
    availableBalance: "₦20,000", pendingBalance: "₦5,000", earnings: "₦45,000",
    recruitedExperts: [],
  },
  {
    id: "m4", name: "Amaka S.", fullName: "Amaka Stella", tasId: "TAS-0045",
    phone: "+234 804 567 8901", email: "amaka@email.com",
    tier: 2, tierLabel: "Silver", bonus: "8%", joined: "10/03/2026",
    status: "Active" as AgentStatus, experts: 15, activeExperts: 11,
    totalEarnings: "₦320,000", thisMonth: "₦45,000",
    availableBalance: "₦90,000", pendingBalance: "₦22,000", earnings: "₦320,000",
    recruitedExperts: [
      { name: "Tunde B.", earningsHistory: "₦60,000", subTas: "Active" as AgentStatus, payouts: "₦50,000", notes: "" },
      { name: "Bisi K.",  earningsHistory: "₦35,000", subTas: "Active" as AgentStatus, payouts: "₦28,000", notes: "On probation" },
    ],
  },
  {
    id: "m5", name: "Kunle D.", fullName: "Kunle Dauda", tasId: "TAS-0056",
    phone: "+234 805 678 9012", email: "kunle@email.com",
    tier: 4, tierLabel: "Platinum", bonus: "15%", joined: "05/01/2026",
    status: "Suspended" as AgentStatus, experts: 38, activeExperts: 0,
    totalEarnings: "₦950,000", thisMonth: "₦0",
    availableBalance: "₦0", pendingBalance: "₦180,000", earnings: "₦950,000",
    recruitedExperts: [],
  },
];

export default function TASManagementPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, selected, selectedStatus } = useAppSelector((s) => s.tas);

  const [activeTab,     setActiveTab]     = useState<TASTab>("Applications");
  const [selectedAgent, setSelectedAgent] = useState<ActiveAgent | null>(null);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchTas());
  }, [dispatch, listStatus]);

  // Derive agents from API or mock — no setState in effect
  const agents: ActiveAgent[] = useMemo(() =>
    listStatus === "succeeded" && list.length > 0
      ? list.map((t) => toActiveAgent(t))
      : MOCK_AGENTS,
  [listStatus, list]);

  // Derive selected agent from Redux selected state — no setState in effect
  const detailAgent: ActiveAgent | null = useMemo(() =>
    selectedStatus === "succeeded" && selected
      ? toActiveAgent(selected)
      : null,
  [selectedStatus, selected]);

  const handleSelectAgent = (agent: ActiveAgent) => {
    setSelectedAgent(agent); // show immediately from local data
    dispatch(fetchTasById(agent.id)); // fetch fresh detail in background
  };

  const handleBack = () => {
    setSelectedAgent(null);
    dispatch(clearSelectedTas());
  };

  // Use fresh API detail if available, else local selection
  const displayAgent = detailAgent ?? selectedAgent;

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

        {/* Detail view */}
        {displayAgent ? (
          <AgentDetail agent={displayAgent} onBack={handleBack} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Tabs */}
            <div className="tas-tabs">
              <div className="tas-tabs-inner">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={tab === activeTab ? "btn-primary" : ""}
                    style={{
                      padding: "8px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                      border: tab === activeTab ? "none" : "1px solid var(--color-border)",
                      backgroundColor: tab === activeTab ? undefined : "transparent",
                      color: tab === activeTab ? undefined : "var(--color-text-muted)",
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading indicator */}
            {activeTab === "Active TAS Agents" && listStatus === "loading" && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                <Loader2 size={16} className="animate-spin" /> Loading TAS agents...
              </div>
            )}

            {/* Mock data notice */}
            {activeTab === "Active TAS Agents" && listStatus === "succeeded" && list.length === 0 && (
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>No agents on server — showing sample data.</p>
            )}

            {activeTab === "Applications"      && <ApplicationsTab />}
            {activeTab === "Active TAS Agents" && <ActiveAgentsTab agents={agents} onSelectAgent={handleSelectAgent} />}
          </div>
        )}
      </div>
    </div>
  );
}