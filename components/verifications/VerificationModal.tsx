"use client";

import { useState } from "react";
import { X, CheckCircle2, Clock, Eye, Download, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { verifyExpertThunk } from "@/lib/redux/verificationSlice";
import type {
  VerificationTier,
  VerificationType,
  ApiVerificationDetail,
  ApiVerificationSummary,
  VerificationDocument,
} from "@/lib/api/verificationApi";

const toApiType = (tier?: VerificationTier): VerificationType =>
  tier === "tier3" ? "tas" : "expert";

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280", margin: "0 0 14px" }}>
      {title}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "10px", alignItems: "flex-start" }}>
      <span style={{ width: "140px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", flex: 1, wordBreak: "break-word" }}>{value ?? "—"}</span>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#F9FAFB", borderRadius: "12px", padding: "16px 18px", marginBottom: "12px" }}>
      {children}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#16a34a", fontWeight: 500 }}>
      <CheckCircle2 size={13} /> Verified
    </span>
  );
}

function PendingBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#d97706", fontWeight: 500 }}>
      <Clock size={13} /> Pending
    </span>
  );
}

function YesChip() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#16a34a" }}>
      <CheckCircle2 size={13} /> Yes
    </span>
  );
}

function DocumentRow({ doc }: { doc: VerificationDocument }) {
  const isVerified = doc.status === "verified";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{doc.name}</span>
      {doc.url && doc.url !== "#" ? (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: "#9CA3AF", display: "flex" }}>
            <Eye size={16} strokeWidth={1.8} />
          </a>
          <a href={doc.url} download style={{ color: "#9CA3AF", display: "flex" }}>
            <Download size={16} strokeWidth={1.8} />
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ color: "#D1D5DB", display: "flex" }}><Eye size={16} strokeWidth={1.8} /></span>
          <span style={{ color: "#D1D5DB", display: "flex" }}><Download size={16} strokeWidth={1.8} /></span>
        </div>
      )}
      <div style={{ minWidth: "72px", textAlign: "right" }}>
        {isVerified ? <VerifiedBadge /> : <PendingBadge />}
      </div>
    </div>
  );
}

// ── Shared expert info header (same for all tiers) ────────────────────────────

function ExpertInfoSection({
  detail, summary, showFee = false,
}: {
  detail: ApiVerificationDetail;
  summary: ApiVerificationSummary;
  showFee?: boolean;
}) {
  return (
    <Section>
      <SectionTitle title="Expert Information" />
      <InfoRow label="Name:"         value={detail.name} />
      <InfoRow label="Phone:"        value={detail.phone} />
      <InfoRow label="Email:"        value={detail.email} />
      <InfoRow label="Applied Tier:" value={summary.appliedTier ?? summary.tier} />
      <InfoRow label="Submitted:"    value={summary.submitted ? new Date(summary.submitted).toLocaleDateString("en-GB") : "—"} />
      {showFee && summary.verificationFee && (
        <InfoRow label="Verification Fee:" value={summary.verificationFee} />
      )}
    </Section>
  );
}

// ── Tier 1 & 2: Expert Info + Documents + NIN Verification ───────────────────

function Tier12Content({ detail, summary }: { detail: ApiVerificationDetail; summary: ApiVerificationSummary }) {
  const nin  = summary.ninVerification;
  const docs = summary.verificationDocuments ?? [];

  return (
    <>
      <ExpertInfoSection detail={detail} summary={summary} showFee={false} />

      <Section>
        <SectionTitle title="Documents" />
        {docs.map((doc, i) => <DocumentRow key={i} doc={doc} />)}
      </Section>

      {nin && (
        <Section>
          <SectionTitle title="NIN Verification" />
          <InfoRow label="NIN Number:" value={nin.ninNumber} />
          <InfoRow label="NIN Status:"  value={nin.ninStatus === "Verified" ? <VerifiedBadge /> : nin.ninStatus} />
          <InfoRow label="Name Match:"  value={nin.nameMatch ? <YesChip /> : "No"} />
          <InfoRow label="DOB Match:"   value={nin.dobMatch  ? <YesChip /> : "No"} />
        </Section>
      )}
    </>
  );
}

// ── Tier 3: Expert Info + Documents + Guarantor + Police Clearance ────────────

function Tier3Content({
  detail, summary, notes, setNotes,
}: {
  detail:    ApiVerificationDetail;
  summary:   ApiVerificationSummary;
  notes:     string;
  setNotes:  (v: string) => void;
}) {
  const docs      = summary.verificationDocuments ?? [];
  const guarantor = summary.guarantor;
  const policeClr = summary.policeClearance;

  return (
    <>
      <ExpertInfoSection detail={detail} summary={summary} showFee={true} />

      <Section>
        <SectionTitle title="Documents" />
        {docs.map((doc, i) => <DocumentRow key={i} doc={doc} />)}
      </Section>

      {guarantor && (
        <Section>
          <SectionTitle title="Guarantor Verification" />
          <InfoRow label="Name:"       value={guarantor.name} />
          <InfoRow label="Phone:"      value={guarantor.phone} />
          <InfoRow label="Occupation:" value={guarantor.occupation} />
          <InfoRow label="Status:"
            value={
              <a href={`tel:${guarantor.phone}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", textDecoration: "none", fontWeight: 500 }}>
                <Phone size={13} /> Call Guarantor
              </a>
            }
          />
          <div style={{ marginTop: "10px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "6px", fontWeight: 500 }}>Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="enter your note…."
              rows={3}
              style={{ width: "100%", borderRadius: "8px", border: "1px solid #E5E7EB", padding: "10px 12px", fontSize: "13px", color: "#111827", backgroundColor: "#fff", resize: "none", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </Section>
      )}

      {policeClr && (
        <Section>
          <SectionTitle title="Police Clearance Verification" />
          <InfoRow label="Certificate #:" value={policeClr.certificateNo} />
          <InfoRow label="Issued:"         value={policeClr.issued} />
          <InfoRow label="Issuing State:"  value={policeClr.issuingState} />
          <InfoRow label="Status:"
            value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", fontWeight: 500 }}>
                <CheckCircle2 size={13} color="#16a34a" /> {policeClr.status}
              </span>
            }
          />
        </Section>
      )}
    </>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  expert:  ApiVerificationDetail | null;
  onClose: () => void;
}

export default function VerificationModal({ expert, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { mutateStatus, selectedStatus, selectedSummary } = useAppSelector((s) => s.verifications);

  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [notes,        setNotes]        = useState("");

  const isMutating      = mutateStatus   === "loading";
  const isLoadingDetail = selectedStatus === "loading";

  // tier comes from the summary (VerificationTier string), not from ApiVerificationDetail
  // (ApiVerificationDetail.tier is a number — the API sends back the expert's current tier level)
  const summaryTier: VerificationTier = selectedSummary?.tier ?? "tier1";

  const handleApprove = () => {
    if (!expert || !selectedSummary) return;
    dispatch(verifyExpertThunk({ id: expert.id, type: toApiType(summaryTier), payload: { verify: true } }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} approved`); onClose(); })
      .catch((err: string) => toast.error("Approval failed", { description: err }));
  };

  const handleReject = () => {
    if (!expert || !selectedSummary) return;
    if (!rejectReason.trim()) { toast.warning("Please provide a reason"); return; }
    dispatch(verifyExpertThunk({ id: expert.id, type: toApiType(summaryTier), payload: { reject: true, reason: rejectReason.trim() } }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} rejected`); setRejectOpen(false); onClose(); })
      .catch((err: string) => toast.error("Rejection failed", { description: err }));
  };

  const mailtoHref = expert
    ? `mailto:${expert.email}?subject=${encodeURIComponent("Verification – More Information Needed")}&body=${encodeURIComponent(`Dear ${expert.name},\n\nWe have reviewed your verification application and need some additional information before we can proceed.\n\nPlease respond to this email with the requested details at your earliest convenience.\n\nThank you.`)}`
    : "#";

  const footer = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button onClick={handleApprove} disabled={isMutating || !expert}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 24px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: (isMutating || !expert) ? "not-allowed" : "pointer", opacity: (isMutating || !expert) ? 0.7 : 1 }}>
        {isMutating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
        Approve
      </button>

      <button onClick={() => setRejectOpen(true)} disabled={isMutating || !expert}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 22px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fff", border: "1.5px solid #fecaca", cursor: (isMutating || !expert) ? "not-allowed" : "pointer", opacity: (isMutating || !expert) ? 0.7 : 1 }}>
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
        ) : !expert || !selectedSummary ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", fontSize: "14px", color: "#ef4444" }}>
            Failed to load verification detail.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(summaryTier === "tier1" || summaryTier === "tier2") && (
              <Tier12Content detail={expert} summary={selectedSummary} />
            )}
            {summaryTier === "tier3" && (
              <Tier3Content detail={expert} summary={selectedSummary} notes={notes} setNotes={setNotes} />
            )}
          </div>
        )}
      </Modal>

      {expert && (
        <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Verification" size="sm"
          footer={
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button onClick={() => setRejectOpen(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
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