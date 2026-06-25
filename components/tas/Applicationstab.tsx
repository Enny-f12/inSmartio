// components/tas/ApplicationsTab.tsx
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/hooks/redux";
import { verifyTas } from "@/lib/api/tasApi";
import type { ApiTas } from "@/lib/api/tasApi";
import ApplicationDetailPage from "./ApplicationDetail";
import { card, statusBadge, getType, type AppTab } from "./shared";

interface Props {
  agents: ApiTas[];
}

type View = { type: "list" } | { type: "detail"; agent: ApiTas };

function getAppStatus(
  a: ApiTas,
  overrides: Record<string, "approved" | "rejected">
): AppTab {
  if (overrides[a.id]) return overrides[a.id];
  const status = a.status != null && typeof a.status !== "object"
    ? String(a.status).toLowerCase() : "";
  const verify = a.verify != null && typeof a.verify !== "object"
    ? String(a.verify).toLowerCase() : "pending";
  if (status === "active" || verify === "approved") return "approved";
  if (verify === "rejected") return "rejected";
  return "pending";
}

function getNetwork(a: ApiTas): string {
  const re = (a as Record<string, unknown>).recruitExpectations as Record<string, unknown> | null;
  return re?.networkSize ? `${re.networkSize}+` : "—";
}

export default function ApplicationsTab({ agents }: Props) {
  const { admin }  = useAppSelector((s) => s.auth);
  const adminId    = (admin as Record<string, string> | null)?.id ?? "";

  const [view,           setView]           = useState<View>({ type: "list" });
  const [appTab,         setAppTab]         = useState<AppTab>("pending");
  const [search,         setSearch]         = useState("");
  const [localOverrides, setLocalOverrides] = useState<Record<string, "approved" | "rejected">>({});

  const counts = {
    pending:  agents.filter((a) => getAppStatus(a, localOverrides) === "pending").length,
    approved: agents.filter((a) => getAppStatus(a, localOverrides) === "approved").length,
    rejected: agents.filter((a) => getAppStatus(a, localOverrides) === "rejected").length,
  };

  const filtered = agents.filter((a) =>
    getAppStatus(a, localOverrides) === appTab &&
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async (id: string, documentKey: string) => {
    try {
      await verifyTas(id, { verify: true, reject: false, adminId, documentKey });
      setLocalOverrides((prev) => ({ ...prev, [id]: "approved" }));
      setView({ type: "list" });
      toast.success("TAS application approved");
    } catch (err: unknown) {
      toast.error("Failed to approve", { description: err instanceof Error ? err.message : "Error" });
    }
  };

  const handleReject = async (id: string, reason: string, documentKey: string) => {
    try {
      await verifyTas(id, { verify: false, reject: true, reason, adminId, documentKey });
      setLocalOverrides((prev) => ({ ...prev, [id]: "rejected" }));
      setView({ type: "list" });
      toast.success("TAS application rejected");
    } catch (err: unknown) {
      toast.error("Failed to reject", { description: err instanceof Error ? err.message : "Error" });
    }
  };

  // ── Detail page view ──────────────────────────────────────────────────────
  if (view.type === "detail") {
    return (
      <ApplicationDetailPage
        agent={view.agent}
        appStatus={getAppStatus(view.agent, localOverrides)}
        onBack={() => setView({ type: "list" })}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  const appTabs: { key: AppTab; label: string }[] = [
    { key: "pending",  label: "Pending"  },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div style={card}>

      {/* Sub-tabs — counts live here, no separate stats bar needed */}
      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", padding: "0 20px" }}>
        {appTabs.map((t) => (
          <button key={t.key} onClick={() => setAppTab(t.key)}
            style={{
              padding: "13px 18px", fontSize: 13, fontWeight: 600,
              border: "none", background: "none", cursor: "pointer",
              color: appTab === t.key ? "#111827" : "#6B7280",
              borderBottom: appTab === t.key ? "2px solid #111827" : "2px solid transparent",
            }}>
            {t.label}
            <span style={{
              marginLeft: 6, fontSize: 11, fontWeight: 700,
              padding: "1px 7px", borderRadius: 999,
              backgroundColor: appTab === t.key ? "#111827" : "#E5E7EB",
              color: appTab === t.key ? "#fff" : "#6B7280",
            }}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "#9CA3AF",
          }} />
          <input
            type="text" placeholder="Search name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 12,
              paddingTop: 9, paddingBottom: 9,
              borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13,
              outline: "none", backgroundColor: "#F9FAFB",
              color: "#111827", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Table — Name | Type | Submitted | Network | Actions */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
              {["Name", "Type", "Submitted", "Network", "Actions"].map((h) => (
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
                <td colSpan={5} style={{ textAlign: "center", padding: 48, fontSize: 13, color: "#9CA3AF" }}>
                  No {appTab} applications.
                </td>
              </tr>
            ) : filtered.map((agent) => (
              <tr key={agent.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "15px 24px", fontSize: 14, fontWeight: 600, color: "#111827" }}>
                  {agent.name}
                </td>
                <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>
                  {getType(agent)}
                </td>
                <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>
                  {new Date(agent.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>
                  {getNetwork(agent)}
                </td>
                <td style={{ padding: "15px 24px" }}>
                  {appTab === "pending" ? (
                    <button onClick={() => setView({ type: "detail", agent })}
                      style={{
                        fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 8,
                        border: "none", background: "#EFF6FF", color: "#2563eb", cursor: "pointer",
                      }}>
                      Review
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {statusBadge(getAppStatus(agent, localOverrides))}
                      <button onClick={() => setView({ type: "detail", agent })}
                        style={{
                          fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 8,
                          border: "1px solid #E5E7EB", background: "#fff",
                          color: "#374151", cursor: "pointer",
                        }}>
                        View
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
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