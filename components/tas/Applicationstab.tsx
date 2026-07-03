// components/tas/ApplicationsTab.tsx
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { ApiTas } from "@/lib/api/tasApi";
import { useAppDispatch } from "@/hooks/redux";
import { fetchTas } from "@/lib/redux/tasSlice";
import ApplicationDetailPage, { computeStatus, type ComputedStatus } from "./ApplicationDetail";
import { card, statusBadge, getType } from "./shared";

interface Props {
  agents: ApiTas[];
}

type View = { type: "list" } | { type: "detail"; agent: ApiTas };

// Same priority rule as the detail page: any rejected document wins over
// everything else; only if none are rejected does "all verified" apply.
function getAppStatus(a: ApiTas, override?: ComputedStatus): ComputedStatus {
  if (override) return override;
  const docs = Array.isArray(a.document) ? a.document : [];
  return computeStatus(docs.map((d) => ({ verified: d?.verify === true, rejected: d?.reject === true })));
}

function getNetwork(a: ApiTas): string {
  const re = (a as Record<string, unknown>).recruitExpectations as Record<string, unknown> | null;
  return re?.networkSize ? `${re.networkSize}+` : "—";
}

export default function ApplicationsTab({ agents }: Props) {
  const dispatch = useAppDispatch();
  const [view,           setView]           = useState<View>({ type: "list" });
  const [appTab,         setAppTab]         = useState<ComputedStatus>("pending");
  const [search,         setSearch]         = useState("");
  const [localOverrides, setLocalOverrides] = useState<Record<string, ComputedStatus>>({});

  const counts = {
    pending:  agents.filter((a) => getAppStatus(a, localOverrides[a.id]) === "pending").length,
    approved: agents.filter((a) => getAppStatus(a, localOverrides[a.id]) === "approved").length,
    rejected: agents.filter((a) => getAppStatus(a, localOverrides[a.id]) === "rejected").length,
  };

  const filtered = agents.filter((a) =>
    getAppStatus(a, localOverrides[a.id]) === appTab &&
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (id: string, status: ComputedStatus) => {
    setLocalOverrides((prev) => ({ ...prev, [id]: status }));
  };

  // The local override above is just for instant feedback while the modal is
  // open. The real fix: refetch the list from the server so Redux itself has
  // the correct document data — otherwise switching tabs (which unmounts this
  // component and wipes the override) or navigating elsewhere and back shows
  // stale data until a hard refresh.
  const handleBackToList = () => {
    setView({ type: "list" });
    dispatch(fetchTas());
  };

  // ── Detail page view ──────────────────────────────────────────────────────
  if (view.type === "detail") {
    return (
      <ApplicationDetailPage
        agent={view.agent}
        onBack={handleBackToList}
        onStatusChange={handleStatusChange}
      />
    );
  }

  const appTabs: { key: ComputedStatus; label: string }[] = [
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
                      {statusBadge(getAppStatus(agent, localOverrides[agent.id]))}
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