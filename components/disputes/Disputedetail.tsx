// components/disputes/DisputeDetail.tsx
"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { PriorityLabel, DisputeStatusBadge } from "./DisputeBadges";
import type { Dispute, Resolution } from "@/components/disputes/types";

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
    <div style={{ fontSize: "13px", marginBottom: "10px" }}>
      <p className="drow-label">{label}</p>
      <p className="drow-value">{children}</p>
    </div>
  );
}

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: "full_expert", label: "Full payment to expert" },
  { value: "full_client", label: "Full refund to client"  },
  { value: "dismiss",     label: "Dismiss dispute"        },
  { value: "partial",     label: "Partial payment (__%)"  },
  { value: "reperform",   label: "Re-performance ordered" },
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
      <style>{`
        /* InfoRow: stacked label+value on mobile, side-by-side on sm */
        .drow-label  { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); margin-bottom: 2px; }
        .drow-value  { font-size: 13px; color: var(--color-text-main); }

        /* Section padding */
        .dd-section  { padding: 16px; border-bottom: 1px solid var(--color-border); background: #fff; }
        .dd-section:last-child { border-bottom: none; }

        /* Statements: stacked on mobile, side-by-side on sm */
        .dd-statements       { display: flex; flex-direction: column; border-bottom: 1px solid var(--color-border); }
        .dd-statement        { padding: 16px; border-bottom: 1px solid var(--color-border); background: #fff; }
        .dd-statement:last-child { border-bottom: none; }

        /* Footer: 2-col grid on mobile, flex row on sm */
        .dd-footer       { display: grid; grid-template-columns: repeat(2, 1fr); flex-shrink: 0; border-top: 1px solid var(--color-border); background: var(--color-surface); }
        .dd-footer-btn   { padding: 14px 10px; font-size: 13px; font-weight: 500; border: none; border-right: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); cursor: pointer; background: none; color: var(--color-text-muted); }
        .dd-footer-btn:nth-child(2n) { border-right: none; }
        .dd-footer-btn:nth-last-child(-n+2) { border-bottom: none; }

        @media (min-width: 480px) {
          .drow-label  { display: inline-block; width: 160px; font-size: 13px; font-weight: 400; text-transform: none; letter-spacing: 0; margin-bottom: 0; line-height: 1.6; vertical-align: top; }
          .drow-value  { display: inline; }
        }

        @media (min-width: 640px) {
          .dd-section      { padding: 24px 32px; }
          .dd-statements   { flex-direction: row; }
          .dd-statement    { flex: 1; border-bottom: none; border-right: 1px solid var(--color-border); }
          .dd-statement:last-child { border-right: none; }
          .dd-footer       { display: flex; }
          .dd-footer-btn   { flex: 1; padding: 16px; border-right: 1px solid var(--color-border); border-bottom: none; }
          .dd-footer-btn:last-child { border-right: none; }
        }
      `}</style>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "var(--color-background)" }} className="sm:p-8">

        {/* Back */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}
        >
          <ArrowLeft size={16} /> Disputes
        </button>

        <div style={{ borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid var(--color-border)", overflow: "hidden" }}>

          {/* Case Information */}
          <div className="dd-section">
            <SectionLabel text="Case Information" />
            <InfoRow label="Case ID">{dispute.id}</InfoRow>
            <InfoRow label="Job ID">{dispute.jobId}</InfoRow>
            <InfoRow label="Opened">{dispute.opened}</InfoRow>
            <InfoRow label="Priority"><PriorityLabel priority={dispute.priority} /></InfoRow>
            <InfoRow label="Amount in Escrow">{dispute.escrowAmount}</InfoRow>
            <InfoRow label="Status"><DisputeStatusBadge status={dispute.status} /></InfoRow>
          </div>

          {/* Statements */}
          <div className="dd-statements">
            {/* Client */}
            <div className="dd-statement">
              <SectionLabel text="Client Statement" />
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--color-text-main)", marginBottom: "14px", lineHeight: 1.6 }}>
                &ldquo;{dispute.clientStatement}&rdquo;
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "10px" }}>Evidence:</p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                {[EVIDENCE_IMAGES[0], EVIDENCE_IMAGES[1]].map((src, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                    <Image src={src} alt={`Evidence ${i + 1}`} width={64} height={64} style={{ width: 64, height: 64, objectFit: "cover" }} />
                  </div>
                ))}
              </div>
              <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-primary)", color: "var(--color-primary)", background: "none", cursor: "pointer" }}>
                View chat Log
              </button>
            </div>

            {/* Expert */}
            <div className="dd-statement">
              <SectionLabel text="Expert Statement" />
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--color-text-main)", marginBottom: "14px", lineHeight: 1.6 }}>
                &ldquo;{dispute.expertStatement}&rdquo;
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "10px" }}>Evidence:</p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                {[EVIDENCE_IMAGES[2], EVIDENCE_IMAGES[3]].map((src, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                    <Image src={src} alt={`Evidence ${i + 1}`} width={64} height={64} style={{ width: 64, height: 64, objectFit: "cover" }} />
                  </div>
                ))}
              </div>
              <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-primary)", color: "var(--color-primary)", background: "none", cursor: "pointer" }}>
                View chat Log
              </button>
            </div>
          </div>

          {/* Mediation Notes */}
          <div className="dd-section">
            <SectionLabel text="Mediation Notes" />
            <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", overflow: "hidden" }}>
              {dispute.mediationNotes.map((n, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "12px 16px", fontSize: "13px", borderBottom: i < dispute.mediationNotes.length - 1 ? "1px solid var(--color-border)" : "none" }}
                  className="sm:flex-row sm:gap-4">
                  <span style={{ flexShrink: 0, fontWeight: 600, fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    [{n.timestamp}]
                  </span>
                  <span style={{ color: "var(--color-text-main)" }}>{n.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="dd-section">
            <SectionLabel text="Resolution" />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {RESOLUTION_OPTIONS.map((opt) => (
                <label key={String(opt.value)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--color-text-main)" }}>
                  <input
                    type="radio" name="resolution" value={opt.value ?? ""}
                    checked={resolution === opt.value}
                    onChange={() => setResolution(opt.value)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)", flexShrink: 0 }}
                  />
                  {opt.label}
                  {opt.value === "partial" && resolution === "partial" && (
                    <input
                      type="text" placeholder="e.g. 70" value={partialPct}
                      onChange={(e) => setPartialPct(e.target.value)}
                      style={{ marginLeft: "4px", width: "64px", padding: "2px 8px", borderRadius: "8px", fontSize: "12px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }}
                    />
                  )}
                </label>
              ))}
            </div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "8px" }}>Decision reason:</p>
            <textarea
              rows={3} placeholder="[Insufficient evidence of pre-damage, 70% payment...]"
              value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          </div>

        </div>
      </div>

      {/* Sticky footer */}
      <div className="dd-footer">
        <button className="dd-footer-btn btn-primary" style={{ fontWeight: 600 }}>
          Submit Decision
        </button>
        <button className="dd-footer-btn">Save Draft</button>
        <button className="dd-footer-btn">Appeal Later</button>
      </div>
    </div>
  );
}