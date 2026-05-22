// components/verifications/VerificationModal.tsx
"use client";

import { useState } from "react";
import { X, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { verifyExpertThunk } from "@/lib/redux/verificationSlice";
import type { VerificationTier, VerificationType } from "@/lib/api/verificationApi";
import type { ApiVerificationDetail } from "@/lib/api/verificationApi";

const toApiType = (tier?: VerificationTier): VerificationType =>
  tier === "tier3" ? "tas" : "expert";

function SectionTitle({ title }: { title: string }) {
  return (
    <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280", margin: "0 0 12px" }}>
      {title}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "140px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", wordBreak: "break-word", flex: 1 }}>{value ?? "—"}</span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", marginBottom: "12px", backgroundColor: "#F9FAFB" }}>
      {children}
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

function UnverifiedChip() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#d97706", fontWeight: 500 }}>
      <Circle size={13} /> Not Verified
    </span>
  );
}

interface Props {
  expert:  ApiVerificationDetail | null; // null while loading
  onClose: () => void;
}

export default function VerificationModal({ expert, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { mutateStatus, selectedStatus, selectedSummary } = useAppSelector((s) => s.verifications);

  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isMutating      = mutateStatus   === "loading";
  const isLoadingDetail = selectedStatus === "loading";

  // Derive tier from summary (needed for PUT type param)
  const summaryTier = selectedSummary?.tier;

  // ── Approve ──────────────────────────────────────────────────
  const handleApprove = () => {
    if (!expert || !selectedSummary) return;
    dispatch(verifyExpertThunk({
      id:      expert.id,
      type:    toApiType(summaryTier),
      payload: { verify: true },
    }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} approved`); onClose(); })
      .catch((err: string) => toast.error("Approval failed", { description: err }));
  };

  // ── Reject ───────────────────────────────────────────────────
  const handleReject = () => {
    if (!expert || !selectedSummary) return;
    if (!rejectReason.trim()) { toast.warning("Please provide a reason"); return; }
    dispatch(verifyExpertThunk({
      id:      expert.id,
      type:    toApiType(summaryTier),
      payload: { reject: true, reason: rejectReason.trim() },
    }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} rejected`); setRejectOpen(false); onClose(); })
      .catch((err: string) => toast.error("Rejection failed", { description: err }));
  };

  const mailtoHref = expert
    ? `mailto:${expert.email}` +
      `?subject=${encodeURIComponent("Verification – More Information Needed")}` +
      `&body=${encodeURIComponent(`Dear ${expert.name},\n\nWe have reviewed your verification application and need some additional information before we can proceed.\n\nPlease respond to this email with the requested details at your earliest convenience.\n\nThank you.`)}`
    : "#";

  const footer = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button onClick={handleApprove} disabled={isMutating || !expert}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: (isMutating || !expert) ? "not-allowed" : "pointer", opacity: (isMutating || !expert) ? 0.7 : 1 }}>
        {isMutating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />} Approve
      </button>
      <button onClick={() => setRejectOpen(true)} disabled={isMutating || !expert}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", cursor: (isMutating || !expert) ? "not-allowed" : "pointer", opacity: (isMutating || !expert) ? 0.7 : 1 }}>
        <X size={14} /> Reject
      </button>
      <a href={mailtoHref}
        style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 500, color: "#6B7280", textDecoration: "none", pointerEvents: !expert ? "none" : "auto", opacity: !expert ? 0.4 : 1 }}>
        Request More Info
      </a>
    </div>
  );

  return (
    <>
      <Modal open onClose={onClose} title="Verification Detail" footer={!isLoadingDetail ? footer : undefined} size="md">

        {isLoadingDetail ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", gap: "8px", color: "#9CA3AF", fontSize: "14px" }}>
            <Loader2 size={18} className="animate-spin" /> Loading details...
          </div>

        ) : !expert ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", fontSize: "14px", color: "#ef4444" }}>
            Failed to load verification detail.
          </div>

        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* Expert Information */}
            <Card>
              <SectionTitle title="Expert Information" />
              <InfoRow label="Name:"          value={expert.name} />
              <InfoRow label="Email:"         value={expert.email} />
              <InfoRow label="Phone:"         value={expert.phone} />
              <InfoRow label="Gender:"        value={expert.gender} />
              <InfoRow label="Role:"          value={expert.role} />
              <InfoRow label="Category:"      value={expert.category} />
              <InfoRow label="Skills:"        value={expert.skill?.join(", ")} />
              <InfoRow label="Tier:"          value={`Tier ${expert.tier}`} />
              <InfoRow label="Verification:"  value={expert.verification} />
              <InfoRow label="Verified:"      value={expert.verify ? <VerifiedChip /> : <UnverifiedChip />} />
              <InfoRow label="Status:"        value={expert.status} />
              <InfoRow label="Payment Model:" value={expert.paymentModel} />
              <InfoRow label="Joined:"        value={new Date(expert.createdAt).toLocaleDateString("en-GB")} />
            </Card>

            {/* Location */}
            <Card>
              <SectionTitle title="Location" />
              <InfoRow label="Address:" value={expert.location?.address} />
              <InfoRow label="City:"    value={expert.location?.city} />
              <InfoRow label="State:"   value={expert.location?.state} />
            </Card>

            {/* KYC / Document */}
            <Card>
              <SectionTitle title="KYC Document" />
              <InfoRow label="Type:"     value={expert.document?.kycType} />
              <InfoRow label="Number:"   value={expert.document?.number} />
              <InfoRow label="Verified:" value={expert.document?.verified ? <VerifiedChip /> : <UnverifiedChip />} />
            </Card>

            {/* Bank Details */}
            {expert.bankDetails && (
              <Card>
                <SectionTitle title="Bank Details" />
                <InfoRow label="Bank:"           value={expert.bankDetails.bankName} />
                <InfoRow label="Account Name:"   value={expert.bankDetails.accountName} />
                <InfoRow label="Account Number:" value={expert.bankDetails.accountNumber} />
              </Card>
            )}

            {/* Bio */}
            {expert.bio && (
              <Card>
                <SectionTitle title="Bio" />
                <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, margin: 0 }}>{expert.bio}</p>
              </Card>
            )}

          </div>
        )}
      </Modal>

      {/* Reject modal */}
      {expert && (
        <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Verification" size="sm"
          footer={
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button onClick={() => setRejectOpen(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={isMutating}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: isMutating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
                {isMutating ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</> : "Confirm Reject"}
              </button>
            </div>
          }>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
              Reason for rejecting <strong style={{ color: "#111827" }}>{expert.name}</strong>&apos;s verification.
            </p>
            <textarea placeholder="e.g. Document unclear, ID expired..." value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)} rows={3}
              style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
          </div>
        </Modal>
      )}
    </>
  );
}