// components/disputes/DisputeDetail.tsx
"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { PriorityLabel, DisputeStatusBadge } from "./DisputeBadges";
import type { Dispute, Resolution } from "@/components/disputes/types";

// ── Unsplash evidence images ─────────────────────────────
const EVIDENCE_IMAGES = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=120&h=120&fit=crop&auto=format",
];

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "12px" }}>
      {text}
    </p>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "12px", fontSize: "13px", marginBottom: "8px" }}>
      <span style={{ width: "160px", flexShrink: 0, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-main)" }}>{children}</span>
    </div>
  );
}

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: "full_expert", label: "Full payment to expert"  },
  { value: "full_client", label: "Full refund to client"   },
  { value: "dismiss",     label: "Dismiss dispute"         },
  { value: "partial",     label: "Partial payment (__%)"   },
  { value: "reperform",   label: "Re-performance ordered"  },
];

interface Props {
  dispute: Dispute;
  onBack: () => void;
}

export default function DisputeDetail({ dispute, onBack }: Props) {
  const [resolution,     setResolution]     = useState<Resolution>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [partialPct,     setPartialPct]     = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", backgroundColor: "var(--color-background)" }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer", marginBottom: "24px" }}
        >
          <ArrowLeft size={16} /> Disputes
        </button>

        <div style={{ borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid var(--color-border)", overflow: "hidden" }}>

          {/* ── Case Information ── */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>
            <SectionLabel text="Case Information" />
            <InfoRow label="Case ID:">{dispute.id}</InfoRow>
            <InfoRow label="Job ID:">{dispute.jobId}</InfoRow>
            <InfoRow label="Opened:">{dispute.opened}</InfoRow>
            <InfoRow label="Priority:"><PriorityLabel priority={dispute.priority} /></InfoRow>
            <InfoRow label="Amount in Escrow:">{dispute.escrowAmount}</InfoRow>
            <InfoRow label="Status:"><DisputeStatusBadge status={dispute.status} /></InfoRow>
          </div>

          {/* ── Statements — side by side ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderBottom: "1px solid var(--color-border)" }}>
            {/* Client */}
            <div style={{ padding: "24px 32px", borderRight: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>
              <SectionLabel text="Client Statement" />
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--color-text-main)", marginBottom: "16px", lineHeight: 1.6 }}>
                &ldquo;{dispute.clientStatement}&rdquo;
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                Evidence:
              </p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                {[EVIDENCE_IMAGES[0], EVIDENCE_IMAGES[1]].map((src, i) => (
                  <div key={i} style={{ width: 72, height: 72, borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                    <Image src={src} alt={`Evidence ${i + 1}`} width={72} height={72} style={{ width: 72, height: 72, objectFit: "cover" }} />
                  </div>
                ))}
              </div>
              <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-primary)", color: "var(--color-primary)", background: "none", cursor: "pointer" }}>
                View chat Log
              </button>
            </div>

            {/* Expert */}
            <div style={{ padding: "24px 32px", backgroundColor: "#ffffff" }}>
              <SectionLabel text="Expert Statement" />
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--color-text-main)", marginBottom: "16px", lineHeight: 1.6 }}>
                &ldquo;{dispute.expertStatement}&rdquo;
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                Evidence:
              </p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                {[EVIDENCE_IMAGES[2], EVIDENCE_IMAGES[3]].map((src, i) => (
                  <div key={i} style={{ width: 72, height: 72, borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                    <Image src={src} alt={`Evidence ${i + 1}`} width={72} height={72} style={{ width: 72, height: 72, objectFit: "cover" }} />
                  </div>
                ))}
              </div>
              <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-primary)", color: "var(--color-primary)", background: "none", cursor: "pointer" }}>
                View chat Log
              </button>
            </div>
          </div>

          {/* ── Mediation Notes ── */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>
            <SectionLabel text="Mediation Notes" />
            <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", overflow: "hidden" }}>
              {dispute.mediationNotes.map((n, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: "16px", padding: "12px 16px", fontSize: "13px", borderBottom: i < dispute.mediationNotes.length - 1 ? "1px solid var(--color-border)" : "none" }}
                >
                  <span style={{ flexShrink: 0, fontWeight: 500, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    [{n.timestamp}]
                  </span>
                  <span style={{ color: "var(--color-text-main)" }}>{n.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Resolution ── */}
          <div style={{ padding: "24px 32px", backgroundColor: "#ffffff" }}>
            <SectionLabel text="Resolution" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {RESOLUTION_OPTIONS.map((opt) => (
                <label
                  key={String(opt.value)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--color-text-main)" }}
                >
                  <input
                    type="radio"
                    name="resolution"
                    value={opt.value ?? ""}
                    checked={resolution === opt.value}
                    onChange={() => setResolution(opt.value)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                  />
                  {opt.label}
                  {opt.value === "partial" && resolution === "partial" && (
                    <input
                      type="text"
                      placeholder="e.g. 70"
                      value={partialPct}
                      onChange={(e) => setPartialPct(e.target.value)}
                      style={{ marginLeft: "4px", width: "64px", padding: "2px 8px", borderRadius: "8px", fontSize: "12px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }}
                    />
                  )}
                </label>
              ))}
            </div>

            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "8px" }}>Decision reason:</p>
            <textarea
              rows={3}
              placeholder="[Insufficient evidence of pre-damage, 70% payment...]"
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          </div>

        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div style={{ flexShrink: 0, display: "flex", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <button className="btn-primary" style={{ flex: 1, padding: "16px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", borderRight: "1px solid var(--color-border)" }}>
          Submit Decision
        </button>
        <button style={{ flex: 1, padding: "16px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
          Save Draft
        </button>
        <button style={{ flex: 1, padding: "16px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
          Appeal Later
        </button>
      </div>
    </div>
  );
}