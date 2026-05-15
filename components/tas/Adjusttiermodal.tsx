"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { ActiveAgent } from "@/components/tas/types";
import { TAS_TIERS } from "@/components/tas/types";

interface AdjustTierModalProps {
  agent: ActiveAgent | null;
  onClose: () => void;
}

export default function AdjustTierModal({ agent, onClose }: AdjustTierModalProps) {
  const currentTierFull = agent
    ? `Tier ${agent.tier} (${agent.tierLabel}, ${agent.bonus} bonus)`
    : "";

  const [selected, setSelected] = useState(currentTierFull);
  const [reason, setReason]     = useState("");

  if (!agent) return null;

  const footer = (
    <>
      <button
        onClick={onClose}
        className="px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onClose}
        className="btn-primary px-5 py-2.5 rounded-xl text-[13px]"
      >
        Confirm Adjustment
      </button>
    </>
  );

  return (
    <Modal open={!!agent} onClose={onClose} title="Adjust TAS Tier" size="sm" footer={footer}>
      <div className="space-y-4">

        {/* Current info */}
        <div className="text-[13px] text-text-muted space-y-1">
          <p>
            <span className="font-medium text-text-main">TAS:</span>{" "}
            {agent.fullName} ({agent.tasId})
          </p>
          <p>
            <span className="font-medium text-text-main">Current Tier:</span>{" "}
            {agent.tier} ({agent.tierLabel}, {agent.bonus} bonus)
          </p>
        </div>

        {/* Tier selection */}
        <div>
          <p className="text-[13px] font-medium text-text-main mb-2">New Tier:</p>
          <div className="space-y-2">
            {TAS_TIERS.map(tier => {
              const isCurrent = tier.toLowerCase().includes(agent.tierLabel.toLowerCase());
              return (
                <label
                  key={tier}
                  className="flex items-center gap-2.5 cursor-pointer text-[13px] text-text-main"
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tier}
                    checked={selected === tier || (selected === currentTierFull && isCurrent)}
                    onChange={() => setSelected(tier)}
                    className="accent-primary"
                  />
                  {isCurrent ? `${tier} - Current` : tier}
                </label>
              );
            })}
          </div>
        </div>

        {/* Reason */}
        <div>
          <p className="text-[13px] font-medium text-text-main mb-1.5">Reason for adjustment:</p>
          <textarea
            rows={3}
            placeholder="enter reason...."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none bg-background border border-border text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

      </div>
    </Modal>
  );
}