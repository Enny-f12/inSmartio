// components/verifications/VerificationModal.tsx
"use client";

import { useState } from "react";
import { X, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { verifyExpertThunk } from "@/lib/redux/verificationSlice";
import type { ApiVerificationSummary } from "@/lib/api/verificationApi";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "130px", flexShrink: 0, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-main)", wordBreak: "break-word", flex: 1 }}>{value ?? "—"}</span>
    </div>
  );
}

interface Props {
  expert:  ApiVerificationSummary;
  onClose: () => void;
}

export default function VerificationModal({ expert, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { mutateStatus } = useAppSelector((s) => s.verifications);

  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const isMutating = mutateStatus === "loading";

  const handleApprove = () => {
    dispatch(verifyExpertThunk({ id: expert.id, payload: { action: "verify" } }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} approved`); onClose(); })
      .catch((err: string) => toast.error("Approval failed", { description: err }));
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.warning("Please provide a reason"); return; }
    dispatch(verifyExpertThunk({ id: expert.id, payload: { action: "reject", reason: rejectReason.trim() } }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} rejected`); setRejectOpen(false); onClose(); })
      .catch((err: string) => toast.error("Rejection failed", { description: err }));
  };

  const footer = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button onClick={handleApprove} disabled={isMutating}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: isMutating ? "not-allowed" : "pointer", opacity: isMutating ? 0.7 : 1, whiteSpace: "nowrap" }}>
        {isMutating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />} Approve
      </button>
      <button onClick={() => setRejectOpen(true)} disabled={isMutating}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", cursor: isMutating ? "not-allowed" : "pointer", opacity: isMutating ? 0.7 : 1, whiteSpace: "nowrap" }}>
        <X size={14} /> Reject
      </button>
      <a
        href={`mailto:${expert.email}?subject=Verification%20-%20More%20Info%20Needed&body=Dear%20${encodeURIComponent(expert.name)}%2C%0A%0AWe%20need%20more%20information%20to%20complete%20your%20verification.%0A%0AThank%20you.`}
        style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
        <ExternalLink size={13} /> Request More Info
      </a>
    </div>
  );

  return (
    <>
      <Modal open onClose={onClose} title="Verification Detail" footer={footer} size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Expert summary */}
          <div style={{ borderRadius: "12px", backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)", padding: "16px" }}>
            <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "12px" }}>
              Expert Information
            </p>
            <InfoRow label="Name:"      value={expert.name} />
            <InfoRow label="Email:"     value={expert.email} />
            <InfoRow label="Status:"    value={expert.status} />
            <InfoRow label="Submitted:" value={expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"} />
            <InfoRow label="Documents:" value={`${expert.documents} of ${expert.totalDocuments} uploaded`} />
          </div>

          {/* Document progress bar */}
          <div style={{ borderRadius: "12px", backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)", padding: "16px" }}>
            <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "12px" }}>
              Document Progress
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "6px" }}>
              <span>{expert.documents} uploaded</span>
              <span>{expert.totalDocuments} required</span>
            </div>
            <div style={{ height: "8px", borderRadius: "999px", backgroundColor: "#E5E7EB", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "999px",
                backgroundColor: expert.documents === expert.totalDocuments ? "#16a34a" : "#f59e0b",
                width: `${expert.totalDocuments > 0 ? (expert.documents / expert.totalDocuments) * 100 : 0}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
            {expert.documents < expert.totalDocuments && (
              <p style={{ fontSize: "12px", color: "#d97706", marginTop: "8px", margin: "8px 0 0" }}>
                ⚠ {expert.totalDocuments - expert.documents} document(s) still missing
              </p>
            )}
          </div>

        </div>
      </Modal>

      {/* Reject reason modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Verification" size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setRejectOpen(false)}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>
              Cancel
            </button>
            <button onClick={handleReject} disabled={isMutating}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
              {isMutating ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</> : "Confirm Reject"}
            </button>
          </div>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Reason for rejecting <strong style={{ color: "var(--color-text-main)" }}>{expert.name}</strong>&apos;s verification.
          </p>
          <textarea placeholder="e.g. Document unclear, ID expired..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3}
            style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
          />
        </div>
      </Modal>
    </>
  );
}