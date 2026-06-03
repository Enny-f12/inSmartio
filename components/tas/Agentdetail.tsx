// components/tas/AgentDetail.tsx
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchTasById, suspendTasThunk, activateTasThunk, clearSelectedTas,
} from "@/lib/redux/tasSlice";
import type { ApiTas } from "@/lib/api/tasApi";
import AdjustTierModal from "./Adjusttiermodal";
import { sectionLabel, InfoRow, statusBadge, fmtMoney, getTierLabel, getTierBonus } from "./shared";

interface Props {
  agentId:  string;
  fallback: ApiTas;
  onBack:   () => void;
}

export default function AgentDetail({ agentId, fallback, onBack }: Props) {
  const dispatch = useAppDispatch();
  const { selected, selectedStatus, mutateStatus } = useAppSelector((s) => s.tas);
  const [showAdjust, setShowAdjust] = useState(false);
  const isMutating = mutateStatus === "loading";

  useEffect(() => {
    dispatch(fetchTasById({ id: agentId, fallback }));
    return () => { dispatch(clearSelectedTas()); };
  }, [agentId, dispatch, fallback]);

  const agent     = selected ?? fallback;
  const isLoading = selectedStatus === "loading";
  const tierNum   = Number(agent.tier ?? 1);

  const ext              = agent as Record<string, unknown>;
  const expertsObj       = ext.expertCount as { total?: number; active?: number } | null
                        ?? ext.experts as { total?: number; active?: number } | null;
  const totalEarnings    = fmtMoney(ext.totalEarnings    as number | undefined);
  const thisMonth        = fmtMoney(ext.thisMonth        as number | undefined);
  const availableBalance = fmtMoney(ext.availableBalance as number | undefined);
  const pendingBalance   = fmtMoney(ext.pendingBalance   as number | undefined);

  // Bank
  const bank = (ext.bankDetails ?? ext.account) as {
    bankName?: string; accountNumber?: string; accountName?: string;
  } | null;

  // Location
  const loc = ext.location as { city?: string; state?: string; country?: string } | null;
  const locationStr = loc ? [loc.city, loc.state, loc.country].filter(Boolean).join(", ") : null;

  // Commissions from API — shape: commissions[]
  const commissions = (ext.commissions ?? ext.commissionsGiven ?? []) as {
    id?: string;
    expertId?: string;
    modelType?: string;
    contractValue?: number;
    commissionRate?: number;
    commissionAmount?: number;
    successfulReferrals?: number;
    status?: string;
    createdAt?: string;
  }[];

  // Recruited experts from expertCount.experts[]
  const recruitedExperts = (expertsObj as { experts?: { id?: string; name?: string; email?: string; status?: string }[] } | null)?.experts ?? [];

  const handleSuspend = () => {
    const isSuspended = String(agent.status ?? "").toLowerCase() === "suspended";
    dispatch((isSuspended ? activateTasThunk : suspendTasThunk)(agent.id))
      .unwrap()
      .then(() => toast.success(isSuspended ? "TAS agent reinstated" : "TAS agent suspended"))
      .catch((err: string) => toast.error("Action failed", { description: err }));
  };

  const actionBtn: React.CSSProperties = {
    flex: 1, padding: "13px 8px", borderRadius: 10, border: "1px solid #E5E7EB",
    backgroundColor: "#fff", color: "#374151", fontSize: 13, fontWeight: 500,
    cursor: "pointer", textAlign: "center",
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: "#F4F5F7" }}>

      {/* Back */}
      <div style={{ padding: "20px 32px 0" }}>
        <button onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 8, border: "none",
            background: "none", cursor: "pointer", fontSize: 14, color: "#111827", fontWeight: 600,
          }}>
          <ArrowLeft size={16} /> Active TAS Agents
        </button>
      </div>

      {isLoading ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 64, gap: 8, color: "#9CA3AF", fontSize: 14,
        }}>
          <Loader2 size={18} className="animate-spin" /> Loading agent…
        </div>
      ) : (
        <div style={{ padding: "20px 32px 120px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Agent Info ── */}
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
              <p style={sectionLabel}>Agent Information</p>
              <InfoRow label="Name:"   value={agent.name} />
              <InfoRow label="TAS ID:" value={(ext.applicationCode as string) ?? agent.id} />
              <InfoRow label="Phone:"  value={ext.phone as string} />
              <InfoRow label="Email:"  value={ext.email as string} />
              <InfoRow label="Gender:" value={ext.gender as string} />
              <InfoRow label="Tier:"   value={`${tierNum} – ${getTierLabel(tierNum).replace(`Tier ${tierNum} (`, "").replace(")", "")}`} />
              <InfoRow label="Bonus:"  value={getTierBonus(tierNum)} />
              {locationStr && <InfoRow label="Location:" value={locationStr} />}
              <InfoRow label="Joined:" value={new Date(agent.createdAt).toLocaleDateString("en-GB")} />
              <div style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "center" }}>
                <span style={{ minWidth: 190, color: "#6B7280" }}>Status:</span>
                {statusBadge(agent.status ?? "active")}
              </div>
            </div>

            {/* ── Bank Details ── */}
            {bank?.bankName && (
              <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
                <p style={sectionLabel}>Bank Details</p>
                <InfoRow label="Bank Name:"      value={bank.bankName} />
                <InfoRow label="Account Name:"   value={bank.accountName} />
                <InfoRow label="Account Number:" value={bank.accountNumber} />
              </div>
            )}

            {/* ── Performance ── */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
              <p style={sectionLabel}>Performance Metrics</p>
              <InfoRow label="Total Experts Recruited:" value={expertsObj?.total  != null ? String(expertsObj.total)  : "—"} />
              <InfoRow label="Active Experts:"          value={expertsObj?.active != null ? String(expertsObj.active) : "—"} />
              <InfoRow label="Total Earnings:"          value={totalEarnings} />
              <InfoRow label="This Month:"              value={thisMonth} />
              <InfoRow label="Available Balance:"       value={availableBalance} />
              <InfoRow label="Pending Balance:"         value={pendingBalance} />
            </div>

            {/* ── Recruited Experts ── */}
            {recruitedExperts.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <p style={{ ...sectionLabel, padding: "20px 28px 0" }}>Recruited Experts</p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      {["Expert ID", "Name", "Email", "Status"].map((h) => (
                        <th key={h} style={{
                          textAlign: "left", padding: "12px 20px", fontSize: 12,
                          fontWeight: 600, color: "#6B7280",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recruitedExperts.map((e, i) => (
                      <tr key={e.id ?? i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", fontFamily: "monospace" }}>{e.id ?? "—"}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151", fontWeight: 500 }}>{e.name ?? "—"}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280" }}>{e.email ?? "—"}</td>
                        <td style={{ padding: "13px 20px" }}>{statusBadge(e.status ?? "active")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Commissions ── */}
            {commissions.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <p style={{ ...sectionLabel, padding: "20px 28px 0" }}>Commission History</p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      {["Expert ID", "Model", "Contract Value", "Rate", "Commission", "Referrals", "Status", "Date"].map((h) => (
                        <th key={h} style={{
                          textAlign: "left", padding: "12px 20px", fontSize: 12,
                          fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c, i) => (
                      <tr key={c.id ?? i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", fontFamily: "monospace", whiteSpace: "nowrap" }}>{c.expertId ?? "—"}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151" }}>{c.modelType ?? "—"}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>{fmtMoney(c.contractValue)}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280" }}>{c.commissionRate != null ? `${c.commissionRate}%` : "—"}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{fmtMoney(c.commissionAmount)}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151", textAlign: "center" }}>{c.successfulReferrals ?? "—"}</td>
                        <td style={{ padding: "13px 20px" }}>{statusBadge(c.status ?? "—")}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {commissions.length === 0 && recruitedExperts.length === 0 && (
              <div style={{ padding: "32px 28px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>No commission history yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action bar ── */}
      <div style={{
        position: "sticky", bottom: 0, backgroundColor: "#F4F5F7",
        borderTop: "1px solid #E5E7EB", padding: "16px 32px",
        display: "flex", gap: 12, flexWrap: "wrap",
      }}>
        <button onClick={() => setShowAdjust(true)}
          style={{ ...actionBtn, backgroundColor: "#2563eb", color: "#fff", border: "none", fontWeight: 600, flex: "1 1 auto" }}>
          Adjust Tier
        </button>
        <button onClick={handleSuspend} disabled={isMutating}
          style={{ ...actionBtn, flex: "1 1 auto", opacity: isMutating ? 0.6 : 1 }}>
          {String(agent.status ?? "").toLowerCase() === "suspended" ? "Reinstate TAS" : "Suspend TAS"}
        </button>
        <button style={{ ...actionBtn, flex: "1 1 auto" }}>Force Payout</button>
        <button style={{ ...actionBtn, flex: "1 1 auto" }}>Add Note</button>
      </div>

      {showAdjust && <AdjustTierModal agent={agent} onClose={() => setShowAdjust(false)} />}
    </div>
  );
}