// components/disputes/DisputeDetail.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { PriorityLabel, DisputeStatusBadge } from "./DisputeBadges";
import Modal from "@/components/ui/Modal";
import { useAppDispatch } from "@/hooks/redux";
import { resolveDisputeThunk, appealDisputeThunk } from "@/lib/redux/disputeSlice";
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

// ── Resolution options — values match backend enum exactly ──
const RESOLUTION_OPTIONS: { value: ResolutionType; label: string }[] = [
  { value: "REFUND_EXPERT",          label: "Full payment to expert"          },
  { value: "REFUND_CLIENT",          label: "Full refund to client"           },
  { value: "SPLIT_REFUND",           label: "Split refund (50/50)"            },
  { value: "PARTIAL_REFUND_EXPERT",  label: "Partial refund — favour expert"  },
  { value: "PARTIAL_REFUND_CLIENT",  label: "Partial refund — favour client"  },
  { value: "DISMISS_DISPUTE",        label: "Dismiss dispute"                 },
  { value: "RE_PERFORM",             label: "Re-performance ordered"          },
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
  const [draftSaved,     setDraftSaved]     = useState(false);
  const [appealOpen,     setAppealOpen]     = useState(false);
  const [appealReason,   setAppealReason]   = useState("");
  const [appealing,      setAppealing]      = useState(false);

  // POST /dispute/{id}/resolve
  const handleSubmitDecision = () => {
    if (!resolution)            { toast.warning("Select a resolution option first."); return; }
    if (!decisionReason.trim()) { toast.warning("Please provide a decision reason."); return; }
    setSubmitting(true);
    dispatch(resolveDisputeThunk({
      id: disputeId,
      payload: { resolution, reason: decisionReason.trim() },
    }))
      .unwrap()
      .then(() => { toast.success("Decision submitted successfully"); onBack(); })
      .catch((err: string) => toast.error("Failed to submit decision", { description: err }))
      .finally(() => setSubmitting(false));
  };

  const handleSaveDraft = () => { setDraftSaved(true); toast.success("Saved as draft"); };

  // POST /dispute/{id}/appeal
  const handleAppealSubmit = () => {
    if (!appealReason.trim()) { toast.warning("Please provide a reason for the appeal."); return; }
    setAppealing(true);
    dispatch(appealDisputeThunk({
      id: disputeId,
      payload: { reason: appealReason.trim() },
    }))
      .unwrap()
      .then(() => { toast.success("Appeal submitted"); setAppealOpen(false); onBack(); })
      .catch((err: string) => toast.error("Failed to submit appeal", { description: err }))
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
        .dd-footer         { display: grid; grid-template-columns: repeat(3, 1fr); flex-shrink: 0; border-top: 1px solid var(--color-border); background: var(--color-surface); }
        .dd-footer-btn     { padding: 14px 10px; font-size: 13px; font-weight: 500; border: none; border-right: 1px solid var(--color-border); cursor: pointer; background: none; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; gap: 6px; }
        .dd-footer-btn:last-child { border-right: none; }
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
          .dd-footer-btn { flex: 1; padding: 16px; }
        }
      `}</style>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "var(--color-background)" }}>

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
                  <input
                    type="radio"
                    name="resolution"
                    value={opt.value}
                    checked={resolution === opt.value}
                    onChange={() => setResolution(opt.value)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)", flexShrink: 0 }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "8px" }}>
              Decision reason: <span style={{ color: "#ef4444" }}>*</span>
            </p>
            <textarea
              rows={3}
              placeholder="Enter your decision reason..."
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          </div>

        </div>
      </div>

      {/* Sticky footer */}
      <div className="dd-footer">
        <button onClick={handleSubmitDecision} disabled={submitting}
          className="dd-footer-btn btn-primary"
          style={{ fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Decision"}
        </button>
        <button onClick={handleSaveDraft} disabled={draftSaved} className="dd-footer-btn"
          style={{ color: draftSaved ? "#16a34a" : "var(--color-text-muted)", fontWeight: draftSaved ? 600 : 500 }}>
          {draftSaved ? "✓ Saved as Draft" : "Save Draft"}
        </button>
        <button onClick={() => setAppealOpen(true)} className="dd-footer-btn">
          Appeal Later
        </button>
      </div>

      {/* Appeal Later Modal */}
      <Modal open={appealOpen} onClose={() => setAppealOpen(false)} title="Appeal Later" size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setAppealOpen(false)}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>
              Cancel
            </button>
            <button onClick={handleAppealSubmit} disabled={appealing} className="btn-primary"
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: appealing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: appealing ? 0.7 : 1 }}>
              {appealing ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Appeal"}
            </button>
          </div>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Provide a reason for appealing this dispute later. This will be logged against the case.
          </p>
          <textarea rows={4} placeholder="e.g. I disagree with the resolution because..."
            value={appealReason} onChange={(e) => setAppealReason(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
          />
        </div>
      </Modal>
    </div>
  );
}