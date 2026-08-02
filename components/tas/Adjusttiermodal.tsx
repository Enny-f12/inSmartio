// components/tas/AdjustTierModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { adjustTier, resetMutateStatus } from "@/lib/redux/tasSlice";
import type { ApiTas, AdjustTierPayload } from "@/lib/api/tasApi";
import { TAS_TIERS } from "./shared";

interface Props {
  agent:   ApiTas;
  onClose: () => void;
}

export default function AdjustTierModal({ agent, onClose }: Props) {
  const dispatch    = useAppDispatch();
  const { mutateStatus } = useAppSelector((s) => s.tas);
  const currentTier = Number(agent.tier ?? 1);
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [reason,       setReason]       = useState("");
  const isMutating = mutateStatus === "loading";

  const handleConfirm = () => {
    dispatch(adjustTier({ id: agent.id, payload: { newTier: selectedTier } as AdjustTierPayload }))
      .unwrap()
      .then(() => {
        toast.success("Tier updated successfully");
        dispatch(resetMutateStatus());
        onClose();
      })
      .catch((err: string) => toast.error("Failed to adjust tier", { description: err }));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid #E5E7EB",
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Adjust TAS Tier</p>
          <button onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>
            <span style={{ color: "#6B7280" }}>TAS: </span>
            {agent.name} ({(agent.applicationCode as string) ?? agent.id})
          </p>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 16px" }}>
            <span style={{ color: "#6B7280" }}>Current Tier: </span>{currentTier}
          </p>

          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 10px" }}>New Tier:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {TAS_TIERS.map((t) => (
              <label key={t.value}
                style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                <input
                  type="radio" name="tier" value={t.value}
                  checked={selectedTier === t.value}
                  onChange={() => setSelectedTier(t.value)}
                  style={{ accentColor: "#2563eb", width: 15, height: 15 }}
                />
                {t.label} {t.value === currentTier ? "– Current" : ""}
              </label>
            ))}
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Reason:</p>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason…" rows={3}
            style={{
              width: "100%", borderRadius: 8, border: "1px solid #E5E7EB",
              padding: "10px 12px", fontSize: 13, color: "#111827",
              resize: "none", outline: "none", boxSizing: "border-box", backgroundColor: "#F9FAFB",
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "14px 24px", borderTop: "1px solid #E5E7EB" }}>
          <button onClick={onClose}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: "1px solid #E5E7EB",
              backgroundColor: "#fff", fontSize: 13, cursor: "pointer", color: "#6B7280",
            }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isMutating}
            style={{
              flex: 2, padding: 10, borderRadius: 10, border: "none",
              backgroundColor: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: isMutating ? "not-allowed" : "pointer", opacity: isMutating ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {isMutating
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : "Confirm Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}