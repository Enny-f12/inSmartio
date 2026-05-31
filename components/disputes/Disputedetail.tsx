// components/disputes/DisputeDetail.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { PriorityLabel, DisputeStatusBadge } from "./DisputeBadges";
import Modal from "@/components/ui/Modal";
import { useAppDispatch } from "@/hooks/redux";
import { resolveDisputeThunk, appealDisputeThunk } from "@/lib/redux/disputeSlice";
import { addMediationNote } from "@/lib/api/disputeApi";
import type { Dispute } from "@/components/disputes/types";
import type { ResolutionType, MediationNote } from "@/lib/api/disputeApi";

// ── Evidence fallbacks ────────────────────────────────────
const FALLBACK_EVIDENCE = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=120&h=120&fit=crop&auto=format",
];

// ── Resolution options ────────────────────────────────────
const RESOLUTION_OPTIONS: { value: ResolutionType; label: string; hasPercent?: boolean }[] = [
  { value: "REFUND_EXPERT",         label: "Full payment to expert"  },
  { value: "REFUND_CLIENT",         label: "Full refund to client"   },
  { value: "DISMISS_DISPUTE",       label: "Dismiss dispute"         },
  { value: "PARTIAL_REFUND_EXPERT", label: "Partial payment",        hasPercent: true },
  { value: "RE_PERFORM",            label: "Re-performance ordered"  },
];

// ── Small shared components ───────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.08em", color: "#6B7280", marginBottom: "12px" }}>
      {text}
    </p>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "10px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "150px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", flex: 1 }}>{children}</span>
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
      {text}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
  fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box",
};

interface Props {
  dispute:   Dispute;
  disputeId: string;
  onBack:    () => void;
}

export default function DisputeDetail({ dispute, disputeId, onBack }: Props) {
  const dispatch = useAppDispatch();

  const [resolution,     setResolution]     = useState<ResolutionType | null>(null);
  const [partialPct,     setPartialPct]     = useState<string>("");
  const [decisionReason, setDecisionReason] = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [draftSaved,     setDraftSaved]     = useState(false);
  const [appealOpen,     setAppealOpen]     = useState(false);
  const [appealReason,   setAppealReason]   = useState("");
  const [appealing,      setAppealing]      = useState(false);

  // Mediation state
  const [mediationOpen,   setMediationOpen]   = useState(false);
  const [mediationNote,   setMediationNote]   = useState("");
  const [mediationDate,   setMediationDate]   = useState(""); // "YYYY-MM-DD"
  const [mediationTime,   setMediationTime]   = useState(""); // "HH:MM"
  const [addingNote,      setAddingNote]      = useState(false);
  // Local override so UI updates immediately after PUT
  const [localMediation,  setLocalMediation]  = useState<MediationNote | null>(null);

  // ── Mediation note: local override → real API data
  // mediation is a single object: { date, time, note }
  const rawMediation = dispute.mediationNotes as unknown as MediationNote | MediationNote[] | null;
  const currentMediation: MediationNote | null =
    localMediation ??
    (rawMediation
      ? Array.isArray(rawMediation)
        ? rawMediation[rawMediation.length - 1] ?? null  // if somehow array, take last
        : rawMediation
      : null);

  const resetMediationForm = () => {
    setMediationNote("");
    setMediationDate("");
    setMediationTime("");
  };

  // ── Add / update mediation note (PUT) ────────────────────
  const handleAddMediationNote = async () => {
    if (!mediationDate.trim()) { toast.warning("Please select a date."); return; }
    if (!mediationTime.trim()) { toast.warning("Please select a time."); return; }
    if (!mediationNote.trim()) { toast.warning("Please enter a note.");  return; }

    setAddingNote(true);
    try {
      // Send exactly what the backend expects:
      // { mediation: { date: "2026-05-19", time: "14:30", note: "..." } }
      const payload: MediationNote = {
        date: mediationDate,       // "YYYY-MM-DD" — backend stores as-is
        time: mediationTime,       // "HH:MM"
        note: mediationNote.trim(),
      };

      await addMediationNote(disputeId, { mediation: payload });

      // Optimistic update — show the new note immediately
      setLocalMediation(payload);
      resetMediationForm();
      setMediationOpen(false);
      toast.success("Mediation note saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      toast.error("Failed to save mediation note", { description: msg });
    } finally {
      setAddingNote(false);
    }
  };

  // ── Submit decision ───────────────────────────────────────
  const handleSubmitDecision = () => {
    if (!resolution)            { toast.warning("Select a resolution option first."); return; }
    if (!decisionReason.trim()) { toast.warning("Please provide a decision reason."); return; }
    setSubmitting(true);
    dispatch(resolveDisputeThunk({
      id: disputeId,
      payload: {
        resolution,
        reason: decisionReason.trim(),
        ...(resolution === "PARTIAL_REFUND_EXPERT" && partialPct
          ? { partialPercent: Number(partialPct) }
          : {}),
      },
    }))
      .unwrap()
      .then(() => { toast.success("Decision submitted successfully"); onBack(); })
      .catch((err: string) => toast.error("Failed to submit decision", { description: err }))
      .finally(() => setSubmitting(false));
  };

  const handleSaveDraft = () => { setDraftSaved(true); toast.success("Saved as draft"); };

  // ── Appeal ────────────────────────────────────────────────
  const handleAppealSubmit = () => {
    if (!appealReason.trim()) { toast.warning("Please provide a reason for the appeal."); return; }
    setAppealing(true);
    dispatch(appealDisputeThunk({ id: disputeId, payload: { reason: appealReason.trim() } }))
      .unwrap()
      .then(() => { toast.success("Appeal submitted"); setAppealOpen(false); onBack(); })
      .catch((err: string) => toast.error("Failed to submit appeal", { description: err }))
      .finally(() => setAppealing(false));
  };

  // ── Evidence arrays ───────────────────────────────────────
  const clientEvidence = dispute.clientEvidence.length > 0
    ? dispute.clientEvidence : [FALLBACK_EVIDENCE[0], FALLBACK_EVIDENCE[1]];
  const expertEvidence = dispute.expertEvidence.length > 0
    ? dispute.expertEvidence : [FALLBACK_EVIDENCE[2], FALLBACK_EVIDENCE[3]];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <style>{`
        .dd-statements   { display: flex; flex-direction: column; border-bottom: 1px solid #E5E7EB; }
        .dd-statement    { padding: 20px 24px; flex: 1; border-bottom: 1px solid #E5E7EB; background: #fff; }
        .dd-statement:last-child { border-bottom: none; }
        .dd-footer       { display: grid; grid-template-columns: repeat(3,1fr); flex-shrink: 0;
                           border-top: 1px solid #E5E7EB; background: #fff; }
        .dd-footer-btn   { padding: 16px 10px; font-size: 13px; font-weight: 500; border: none;
                           border-right: 1px solid #E5E7EB; cursor: pointer; background: none;
                           color: #6B7280; display:flex; align-items:center; justify-content:center; gap:6px; }
        .dd-footer-btn:last-child { border-right: none; }
        @media(min-width:640px){
          .dd-statements { flex-direction: row; }
          .dd-statement  { border-bottom: none; border-right: 1px solid #E5E7EB; }
          .dd-statement:last-child { border-right: none; }
          .dd-footer { display: flex; }
          .dd-footer-btn { flex: 1; }
        }
      `}</style>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "#F4F5F7" }}>

        <button onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px",
            fontWeight: 500, color: "#111827", background: "none", border: "none",
            cursor: "pointer", marginBottom: "20px" }}>
          <ArrowLeft size={16} /> Disputes
        </button>

        <div style={{ borderRadius: "16px", backgroundColor: "#ffffff",
          border: "1px solid #E5E7EB", overflow: "hidden" }}>

          {/* ── Case Information ── */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Case Information" />
            <InfoRow label="Case ID:">{dispute.id}</InfoRow>
            <InfoRow label="Job ID:">{dispute.jobId}</InfoRow>
            <InfoRow label="Opened:">{dispute.opened}</InfoRow>
            <InfoRow label="Priority:"><PriorityLabel priority={dispute.priority} /></InfoRow>
            <InfoRow label="Amount in Escrow:">{dispute.escrowAmount}</InfoRow>
            <InfoRow label="Status:"><DisputeStatusBadge status={dispute.status} /></InfoRow>
          </div>

          {/* ── Statements ── */}
          <div className="dd-statements">
            <div className="dd-statement">
              <SectionLabel text="Client Statement" />
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "#111827",
                marginBottom: "16px", lineHeight: 1.6 }}>
                &ldquo;{dispute.clientStatement}&rdquo;
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#6B7280", marginBottom: "10px" }}>Evidence:</p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                {clientEvidence.slice(0, 2).map((src, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: "10px",
                    overflow: "hidden", border: "1px solid #E5E7EB", flexShrink: 0 }}>
                    <Image src={src} alt={`Client evidence ${i + 1}`} width={64} height={64}
                      style={{ width: 64, height: 64, objectFit: "cover" }} />
                  </div>
                ))}
              </div>
              <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px",
                fontWeight: 500, border: "1px solid #2563EB", color: "#2563EB",
                background: "none", cursor: "pointer" }}>View chat Log</button>
            </div>

            <div className="dd-statement">
              <SectionLabel text="Expert Statement" />
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "#111827",
                marginBottom: "16px", lineHeight: 1.6 }}>
                &ldquo;{dispute.expertStatement}&rdquo;
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#6B7280", marginBottom: "10px" }}>Evidence:</p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                {expertEvidence.slice(0, 2).map((src, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: "10px",
                    overflow: "hidden", border: "1px solid #E5E7EB", flexShrink: 0 }}>
                    <Image src={src} alt={`Expert evidence ${i + 1}`} width={64} height={64}
                      style={{ width: 64, height: 64, objectFit: "cover" }} />
                  </div>
                ))}
              </div>
              <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px",
                fontWeight: 500, border: "1px solid #2563EB", color: "#2563EB",
                background: "none", cursor: "pointer" }}>View chat Log</button>
            </div>
          </div>

          {/* ── Mediation Note ── */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#6B7280", margin: 0 }}>Mediation Note</p>
              <button onClick={() => setMediationOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px",
                  borderRadius: "8px", border: "1px solid #2563EB", backgroundColor: "#EFF6FF",
                  color: "#2563EB", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <Plus size={13} /> {currentMediation ? "Update Note" : "Add Note"}
              </button>
            </div>

            {currentMediation ? (
              <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB",
                backgroundColor: "#F9FAFB", padding: "12px 16px",
                display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "13px" }}>
                <span style={{ fontWeight: 600, color: "#6B7280", flexShrink: 0, whiteSpace: "nowrap" }}>
                  [{currentMediation.date} {currentMediation.time}]
                </span>
                <span style={{ color: "#111827" }}>{currentMediation.note}</span>
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "#9CA3AF", fontStyle: "italic",
                padding: "12px 16px", borderRadius: "12px", border: "1px dashed #E5E7EB",
                backgroundColor: "#F9FAFB" }}>
                No mediation note yet — click Add Note to record one.
              </p>
            )}
          </div>

          {/* ── Resolution ── */}
          <div style={{ padding: "20px 24px" }}>
            <SectionLabel text="Resolution" />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {RESOLUTION_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px",
                    cursor: "pointer", fontSize: "13px", color: "#111827" }}>
                    <input type="radio" name="resolution" value={opt.value}
                      checked={resolution === opt.value}
                      onChange={() => setResolution(opt.value)}
                      style={{ width: "16px", height: "16px", accentColor: "#2563EB", flexShrink: 0 }} />
                    {opt.label}
                    {opt.hasPercent && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "#6B7280", fontSize: "13px" }}>(</span>
                        <input type="number" min={1} max={99} placeholder="__" value={partialPct}
                          onChange={(e) => setPartialPct(e.target.value)}
                          disabled={resolution !== opt.value}
                          style={{ width: "48px", padding: "2px 6px", borderRadius: "6px",
                            border: "1px solid #E5E7EB", fontSize: "13px", color: "#111827",
                            outline: "none",
                            backgroundColor: resolution === opt.value ? "#fff" : "#F9FAFB" }} />
                        <span style={{ color: "#6B7280", fontSize: "13px" }}>%)</span>
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", marginBottom: "8px" }}>
              Decision reason:
            </p>
            <textarea rows={3}
              placeholder="[Insufficient evidence of pre-damage, 70% payment...]"
              value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px",
                fontSize: "13px", outline: "none", resize: "none",
                border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
                color: "#111827", boxSizing: "border-box" }} />
          </div>
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="dd-footer">
        <button onClick={handleSubmitDecision} disabled={submitting} className="dd-footer-btn"
          style={{ color: "#111827", fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Decision"}
        </button>
        <button onClick={handleSaveDraft} disabled={draftSaved} className="dd-footer-btn"
          style={{ color: draftSaved ? "#16a34a" : "#6B7280", fontWeight: draftSaved ? 600 : 500 }}>
          {draftSaved ? "✓ Saved as Draft" : "Save Draft"}
        </button>
        <button onClick={() => setAppealOpen(true)} className="dd-footer-btn">Appeal Later</button>
      </div>

      {/* ── Add / Update Mediation Note modal ── */}
      <Modal open={mediationOpen}
        onClose={() => { setMediationOpen(false); resetMediationForm(); }}
        title={currentMediation ? "Update Mediation Note" : "Add Mediation Note"}
        size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => { setMediationOpen(false); resetMediationForm(); }}
              style={{ flex: 1, padding: "10px", borderRadius: "10px",
                border: "1px solid #E5E7EB", backgroundColor: "#fff",
                fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
              Cancel
            </button>
            <button onClick={handleAddMediationNote} disabled={addingNote}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600,
                cursor: addingNote ? "not-allowed" : "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: "8px",
                opacity: addingNote ? 0.7 : 1 }}>
              {addingNote ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Note"}
            </button>
          </div>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Pre-fill with existing note if updating */}
          {currentMediation && (
            <p style={{ fontSize: "12px", color: "#6B7280", margin: 0,
              padding: "8px 12px", backgroundColor: "#F9FAFB", borderRadius: "8px",
              border: "1px solid #E5E7EB" }}>
              Current: <strong>{currentMediation.date} {currentMediation.time}</strong> — {currentMediation.note}
            </p>
          )}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <FieldLabel text="Date" />
              <input type="date" value={mediationDate}
                onChange={(e) => setMediationDate(e.target.value)}
                style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel text="Time" />
              <input type="time" value={mediationTime}
                onChange={(e) => setMediationTime(e.target.value)}
                style={inputStyle} />
            </div>
          </div>
          <div>
            <FieldLabel text="Note" />
            <textarea rows={4}
              placeholder="e.g. Spoke with both parties, expert provided additional photos..."
              value={mediationNote} onChange={(e) => setMediationNote(e.target.value)}
              style={{ ...inputStyle, resize: "none" }} />
          </div>
        </div>
      </Modal>

      {/* ── Appeal modal ── */}
      <Modal open={appealOpen} onClose={() => setAppealOpen(false)}
        title="Appeal Later" size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setAppealOpen(false)}
              style={{ flex: 1, padding: "10px", borderRadius: "10px",
                border: "1px solid #E5E7EB", backgroundColor: "#fff",
                fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
              Cancel
            </button>
            <button onClick={handleAppealSubmit} disabled={appealing}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600,
                cursor: appealing ? "not-allowed" : "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: "8px",
                opacity: appealing ? 0.7 : 1 }}>
              {appealing ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Appeal"}
            </button>
          </div>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
            Provide a reason for appealing this dispute later. This will be logged against the case.
          </p>
          <textarea rows={4}
            placeholder="e.g. I disagree with the resolution because..."
            value={appealReason} onChange={(e) => setAppealReason(e.target.value)}
            style={{ ...inputStyle, resize: "none" }} />
        </div>
      </Modal>
    </div>
  );
}