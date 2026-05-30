// app/(dashboard)/tas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Download, CheckCircle2, X, SlidersHorizontal, Loader2, ArrowLeft } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchTas, fetchTasById, adjustTier,
  suspendTasThunk, activateTasThunk,
  clearSelectedTas, resetMutateStatus,
} from "@/lib/redux/tasSlice";
import type { ApiTas, AdjustTierPayload } from "@/lib/api/tasApi";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type AppStatus = "pending" | "approved" | "rejected";
type AppTab    = "pending" | "approved" | "rejected";
type MainTab   = "applications" | "active";

interface TasApplication {
  id:                    string;
  name:                  string;
  phone:                 string;
  email:                 string;
  type:                  string;
  expertId:              string;
  expertRating:          number;
  expertJobsCompleted:   number;
  submitted:             string;
  network:               string;
  status:                AppStatus;
  recruitmentExperience: string;
  networkSize:           string;
  categories:            string;
  whyTas:                string;
  documents: { name: string; url?: string; status: "verified" | "pending" }[];
}

// ── Mock applications ─────────────────────────────────────────────────────────

const MOCK_APPLICATIONS: TasApplication[] = [
  {
    id: "mock-app-1", name: "Peter Okafor", phone: "+234 801 234 5678",
    email: "peter@email.com", type: "Expert TAS", expertId: "EXP-12345",
    expertRating: 4.9, expertJobsCompleted: 45,
    submitted: "2026-03-25", network: "50+", status: "pending",
    recruitmentExperience: "I have recruited 10+ plumbers locally",
    networkSize: "50+ skilled professionals",
    categories: "Repair & Construction, Auto Repair, Housekeeping",
    whyTas: "I want to help my community members find work",
    documents: [
      { name: "NIN Slip",               url: "#", status: "verified" },
      { name: "Valid ID (National ID)",  url: "#", status: "verified" },
    ],
  },
  {
    id: "mock-app-2", name: "Mary Kehinde", phone: "+234 802 345 6789",
    email: "mary@email.com", type: "Dedicated TAS", expertId: "EXP-23456",
    expertRating: 4.7, expertJobsCompleted: 32,
    submitted: "2026-03-24", network: "100+", status: "pending",
    recruitmentExperience: "Previously managed a team of 20 artisans",
    networkSize: "100+ contacts in Abuja",
    categories: "Plumbing, Electrical, Carpentry",
    whyTas: "To formalize my network and earn commissions",
    documents: [
      { name: "NIN Slip",              url: "#", status: "verified" },
      { name: "Valid ID (National ID)",          status: "pending"  },
    ],
  },
  {
    id: "mock-app-3", name: "John Doe", phone: "+234 803 456 7890",
    email: "john@email.com", type: "Expert TAS", expertId: "EXP-34567",
    expertRating: 4.5, expertJobsCompleted: 28,
    submitted: "2026-03-23", network: "25+", status: "pending",
    recruitmentExperience: "Built a WhatsApp group of 25+ skilled workers",
    networkSize: "25+ verified tradespeople",
    categories: "Auto Repair, Cleaning",
    whyTas: "I believe in empowering local experts",
    documents: [
      { name: "NIN Slip",               url: "#", status: "verified" },
      { name: "Valid ID (National ID)",  url: "#", status: "verified" },
    ],
  },
];

// ── Tier config ───────────────────────────────────────────────────────────────

const TAS_TIERS = [
  { value: 1, label: "Tier 1 (Associate, 0% bonus)",           bonus: "0%"   },
  { value: 2, label: "Tier 2 (Senior, +5% bonus)",             bonus: "+5%"  },
  { value: 3, label: "Tier 3 (Master, +10% bonus)",            bonus: "+10%" },
  { value: 4, label: "Tier 4 (Regional Lead, +12% bonus)",     bonus: "+12%" },
  { value: 5, label: "Tier 5 (National Director, +15% bonus)", bonus: "+15%" },
  { value: 6, label: "Tier 6 (Elite Ambassador, +20% bonus)",  bonus: "+20%" },
];

const getTierBonus = (tier: number) =>
  TAS_TIERS.find((t) => t.value === tier)?.bonus ?? "—";

const getTierLabel = (tier: number) =>
  TAS_TIERS.find((t) => t.value === tier)?.label ?? `Tier ${tier}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtMoney = (n?: number | null) =>
  n != null ? `₦${Number(n).toLocaleString()}` : "—";

const statusBadge = (s: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#FEF3C7", color: "#B45309" },
    approved:  { bg: "#D1FAE5", color: "#065F46" },
    rejected:  { bg: "#FEE2E2", color: "#991B1B" },
    active:    { bg: "#D1FAE5", color: "#065F46" },
    inactive:  { bg: "#FEF3C7", color: "#B45309" },
    suspended: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const key = s?.toLowerCase() ?? "";
  const c = map[key] ?? { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
      backgroundColor: c.bg, color: c.color, whiteSpace: "nowrap" }}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 9, alignItems: "flex-start" }}>
      <span style={{ minWidth: 165, flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", flex: 1 }}>{value ?? "—"}</span>
    </div>
  );
}

const card: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid #E5E7EB",
  borderRadius: 14, overflow: "hidden",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.08em", color: "#6B7280", margin: "0 0 14px",
};

// ── Application Detail Modal ──────────────────────────────────────────────────

function AppModal({ app, onClose, onApprove, onReject }: {
  app: TasApplication; onClose: () => void;
  onApprove: (id: string) => void; onReject: (id: string) => void;
}) {
  const mailHref = `mailto:${app.email}?subject=${encodeURIComponent("TAS Application – More Information Needed")}&body=${encodeURIComponent(`Dear ${app.name},\n\nWe need more information regarding your TAS application.\n\nThank you.`)}`;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>TAS Applications</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer",
            color: "#9CA3AF", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Applicant Information */}
          <div>
            <p style={sectionLabel}>Applicant Information</p>
            <InfoRow label="Name:"                  value={app.name} />
            <InfoRow label="Phone:"                 value={app.phone} />
            <InfoRow label="Email:"                 value={app.email} />
            <InfoRow label="Type:"                  value={`${app.type} (${app.expertId})`} />
            <InfoRow label="Expert Rating:"         value={<span>⭐ {app.expertRating}</span>} />
            <InfoRow label="Expert Jobs Completed:" value={String(app.expertJobsCompleted)} />
            <InfoRow label="Submitted:"             value={new Date(app.submitted).toLocaleDateString("en-GB")} />
          </div>
          {/* Application Details */}
          <div>
            <p style={sectionLabel}>Application Details</p>
            <InfoRow label="Recruitment Experience:" value={`"${app.recruitmentExperience}"`} />
            <InfoRow label="Network Size:"           value={app.networkSize} />
            <InfoRow label="Categories:"             value={app.categories} />
            <InfoRow label="Why TAS:"                value={`"${app.whyTas}"`} />
          </div>
          {/* Documents */}
          <div>
            <p style={sectionLabel}>Documents</p>
            {app.documents.map((doc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ flex: 1, fontSize: 13, color: "#111827" }}>{doc.name}</span>
                {doc.url ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <a href={doc.url} target="_blank" rel="noreferrer"
                      style={{ color: "#9CA3AF", display: "flex" }}><Eye size={15} strokeWidth={1.8} /></a>
                    <a href={doc.url} download style={{ color: "#9CA3AF", display: "flex" }}>
                      <Download size={15} strokeWidth={1.8} /></a>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: "#D1D5DB", display: "flex" }}><Eye size={15} /></span>
                    <span style={{ color: "#D1D5DB", display: "flex" }}><Download size={15} /></span>
                  </div>
                )}
                <span style={{ minWidth: 64, textAlign: "right" }}>
                  {doc.status === "verified"
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 12, color: "#16a34a", fontWeight: 500 }}>
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    : <span style={{ fontSize: 12, color: "#d97706", fontWeight: 500 }}>Pending</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        {app.status === "pending" ? (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB",
            display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => onApprove(app.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px",
                borderRadius: 10, border: "none", backgroundColor: "#16a34a", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <CheckCircle2 size={14} /> Approve as TAS
            </button>
            <button onClick={() => onReject(app.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
                borderRadius: 10, border: "1.5px solid #fecaca", backgroundColor: "#fff",
                color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <X size={14} /> Reject
            </button>
            <a href={mailHref} style={{ marginLeft: "auto", fontSize: 13, color: "#6B7280",
              fontWeight: 500, textDecoration: "none" }}>Request More Info</a>
          </div>
        ) : (
          <div style={{ padding: "14px 24px", borderTop: "1px solid #E5E7EB",
            display: "flex", alignItems: "center", gap: 8 }}>
            {statusBadge(app.status)}
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              This application has been {app.status}.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Adjust Tier Modal ─────────────────────────────────────────────────────────

function AdjustTierModal({ agent, onClose }: { agent: ApiTas; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { mutateStatus } = useAppSelector((s) => s.tas);
  const currentTier = Number(agent.tier ?? 1);
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [reason, setReason] = useState("");
  const isMutating = mutateStatus === "loading";

  const handleConfirm = () => {
    dispatch(adjustTier({ id: agent.id, payload: { newTier: selectedTier } as AdjustTierPayload }))
      .unwrap()
      .then(() => { toast.success("Tier updated successfully"); onClose(); dispatch(resetMutateStatus()); })
      .catch((err: string) => toast.error("Failed to adjust tier", { description: err }));
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Adjust TAS Tier</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer",
            color: "#9CA3AF", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* TAS info — matches Image 3 */}
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>
            <span style={{ color: "#6B7280" }}>TAS: </span>
            {agent.name} ({(agent.applicationCode as string) ?? agent.id})
          </p>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 16px" }}>
            <span style={{ color: "#6B7280" }}>Current Tier: </span>
            {currentTier} ({getTierLabel(currentTier).replace(`Tier ${currentTier} (`, "").replace(")", "")})
          </p>

          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 10px" }}>New Tier:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {TAS_TIERS.map((t) => (
              <label key={t.value} style={{ display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, color: "#374151", cursor: "pointer" }}>
                <input type="radio" name="tier" value={t.value} checked={selectedTier === t.value}
                  onChange={() => setSelectedTier(t.value)}
                  style={{ accentColor: "#2563eb", width: 15, height: 15 }} />
                {t.label} {t.value === currentTier ? "– Current" : ""}
              </label>
            ))}
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>
            Reason for adjustment:
          </p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="enter reason…."
            rows={3}
            style={{ width: "100%", borderRadius: 8, border: "1px solid #E5E7EB",
              padding: "10px 12px", fontSize: 13, color: "#111827", resize: "none",
              outline: "none", boxSizing: "border-box", backgroundColor: "#F9FAFB" }} />
        </div>

        <div style={{ display: "flex", gap: 10, padding: "14px 24px", borderTop: "1px solid #E5E7EB" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #E5E7EB",
              backgroundColor: "#fff", fontSize: 13, cursor: "pointer", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isMutating}
            style={{ flex: 2, padding: 10, borderRadius: 10, border: "none",
              backgroundColor: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: isMutating ? "not-allowed" : "pointer", opacity: isMutating ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {isMutating
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
              : "Confirm Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agent Detail (Image 4) ────────────────────────────────────────────────────

function AgentDetail({ agentId, fallback, onBack }: {
  agentId: string; fallback: ApiTas; onBack: () => void;
}) {
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
  const tierBonus = getTierBonus(tierNum);
  const tasId     = (agent.applicationCode as string) ?? agent.id;
  const joinDate  = new Date(agent.createdAt).toLocaleDateString("en-GB");

  /* TODO-BACKEND: experts is a Prisma spec object, not resolved data.
     Needs: experts: { total: number; active: number } */
  const expertsObj = agent.experts as { total?: number; active?: number } | null;

  /* TODO-BACKEND: earnings fields missing entirely from response.
     Needs: totalEarnings, thisMonth, availableBalance, pendingBalance */
  const totalEarnings    = fmtMoney((agent as Record<string, unknown>).totalEarnings    as number | undefined);
  const thisMonth        = fmtMoney((agent as Record<string, unknown>).thisMonth        as number | undefined);
  const availableBalance = fmtMoney((agent as Record<string, unknown>).availableBalance as number | undefined);
  const pendingBalance   = fmtMoney((agent as Record<string, unknown>).pendingBalance   as number | undefined);

  /* commissionsGiven — maps to Recruited Experts table rows.
     TODO-BACKEND: each entry needs expertName. Currently only has refereeClientId.
     Also needs: modelType (Earnings History), sub-TAS status, commissionAmount (Payouts) */
  const commissions = (agent.commissionsGiven ?? []) as {
    id?: string;
    expertName?: string;       // TODO-BACKEND: missing
    modelType?: string;
    subTasStatus?: string;     // TODO-BACKEND: missing
    commissionAmount?: number;
  }[];

  const handleSuspend = () => {
    const isSuspended = agent.status?.toLowerCase() === "suspended";
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      backgroundColor: "#F4F5F7" }}>

      {/* Back */}
      <div style={{ padding: "20px 32px 0" }}>
        <button onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 8, border: "none",
            background: "none", cursor: "pointer", fontSize: 14, color: "#111827", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Active TAS Agents
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          padding: 64, gap: 8, color: "#9CA3AF", fontSize: 14 }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading agent…
        </div>
      ) : (
        <div style={{ padding: "20px 32px 100px", display: "flex", flexDirection: "column", gap: 0,
          flex: 1, overflowY: "auto" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px",
            border: "1px solid #E5E7EB", overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

          {/* ── Job Information ── */}
          <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
            <p style={sectionLabel}>Job Information</p>
            <InfoRow label="Name:"   value={agent.name} />
            <InfoRow label="TAS ID:" value={tasId} />
            <InfoRow label="Phone:"  value={agent.phone} />
            <InfoRow label="Email:"  value={agent.email} />
            <InfoRow label="Tier:"   value={`${tierNum} (${getTierLabel(tierNum).replace(`Tier ${tierNum} (`, "").replace(")", "")})`} />
            <InfoRow label="Bonus:"  value={tierBonus} />
            <InfoRow label="Joined:" value={joinDate} />
            <div style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "center" }}>
              <span style={{ minWidth: 165, color: "#6B7280" }}>Status:</span>
              {statusBadge(agent.status ?? "active")}
            </div>
          </div>

          {/* ── Performance Metrics ── */}
          <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
            <p style={sectionLabel}>Performance Metrics</p>
            <InfoRow label="Total Experts Recruited:"      value={expertsObj?.total != null ? String(expertsObj.total) : "—"} />
            <InfoRow label="Active Experts (3-month avg):" value={expertsObj?.active != null ? String(expertsObj.active) : "—"} />
            <InfoRow label="Total Earnings:"               value={totalEarnings} />
            <InfoRow label="This Month:"                   value={thisMonth} />
            <InfoRow label="Available Balance:"            value={availableBalance} />
            <InfoRow label="Pending Balance:"              value={pendingBalance} />
          </div>

          {/* ── Recruited Experts Table ── */}
          <div style={{ ...card, marginTop: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                  {["Recruited Experts", "Earnings History", "Sub-TAS", "Payouts", "Notes"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: 12,
                      fontWeight: 600, color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "32px 20px", textAlign: "center",
                    fontSize: 13, color: "#9CA3AF" }}>No recruited experts yet.</td></tr>
                ) : commissions.map((c, i) => (
                  <tr key={c.id ?? i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    {/* expertName — TODO-BACKEND: not in response */}
                    <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151" }}>
                      {c.expertName ?? "—"}
                    </td>
                    {/* modelType — available as "flat" etc */}
                    <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280" }}>
                      {c.modelType ? `Model ${c.modelType}` : "—"}
                    </td>
                    {/* subTasStatus — TODO-BACKEND: not in response */}
                    <td style={{ padding: "13px 20px" }}>
                      {statusBadge(c.subTasStatus ?? "active")}
                    </td>
                    {/* commissionAmount — available */}
                    <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151" }}>
                      {fmtMoney(c.commissionAmount)}
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280" }}>
                      earned for TAS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {commissions.length > 0 && expertsObj?.total && (
              <div style={{ padding: "10px 20px" }}>
                <button style={{ fontSize: 13, color: "#2563eb", fontWeight: 500,
                  background: "none", border: "none", cursor: "pointer" }}>
                  View All {expertsObj.total} Experts
                </button>
              </div>
            )}
          </div>
          </div>{/* end white card */}
        </div>
      )}

      {/* ── Action Bar — 4 buttons (matches Image 4) ── */}
      <div style={{ position: "sticky", bottom: 0, backgroundColor: "#F4F5F7",
        borderTop: "1px solid #E5E7EB", padding: "16px 32px",
        display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => setShowAdjust(true)}
          style={{ ...actionBtn, backgroundColor: "#2563eb", color: "#fff",
            border: "none", fontWeight: 600, flex: "1 1 auto" }}>
          Adjust Tier
        </button>
        <button onClick={handleSuspend} disabled={isMutating}
          style={{ ...actionBtn, flex: "1 1 auto", opacity: isMutating ? 0.6 : 1 }}>
          {agent.status?.toLowerCase() === "suspended" ? "Reinstate TAS" : "Suspend TAS"}
        </button>
        <button style={{ ...actionBtn, flex: "1 1 auto" }}>Force Payout</button>
        <button style={{ ...actionBtn, flex: "1 1 auto" }}>Add Note</button>
      </div>

      {showAdjust && <AdjustTierModal agent={agent} onClose={() => setShowAdjust(false)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────────

function ApplicationsTab() {
  const [appTab,    setAppTab]    = useState<AppTab>("pending");
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");
  const [selected,  setSelected]  = useState<TasApplication | null>(null);
  const [localData, setLocalData] = useState<TasApplication[]>(MOCK_APPLICATIONS);

  const counts = {
    pending:  localData.filter((a) => a.status === "pending").length,
    approved: localData.filter((a) => a.status === "approved").length,
    rejected: localData.filter((a) => a.status === "rejected").length,
  };

  const filtered = localData.filter((a) => {
    const matchTab    = a.status === appTab;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || a.type.toLowerCase().includes(filter.toLowerCase());
    return matchTab && matchSearch && matchFilter;
  });

  const handleApprove = (id: string) => {
    setLocalData((prev) => prev.map((a) => a.id === id ? { ...a, status: "approved" as AppStatus } : a));
    setSelected(null);
  };
  const handleReject = (id: string) => {
    setLocalData((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected" as AppStatus } : a));
    setSelected(null);
  };

  const appTabs: { key: AppTab; label: string }[] = [
    { key: "pending",  label: "Pending"  },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <>
      <div style={card}>
        {/* Sub-tabs with counts */}
        <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", padding: "0 20px" }}>
          {appTabs.map((t) => (
            <button key={t.key} onClick={() => setAppTab(t.key)}
              style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, border: "none",
                background: "none", cursor: "pointer",
                color: appTab === t.key ? "#111827" : "#6B7280",
                borderBottom: appTab === t.key ? "2px solid #111827" : "2px solid transparent",
                display: "flex", alignItems: "center", gap: 6 }}>
              {t.label}
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                backgroundColor: appTab === t.key ? "#111827" : "#E5E7EB",
                color: appTab === t.key ? "#fff" : "#6B7280" }}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB",
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151",
            fontSize: 13, fontWeight: 500 }}>
            <SlidersHorizontal size={14} /> Filter
          </div>
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input type="text" placeholder="Search name..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9,
                paddingBottom: 9, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13,
                outline: "none", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #E5E7EB",
              fontSize: 13, color: "#374151", backgroundColor: "#fff", outline: "none", cursor: "pointer" }}>
            <option value="all">All Applications</option>
            <option value="expert">Expert TAS</option>
            <option value="dedicated">Dedicated TAS</option>
          </select>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
            borderRadius: 10, border: "1px solid #E5E7EB", backgroundColor: "#fff",
            fontSize: 13, color: "#374151", cursor: "pointer", fontWeight: 500 }}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* Table — columns: Name, Type, Submitted, Network, Actions */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                {["Name", "Type", "Submitted", "Network", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: 12,
                    fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 48,
                  fontSize: 13, color: "#9CA3AF" }}>No {appTab} applications.</td></tr>
              ) : filtered.map((app) => (
                <tr key={app.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "15px 24px", fontSize: 14, fontWeight: 600,
                    color: "#111827" }}>{app.name}</td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>{app.type}</td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>
                    {new Date(app.submitted).toLocaleDateString("en-GB")}
                  </td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>{app.network}</td>
                  <td style={{ padding: "15px 24px" }}>
                    {appTab === "pending" ? (
                      <button onClick={() => setSelected(app)}
                        style={{ fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 8,
                          border: "1px solid #E5E7EB", background: "#fff", color: "#374151", cursor: "pointer" }}>
                        Review
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {statusBadge(app.status)}
                        <button onClick={() => setSelected(app)}
                          style={{ padding: 6, borderRadius: 8, border: "none", background: "none",
                            cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                          <Eye size={16} strokeWidth={1.8} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
            Showing 1–{filtered.length} of {filtered.length} results
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12,
              border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280",
              cursor: "pointer", opacity: 0.4 }}>Previous</button>
            <button style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "none", backgroundColor: "#16a34a", color: "#fff", cursor: "pointer" }}>1</button>
            <button style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12,
              border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280",
              cursor: "pointer", opacity: 0.4 }}>Next</button>
          </div>
        </div>
      </div>

      {selected && (
        <AppModal app={selected} onClose={() => setSelected(null)}
          onApprove={handleApprove} onReject={handleReject} />
      )}
    </>
  );
}

// ── Active TAS Agents Tab (Image 1) ───────────────────────────────────────────

function ActiveAgentsTab() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError } = useAppSelector((s) => s.tas);
  const [search,     setSearch]     = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchTas());
  }, [dispatch, listStatus]);

  const selectedAgent = list.find((a) => a.id === selectedId) ?? null;

  if (selectedId && selectedAgent) {
    return (
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F4F5F7",
        padding: "24px 32px" }}>
        <AgentDetail agentId={selectedId} fallback={selectedAgent} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  const filtered = list.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchTier   = tierFilter === "all" || String(a.tier) === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div style={card}>
      {/* Filter */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB",
        display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151",
          fontSize: 13, fontWeight: 500 }}>
          <SlidersHorizontal size={14} /> Filter
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input type="text" placeholder="Search name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9,
              paddingBottom: 9, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13,
              outline: "none", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #E5E7EB",
            fontSize: 13, color: "#374151", backgroundColor: "#fff", outline: "none", cursor: "pointer" }}>
          <option value="all">All Tiers</option>
          {TAS_TIERS.map((t) => <option key={t.value} value={String(t.value)}>Tier {t.value}</option>)}
        </select>
      </div>

      {listStatus === "loading" && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          padding: 56, gap: 8, color: "#9CA3AF", fontSize: 14 }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading TAS agents…
        </div>
      )}
      {listStatus === "failed" && (
        <p style={{ textAlign: "center", padding: 40, fontSize: 13, color: "#ef4444" }}>{listError}</p>
      )}

      {listStatus !== "loading" && (
        <>
          {/* Table — columns: Name, TAS ID, Tier, Experts, Earnings, Actions (Image 1) */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                  {["Name", "TAS ID", "Tier", "Experts", "Earnings", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: 12,
                      fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 48,
                    fontSize: 13, color: "#9CA3AF" }}>No agents found.</td></tr>
                ) : filtered.map((agent) => {
                  /* TODO-BACKEND: experts is a Prisma spec, not a resolved count.
                     Needs: experts: { total: number; active: number } */
                  const expertsCount = (agent.experts as { total?: number } | null)?.total ?? "—";

                  /* TODO-BACKEND: totalEarnings not in response.
                     Needs: totalEarnings: number */
                  const earnings = fmtMoney((agent as Record<string, unknown>).totalEarnings as number | undefined);

                  return (
                    <tr key={agent.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "15px 24px", fontSize: 14, fontWeight: 600,
                        color: "#111827" }}>{agent.name}</td>
                      <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>
                        {(agent.applicationCode as string) ?? agent.id}
                      </td>
                      <td style={{ padding: "15px 24px", fontSize: 13, color: "#374151" }}>
                        {agent.tier ?? "—"}
                      </td>
                      <td style={{ padding: "15px 24px", fontSize: 13, color: "#374151" }}>
                        {expertsCount}
                      </td>
                      <td style={{ padding: "15px 24px", fontSize: 13, fontWeight: 500,
                        color: "#111827" }}>
                        {earnings}
                      </td>
                      <td style={{ padding: "15px 24px" }}>
                        <button onClick={() => setSelectedId(agent.id)}
                          style={{ padding: 6, borderRadius: 8, border: "none", background: "none",
                            cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                          <Eye size={17} strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
              Showing 1–{filtered.length} of {list.length} results
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12,
                border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280",
                cursor: "pointer", opacity: 0.4 }}>Previous</button>
              <button style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: "none", backgroundColor: "#16a34a", color: "#fff", cursor: "pointer" }}>1</button>
              <button style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12,
                border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280",
                cursor: "pointer", opacity: 0.4 }}>Next</button>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TASPage() {
  const [mainTab, setMainTab] = useState<MainTab>("applications");

  // Count for tab badges
  const { list } = useAppSelector((s) => s.tas);
  const appCount    = MOCK_APPLICATIONS.length; // TODO-BACKEND: replace with real API count
  const activeCount = list.filter((t) =>
    (t.status ?? "").toLowerCase() === "active"
  ).length;

  const tabs = [
    { key: "applications" as MainTab, label: "Applications",     count: appCount    },
    { key: "active"       as MainTab, label: "Active TAS Agents", count: activeCount },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh",
      backgroundColor: "#F4F5F7" }}>
      <Topbar title="TAS Management" />
      <main style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Main tabs with counts */}
        <div style={{ display: "flex", gap: 8 }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setMainTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "9px 22px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                border:           mainTab === t.key ? "none"           : "1px solid #D1D5DB",
                backgroundColor:  mainTab === t.key ? "#2563eb"        : "#fff",
                color:            mainTab === t.key ? "#fff"            : "#6B7280" }}>
              {t.label}
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                backgroundColor: mainTab === t.key ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                color:           mainTab === t.key ? "#fff" : "#6B7280" }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {mainTab === "applications" && <ApplicationsTab />}
        {mainTab === "active"       && <ActiveAgentsTab />}
      </main>
    </div>
  );
}