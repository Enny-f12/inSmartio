// components/tas/Agentdetail.tsx
"use client";

import { useState } from "react";
import {
  ArrowLeft, User, Hash, Phone, Mail, Layers, Percent,
  CalendarDays, ShieldCheck, MapPin, FileText, Building2,
  Users, Wallet, GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { AgentBadge } from "./Tasbadges";
import AdjustTierModal from "./Adjusttiermodal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { suspendTasThunk, activateTasThunk } from "@/lib/redux/tasSlice";
import type { ActiveAgent } from "./types";

interface AgentDetailProps {
  agent:  ActiveAgent;
  onBack: () => void;
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B7280", margin: "0 0 12px" }}>
      {text}
    </p>
  );
}

function InfoRow({ icon: Icon, label, value, children }: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
}) {
  if (!value && !children) return null; // skip empty rows
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
      <Icon size={14} style={{ color: "#9CA3AF", marginTop: "2px", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="inforow-label">{label}</p>
        {children ?? <p className="inforow-value">{value}</p>}
      </div>
    </div>
  );
}

const fmt = (iso?: string | null) => {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-GB"); }
  catch { return iso; }
};

export default function AgentDetail({ agent, onBack }: AgentDetailProps) {
  // Extended cast — add gender, referral, parentTasId to ActiveAgent in types.ts to remove this
  const ext = agent as ActiveAgent & { gender?: string; referral?: string; parentTasId?: string };
  const dispatch = useAppDispatch();
  const { mutateStatus } = useAppSelector((s) => s.tas);

  const [adjustTierAgent, setAdjustTierAgent] = useState<ActiveAgent | null>(null);

  const isSuspended = agent.status === "Suspended";
  const isMutating  = mutateStatus === "loading";

  const handleSuspendToggle = () => {
    if (isSuspended) {
      dispatch(activateTasThunk(agent.id))
        .unwrap()
        .then(() => toast.success(`${agent.name} reinstated`))
        .catch((err: string) => toast.error("Failed to reinstate", { description: err }));
    } else {
      dispatch(suspendTasThunk(agent.id))
        .unwrap()
        .then(() => toast.success(`${agent.name} suspended`))
        .catch((err: string) => toast.error("Failed to suspend", { description: err }));
    }
  };

  const mailtoHref =
    `mailto:${agent.email}` +
    `?subject=${encodeURIComponent("TAS Account – More Information Needed")}` +
    `&body=${encodeURIComponent(`Dear ${agent.fullName},\n\nWe have reviewed your TAS account and require some additional information before we can proceed.\n\nPlease respond to this email at your earliest convenience.\n\nThank you.`)}`;

  // Location from API
  const loc = agent.location as { city?: string; state?: string; address?: string } | undefined;
  const locationStr = [loc?.address, loc?.city, loc?.state].filter(Boolean).join(", ") || null;

  // Document from API
  const doc = agent.document as { url?: string; type?: string } | undefined;

  return (
    <>
      <style>{`
        .inforow-label { font-size: 13px; font-weight: 500; color: #6B7280; margin: 0 0 1px; }
        .inforow-value { font-size: 13px; color: #111827; word-break: break-word; margin: 0; }
        .ad-section { padding: 20px 24px; }
        .ad-action-bar { display: grid; grid-template-columns: repeat(2, 1fr); }
        .ad-act-btn {
          padding: 16px 10px; font-size: 13px; font-weight: 500;
          border: none; border-right: 1px solid #E5E7EB; border-top: 1px solid #E5E7EB;
          cursor: pointer; background: #ffffff; color: #6B7280;
          transition: background 0.15s; text-decoration: none;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .ad-act-btn:hover { background: #F9FAFB; }
        .ad-act-btn:nth-child(2n) { border-right: none; }
        .ad-act-btn:nth-child(1) { background: #2563eb; color: #fff; font-weight: 600; border-right: none; }
        .ad-act-btn:nth-child(1):hover { background: #1d4ed8; }
        @media (min-width: 480px) {
          .inforow-label { display: inline-block; width: 200px; }
          .inforow-value { display: inline; }
        }
        @media (min-width: 640px) {
          .ad-section { padding: 24px 32px; }
          .ad-action-bar { display: flex; grid-template-columns: none; }
          .ad-act-btn { border-right: 1px solid #E5E7EB !important; flex: 1; }
          .ad-act-btn:last-child { border-right: none !important; }
          .ad-act-btn:nth-child(2n) { border-right: 1px solid #E5E7EB !important; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Back */}
        <button onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "#111827", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={16} /> TAS Management
        </button>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>

          {/* ── Profile ── */}
          <div className="ad-section" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Profile" />
            <InfoRow icon={User}         label="Full Name"  value={agent.fullName} />
            <InfoRow icon={Hash}         label="Username"   value={agent.tasId} />
            <InfoRow icon={Phone}        label="Phone"      value={agent.phone} />
            <InfoRow icon={Mail}         label="Email"      value={agent.email} />
            <InfoRow icon={User}         label="Gender"     value={ext.gender} />
            <InfoRow icon={CalendarDays} label="Date of Birth" value={fmt(agent.dob)} />
            <InfoRow icon={CalendarDays} label="Joined"     value={agent.joined} />
            <InfoRow icon={ShieldCheck}  label="Status">
              <AgentBadge status={agent.status} />
            </InfoRow>
          </div>

          {/* ── TAS Info ── */}
          <div className="ad-section" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="TAS Information" />
            <InfoRow icon={Layers}    label="Tier"             value={`Tier ${agent.tier}`} />
            <InfoRow icon={Percent}   label="Bonus"            value={agent.bonus !== "—" ? agent.bonus : null} />
            <InfoRow icon={Hash}      label="Referral Code"    value={ext.referral} />
            <InfoRow icon={GitBranch} label="Parent TAS ID"    value={ext.parentTasId} />
            <InfoRow icon={Users}     label="Application Code" value={agent.applicationCode} />
          </div>

          {/* ── Location ── */}
          {locationStr && (
            <div className="ad-section" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <SectionLabel text="Location" />
              <InfoRow icon={MapPin} label="Location" value={locationStr} />
            </div>
          )}

          {/* ── Document ── */}
          {doc?.type && (
            <div className="ad-section" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <SectionLabel text="Document" />
              <InfoRow icon={FileText} label="Type" value={doc.type} />
              {doc.url && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <FileText size={14} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                  <div>
                    <p className="inforow-label">Document URL</p>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "13px", color: "#2563eb", wordBreak: "break-all" }}>
                      View Document
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Bank Details ── */}
          {agent.bankName && (
            <div className="ad-section" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <SectionLabel text="Bank Details" />
              <InfoRow icon={Building2} label="Bank Name"      value={agent.bankName} />
              <InfoRow icon={Hash}      label="Account Number" value={agent.accountNo} />
            </div>
          )}

          {/* ── Earnings (placeholder until API provides) ── */}
          <div className="ad-section" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Earnings" />
            <InfoRow icon={Wallet} label="Total Earnings"    value={agent.totalEarnings} />
            <InfoRow icon={Wallet} label="This Month"        value={agent.thisMonth} />
            <InfoRow icon={Wallet} label="Available Balance" value={agent.availableBalance} />
            <InfoRow icon={Wallet} label="Pending Balance"   value={agent.pendingBalance} />
          </div>

          {/* ── Action bar ── */}
          <div className="ad-action-bar">
            <button onClick={() => setAdjustTierAgent(agent)} disabled={isMutating} className="ad-act-btn">
              Adjust Tier
            </button>
            <button
              onClick={handleSuspendToggle}
              disabled={isMutating}
              className="ad-act-btn"
              style={{ color: isSuspended ? "#16a34a" : "#d97706" }}>
              {isMutating ? "Please wait…" : isSuspended ? "Reinstate TAS" : "Suspend TAS"}
            </button>
            <a href={mailtoHref} className="ad-act-btn">
              Request Info
            </a>
          </div>

        </div>
      </div>

      <AdjustTierModal agent={adjustTierAgent} onClose={() => setAdjustTierAgent(null)} />
    </>
  );
}