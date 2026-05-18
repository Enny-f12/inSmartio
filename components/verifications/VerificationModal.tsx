// components/verifications/VerificationModal.tsx
"use client";

import { useState } from "react";
import { X, Eye, Download, CheckCircle2, Circle, Phone } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Expert } from "@/components/verifications/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: "12px", backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)", padding: "16px" }}>
      <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "12px" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "120px", flexShrink: 0, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-main)", wordBreak: "break-word", flex: 1 }}>{value}</span>
    </div>
  );
}

function VerifiedChip() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#16a34a" }}>
      <CheckCircle2 size={13} /> Verified
    </span>
  );
}

function PendingChip() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#d97706" }}>
      <Circle size={13} /> Pending
    </span>
  );
}

interface Props {
  expert: Expert | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function VerificationModal({ expert, onClose, onApprove, onReject }: Props) {
  const [note, setNote] = useState("");

  const footer = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button
        onClick={onApprove}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        <CheckCircle2 size={15} /> Approve
      </button>
      <button
        onClick={onReject}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        <X size={14} /> Reject
      </button>
      <button
        style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        Request More Info
      </button>
    </div>
  );

  return (
    <Modal open={!!expert} onClose={onClose} title="Verification Detail" footer={footer} size="md">
      {expert && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Expert Information */}
          <Section title="Expert Information">
            <InfoRow label="Name:"          value={expert.name.replace(".", "")} />
            <InfoRow label="Phone:"         value={expert.phone} />
            <InfoRow label="Email:"         value={expert.email} />
            <InfoRow label="Applied Tier:"  value={expert.appliedTier} />
            <InfoRow label="Submitted:"     value={expert.submitted} />
            {expert.verificationFee && (
              <InfoRow
                label="Verification Fee:"
                value={
                  <span>
                    {expert.verificationFee}
                    <span style={{ color: "var(--color-text-muted)" }}> · Paid on {expert.feePaidOn}</span>
                  </span>
                }
              />
            )}
          </Section>

          {/* Documents */}
          <Section title="Documents">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {expert.documents.map((doc) => (
                <div key={doc.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--color-text-main)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                  <button style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }} title="View"><Eye size={15} /></button>
                  <button style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }} title="Download"><Download size={15} /></button>
                  <span style={{ flexShrink: 0 }}>
                    {doc.status === "Verified" ? <VerifiedChip /> : <PendingChip />}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* NIN Verification */}
          {expert.nin && (
            <Section title="NIN Verification">
              <InfoRow label="NIN Number:" value={expert.nin.number} />
              <InfoRow label="NIN Status:" value={expert.nin.status === "Verified" ? <VerifiedChip /> : <PendingChip />} />
              <InfoRow label="Name Match:" value={expert.nin.nameMatch ? <VerifiedChip /> : <PendingChip />} />
              <InfoRow label="DOB Match:"  value={expert.nin.dobMatch ? <VerifiedChip /> : <PendingChip />} />
            </Section>
          )}

          {/* Guarantor */}
          {expert.guarantor && (
            <Section title="Guarantor Verification">
              <InfoRow label="Name:"       value={expert.guarantor.name} />
              <InfoRow label="Phone:"      value={expert.guarantor.phone} />
              <InfoRow label="Occupation:" value={expert.guarantor.occupation} />
              <InfoRow
                label="Status:"
                value={
                  <button style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}>
                    <Phone size={12} /> {expert.guarantor.status}
                  </button>
                }
              />
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginTop: "12px", marginBottom: "6px" }}>Notes</p>
              <textarea
                placeholder="enter your note...."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-main)", boxSizing: "border-box" }}
              />
            </Section>
          )}

          {/* Police Clearance */}
          {expert.policeClearance && (
            <Section title="Police Clearance Verification">
              <InfoRow label="Certificate #:" value={expert.policeClearance.certificate} />
              <InfoRow label="Issued:"         value={expert.policeClearance.issued} />
              <InfoRow label="Issuing State:"  value={expert.policeClearance.issuingState} />
              <InfoRow
                label="Status:"
                value={
                  <button style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}>
                    <Circle size={12} /> Verify Online
                  </button>
                }
              />
            </Section>
          )}

        </div>
      )}
    </Modal>
  );
}