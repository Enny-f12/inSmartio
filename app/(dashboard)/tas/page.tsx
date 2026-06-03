// app/(admin)/tas/page.tsx  — or wherever your TAS page lives
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchTas } from "@/lib/redux/tasSlice";
import type { ApiTas } from "@/lib/api/tasApi";
import ApplicationsTab from "@/components/tas/Applicationstab";
import ActiveAgentsTab from "@/components/tas/Activeagentstab";
import type { MainTab } from "@/components/tas/shared";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Applications = anyone who has gone through the verify flow (has a `verify` field).
// Includes pending, approved, and rejected — so approved agents appear in both tabs.
const isApplication = (t: ApiTas): boolean => {
  const ext = t as Record<string, unknown>;
  return ext.verify !== undefined && ext.verify !== null;
};

// Active Agents = strictly status: "active" (operational, verified agents).
const isActiveAgent = (t: ApiTas): boolean => {
  const s = t.status;
  if (!s || typeof s === "object") return false;
  return String(s).toLowerCase() === "active";
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TASPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError } = useAppSelector((s) => s.tas);
  const [mainTab, setMainTab] = useState<MainTab>("applications");

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchTas());
  }, [dispatch, listStatus]);

  const applications = list.filter(isApplication);
  const activeAgents  = list.filter(isActiveAgent);

  const tabs = [
    { key: "applications" as MainTab, label: "Applications",      count: applications.length },
    { key: "active"       as MainTab, label: "Active TAS Agents", count: activeAgents.length  },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1,
      minHeight: "100vh", backgroundColor: "#F4F5F7",
    }}>
      <Topbar title="TAS Management" />

      <main style={{
        flex: 1, padding: "24px 32px",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Loading */}
        {listStatus === "loading" && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 64, gap: 8, color: "#9CA3AF", fontSize: 14,
          }}>
            <Loader2 size={18} className="animate-spin" /> Loading TAS data…
          </div>
        )}

        {/* Error */}
        {listStatus === "failed" && list.length === 0 && (
          <p style={{ textAlign: "center", padding: 40, fontSize: 13, color: "#ef4444" }}>
            {listError}
          </p>
        )}

        {/* Content */}
        {(listStatus === "succeeded" || listStatus === "failed") && (
          <>
            {/* Main tab switcher */}
            <div style={{ display: "flex", gap: 8 }}>
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setMainTab(t.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 22px", borderRadius: 999,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border:           mainTab === t.key ? "none"    : "1px solid #D1D5DB",
                    backgroundColor:  mainTab === t.key ? "#2563eb" : "#fff",
                    color:            mainTab === t.key ? "#fff"    : "#6B7280",
                  }}>
                  {t.label}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                    backgroundColor: mainTab === t.key ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                    color:           mainTab === t.key ? "#fff" : "#6B7280",
                  }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {mainTab === "applications" && <ApplicationsTab agents={applications} />}
            {mainTab === "active"       && <ActiveAgentsTab agents={activeAgents}  />}
          </>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}