// components/tas/Adjusttiermodal.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { adjustTier } from "@/lib/redux/tasSlice";
import type { ActiveAgent } from "@/components/tas/types";
import { TAS_TIERS } from "@/components/tas/types";

interface AdjustTierModalProps {
  agent:   ActiveAgent | null;
  onClose: () => void;
}

export default function AdjustTierModal({ agent, onClose }: AdjustTierModalProps) {
  const dispatch = useAppDispatch();
  const { mutateStatus } = useAppSelector((s) => s.tas);

  // Keep selected as string to avoid type coercion issues with radio inputs
  // Ensure we always have a valid tier string — agent.tier may be null/0/undefined
  const initialTier = agent?.tier != null && agent.tier !== 0 ? String(agent.tier) : "1";
  const [selected, setSelected] = useState(initialTier);
  const [reason,   setReason]   = useState("");

  const isLoading = mutateStatus === "loading";

  if (!agent) return null;

  const handleConfirm = () => {
    console.log("🔧 Adjusting tier:", { id: agent.id, selected, asNumber: Number(selected) });
    dispatch(adjustTier({
      id:      agent.id,
      payload: { newTier: Number(selected) },  // convert to number only at dispatch
    }))
      .unwrap()
      .then(() => { toast.success(`Tier adjusted to ${selected} for ${agent.name}`); onClose(); })
      .catch((err: string) => toast.error("Failed to adjust tier", { description: err }));
  };

  const footer = (
    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
      <button onClick={onClose}
        style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>
        Cancel
      </button>
      <button onClick={handleConfirm} disabled={isLoading} className="btn-primary"
        style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isLoading ? 0.7 : 1 }}>
        {isLoading ? <><Loader2 size={14} className="animate-spin" /> Adjusting...</> : "Confirm Adjustment"}
      </button>
    </div>
  );

  return (
    <Modal open={!!agent} onClose={onClose} title="Adjust TAS Tier" size="sm" footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Current info */}
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: 500, color: "var(--color-text-main)" }}>TAS:</span>{" "}
            {agent.fullName} ({agent.tasId})
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: 500, color: "var(--color-text-main)" }}>Current Tier:</span>{" "}
            Tier {agent.tier} ({agent.tierLabel})
          </p>
        </div>

        {/* Tier selection */}
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "10px" }}>New Tier:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {TAS_TIERS.map((tier) => {
              const tierStr    = String(tier);
              const isCurrent  = tierStr === String(agent.tier);
              const isSelected = selected === tierStr;
              return (
                <label
                  key={tierStr}
                  onClick={() => setSelected(tierStr)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--color-text-main)", userSelect: "none" }}>
                  {/* Custom radio to avoid browser inconsistencies */}
                  <div style={{
                    width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${isSelected ? "var(--color-primary, #2563eb)" : "#D1D5DB"}`,
                    backgroundColor: isSelected ? "var(--color-primary, #2563eb)" : "#ffffff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {isSelected && <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ffffff" }} />}
                  </div>
                  Tier {tierStr}
                  {isCurrent && (
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>— Current</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Reason */}
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "8px" }}>
            Reason{" "}
            <span style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "12px" }}>(optional)</span>
          </p>
          <textarea
            rows={3}
            placeholder="Enter reason for adjustment..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
          />
        </div>

      </div>
    </Modal>
  );
}