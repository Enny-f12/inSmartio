"use client";

import { useState } from "react";
import {
  ArrowLeft, User, Hash, Phone, Mail, Layers, Percent,
  CalendarDays, ShieldCheck, Users, TrendingUp, Wallet,
  Clock, PiggyBank, Hourglass,
} from "lucide-react";
import { AgentBadge } from "./Tasbadges";
import AdjustTierModal from "./Adjusttiermodal";
import type { ActiveAgent } from "./types";

interface AgentDetailProps {
  agent: ActiveAgent;
  onBack: () => void;
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B7280", marginBottom: "12px", margin: "0 0 12px" }}>
      {text}
    </p>
  );
}

function InfoRow({ icon: Icon, label, value, children }: { icon: React.ElementType; label: string; value?: string | number; children?: React.ReactNode }) {
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

export default function AgentDetail({ agent, onBack }: AgentDetailProps) {
  const [adjustTierAgent, setAdjustTierAgent] = useState<ActiveAgent | null>(null);

  return (
    <>
      <style>{`
        .inforow-label { font-size: 13px; font-weight: 500; color: #6B7280; margin: 0 0 1px; }
        .inforow-value { font-size: 13px; color: #111827; word-break: break-word; margin: 0; }

        .ad-section { padding: 20px 24px; }

        .experts-desktop { display: none !important; }
        .experts-mobile  { display: flex !important; flex-direction: column; gap: 10px; }

        .ad-action-bar { display: grid; grid-template-columns: repeat(2, 1fr); }
        .ad-act-btn {
          padding: 16px 10px; font-size: 13px; font-weight: 500;
          border: none; border-right: 1px solid #E5E7EB; border-top: 1px solid #E5E7EB;
          cursor: pointer; background: #ffffff; color: #6B7280;
          transition: background 0.15s;
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
          .experts-desktop { display: block !important; }
          .experts-mobile  { display: none !important; }
          .ad-action-bar { display: flex; grid-template-columns: none; }
          .ad-act-btn { border-right: 1px solid #E5E7EB !important; flex: 1; }
          .ad-act-btn:last-child { border-right: none !important; }
          .ad-act-btn:nth-child(2n) { border-right: 1px solid #E5E7EB !important; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "#111827", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={16} /> Active TAS Agents
        </button>

        {/* ── Profile card ── */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>

          {/* Job Information */}
          <div className="ad-section" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Job Information" />
            <InfoRow icon={User}         label="Name"   value={agent.fullName} />
            <InfoRow icon={Hash}         label="TAS ID" value={agent.tasId} />
            <InfoRow icon={Phone}        label="Phone"  value={agent.phone} />
            <InfoRow icon={Mail}         label="Email"  value={agent.email} />
            <InfoRow icon={Layers}       label="Tier"   value={`${agent.tier} (${agent.tierLabel})`} />
            <InfoRow icon={Percent}      label="Bonus"  value={agent.bonus} />
            <InfoRow icon={CalendarDays} label="Joined" value={agent.joined} />
            <InfoRow icon={ShieldCheck}  label="Status">
              <AgentBadge status={agent.status} />
            </InfoRow>
          </div>

          {/* Performance Metrics */}
          <div className="ad-section" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Performance Metrics" />
            <InfoRow icon={Users}      label="Total Experts Recruited"      value={agent.experts} />
            <InfoRow icon={TrendingUp} label="Active Experts (3-month avg)" value={agent.activeExperts} />
            <InfoRow icon={Wallet}     label="Total Earnings"               value={agent.totalEarnings} />
            <InfoRow icon={Clock}      label="This Month"                   value={agent.thisMonth} />
            <InfoRow icon={PiggyBank}  label="Available Balance"            value={agent.availableBalance} />
            <InfoRow icon={Hourglass}  label="Pending Balance"              value={agent.pendingBalance} />
          </div>

          {/* Recruited Experts */}
          <div className="ad-section">
            <SectionLabel text="Recruited Experts" />

            {/* Mobile cards */}
            <div className="experts-mobile">
              {agent.recruitedExperts.map((expert, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", margin: 0 }}>{expert.name}</p>
                    <AgentBadge status={expert.subTas} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}><span style={{ fontWeight: 500, color: "#111827" }}>Earnings: </span>{expert.earningsHistory}</span>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}><span style={{ fontWeight: 500, color: "#111827" }}>Payouts: </span>{expert.payouts}</span>
                    {expert.notes && <span style={{ fontSize: "12px", color: "#6B7280", width: "100%", marginTop: "2px" }}><span style={{ fontWeight: 500, color: "#111827" }}>Notes: </span>{expert.notes}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="experts-desktop">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                    {["Recruited Experts", "Earnings History", "Sub-TAS", "Payouts", "Notes"].map(h => (
                      <th key={h} style={{ textAlign: "left", paddingBottom: "12px", paddingRight: "24px", fontSize: "12px", fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agent.recruitedExperts.map((expert, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "14px 24px 14px 0", fontSize: "13.5px", color: "#111827" }}>{expert.name}</td>
                      <td style={{ padding: "14px 24px 14px 0", fontSize: "13.5px", color: "#6B7280" }}>{expert.earningsHistory}</td>
                      <td style={{ padding: "14px 24px 14px 0" }}><AgentBadge status={expert.subTas} /></td>
                      <td style={{ padding: "14px 24px 14px 0", fontSize: "13.5px", color: "#111827" }}>{expert.payouts}</td>
                      <td style={{ padding: "14px 0", fontSize: "13.5px", color: "#6B7280" }}>{expert.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button style={{ marginTop: "16px", fontSize: "13px", fontWeight: 500, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0, display: "block" }}>
              View All {agent.experts} Experts
            </button>
          </div>

          {/* Action bar — inside the card at the bottom */}
          <div className="ad-action-bar" style={{ borderTop: "1px solid #E5E7EB" }}>
            <button onClick={() => setAdjustTierAgent(agent)} className="ad-act-btn">Adjust Tier</button>
            <button className="ad-act-btn">Suspend TAS</button>
            <button className="ad-act-btn">Force Payout</button>
            <button className="ad-act-btn">Add Note</button>
          </div>

        </div>
      </div>

      <AdjustTierModal agent={adjustTierAgent} onClose={() => setAdjustTierAgent(null)} />
    </>
  );
}