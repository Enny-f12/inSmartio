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
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", marginBottom: "12px" }}>
      {text}
    </p>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
      <Icon size={14} style={{ color: "var(--color-text-muted)", marginTop: "2px", flexShrink: 0 }} />
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
        .inforow-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); margin-bottom: 2px; }
        .inforow-value { font-size: 13px; color: var(--color-text-main); word-break: break-word; }

        .agent-section { padding: 16px; }

        .experts-cards { display: flex; flex-direction: column; gap: 10px; }
        .experts-table { display: none; }

        .agent-action-bar { display: grid; grid-template-columns: repeat(2, 1fr); border-top: 1px solid var(--color-border); margin-top: 24px; }
        .agent-action-btn { padding: 14px 10px; font-size: 13px; font-weight: 500; border: none; border-right: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); cursor: pointer; background: none; color: var(--color-text-muted); }
        .agent-action-btn:nth-child(2n) { border-right: none; }

        @media (min-width: 480px) {
          .inforow-label { font-size: 13px; font-weight: 400; text-transform: none; letter-spacing: 0; display: inline-block; width: 200px; margin-bottom: 0; line-height: 1.6; }
          .inforow-value { display: inline; }
        }

        @media (min-width: 640px) {
          .agent-section { padding: 24px 32px; }
          .experts-cards { display: none; }
          .experts-table { display: block; }
          .agent-action-bar { display: flex; }
          .agent-action-btn { border-right: 1px solid var(--color-border) !important; }
          .agent-action-btn:last-child { border-right: none !important; }
        }
      `}</style>

      <div style={{ padding: "16px" }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer", marginBottom: "24px" }}
        >
          <ArrowLeft size={16} />
          Active TAS Agents
        </button>

        {/* Card */}
        <div style={{ borderRadius: "16px", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

          {/* Job Information */}
          <div className="agent-section" style={{ borderBottom: "1px solid var(--color-border)" }}>
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
          <div className="agent-section" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <SectionLabel text="Performance Metrics" />
            <InfoRow icon={Users}      label="Total Experts Recruited"      value={agent.experts} />
            <InfoRow icon={TrendingUp} label="Active Experts (3-month avg)" value={agent.activeExperts} />
            <InfoRow icon={Wallet}     label="Total Earnings"               value={agent.totalEarnings} />
            <InfoRow icon={Clock}      label="This Month"                   value={agent.thisMonth} />
            <InfoRow icon={PiggyBank}  label="Available Balance"            value={agent.availableBalance} />
            <InfoRow icon={Hourglass}  label="Pending Balance"              value={agent.pendingBalance} />
          </div>

          {/* Recruited Experts */}
          <div className="agent-section">
            <SectionLabel text="Recruited Experts" />

            {/* Mobile: cards */}
            <div className="experts-cards">
              {agent.recruitedExperts.map((expert, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{expert.name}</p>
                    <AgentBadge status={expert.subTas} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      <span style={{ fontWeight: 500, color: "var(--color-text-main)" }}>Earnings: </span>
                      {expert.earningsHistory}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      <span style={{ fontWeight: 500, color: "var(--color-text-main)" }}>Payouts: </span>
                      {expert.payouts}
                    </span>
                    {expert.notes && (
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)", width: "100%", marginTop: "2px" }}>
                        <span style={{ fontWeight: 500, color: "var(--color-text-main)" }}>Notes: </span>
                        {expert.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="experts-table">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Recruited Experts", "Earnings History", "Sub-TAS", "Payouts", "Notes"].map(h => (
                      <th key={h} style={{ textAlign: "left", paddingBottom: "12px", paddingRight: "24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agent.recruitedExperts.map((expert, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "14px 24px 14px 0", fontSize: "13.5px", color: "var(--color-text-main)" }}>{expert.name}</td>
                      <td style={{ padding: "14px 24px 14px 0", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{expert.earningsHistory}</td>
                      <td style={{ padding: "14px 24px 14px 0" }}><AgentBadge status={expert.subTas} /></td>
                      <td style={{ padding: "14px 24px 14px 0", fontSize: "13.5px", color: "var(--color-text-main)" }}>{expert.payouts}</td>
                      <td style={{ padding: "14px 0", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{expert.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button style={{ marginTop: "16px", fontSize: "13px", fontWeight: 500, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              View All {agent.experts} Experts
            </button>
          </div>

        </div>

        {/* Action bar */}
        <div className="agent-action-bar">
          <button
            onClick={() => setAdjustTierAgent(agent)}
            className="agent-action-btn btn-primary"
            style={{ fontWeight: 600 }}
          >
            Adjust Tier
          </button>
          {["Suspend TAS", "Force Payout", "Add Note"].map(label => (
            <button key={label} className="agent-action-btn">{label}</button>
          ))}
        </div>

      </div>

      <AdjustTierModal agent={adjustTierAgent} onClose={() => setAdjustTierAgent(null)} />
    </>
  );
}