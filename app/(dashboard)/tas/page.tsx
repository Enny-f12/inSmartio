// app/(dashboard)/tas/page.tsx
"use client";

import { useState } from "react";
import Topbar from "@/components/layout/Navbar";
import ApplicationsTab from "@/components/tas/Applicationstab";
import ActiveAgentsTab from "@/components/tas/Activeagentstab";
import AgentDetail from "@/components/tas/Agentdetail";
import type { TASTab, ActiveAgent } from "@/components/tas/types";

const TABS: TASTab[] = ["Applications", "Active TAS Agents"];

export default function TASManagementPage() {
  const [activeTab,     setActiveTab]     = useState<TASTab>("Applications");
  const [selectedAgent, setSelectedAgent] = useState<ActiveAgent | null>(null);

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

      <div
        className="tas-outer"
        style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--color-background)" }}
      >
        {selectedAgent ? (
          <AgentDetail agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Tab switcher — scrollable on mobile */}
            <div className="tas-tabs">
              <div className="tas-tabs-inner">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={tab === activeTab ? "btn-primary" : ""}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      border: tab === activeTab ? "none" : "1px solid var(--color-border)",
                      backgroundColor: tab === activeTab ? undefined : "transparent",
                      color: tab === activeTab ? undefined : "var(--color-text-muted)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "Applications"      && <ApplicationsTab />}
            {activeTab === "Active TAS Agents" && <ActiveAgentsTab onSelectAgent={setSelectedAgent} />}
          </div>
        )}
      </div>
    </div>
  );
}