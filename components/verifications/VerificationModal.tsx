// components/verifications/VerificationModal.tsx
"use client";

import { useState } from "react";
import { X, CheckCircle2, Circle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { verifyDocument } from "@/lib/redux/verificationSlice";
import type { ApiVerificationExpert } from "@/lib/api/verificationApi";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: "12px", backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)", padding: "16px" }}>
      <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "12px" }}>{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "130px", flexShrink: 0, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-main)", wordBreak: "break-word", flex: 1 }}>{value ?? "—"}</span>
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
  expert:  ApiVerificationExpert;
  onClose: () => void;
}

export default function VerificationModal({ expert, onClose }: Props) {
  const dispatch = useAppDispatch();
  const adminId  = useAppSelector((s) => (s.auth.admin as { id?: string } | null)?.id ?? "");
  const { mutateStatus } = useAppSelector((s) => s.verifications);

  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const isMutating = mutateStatus === "loading";

  const handleApprove = () => {
    dispatch(verifyDocument({
      id: expert.id,
      payload: { documentKey: "all", verify: true, reject: false, adminId },
    }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} approved`); onClose(); })
      .catch((err: string) => toast.error("Approval failed", { description: err }));
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.warning("Please provide a reason"); return; }
    dispatch(verifyDocument({
      id: expert.id,
      payload: { documentKey: "all", verify: false, reject: true, reason: rejectReason.trim(), adminId },
    }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} rejected`); setRejectOpen(false); onClose(); })
      .catch((err: string) => toast.error("Rejection failed", { description: err }));
  };

  const loc  = expert.location;
  const locationStr = loc ? [loc.area, loc.city, loc.state, loc.country].filter(Boolean).join(", ") : "—";

  const skill = expert.skill;
  const bank  = expert.bankDetails as { bankName?: string; accountNo?: string } | undefined;
  const docs  = expert.verificationDocument as Record<string, string | undefined> | undefined;

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
      {/* Request More Info → opens expert's email */}
      <a href={`mailto:${expert.email}?subject=Verification%20Request%20-%20More%20Info%20Needed&body=Dear%20${encodeURIComponent(expert.name)}%2C%0A%0AWe%20need%20more%20information%20to%20complete%20your%20verification.%0A%0APlease%20provide%3A%0A%0AThank%20you.`}
        style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
        <ExternalLink size={13} /> Request More Info
      </a>
    </div>
  );

  return (
    <>
      <Modal open onClose={onClose} title="Verification Detail" footer={footer} size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Expert Info */}
          <Section title="Expert Information">
            <InfoRow label="Name:"          value={expert.name} />
            <InfoRow label="Phone:"         value={expert.phone} />
            <InfoRow label="Email:"         value={expert.email} />
            <InfoRow label="Gender:"        value={expert.gender} />
            <InfoRow label="Bio:"           value={expert.bio} />
            <InfoRow label="Payment Model:" value={expert.paymentModel} />
            <InfoRow label="Location:"      value={locationStr} />
          </Section>

          {/* Skill */}
          {skill && (
            <Section title="Skill Information">
              <InfoRow label="Role:"        value={skill.role} />
              <InfoRow label="Experience:"  value={skill.experience} />
              <InfoRow label="Area:"        value={skill.area} />
              <InfoRow label="Description:" value={skill.description} />
            </Section>
          )}

          {/* Categories */}
          {expert.category && (expert.category as string[]).length > 0 && (
            <Section title="Categories">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(expert.category as string[]).map((c, i) => (
                  <span key={i} style={{ fontSize: "12px", fontWeight: 500, padding: "4px 12px", borderRadius: "999px", backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Verification Documents */}
          <Section title="Verification Documents">
            {!docs || Object.keys(docs).length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No documents uploaded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(docs).map(([key, url]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ flex: 1, fontSize: "13px", color: "var(--color-text-main)", textTransform: "capitalize" }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}>
                        <ExternalLink size={13} /> View
                      </a>
                    ) : null}
                    <span style={{ flexShrink: 0 }}>{url ? <VerifiedChip /> : <PendingChip />}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Bank Details */}
          {bank && (
            <Section title="Bank Details">
              <InfoRow label="Bank Name:"    value={bank.bankName} />
              <InfoRow label="Account No:"  value={bank.accountNo} />
            </Section>
          )}

        </div>
      </Modal>

      {/* Reject reason modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Verification" size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setRejectOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
            <button onClick={handleReject} disabled={isMutating}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
              {isMutating ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</> : "Confirm Reject"}
            </button>
          </div>
        }
      >
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