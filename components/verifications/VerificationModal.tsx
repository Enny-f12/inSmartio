// components/verifications/VerificationModal.tsx
"use client";

import { useState } from "react";
import { X, Eye, Download, CheckCircle2, Circle, Phone } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Expert } from "@/components/verifications/types";

// ── Small reusable pieces ────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-background border border-border p-4">
      <p className="text-[10.5px] font-bold uppercase tracking-widest text-text-muted mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[13px] mb-1.5">
      <span className="w-36 shrink-0 text-text-muted">{label}</span>
      <span className="text-text-main">{value}</span>
    </div>
  );
}

function VerifiedChip() {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-green-600">
      <CheckCircle2 size={13} /> Verified
    </span>
  );
}

function PendingChip() {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-amber-600">
      <Circle size={13} /> Pending
    </span>
  );
}

// ── Props ────────────────────────────────────────────────────

interface Props {
  expert: Expert | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

// ── Component ────────────────────────────────────────────────

export default function VerificationModal({ expert, onClose, onApprove, onReject }: Props) {
  const [note, setNote] = useState("");

  const footer = (
    <>
      <button
        onClick={onApprove}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
      >
        <CheckCircle2 size={15} />
        Approve
      </button>
      <button
        onClick={onReject}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
      >
        <X size={14} />
        Reject
      </button>
      <button className="ml-auto text-[13px] font-medium text-text-muted hover:text-text-main transition-colors">
        Request More Info
      </button>
    </>
  );

  return (
    <Modal
      open={!!expert}
      onClose={onClose}
      title="Verification Detail"
      footer={footer}
      size="md"
    >
      {expert && (
        <div className="space-y-4">

          {/* ── 1. Expert Information ── */}
          <Section title="Expert Information">
            <InfoRow label="Name:"             value={expert.name.replace(".", "")} />
            <InfoRow label="Phone:"            value={expert.phone} />
            <InfoRow label="Email:"            value={expert.email} />
            <InfoRow label="Applied Tier:"     value={expert.appliedTier} />
            <InfoRow label="Submitted:"        value={expert.submitted} />
            {expert.verificationFee && (
              <InfoRow
                label="Verification Fee:"
                value={
                  <span>
                    {expert.verificationFee}
                    <span className="text-text-muted"> · Paid on {expert.feePaidOn}</span>
                  </span>
                }
              />
            )}
          </Section>

          {/* ── 2. Documents ── */}
          <Section title="Documents">
            <div className="space-y-2.5">
              {expert.documents.map((doc) => (
                <div key={doc.name} className="flex items-center gap-3">
                  <span className="flex-1 text-[13px] text-text-main">{doc.name}</span>
                  <button className="text-primary hover:opacity-70 transition-opacity" title="View">
                    <Eye size={15} />
                  </button>
                  <button className="text-primary hover:opacity-70 transition-opacity" title="Download">
                    <Download size={15} />
                  </button>
                  <span className="w-20 text-right">
                    {doc.status === "Verified" ? <VerifiedChip /> : <PendingChip />}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 3. NIN Verification (Tier 1) ── */}
          {expert.nin && (
            <Section title="NIN Verification">
              <InfoRow label="NIN Number:" value={expert.nin.number} />
              <InfoRow
                label="NIN Status:"
                value={expert.nin.status === "Verified" ? <VerifiedChip /> : <PendingChip />}
              />
              <InfoRow
                label="Name Match:"
                value={expert.nin.nameMatch ? <VerifiedChip /> : <PendingChip />}
              />
              <InfoRow
                label="DOB Match:"
                value={expert.nin.dobMatch ? <VerifiedChip /> : <PendingChip />}
              />
            </Section>
          )}

          {/* ── 4. Guarantor Verification (Tier 3) ── */}
          {expert.guarantor && (
            <Section title="Guarantor Verification">
              <InfoRow label="Name:"       value={expert.guarantor.name} />
              <InfoRow label="Phone:"      value={expert.guarantor.phone} />
              <InfoRow label="Occupation:" value={expert.guarantor.occupation} />
              <InfoRow
                label="Status:"
                value={
                  <button className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:opacity-80 transition-opacity">
                    <Phone size={12} />
                    {expert.guarantor.status}
                  </button>
                }
              />

              {/* Notes */}
              <p className="text-[12px] font-medium text-text-muted mt-4 mb-1.5">Notes</p>
              <textarea
                placeholder="enter your note...."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none bg-white border border-border text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </Section>
          )}

          {/* ── 5. Police Clearance Verification (Tier 3) ── */}
          {expert.policeClearance && (
            <Section title="Police Clearance Verification">
              <InfoRow label="Certificate #:"  value={expert.policeClearance.certificate} />
              <InfoRow label="Issued:"         value={expert.policeClearance.issued} />
              <InfoRow label="Issuing State:"  value={expert.policeClearance.issuingState} />
              <InfoRow
                label="Status:"
                value={
                  <button className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:opacity-80 transition-opacity">
                    <Circle size={12} />
                    Verify Online
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