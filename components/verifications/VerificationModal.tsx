// components/verifications/VerificationModal.tsx
"use client";

import { useState } from "react";
import { X, CheckCircle2, Circle, Loader2, Eye, Download, Phone } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { verifyExpertThunk } from "@/lib/redux/verificationSlice";
import type { ApiVerificationSummary } from "@/lib/api/verificationApi";

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
      <span style={{ minWidth: "130px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
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
  return <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#16a34a", fontWeight: 500 }}><CheckCircle2 size={13} /> Verified</span>;
}
function PendingChip() {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#d97706", fontWeight: 500 }}><Circle size={13} /> Pending</span>;
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
  const [notes,        setNotes]        = useState(expert.notes ?? "");
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
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: isMutating ? "not-allowed" : "pointer", opacity: isMutating ? 0.7 : 1 }}>
        {isMutating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />} Approve
      </button>
      <button onClick={() => setRejectOpen(true)} disabled={isMutating}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", cursor: isMutating ? "not-allowed" : "pointer", opacity: isMutating ? 0.7 : 1 }}>
        <X size={14} /> Reject
      </button>
      <a href={`mailto:${expert.email}?subject=Verification%20-%20More%20Info%20Needed&body=Dear%20${encodeURIComponent(expert.name)}%2C%0A%0AWe%20need%20more%20information%20to%20complete%20your%20verification.%0A%0AThank%20you.`}
        style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 500, color: "#6B7280", textDecoration: "none" }}>
        Request More Info
      </a>
    </div>
  );

  return (
    <>
      <Modal open onClose={onClose} title="Verification Detail" footer={footer} size="md">
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Expert Information */}
          <Card>
            <SectionTitle title="Expert Information" />
            <InfoRow label="Name:"             value={expert.name} />
            <InfoRow label="Phone:"            value={expert.phone} />
            <InfoRow label="Email:"            value={expert.email} />
            <InfoRow label="Applied Tier:"     value={expert.appliedTier} />
            <InfoRow label="Submitted:"        value={expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"} />
            {expert.verificationFee && (
              <InfoRow label="Verification Fee:" value={expert.verificationFee} />
            )}
          </Card>

          {/* Documents */}
          {expert.verificationDocuments && expert.verificationDocuments.length > 0 && (
            <Card>
              <SectionTitle title="Documents" />
              {expert.verificationDocuments.map((doc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: i < expert.verificationDocuments!.length - 1 ? "10px" : 0 }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{doc.name}</span>
                  {doc.url && (
                    <>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        style={{ color: "#2563eb", display: "flex", alignItems: "center" }} title="View">
                        <Eye size={15} />
                      </a>
                      <a href={doc.url} download
                        style={{ color: "#2563eb", display: "flex", alignItems: "center" }} title="Download">
                        <Download size={15} />
                      </a>
                    </>
                  )}
                  <span style={{ flexShrink: 0 }}>
                    {doc.status === "verified" ? <VerifiedChip /> : <PendingChip />}
                  </span>
                </div>
              ))}
            </Card>
          )}

          {/* Guarantor Verification */}
          {expert.guarantor && (
            <Card>
              <SectionTitle title="Guarantor Verification" />
              <InfoRow label="Name:"       value={expert.guarantor.name} />
              <InfoRow label="Phone:"      value={
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {expert.guarantor.phone}
                  <a href={`tel:${expert.guarantor.phone}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                    <Phone size={12} /> Call Guarantor
                  </a>
                </span>
              } />
              <InfoRow label="Occupation:" value={expert.guarantor.occupation} />
              {expert.guarantor.status && <InfoRow label="Status:" value={expert.guarantor.status} />}
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", marginBottom: "6px" }}>Notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="enter your note...."
                  rows={3}
                  style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#111827", boxSizing: "border-box" }}
                />
              </div>
            </Card>
          )}

          {/* Police Clearance */}
          {expert.policeClearance && (
            <Card>
              <SectionTitle title="Police Clearance Verification" />
              <InfoRow label="Certificate #:"  value={expert.policeClearance.certificateNo} />
              <InfoRow label="Issued:"         value={expert.policeClearance.issued} />
              <InfoRow label="Issuing State:"  value={expert.policeClearance.issuingState} />
              <InfoRow label="Status:"         value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6B7280" }}>
                  <Circle size={13} /> {expert.policeClearance.status}
                </span>
              } />
            </Card>
          )}

          {/* NIN Verification */}
          {expert.ninVerification && (
            <Card>
              <SectionTitle title="NIN Verification" />
              <InfoRow label="NIN Number:"  value={expert.ninVerification.ninNumber} />
              <InfoRow label="NIN Status:"  value={<VerifiedChip />} />
              <InfoRow label="Name Match:"  value={expert.ninVerification.nameMatch ? <VerifiedChip /> : <PendingChip />} />
              <InfoRow label="DOB Match:"   value={expert.ninVerification.dobMatch  ? <VerifiedChip /> : <PendingChip />} />
            </Card>
          )}

          {/* No detail available fallback */}
          {!expert.verificationDocuments && !expert.guarantor && !expert.policeClearance && !expert.ninVerification && (
            <Card>
              <SectionTitle title="Document Progress" />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6B7280", marginBottom: "6px" }}>
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
                <p style={{ fontSize: "12px", color: "#d97706", marginTop: "8px" }}>
                  ⚠ {expert.totalDocuments - expert.documents} document(s) still missing
                </p>
              )}
            </Card>
          )}

        </div>
      </Modal>

      {/* Reject modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Verification" size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setRejectOpen(false)}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
              Cancel
            </button>
            <button onClick={handleReject} disabled={isMutating}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
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
            style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
          />
        </div>
      </Modal>
    </>
  );
}