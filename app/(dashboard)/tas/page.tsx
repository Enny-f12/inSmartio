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
import { verifyTas } from "@/lib/api/tasApi";
import { toast } from "sonner";

type AppTab  = "pending" | "approved" | "rejected";
type MainTab = "applications" | "active";
type LocalOverride = Record<string, "approved" | "rejected">;

// ── Helpers ───────────────────────────────────────────────────────────────────

// Route by status:
// status === "active"   → Active TAS Agents tab
// status === "inactive" → Applications tab (pending)
//
// NOTE FOR BACKEND: The API must return status as a plain string:
//   "active" | "inactive" | "suspended"
// Currently the field may arrive as boolean or object — this guard handles both.
const isVerified = (t: ApiTas) => {
  const s = t.status;
  if (!s) return false;
  if (typeof s === "boolean") return s === true;
  if (typeof s === "object")  return false; // unexpected shape — treat as not verified
  return String(s).toLowerCase() === "active";
};
const isApplication = (t: ApiTas) => !isVerified(t);

// ── Tier config ───────────────────────────────────────────────────────────────

const TAS_TIERS = [
  { value: 1, label: "Tier 1 (Associate, 0% bonus)",           bonus: "0%"   },
  { value: 2, label: "Tier 2 (Senior, +5% bonus)",             bonus: "+5%"  },
  { value: 3, label: "Tier 3 (Master, +10% bonus)",            bonus: "+10%" },
  { value: 4, label: "Tier 4 (Regional Lead, +12% bonus)",     bonus: "+12%" },
  { value: 5, label: "Tier 5 (National Director, +15% bonus)", bonus: "+15%" },
  { value: 6, label: "Tier 6 (Elite Ambassador, +20% bonus)",  bonus: "+20%" },
];

const getTierBonus = (tier: number) => TAS_TIERS.find((t) => t.value === tier)?.bonus ?? "—";
const getTierLabel = (tier: number) => TAS_TIERS.find((t) => t.value === tier)?.label ?? `Tier ${tier}`;

const fmtMoney = (n?: number | null) =>
  n != null ? `₦${Number(n).toLocaleString()}` : "—";

const statusBadge = (s: unknown) => {
  const str = s != null && typeof s !== "object" ? String(s) : "";
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#FEF3C7", color: "#B45309" },
    approved:  { bg: "#D1FAE5", color: "#065F46" },
    rejected:  { bg: "#FEE2E2", color: "#991B1B" },
    active:    { bg: "#D1FAE5", color: "#065F46" },
    inactive:  { bg: "#FEF3C7", color: "#B45309" },
    suspended: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const key = str.toLowerCase();
  const c = map[key] ?? { bg: "#F3F4F6", color: "#374151" };
  const label = str ? str.charAt(0).toUpperCase() + str.slice(1) : "—";
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
      backgroundColor: c.bg, color: c.color, whiteSpace: "nowrap" }}>
      {label}
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
  backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.08em", color: "#6B7280", margin: "0 0 14px",
};

// ── Application Review Modal ──────────────────────────────────────────────────

function AppModal({ agent, appStatus, onClose, onApprove, onReject }: {
  agent:     ApiTas;
  appStatus: AppTab;
  onClose:   () => void;
  onApprove: (id: string, documentKey: string) => Promise<void>;
  onReject:  (id: string, reason: string, documentKey: string) => Promise<void>;
}) {
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [docChecks,    setDocChecks]    = useState<Record<string, boolean>>({});

  const toggleDoc = (key: string) =>
    setDocChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const rawAgent = ((agent as Record<string, unknown>).user as ApiTas | undefined) ?? agent;

  // document can be array (new API) or object (old API)
  const docArray = (rawAgent.document ?? agent.document) as {
    type: string; secureUrl?: string; url?: string; verify?: boolean; reject?: boolean;
  }[] | Record<string, string> | null;

  const docList = Array.isArray(docArray)
    ? docArray
        .filter((d) => d.type !== "avatar" && d.type !== "profile photo")
        .map((d) => ({
          label: d.type.charAt(0).toUpperCase() + d.type.slice(1),
          url:   d.secureUrl ?? d.url,
        }))
    : [
        { key: "ninSlip",  label: "NIN Slip"              },
        { key: "validId",  label: "Valid ID (National ID)" },
        { key: "passport", label: "Passport Photograph"    },
      ].map(({ key, label }) => {
        const rec = docArray as Record<string, string> | null;
        return { label, url: rec?.[key] && rec[key].length > 10 ? rec[key] : undefined };
      });

  const mailHref = `mailto:${rawAgent.email}?subject=${encodeURIComponent("TAS Application – More Information Needed")}&body=${encodeURIComponent(`Dear ${rawAgent.name},\n\nWe need more information regarding your TAS application.\n\nThank you.`)}`;

  // Extract publicId value, stored as documentKey
  const documentKey = Array.isArray(docArray)
    ? ((docArray as unknown as { publicId?: string }[])[0]?.publicId ?? "")
    : "";

  const handleApprove = async () => {
    setLoading(true);
    try { await onApprove(agent.id, documentKey); } finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.warning("Please provide a reason"); return; }
    setLoading(true);
    try { await onReject(agent.id, rejectReason.trim(), documentKey); } finally { setLoading(false); }
  };

  const re = rawAgent.recruitExpectations as Record<string, unknown> | string | null;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>TAS Application</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer",
            color: "#9CA3AF", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Applicant Info */}
          <div>
            <p style={sectionLabel}>Applicant Information</p>
            <InfoRow label="Name:"      value={rawAgent.name} />
            <InfoRow label="Phone:"     value={rawAgent.phone} />
            <InfoRow label="Email:"     value={rawAgent.email} />
            <InfoRow label="TAS ID:"    value={(rawAgent.applicationCode as string) ?? rawAgent.id} />
            <InfoRow label="Submitted:" value={new Date(rawAgent.createdAt).toLocaleDateString("en-GB")} />
            <InfoRow label="Status:"    value={statusBadge(rawAgent.status ?? "inactive")} />
            <InfoRow label="Verify:"    value={statusBadge(String(rawAgent.verify ?? "pending"))} />
            {/* Categories */}
            {Array.isArray(rawAgent.category) && rawAgent.category.length > 0 && (
              <InfoRow label="Categories:" value={(rawAgent.category as string[]).join(", ")} />
            )}
            {/* Recruit expectations */}
            {re && typeof re === "object" && (
              <>
                {re.area              && <InfoRow label="Area:"               value={String(re.area)} />}
                {re.years             && <InfoRow label="Years Exp.:"         value={String(re.years)} />}
                {re.networkSize       && <InfoRow label="Network Size:"       value={String(re.networkSize)} />}
                {re.recruitCountMonthly && <InfoRow label="Monthly Recruits:" value={String(re.recruitCountMonthly)} />}
                {re.recruitmentExperienceDescription && (
                  <InfoRow label="Experience:" value={String(re.recruitmentExperienceDescription)} />
                )}
              </>
            )}
          </div>

          {/* Documents */}
          <div>
            <p style={sectionLabel}>Documents</p>
            {docList.length === 0 && (
              <p style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>No documents uploaded.</p>
            )}
            {docList.map((doc) => {
              const isChecked = !!docChecks[doc.label];
              return (
                <div key={doc.label} style={{ display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ flex: 1, fontSize: 13, color: "#111827" }}>{doc.label}</span>
                  {doc.url ? (
                    <>
                      <a href={doc.url} target="_blank" rel="noreferrer" title="View"
                        style={{ color: "#9CA3AF", display: "flex", alignItems: "center" }}>
                        <Eye size={15} strokeWidth={1.8} />
                      </a>
                      <a href={doc.url} download={`${doc.label}.pdf`} title="Download"
                        style={{ color: "#9CA3AF", display: "flex", alignItems: "center" }}>
                        <Download size={15} strokeWidth={1.8} />
                      </a>
                      <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                        fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                        color: isChecked ? "#16a34a" : "#d97706" }}>
                        <input type="checkbox" checked={isChecked} onChange={() => toggleDoc(doc.label)}
                          style={{ accentColor: "#16a34a", width: 14, height: 14 }} />
                        {isChecked ? "Verified" : "Pending"}
                      </label>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>N/A</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {appStatus === "pending" ? (
          rejectOpen ? (
            <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB",
              display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                Reason for rejecting <strong style={{ color: "#111827" }}>{rawAgent.name}</strong>:
              </p>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete documents, insufficient experience..."
                rows={3}
                style={{ width: "100%", borderRadius: 8, border: "1px solid #E5E7EB",
                  padding: "10px 12px", fontSize: 13, resize: "none", outline: "none",
                  boxSizing: "border-box", backgroundColor: "#F9FAFB" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setRejectOpen(false); setRejectReason(""); }}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #E5E7EB",
                    backgroundColor: "#fff", fontSize: 13, cursor: "pointer", color: "#6B7280" }}>
                  Cancel
                </button>
                <button onClick={handleReject} disabled={loading}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "none",
                    backgroundColor: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</> : "Confirm Reject"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB",
              display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={handleApprove} disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px",
                  borderRadius: 10, border: "none", backgroundColor: "#16a34a", color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Approve as TAS
              </button>
              <button onClick={() => setRejectOpen(true)} disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
                  borderRadius: 10, border: "1.5px solid #fecaca", backgroundColor: "#fff",
                  color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <X size={14} /> Reject
              </button>
              <a href={mailHref} style={{ marginLeft: "auto", fontSize: 13, color: "#6B7280",
                fontWeight: 500, textDecoration: "none" }}>Request More Info</a>
            </div>
          )
        ) : (
          <div style={{ padding: "14px 24px", borderTop: "1px solid #E5E7EB",
            display: "flex", alignItems: "center", gap: 8 }}>
            {statusBadge(appStatus)}
            <span style={{ fontSize: 13, color: "#6B7280" }}>This application has been {appStatus}.</span>
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
  const [reason,       setReason]       = useState("");
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
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>
            <span style={{ color: "#6B7280" }}>TAS: </span>
            {agent.name} ({(agent.applicationCode as string) ?? agent.id})
          </p>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 16px" }}>
            <span style={{ color: "#6B7280" }}>Current Tier: </span>
            {currentTier}
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
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Reason:</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason…" rows={3}
            style={{ width: "100%", borderRadius: 8, border: "1px solid #E5E7EB",
              padding: "10px 12px", fontSize: 13, color: "#111827", resize: "none",
              outline: "none", boxSizing: "border-box", backgroundColor: "#F9FAFB" }} />
        </div>
        <div style={{ display: "flex", gap: 10, padding: "14px 24px", borderTop: "1px solid #E5E7EB" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #E5E7EB",
              backgroundColor: "#fff", fontSize: 13, cursor: "pointer", color: "#6B7280" }}>Cancel</button>
          <button onClick={handleConfirm} disabled={isMutating}
            style={{ flex: 2, padding: 10, borderRadius: 10, border: "none",
              backgroundColor: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: isMutating ? "not-allowed" : "pointer", opacity: isMutating ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {isMutating ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Confirm Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agent Detail ──────────────────────────────────────────────────────────────

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
  const expertsObj    = agent.experts as { total?: number; active?: number } | null;
  const totalEarnings    = fmtMoney((agent as Record<string, unknown>).totalEarnings    as number | undefined);
  const thisMonth        = fmtMoney((agent as Record<string, unknown>).thisMonth        as number | undefined);
  const availableBalance = fmtMoney((agent as Record<string, unknown>).availableBalance as number | undefined);
  const pendingBalance   = fmtMoney((agent as Record<string, unknown>).pendingBalance   as number | undefined);
  const commissions = (agent.commissionsGiven ?? []) as {
    id?: string; expertName?: string; modelType?: string;
    subTasStatus?: string; commissionAmount?: number;
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: "#F4F5F7" }}>
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
          <Loader2 size={18} className="animate-spin" /> Loading agent…
        </div>
      ) : (
        <div style={{ padding: "20px 32px 100px", flex: 1, overflowY: "auto" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
              <p style={sectionLabel}>Agent Information</p>
              <InfoRow label="Name:"   value={agent.name} />
              <InfoRow label="TAS ID:" value={(agent.applicationCode as string) ?? agent.id} />
              <InfoRow label="Phone:"  value={agent.phone} />
              <InfoRow label="Email:"  value={agent.email} />
              <InfoRow label="Tier:"   value={`${tierNum} (${getTierLabel(tierNum).replace(`Tier ${tierNum} (`, "").replace(")", "")})`} />
              <InfoRow label="Bonus:"  value={getTierBonus(tierNum)} />
              <InfoRow label="Joined:" value={new Date(agent.createdAt).toLocaleDateString("en-GB")} />
              <div style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "center" }}>
                <span style={{ minWidth: 165, color: "#6B7280" }}>Status:</span>
                {statusBadge(agent.status ?? "active")}
              </div>
            </div>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #E5E7EB" }}>
              <p style={sectionLabel}>Performance Metrics</p>
              <InfoRow label="Total Experts Recruited:"      value={expertsObj?.total != null ? String(expertsObj.total) : "—"} />
              <InfoRow label="Active Experts:"               value={expertsObj?.active != null ? String(expertsObj.active) : "—"} />
              <InfoRow label="Total Earnings:"               value={totalEarnings} />
              <InfoRow label="This Month:"                   value={thisMonth} />
              <InfoRow label="Available Balance:"            value={availableBalance} />
              <InfoRow label="Pending Balance:"              value={pendingBalance} />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                    {["Recruited Experts", "Earnings History", "Sub-TAS", "Payouts", "Notes"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>No recruited experts yet.</td></tr>
                  ) : commissions.map((c, i) => (
                    <tr key={c.id ?? i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151" }}>{c.expertName ?? "—"}</td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280" }}>{c.modelType ? `Model ${c.modelType}` : "—"}</td>
                      <td style={{ padding: "13px 20px" }}>{statusBadge(c.subTasStatus ?? "active")}</td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#374151" }}>{fmtMoney(c.commissionAmount)}</td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280" }}>earned for TAS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <div style={{ position: "sticky", bottom: 0, backgroundColor: "#F4F5F7",
        borderTop: "1px solid #E5E7EB", padding: "16px 32px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => setShowAdjust(true)}
          style={{ ...actionBtn, backgroundColor: "#2563eb", color: "#fff", border: "none", fontWeight: 600, flex: "1 1 auto" }}>
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
    </div>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────────

function ApplicationsTab({ agents }: { agents: ApiTas[] }) {
  // Same pattern as VerificationModal — s.auth.admin.id
  const { admin } = useAppSelector((s) => s.auth);
  const adminId = (admin as Record<string, string> | null)?.id ?? "";
  const [appTab,         setAppTab]         = useState<AppTab>("pending");
  const [search,         setSearch]         = useState("");
  const [selected,       setSelected]       = useState<ApiTas | null>(null);
  const [localOverrides, setLocalOverrides] = useState<LocalOverride>({});

  // Derive tab — local override wins, then use status/verify
  // inactive → pending tab | approved/active → approved tab | rejected → rejected tab
  const getAppStatus = (a: ApiTas): AppTab => {
    if (localOverrides[a.id]) return localOverrides[a.id];
    const status = a.status != null && typeof a.status !== "object" ? String(a.status).toLowerCase() : "";
    const verify = a.verify != null && typeof a.verify !== "object" ? String(a.verify).toLowerCase() : "pending";
    if (status === "active" || verify === "approved") return "approved";
    if (verify === "rejected")                        return "rejected";
    return "pending";
  };

  const counts = {
    pending:  agents.filter((a) => getAppStatus(a) === "pending").length,
    approved: agents.filter((a) => getAppStatus(a) === "approved").length,
    rejected: agents.filter((a) => getAppStatus(a) === "rejected").length,
  };

  const filtered = agents.filter((a) => {
    const matchTab    = getAppStatus(a) === appTab;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleApprove = async (id: string, documentKey: string) => {
    try {
      await verifyTas(id, { verify: true, reject: false, adminId, documentKey });
      setLocalOverrides((prev) => ({ ...prev, [id]: "approved" }));
      setSelected(null);
      toast.success("TAS application approved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approval failed";
      toast.error("Failed to approve application", { description: msg });
    }
  };

  const handleReject = async (id: string, reason: string, documentKey: string) => {
    try {
      await verifyTas(id, { verify: false, reject: true, reason, adminId, documentKey });
      setLocalOverrides((prev) => ({ ...prev, [id]: "rejected" }));
      setSelected(null);
      toast.success("TAS application rejected");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rejection failed";
      toast.error("Failed to reject application", { description: msg });
    }
  };

  const appTabs: { key: AppTab; label: string }[] = [
    { key: "pending",  label: "Pending (Inactive)"  },
    { key: "approved", label: "Approved (Active)"   },
    { key: "rejected", label: "Rejected"             },
  ];

  return (
    <>
      <div style={card}>
        {/* Sub-tabs */}
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

        {/* Search */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input type="text" placeholder="Search name..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, outline: "none",
                backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                {["Name", "TAS ID", "Email", "Submitted", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: 12,
                    fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, fontSize: 13, color: "#9CA3AF" }}>
                  No {appTab} applications.
                </td></tr>
              ) : filtered.map((agent) => (
                <tr key={agent.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "15px 24px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{agent.name}</td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>
                    {(agent.applicationCode as string) ?? agent.id}
                  </td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>{agent.email}</td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>
                    {new Date(agent.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td style={{ padding: "15px 24px" }}>{statusBadge(agent.status ?? "inactive")}</td>
                  <td style={{ padding: "15px 24px" }}>
                    {appTab === "pending" ? (
                      <button onClick={() => setSelected(agent)}
                        style={{ fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 8,
                          border: "1px solid #E5E7EB", background: "#fff", color: "#374151", cursor: "pointer" }}>
                        Review
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {statusBadge(getAppStatus(agent))}
                        <button onClick={() => setSelected(agent)}
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
            Showing {filtered.length} of {agents.length} results
          </p>
        </div>
      </div>

      {selected && (
        <AppModal
          agent={selected}
          appStatus={getAppStatus(selected)}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </>
  );
}

// ── Active TAS Agents Tab ─────────────────────────────────────────────────────

function ActiveAgentsTab({ agents }: { agents: ApiTas[] }) {
  const [search,     setSearch]     = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedAgent = agents.find((a) => a.id === selectedId) ?? null;

  if (selectedId && selectedAgent) {
    return <AgentDetail agentId={selectedId} fallback={selectedAgent} onBack={() => setSelectedId(null)} />;
  }

  const filtered = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchTier   = tierFilter === "all" || String(a.tier) === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div style={card}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB",
        display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <SlidersHorizontal size={14} style={{ color: "#374151" }} />
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input type="text" placeholder="Search name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, outline: "none",
              backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #E5E7EB",
            fontSize: 13, color: "#374151", backgroundColor: "#fff", outline: "none", cursor: "pointer" }}>
          <option value="all">All Tiers</option>
          {TAS_TIERS.map((t) => <option key={t.value} value={String(t.value)}>Tier {t.value}</option>)}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
              {["Name", "TAS ID", "Tier", "Experts", "Earnings", "Status", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: 12,
                  fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, fontSize: 13, color: "#9CA3AF" }}>No active agents found.</td></tr>
            ) : filtered.map((agent) => {
              const expertsCount = (agent.experts as { total?: number } | null)?.total ?? "—";
              const earnings     = fmtMoney((agent as Record<string, unknown>).totalEarnings as number | undefined);
              return (
                <tr key={agent.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "15px 24px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{agent.name}</td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#6B7280" }}>{(agent.applicationCode as string) ?? agent.id}</td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#374151" }}>{agent.tier ?? "—"}</td>
                  <td style={{ padding: "15px 24px", fontSize: 13, color: "#374151" }}>{expertsCount}</td>
                  <td style={{ padding: "15px 24px", fontSize: 13, fontWeight: 500, color: "#111827" }}>{earnings}</td>
                  <td style={{ padding: "15px 24px" }}>{statusBadge(agent.status ?? "active")}</td>
                  <td style={{ padding: "15px 24px" }}>
                    <button onClick={() => setSelectedId(agent.id)}
                      style={{ padding: 6, borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                      <Eye size={17} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
          Showing {filtered.length} of {agents.length} results
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TASPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError } = useAppSelector((s) => s.tas);
  const [mainTab, setMainTab] = useState<MainTab>("applications");

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchTas());
  }, [dispatch, listStatus]);

  // ✅ Fixed: verify is a string ("pending" | "approved" | "rejected"), not boolean
  const applications = list.filter((t) => isApplication(t));
  const activeAgents  = list.filter((t) => isVerified(t));

  const tabs = [
    { key: "applications" as MainTab, label: "Applications",      count: applications.length },
    { key: "active"       as MainTab, label: "Active TAS Agents", count: activeAgents.length  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", backgroundColor: "#F4F5F7" }}>
      <Topbar title="TAS Management" />
      <main style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

        {listStatus === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 64, gap: 8, color: "#9CA3AF", fontSize: 14 }}>
            <Loader2 size={18} className="animate-spin" /> Loading TAS data…
          </div>
        )}
        {listStatus === "failed" && list.length === 0 && (
          <p style={{ textAlign: "center", padding: 40, fontSize: 13, color: "#ef4444" }}>{listError}</p>
        )}

        {(listStatus === "succeeded" || listStatus === "failed") && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setMainTab(t.key)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 22px",
                    borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border:          mainTab === t.key ? "none"    : "1px solid #D1D5DB",
                    backgroundColor: mainTab === t.key ? "#2563eb" : "#fff",
                    color:           mainTab === t.key ? "#fff"    : "#6B7280" }}>
                  {t.label}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                    backgroundColor: mainTab === t.key ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                    color:           mainTab === t.key ? "#fff" : "#6B7280" }}>
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