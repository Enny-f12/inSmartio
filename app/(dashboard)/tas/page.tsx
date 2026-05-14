"use client";

import { useState } from "react";
import Topbar from "@/components/layout/Navbar";
import ApplicationsTab from "@/components/tas/Applicationstab";
import ActiveAgentsTab from "@/components/tas/Activeagentstab";
import AgentDetail from "@/components/tas/Agentdetail";
import type { TASTab, ActiveAgent } from "@/components/tas/types";

const TABS: TASTab[] = ["Applications", "Active TAS Agents"];

export default function TASManagementPage() {
  const [activeTab,      setActiveTab]      = useState<TASTab>("Applications");
  const [selectedAgent,  setSelectedAgent]  = useState<ActiveAgent | null>(null);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Topbar title="TAS Management" />

      <div className="flex-1 px-8 py-5 overflow-y-auto bg-background">
        {selectedAgent ? (
          /* ── Detail view: full content area, no tab bar ── */
          <AgentDetail
            agent={selectedAgent}
            onBack={() => setSelectedAgent(null)}
          />
        ) : (
          /* ── List views: tab bar + content ── */
          <div className="p-8 space-y-5">
            {/* Tab switcher */}
            <div className="flex items-center gap-2">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                    tab === activeTab
                      ? "btn-primary"
                      : "bg-transparent border border-border text-text-muted hover:bg-surface"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Applications" && <ApplicationsTab />}
            {activeTab === "Active TAS Agents" && (
              <ActiveAgentsTab onSelectAgent={setSelectedAgent} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}