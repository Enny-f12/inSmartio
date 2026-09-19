// components/tas/AgentDetail.tsx
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchTasById, suspendTasThunk, activateTasThunk, clearSelectedTas,
} from "@/lib/redux/tasSlice";
import type { ApiTas } from "@/lib/api/tasApi";
import AdjustTierModal from "./Adjusttiermodal";
import { sectionLabel, statusBadge, fmtMoney, getTierLabel, getTierBonus } from "./shared";

interface Props {
  agentId:  string;
  fallback: ApiTas;
  onBack:   () => void;
}

// Full expert profile shape, as returned in `data.expert.experts[]` / `data.expert.activeExperts[]`
interface FullExpert {
  id?:                   string;
  name?:                 string;
  email?:                string;
  phone?:                string;
  avatar?:               string | null;
  bio?:                  string;
  gender?:               string;
  rating?:               number;
  status?:               string;
  verify?:               string;
  tier?:                 number;
  currentMode?:          string;
  subscriptionActive?:   boolean;
  subscriptionExpiresAt?: string;
  createdAt?:            string;
  location?:             { area?: string; city?: string; state?: string; country?: string };
  category?:             { name?: string; sub?: string[] }[];
  skill?:                { area?: string; role?: string[]; experience?: number };
}

// Shape of `data.expert` — the recruit summary + roster object
interface ExpertSummary {
  total?:         number;
  active?:        number;
  activeExperts?: FullExpert[];
  experts?:       FullExpert[];
}

// ── Mobile-aware InfoRow ──────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "2px" : "8px",
      fontSize: 13,
      marginBottom: 10,
    }}>
      <span style={{
        minWidth: isMobile ? "unset" : "200px",
        flexShrink: 0,
        fontWeight: 500,
        color: "#6B7280",
      }}>
        {label}
      </span>
      <span style={{ color: "#111827", wordBreak: "break-word", flex: 1 }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── Expert Detail Modal ────────────────────────────────────────────────────
function ExpertDetailModal({ expert, onClose }: { expert: FullExpert; onClose: () => void }) {
  const categories = (expert.category ?? [])
    .map((c) => [c.name, ...(c.sub ?? [])].filter(Boolean).join(": "))
    .filter(Boolean);

  const location = [expert.location?.area, expert.location?.city, expert.location?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(17,24,39,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0,
          backgroundColor: "#fff",
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
            Expert Details
          </p>
          <button onClick={onClose} style={{
            border: "none", background: "none", cursor: "pointer",
            color: "#6B7280", display: "flex",
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <InfoRow label="Name:"     value={expert.name} />
          <InfoRow label="Expert ID:" value={expert.id} />
          <InfoRow label="Email:"    value={expert.email} />
          <InfoRow label="Phone:"    value={expert.phone} />
          <InfoRow label="Gender:"   value={expert.gender} />
          <InfoRow label="Location:" value={location || "—"} />
          <InfoRow label="Categories:" value={categories.length ? categories.join(" · ") : "—"} />
          <InfoRow label="Experience:" value={
            expert.skill?.experience != null ? `${expert.skill.experience} yrs` : "—"
          } />
          <InfoRow label="Rating:"   value={expert.rating != null ? `${expert.rating} / 5` : "—"} />
          <InfoRow label="Tier:"     value={expert.tier != null ? getTierLabel(expert.tier) : "—"} />
          <InfoRow label="Verification:" value={expert.verify} />
          <InfoRow label="Subscription:" value={
            expert.subscriptionActive
              ? `Active${expert.subscriptionExpiresAt
                  ? ` (expires ${new Date(expert.subscriptionExpiresAt).toLocaleDateString("en-GB")})`
                  : ""}`
              : "Inactive"
          } />
          <InfoRow label="Joined:"   value={
            expert.createdAt ? new Date(expert.createdAt).toLocaleDateString("en-GB") : "—"
          } />
          <div style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 10, alignItems: "center" }}>
            <span style={{ minWidth: 200, color: "#6B7280", fontWeight: 500 }}>Status:</span>
            {statusBadge(expert.status ?? "active")}
          </div>
          {expert.bio && (
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", margin: "0 0 4px" }}>Bio</p>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>{expert.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentDetail({ agentId, fallback, onBack }: Props) {
  const dispatch = useAppDispatch();
  const { selected, selectedStatus, mutateStatus } = useAppSelector((s) => s.tas);
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<FullExpert | null>(null);
  const [showAllExperts, setShowAllExperts] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const isMutating = mutateStatus === "loading";

  useEffect(() => {
    dispatch(fetchTasById({ id: agentId, fallback }));
    return () => { dispatch(clearSelectedTas()); };
  }, [agentId, dispatch, fallback]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const agent     = selected ?? fallback;
  const isLoading = selectedStatus === "loading";
  const tierNum   = Number(agent.tier ?? 1);

  const ext = agent as Record<string, unknown>;

  // ── Recruit summary object — backend key is `expert` (singular) ──
  const expertsObj = ext.expert as ExpertSummary | undefined;

  // ── Balances / earnings — mapped to the actual backend field names ──
  // currentBalance  → "Available Balance"
  // thisMonthEarnings → "This Month"
  // earnings        → "Total Earnings"
  // pendingBalance  → "Pending Balance"
  const totalEarnings    = fmtMoney(ext.earnings           as number | undefined);
  const thisMonth        = fmtMoney(ext.thisMonthEarnings  as number | undefined);
  const availableBalance = fmtMoney(ext.currentBalance      as number | undefined);
  const pendingBalance   = fmtMoney(ext.pendingBalance      as number | undefined);

  const rawCommissions = ext.commissions ?? ext.commissionsGiven;
  const commissions = (Array.isArray(rawCommissions) ? rawCommissions : []) as {
    id?: string;
    expertId?: string;
    modelType?: string;
    contractValue?: number;
    commissionRate?: number;
    commissionAmount?: number;
    successfulReferrals?: number;
    status?: string;
    createdAt?: string;
    metadata?: { expertEmail?: string; expertId?: string; reason?: string };
  }[];

  type ExpertRow = {
    key:     string;
    name?:   string;
    model?:  string;
    status?: string;
    payout?: number;
    notes?:  string;
    expert?: FullExpert; // full profile for the detail modal, when available
  };

  // Full expert profiles live at `data.expert.experts[]` (the complete roster) —
  // this is the richest source and what the detail modal needs. Fall back to
  // `data.expert.activeExperts[]`, then finally to commissions-derived rows
  // (no name available from commissions alone).
  const rawFullExperts: FullExpert[] =
    (Array.isArray(expertsObj?.experts) && expertsObj.experts.length > 0)
      ? expertsObj.experts
      : (Array.isArray(expertsObj?.activeExperts) ? expertsObj.activeExperts : []);

  const recruitedExperts: ExpertRow[] = rawFullExperts.length > 0
    ? rawFullExperts.map((e) => ({
        // eslint-disable-next-line react-hooks/purity
        key:    e.id ?? e.name ?? Math.random().toString(),
        name:   e.name,
        model:  e.currentMode,
        status: e.status,
        notes:  e.category?.[0]?.name,
        expert: e,
      }))
    : commissions.map((c) => ({
        // eslint-disable-next-line react-hooks/purity
        key:    c.id ?? c.expertId ?? Math.random().toString(),
        name:   undefined, // real name not available from commissions alone
        model:  c.modelType,
        status: "active",
        payout: c.commissionAmount,
        notes:  "Earned for TAS",
      }));

  const VISIBLE_LIMIT = 5;
  const visibleExperts = showAllExperts ? recruitedExperts : recruitedExperts.slice(0, VISIBLE_LIMIT);
  const hasMoreExperts = recruitedExperts.length > VISIBLE_LIMIT;

  const handleSuspend = () => {
    const isSuspended = String(agent.status ?? "").toLowerCase() === "suspended";
    dispatch((isSuspended ? activateTasThunk : suspendTasThunk)(agent.id))
      .unwrap()
      .then(() => toast.success(isSuspended ? "TAS agent reinstated" : "TAS agent suspended"))
      .catch((err: string) => toast.error("Action failed", { description: err }));
  };

  const actionBtn: React.CSSProperties = {
    flex: "1 1 auto",
    padding: "13px 8px",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    backgroundColor: "#fff",
    color: "#374151",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "center",
  };

  const sectionPad = isMobile ? "16px" : "24px 28px";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: "#F4F5F7" }}>

      {/* Back */}
      <div style={{ padding: isMobile ? "16px 16px 0" : "20px 32px 0" }}>
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
        <div style={{
          padding: isMobile ? "16px 12px 120px" : "20px 32px 120px",
          flex: 1, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 16,
        }}>

          {/* ── Agent Info ── */}
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: sectionPad, borderBottom: "1px solid #E5E7EB" }}>
              <p style={sectionLabel}>Agent Information</p>
              <InfoRow label="Name:"   value={agent.name} />
              <InfoRow label="TAS ID:" value={(ext.applicationCode as string) ?? agent.id} />
              <InfoRow label="Phone:"  value={ext.phone as string} />
              <InfoRow label="Email:"  value={ext.email as string} />
              <InfoRow label="Tier:"   value={`${tierNum} (${getTierLabel(tierNum).replace(`Tier ${tierNum} (`, "").replace(")", "")})`} />
              <InfoRow label="Bonus:"  value={getTierBonus(tierNum)} />
              <InfoRow label="Joined:" value={new Date(agent.createdAt).toLocaleDateString("en-GB")} />
              <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? "2px" : "8px",
                fontSize: 13,
                alignItems: isMobile ? "flex-start" : "center",
              }}>
                <span style={{ minWidth: isMobile ? "unset" : 200, color: "#6B7280", fontWeight: 500 }}>Status:</span>
                {statusBadge(agent.status ?? "active")}
              </div>
            </div>

            {/* ── Performance ── */}
            <div style={{ padding: sectionPad, borderBottom: "1px solid #E5E7EB" }}>
              <p style={sectionLabel}>Performance Metrics</p>
              <InfoRow label="Total Experts Recruited:" value={
                expertsObj?.total != null ? String(expertsObj.total) : String(recruitedExperts.length)
              } />
              <InfoRow label="Active Experts:"          value={expertsObj?.active != null ? String(expertsObj.active) : "—"} />
              <InfoRow label="Total Earnings:"          value={totalEarnings} />
              <InfoRow label="This Month:"              value={thisMonth} />
              <InfoRow label="Available Balance:"       value={availableBalance} />
              <InfoRow label="Pending Balance:"         value={pendingBalance} />
            </div>

            {/* ── Recruited Experts (max 5, expandable; click row for details) ── */}
            <div style={{ overflowX: "auto" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: isMobile ? "16px 16px 0" : "20px 28px 0",
              }}>
                <p style={{ ...sectionLabel, margin: 0 }}>Recruited Experts</p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                    {["Recruited Expert", "Earning History", "Sub-TAS", "Payout", "Notes"].map((h) => (
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
                  {visibleExperts.length > 0 ? (
                    visibleExperts.map((e) => (
                      <tr
                        key={e.key}
                        onClick={() => e.expert && setSelectedExpert(e.expert)}
                        style={{
                          borderBottom: "1px solid #F3F4F6",
                          cursor: e.expert ? "pointer" : "default",
                        }}
                        onMouseEnter={(ev) => { if (e.expert) ev.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                        onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151", fontWeight: 500, whiteSpace: "nowrap" }}>{e.name ?? "—"}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
                          {e.model ? (e.model === "model1" ? "Model 1" : e.model === "model2" ? "Model 2" : e.model) : "—"}
                        </td>
                        <td style={{ padding: "13px 20px" }}>{statusBadge(e.status ?? "active")}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                          {e.payout != null ? fmtMoney(e.payout) : "—"}
                        </td>
                        <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>{e.notes ?? "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{
                        padding: isMobile ? "16px" : "20px 28px",
                        textAlign: "center", fontSize: 13, color: "#9CA3AF", fontStyle: "italic",
                      }}>
                        No experts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {hasMoreExperts && (
                <div style={{ padding: isMobile ? "12px 16px 20px" : "12px 28px 24px" }}>
                  <button
                    onClick={() => setShowAllExperts((v) => !v)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      border: "none", background: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, color: "#2563eb", padding: 0,
                    }}
                  >
                    {showAllExperts
                      ? <>Show less <ChevronUp size={14} /></>
                      : <>Show all {recruitedExperts.length} experts <ChevronDown size={14} /></>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Action bar ── */}
      <div style={{
        position: "sticky", bottom: 0, backgroundColor: "#F4F5F7",
        borderTop: "1px solid #E5E7EB",
        padding: isMobile ? "12px" : "16px 32px",
        display: "flex", gap: isMobile ? 8 : 12, flexWrap: "wrap",
      }}>
        <button onClick={() => setShowAdjust(true)}
          style={{ ...actionBtn, backgroundColor: "#2563eb", color: "#fff", border: "none", fontWeight: 600 }}>
          Adjust Tier
        </button>
        <button onClick={handleSuspend} disabled={isMutating}
          style={{ ...actionBtn, opacity: isMutating ? 0.6 : 1 }}>
          {String(agent.status ?? "").toLowerCase() === "suspended" ? "Reinstate TAS" : "Suspend TAS"}
        </button>
        <button style={actionBtn}>Force Payout</button>
        <button style={actionBtn}>Add Note</button>
      </div>

      {showAdjust && <AdjustTierModal agent={agent} onClose={() => setShowAdjust(false)} />}
      {selectedExpert && (
        <ExpertDetailModal expert={selectedExpert} onClose={() => setSelectedExpert(null)} />
      )}
    </div>
  );
}