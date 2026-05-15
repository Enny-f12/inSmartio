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
    <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-text-muted pt-6">
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
    <div className="flex items-center gap-3 text-[13px] mb-8">
      <Icon size={14} className="text-text-muted shrink-0" />
      <span className="w-52 shrink-0 text-text-muted">{label}</span>
      {children ?? <span className="text-text-main font-medium">{value}</span>}
    </div>
  );
}

export default function AgentDetail({ agent, onBack }: AgentDetailProps) {
  const [adjustTierAgent, setAdjustTierAgent] = useState<ActiveAgent | null>(null);

  return (
    <>
      <div className="p-8">

        {/* ── Back ── */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[14px] font-medium text-text-main hover:opacity-70 transition-opacity mb-8"
        >
          <ArrowLeft size={16} />
          Active TAS Agents
        </button>

        {/* ── Main card ── */}
        <div className="rounded-2xl bg-surface border border-border px-8 py-8 ">

          {/* Job Information */}
          <SectionLabel text="Job Information" />
          <InfoRow icon={User}         label="Name:"   value={agent.fullName} />
          <InfoRow icon={Hash}         label="TAS ID:" value={agent.tasId} />
          <InfoRow icon={Phone}        label="Phone:"  value={agent.phone} />
          <InfoRow icon={Mail}         label="Email:"  value={agent.email} />
          <InfoRow icon={Layers}       label="Tier:"   value={`${agent.tier} (${agent.tierLabel})`} />
          <InfoRow icon={Percent}      label="Bonus:"  value={agent.bonus} />
          <InfoRow icon={CalendarDays} label="Joined:" value={agent.joined} />
          <InfoRow icon={ShieldCheck}  label="Status:">
            <AgentBadge status={agent.status} />
          </InfoRow>

          <div className="py-3 border-t border-border" />

          {/* Performance Metrics */}
          <SectionLabel text="Performance Metrics" />
          <InfoRow icon={Users}      label="Total Experts Recruited:"      value={agent.experts} />
          <InfoRow icon={TrendingUp} label="Active Experts (3-month avg):" value={agent.activeExperts} />
          <InfoRow icon={Wallet}     label="Total Earnings:"               value={agent.totalEarnings} />
          <InfoRow icon={Clock}      label="This Month:"                   value={agent.thisMonth} />
          <InfoRow icon={PiggyBank}  label="Available Balance:"            value={agent.availableBalance} />
          <InfoRow icon={Hourglass}  label="Pending Balance:"              value={agent.pendingBalance} />

          <div className="py-3 border-t border-border" />

          {/* Recruited Experts table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Recruited Experts", "Earnings History", "Sub-TAS", "Payouts", "Notes"].map(h => (
                    <th
                      key={h}
                      className="text-left pb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted pr-8 last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agent.recruitedExperts.map((expert, i) => (
                  <tr key={i} className="hover:bg-background transition-colors">
                    <td className="py-4 text-[13.5px] text-text-main pr-8">{expert.name}</td>
                    <td className="py-4 text-[13.5px] text-text-muted pr-8">{expert.earningsHistory}</td>
                    <td className="py-4 pr-8"><AgentBadge status={expert.subTas} /></td>
                    <td className="py-4 text-[13.5px] text-text-main pr-8">{expert.payouts}</td>
                    <td className="py-4 text-[13.5px] text-text-muted">{expert.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="mt-4 text-[13px] font-medium text-primary hover:opacity-70 transition-opacity">
            View All {agent.experts} Experts
          </button>
        </div>

        {/* ── Action bar ── */}
        <div className="flex items-center gap-3 mt-10 flex-wrap">
          <button
            onClick={() => setAdjustTierAgent(agent)}
            className="btn-primary px-6 py-3 rounded-xl text-[13px]"
          >
            Adjust Tier
          </button>
          {["Suspend TAS", "Force Payout", "Add Note"].map(label => (
            <button
              key={label}
              className="px-6 py-3 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

      </div>

      <AdjustTierModal agent={adjustTierAgent} onClose={() => setAdjustTierAgent(null)} />
    </>
  );
}