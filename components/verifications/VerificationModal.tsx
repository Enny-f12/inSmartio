"use client";

import { useState } from "react";
import { X, CheckCircle2, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { verifyExpertThunk } from "@/lib/redux/verificationSlice";
import type {
  VerificationTier,
  VerificationType,
  ApiVerificationDetail,
  ApiVerificationSummary,
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

// ── Document row with checkbox + view/download ────────────────────────────────

interface DocItem {
  name:      string;
  url?:      string;   // base64 data URI or real URL; undefined/empty = not uploaded
  checked:   boolean;
  onChange:  () => void;
}

function DocumentRow({ doc }: { doc: DocItem }) {
  const hasFile = !!doc.url && doc.url.length > 10;

  if (!hasFile) {
    // Not uploaded — show N/A
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
        <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{doc.name}</span>
        <span style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>N/A</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{doc.name}</span>
      {/* View */}
      <a href={doc.url} target="_blank" rel="noreferrer"
        style={{ color: "#9CA3AF", display: "flex", alignItems: "center" }} title="View">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </a>
      {/* Download */}
      <a href={doc.url} download={`${doc.name}.pdf`}
        style={{ color: "#9CA3AF", display: "flex", alignItems: "center" }} title="Download">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </a>
      {/* Verified checkbox */}
      <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "12px", color: doc.checked ? "#16a34a" : "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>
        <input
          type="checkbox"
          checked={doc.checked}
          onChange={doc.onChange}
          style={{ accentColor: "#16a34a", width: 14, height: 14 }}
        />
        Verified
      </label>
    </div>
  );
}

// ── Build doc list from detail.document (real API shape) ──────────────────────

const DOC_MAP = [
  { key: "ninSlip",  label: "NIN Slip"              },
  { key: "validId",  label: "Valid ID (National ID)" },
  { key: "passport", label: "Passport Photograph"    },
];

const NAME_TO_KEY: Record<string, string> = {
  "NIN Slip":              "ninSlip",
  "Valid ID (National ID)":"validId",
  "Passport Photograph":   "passport",
  "BVN Consent Form":      "bvn",
  "Proof of Address":      "proofOfAddress",
  "Guarantor Form":        "guarantorForm",
  "Police Clearance":      "policeClearance",
  "CAC Certificate":       "cacCertificate",
};

function buildDocs(detail: ApiVerificationDetail, summary: ApiVerificationSummary) {
  const raw = detail.document as Record<string, unknown> | null;

  // If summary has named documents, use those with URLs from detail.document
  if (summary.verificationDocuments && summary.verificationDocuments.length > 0) {
    return summary.verificationDocuments.map((d) => {
      const key = NAME_TO_KEY[d.name] ?? "";
      const val = raw ? raw[key] : undefined;
      const url = typeof val === "string" && val.length > 10 ? val : (d.url && d.url !== "#" ? d.url : undefined);
      return { name: d.name, url, key };
    });
  }

  // Fall back to detail.document fields
  if (!raw) return [];
  return DOC_MAP.map(({ key, label }) => {
    const val = raw[key];
    const url = typeof val === "string" && val.length > 10 ? val : undefined;
    return { name: label, url, key };
  });
}

// ── Expert Info section ───────────────────────────────────────────────────────

function ExpertInfoSection({ detail, summary, showFee = false }: {
  detail: ApiVerificationDetail; summary: ApiVerificationSummary; showFee?: boolean;
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

// ── Tier 1 & 2 ────────────────────────────────────────────────────────────────

function Tier12Content({ detail, summary, docChecks, onToggle }: {
  detail: ApiVerificationDetail; summary: ApiVerificationSummary;
  docChecks: Record<string, boolean>; onToggle: (key: string) => void;
}) {
  const nin  = summary.ninVerification;
  const docs = buildDocs(detail, summary);

  return (
    <>
      <ExpertInfoSection detail={detail} summary={summary} showFee={false} />
      <Section>
        <SectionTitle title="Documents" />
        {docs.map((doc) => (
          <DocumentRow key={doc.key} doc={{ name: doc.name, url: doc.url, checked: !!docChecks[doc.key], onChange: () => onToggle(doc.key) }} />
        ))}
      </Section>

      {/* NIN Verification — always show, with checkboxes */}
      <Section>
        <SectionTitle title="NIN Verification" />

        {/* NIN Number row */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0", borderBottom: "1px solid #F3F4F6", fontSize: "13px" }}>
          <span style={{ width: "140px", flexShrink: 0, color: "#6B7280" }}>NIN Number:</span>
          <span style={{ color: "#111827", flex: 1, fontFamily: "monospace", fontWeight: 600 }}>
            {nin?.ninNumber ?? "—"}
          </span>
        </div>

        {/* NIN Status checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
          <span style={{ width: "140px", flexShrink: 0, fontSize: "13px", color: "#6B7280" }}>NIN Status:</span>
          <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{nin?.ninStatus ?? "—"}</span>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "12px", color: docChecks["ninStatus"] ? "#16a34a" : "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={!!docChecks["ninStatus"]} onChange={() => onToggle("ninStatus")} style={{ accentColor: "#16a34a", width: 14, height: 14 }} />
            Verified
          </label>
        </div>

        {/* Name Match checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
          <span style={{ width: "140px", flexShrink: 0, fontSize: "13px", color: "#6B7280" }}>Name Match:</span>
          <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{nin?.nameMatch ? "Yes" : "No"}</span>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "12px", color: docChecks["ninNameMatch"] ? "#16a34a" : "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={!!docChecks["ninNameMatch"]} onChange={() => onToggle("ninNameMatch")} style={{ accentColor: "#16a34a", width: 14, height: 14 }} />
            Verified
          </label>
        </div>

        {/* DOB Match checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0" }}>
          <span style={{ width: "140px", flexShrink: 0, fontSize: "13px", color: "#6B7280" }}>DOB Match:</span>
          <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{nin?.dobMatch ? "Yes" : "No"}</span>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "12px", color: docChecks["ninDobMatch"] ? "#16a34a" : "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={!!docChecks["ninDobMatch"]} onChange={() => onToggle("ninDobMatch")} style={{ accentColor: "#16a34a", width: 14, height: 14 }} />
            Verified
          </label>
        </div>
      </Section>
    </>
  );
}

// ── Tier 3 ────────────────────────────────────────────────────────────────────

function Tier3Content({ detail, summary, notes, setNotes, docChecks, onToggle }: {
  detail: ApiVerificationDetail; summary: ApiVerificationSummary;
  notes: string; setNotes: (v: string) => void;
  docChecks: Record<string, boolean>; onToggle: (key: string) => void;
}) {
  const docs      = buildDocs(detail, summary);
  const guarantor = summary.guarantor;
  const policeClr = summary.policeClearance;

  return (
    <>
      <ExpertInfoSection detail={detail} summary={summary} showFee={true} />
      <Section>
        <SectionTitle title="Documents" />
        {docs.map((doc) => (
          <DocumentRow key={doc.key} doc={{ name: doc.name, url: doc.url, checked: !!docChecks[doc.key], onChange: () => onToggle(doc.key) }} />
        ))}
      </Section>
      {guarantor && (
        <Section>
          <SectionTitle title="Guarantor Verification" />
          <InfoRow label="Name:"       value={guarantor.name} />
          <InfoRow label="Phone:"      value={guarantor.phone} />
          <InfoRow label="Occupation:" value={guarantor.occupation} />
          <InfoRow label="Status:"
            value={
              <a href={`tel:${guarantor.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", textDecoration: "none", fontWeight: 500 }}>
                <Phone size={13} /> Call Guarantor
              </a>
            }
          />
          <div style={{ marginTop: "10px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "6px", fontWeight: 500 }}>Notes</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="enter your note…." rows={3}
              style={{ width: "100%", borderRadius: "8px", border: "1px solid #E5E7EB", padding: "10px 12px", fontSize: "13px", color: "#111827", backgroundColor: "#fff", resize: "none", outline: "none", boxSizing: "border-box" }} />
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

// ── Main Modal ────────────────────────────────────────────────────────────────

interface Props {
  expert:         ApiVerificationDetail | null;
  onClose:        () => void;
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
}

export default function VerificationModal({ expert, onClose, onStatusChange }: Props) {
  const dispatch = useAppDispatch();
  const { mutateStatus, selectedStatus, selectedSummary } = useAppSelector((s) => s.verifications);
  const { admin } = useAppSelector((s) => s.auth);

  const [approveOpen,  setApproveOpen]  = useState(false);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [notes,        setNotes]        = useState("");
  const [docChecks,    setDocChecks]    = useState<Record<string, boolean>>({});

  const isMutating      = mutateStatus   === "loading";
  const isLoadingDetail = selectedStatus === "loading";
  const summaryTier: VerificationTier = selectedSummary?.tier ?? "tier1";
  const adminId = admin?.id ?? "";

  const toggleDoc = (key: string) =>
    setDocChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const getDocumentKey = () => {
    const docs = selectedSummary?.verificationDocuments;
    if (!docs || docs.length === 0) return "ninSlip";
    return NAME_TO_KEY[docs[0].name] ?? "ninSlip";
  };

  const confirmApprove = () => {
    if (!expert || !selectedSummary) return;
    dispatch(verifyExpertThunk({
      id:      expert.id,
      type:    toApiType(summaryTier),
      payload: {
        publicId: getDocumentKey(),
        verify:      true,
        reject:      false,
        adminId,
      },
    }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} approved`); setApproveOpen(false); onStatusChange(expert.id, "approved"); })
      .catch((err: string) => toast.error("Approval failed", { description: err }));
  };

  const confirmReject = () => {
    if (!expert || !selectedSummary) return;
    if (!rejectReason.trim()) { toast.warning("Please provide a reason"); return; }
    dispatch(verifyExpertThunk({
      id:      expert.id,
      type:    toApiType(summaryTier),
      payload: {
        publicId: getDocumentKey(),
        verify:      false,
        reject:      true,
        reason:      rejectReason.trim(),
        adminId,
      },
    }))
      .unwrap()
      .then(() => { toast.success(`${expert.name} rejected`); setRejectOpen(false); onStatusChange(expert.id, "rejected"); })
      .catch((err: string) => toast.error("Rejection failed", { description: err }));
  };

  const mailtoHref = expert
    ? `mailto:${expert.email}?subject=${encodeURIComponent("Verification – More Information Needed")}&body=${encodeURIComponent(`Dear ${expert.name},\n\nWe have reviewed your verification application and need some additional information before we can proceed.\n\nPlease respond to this email with the requested details at your earliest convenience.\n\nThank you.`)}`
    : "#";

  const footer = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button onClick={() => setApproveOpen(true)} disabled={isMutating || !expert}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 24px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: (isMutating || !expert) ? "not-allowed" : "pointer", opacity: (isMutating || !expert) ? 0.7 : 1 }}>
        <CheckCircle2 size={15} /> Approve
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
      {/* ── Main detail modal ── */}
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
              <Tier12Content detail={expert} summary={selectedSummary} docChecks={docChecks} onToggle={toggleDoc} />
            )}
            {summaryTier === "tier3" && (
              <Tier3Content detail={expert} summary={selectedSummary} notes={notes} setNotes={setNotes} docChecks={docChecks} onToggle={toggleDoc} />
            )}
          </div>
        )}
      </Modal>

      {/* ── Approve confirmation modal ── */}
      {expert && (
        <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Confirm Approval" size="sm"
          footer={
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button onClick={() => setApproveOpen(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
                Cancel
              </button>
              <button onClick={confirmApprove} disabled={isMutating}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#16a34a", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: isMutating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
                {isMutating ? <><Loader2 size={14} className="animate-spin" /> Approving...</> : <><CheckCircle2 size={14} /> Confirm Approve</>}
              </button>
            </div>
          }>
          <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
            Are you sure you want to approve <strong style={{ color: "#111827" }}>{expert.name}</strong>&apos;s verification? This action will mark them as verified.
          </p>
        </Modal>
      )}

      {/* ── Reject reason modal ── */}
      {expert && (
        <Modal open={rejectOpen} onClose={() => { setRejectOpen(false); setRejectReason(""); }} title="Reject Verification" size="sm"
          footer={
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button onClick={() => { setRejectOpen(false); setRejectReason(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
                Cancel
              </button>
              <button onClick={confirmReject} disabled={isMutating}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: isMutating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
                {isMutating ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</> : "Confirm Reject"}
              </button>
            </div>
          }>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
              Provide a reason for rejecting <strong style={{ color: "#111827" }}>{expert.name}</strong>&apos;s verification.
            </p>
            <textarea
              placeholder="e.g. Document unclear, ID expired, information mismatch..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}