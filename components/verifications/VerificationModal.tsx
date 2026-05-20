// components/verifications/VerificationModal.tsx
"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Eye, Download, CheckCircle2, Circle, Phone, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

import { verifyDocument } from "@/lib/redux/verificationSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { ApiVerificationExpert } from "@/lib/api/verificationApi";

// ── Explicit Sub-Interfaces for Type Safety ────────────────
interface VerificationDocument {
  name: string;
  status: string;
}

interface NinVerification {
  number: string;
  status: string;
  nameMatch: boolean;
  dobMatch: boolean;
}

interface GuarantorVerification {
  name: string;
  phone: string;
  occupation: string;
  status: string;
}

interface PoliceClearanceVerification {
  certificate: string;
  issued: string;
  issuingState: string;
}

// Extension to safely map dynamic layout keys without hitting 'unknown' blocks
interface SafeVerificationExpert extends ApiVerificationExpert {
  appliedTier?: string;
  submitted?: string;
  verificationFee?: string | number;
  feePaidOn?: string;
}

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
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#16a34a", fontWeight: 500 }}>
      <CheckCircle2 size={13} /> Verified
    </span>
  );
}

function PendingChip() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#d97706", fontWeight: 500 }}>
      <Circle size={13} /> Pending
    </span>
  );
}

interface Props {
  expert: ApiVerificationExpert | null;
  onClose: () => void;
}

export default function VerificationModal({ expert: rawExpert, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { mutateStatus } = useSelector((state: RootState) => state.verifications);

  const [note, setNote] = useState("");
  const isMutating = mutateStatus === "loading";

  if (!rawExpert) return null;

  // Apply explicit extended interface casting
  const expert = rawExpert as SafeVerificationExpert;

  // Safe Extraction Layer via Typecasting Unknowns securely
  const expertName = expert.name ? expert.name.replace(/\./g, "") : "Unknown Expert";
  const appliedTier = expert.verification || expert.appliedTier || "Tier 1";
  const dateSubmitted = expert.createdAt ? new Date(expert.createdAt).toLocaleDateString("en-GB") : expert.submitted || "Pending";
  
  const documentList = Array.isArray(expert.documents) 
    ? (expert.documents as VerificationDocument[]) 
    : [{ name: "Primary Identification", status: expert.verify ? "Verified" : "Pending" }];

  const ninData = (expert.nin || expert.document?.nin) as NinVerification | undefined;
  const guarantorData = expert.guarantor as GuarantorVerification | undefined;
  const policeClearanceData = expert.policeClearance as PoliceClearanceVerification | undefined;

  const handleAction = async (isApproval: boolean) => {
    if (!isApproval && !note.trim()) {
      alert("Please provide a reason in the notes field for rejection.");
      return;
    }

    const payload = {
      documentKey: "all_documents", 
      verify: isApproval,
      reject: !isApproval,
      reason: !isApproval ? note : undefined,
      adminId: "current-admin-id", 
    };

    await dispatch(verifyDocument({ id: expert.id, payload }));
    onClose();
  };

  const footer = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button
        onClick={() => handleAction(true)}
        disabled={isMutating}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {isMutating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />} Approve
      </button>
      <button
        onClick={() => handleAction(false)}
        disabled={isMutating}
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
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Expert Information */}
        <Section title="Expert Information">
          <InfoRow label="Name:"          value={expertName} />
          <InfoRow label="Phone:"         value={expert.phone ?? "—"} />
          <InfoRow label="Email:"         value={expert.email} />
          <InfoRow label="Applied Tier:"  value={appliedTier} />
          <InfoRow label="Submitted:"     value={dateSubmitted} />
          {expert.verificationFee && (
            <InfoRow
              label="Verification Fee:"
              value={
                <span>
                  {String(expert.verificationFee)}
                  {expert.feePaidOn && <span style={{ color: "var(--color-text-muted)" }}> · Paid on {expert.feePaidOn}</span>}
                </span>
              }
            />
          )}
        </Section>

        {/* Documents */}
        <Section title="Documents">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {documentList.map((doc, index) => (
              <div key={doc.name || index} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ flex: 1, fontSize: "13px", color: "var(--color-text-main)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                <button style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }} title="View"><Eye size={15} /></button>
                <button style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }} title="Download"><Download size={15} /></button>
                <span style={{ flexShrink: 0 }}>
                  {doc.status === "Verified" || expert.verify ? <VerifiedChip /> : <PendingChip />}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* NIN Verification */}
        {ninData && (
          <Section title="NIN Verification">
            <InfoRow label="NIN Number:" value={ninData.number ?? "—"} />
            <InfoRow label="NIN Status:" value={ninData.status === "Verified" ? <VerifiedChip /> : <PendingChip />} />
            <InfoRow label="Name Match:" value={ninData.nameMatch ? <VerifiedChip /> : <PendingChip />} />
            <InfoRow label="DOB Match:"  value={ninData.dobMatch ? <VerifiedChip /> : <PendingChip />} />
          </Section>
        )}

        {/* Guarantor Verification */}
        {guarantorData && (
          <Section title="Guarantor Verification">
            <InfoRow label="Name:"       value={guarantorData.name} />
            <InfoRow label="Phone:"      value={guarantorData.phone} />
            <InfoRow label="Occupation:" value={guarantorData.occupation} />
            <InfoRow
              label="Status:"
              value={
                <button style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}>
                  <Phone size={12} /> {guarantorData.status}
                </button>
              }
            />
            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginTop: "12px", marginBottom: "6px" }}>Rejection Notes / Internal Memo</p>
            <textarea
              placeholder="Provide context details if choosing to reject this documentation layer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid var(--color-border)", backgroundColor: "#fff", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          </Section>
        )}

        {/* Police Clearance Verification */}
        {policeClearanceData && (
          <Section title="Police Clearance Verification">
            <InfoRow label="Certificate #:" value={policeClearanceData.certificate} />
            <InfoRow label="Issued:"         value={policeClearanceData.issued} />
            <InfoRow label="Issuing State:"  value={policeClearanceData.issuingState} />
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
    </Modal>
  );
}