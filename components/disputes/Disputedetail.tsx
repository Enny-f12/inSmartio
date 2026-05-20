/* eslint-disable @typescript-eslint/no-unused-vars */
// components/disputes/DisputeDetail.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { PriorityLabel, DisputeStatusBadge } from "./DisputeBadges";
import { useAppDispatch } from "@/hooks/redux";
import { editDispute, resolveDisputeThunk } from "@/lib/redux/disputeSlice";
import type { Dispute } from "@/components/disputes/types";
import type { ResolutionType } from "@/lib/api/disputeApi";

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

const RESOLUTION_OPTIONS: { value: ResolutionType; label: string }[] = [
  { value: "full_expert", label: "Full payment to expert"  },
  { value: "full_client", label: "Full refund to client"   },
  { value: "dismiss",     label: "Dismiss dispute"         },
  { value: "partial_70",  label: "Partial payment (70%)"   },
  { value: "reperform",   label: "Re-performance ordered"  },
];

interface Props {
  dispute:   Dispute;
  disputeId: string;
  onBack:    () => void;
}

export default function DisputeDetail({ dispute, disputeId, onBack }: Props) {
  const dispatch = useAppDispatch();

  const [resolution,     setResolution]     = useState<ResolutionType | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [drafting,       setDrafting]       = useState(false);
  const [appealing,      setAppealing]      = useState(false);

  // Submit Decision → Resolved
  const handleSubmitDecision = () => {
    if (!resolution) { toast.warning("Select a resolution option first."); return; }
    setSubmitting(true);
    dispatch(resolveDisputeThunk({
      id: disputeId,
      payload: {
        resolution,
        ...(decisionReason.trim() ? { reason: decisionReason.trim() } : {}),
      },
    }))
      .unwrap()
      .then(() => { toast.success("Decision submitted — dispute resolved"); onBack(); })
      .catch((err: string) => toast.error("Failed to submit decision", { description: err }))
      .finally(() => setSubmitting(false));
  };

  // Save Draft → In Progress
  const handleSaveDraft = () => {
    setDrafting(true);
    dispatch(editDispute({ id: disputeId, payload: { status: "In Progress" } }))
      .unwrap()
      .then(() => { toast.success("Saved as draft — status set to In Progress"); onBack(); })
      .catch((err: string) => toast.error("Failed to save draft", { description: err }))
      .finally(() => setDrafting(false));
  };

  // Appeal Later → In Progress
  const handleAppealLater = () => {
    setAppealing(true);
    dispatch(editDispute({ id: disputeId, payload: { status: "In Progress" } }))
      .unwrap()
      .then(() => { toast.success("Marked for appeal — status set to In Progress"); onBack(); })
      .catch((err: string) => toast.error("Failed to update dispute", { description: err }))
      .finally(() => setAppealing(false));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <style>{`
        .drow-label  { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); margin-bottom: 2px; }
        .drow-value  { font-size: 13px; color: var(--color-text-main); }
        .dd-section  { padding: 16px; border-bottom: 1px solid var(--color-border); background: #fff; }
        .dd-section:last-child { border-bottom: none; }
        .dd-statements     { display: flex; flex-direction: column; border-bottom: 1px solid var(--color-border); }
        .dd-statement      { padding: 16px; border-bottom: 1px solid var(--color-border); background: #fff; }
        .dd-statement:last-child { border-bottom: none; }
        .dd-footer         { display: grid; grid-template-columns: repeat(2, 1fr); flex-shrink: 0; border-top: 1px solid var(--color-border); background: var(--color-surface); }
        .dd-footer-btn     { padding: 14px 10px; font-size: 13px; font-weight: 500; border: none; border-right: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); cursor: pointer; background: none; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; gap: 6px; }
        .dd-footer-btn:nth-child(2n) { border-right: none; }
        .dd-footer-btn:nth-last-child(-n+2) { border-bottom: none; }
        @media (min-width: 480px) {
          .drow-label { display: inline-block; width: 160px; font-size: 13px; font-weight: 400; text-transform: none; letter-spacing: 0; margin-bottom: 0; line-height: 1.6; vertical-align: top; }
          .drow-value { display: inline; }
        }
        @media (min-width: 640px) {
          .dd-section    { padding: 24px 32px; }
          .dd-statements { flex-direction: row; }
          .dd-statement  { flex: 1; border-bottom: none; border-right: 1px solid var(--color-border); }
          .dd-statement:last-child { border-right: none; }
          .dd-footer     { display: flex; }
          .dd-footer-btn { flex: 1; padding: 16px; border-right: 1px solid var(--color-border); border-bottom: none; }
          .dd-footer-btn:last-child { border-right: none; }
        }
      `}</style>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "var(--color-background)" }} className="sm:p-8">

        {/* Back */}
        <div style={{ marginBottom: "20px" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={16} /> Disputes
          </button>
        </div>

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
            <div className="dd-statement">
              <SectionLabel text="Client Statement" />
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--color-text-main)", marginBottom: "14px", lineHeight: 1.6 }}>
                &ldquo;{dispute.clientStatement}&rdquo;
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "10px" }}>Evidence:</p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                {(dispute.clientEvidence.length > 0 ? dispute.clientEvidence : [EVIDENCE_IMAGES[0], EVIDENCE_IMAGES[1]]).slice(0, 2).map((src, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                    <Image src={src} alt={`Evidence ${i + 1}`} width={64} height={64} style={{ width: 64, height: 64, objectFit: "cover" }} />
                  </div>
                ))}
              </div>
              {dispute.chatId && (
                <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-primary)", color: "var(--color-primary)", background: "none", cursor: "pointer" }}>
                  View Chat Log
                </button>
              )}
            </div>

            <div className="dd-statement">
              <SectionLabel text="Expert Statement" />
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--color-text-main)", marginBottom: "14px", lineHeight: 1.6 }}>
                &ldquo;{dispute.expertStatement}&rdquo;
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "10px" }}>Evidence:</p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                {(dispute.expertEvidence.length > 0 ? dispute.expertEvidence : [EVIDENCE_IMAGES[2], EVIDENCE_IMAGES[3]]).slice(0, 2).map((src, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                    <Image src={src} alt={`Evidence ${i + 1}`} width={64} height={64} style={{ width: 64, height: 64, objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mediation Notes */}
          {dispute.mediationNotes.length > 0 && (
            <div className="dd-section">
              <SectionLabel text="Mediation Notes" />
              <div style={{ borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", overflow: "hidden" }}>
                {dispute.mediationNotes.map((n, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "12px 16px", fontSize: "13px", borderBottom: i < dispute.mediationNotes.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <span style={{ fontWeight: 600, fontSize: "11px", color: "var(--color-text-muted)" }}>[{n.timestamp}]</span>
                    <span style={{ color: "var(--color-text-main)" }}>{n.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution */}
          <div className="dd-section">
            <SectionLabel text="Resolution" />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {RESOLUTION_OPTIONS.map((opt) => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--color-text-main)" }}>
                  <input type="radio" name="resolution" value={opt.value} checked={resolution === opt.value} onChange={() => setResolution(opt.value)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)", flexShrink: 0 }} />
                  {opt.label}
                </label>
              ))}
            </div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "8px" }}>
              Decision reason: <span style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "12px" }}>(optional)</span>
            </p>
            <textarea rows={3} placeholder="Enter your decision reason..."
              value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="dd-footer">
        {/* Submit → Resolved */}
        <button onClick={handleSubmitDecision} disabled={submitting} className="dd-footer-btn btn-primary" style={{ fontWeight: 600 }}>
          {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Decision"}
        </button>

        {/* Save Draft → In Progress */}
        <button onClick={handleSaveDraft} disabled={drafting} className="dd-footer-btn">
          {drafting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Draft"}
        </button>

        {/* Appeal Later → In Progress */}
        <button onClick={handleAppealLater} disabled={appealing} className="dd-footer-btn">
          {appealing ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : "Appeal Later"}
        </button>
      </div>
    </div>
  );
}