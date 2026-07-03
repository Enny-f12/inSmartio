/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle2, Phone, Loader2, XCircle, Clock, X } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppSelector } from "@/hooks/redux";
import { verifyExpert } from "@/lib/api/verificationApi";
import type {
  VerificationTier,
  VerificationType,
  ApiVerificationDetail,
  ApiVerificationSummary,
} from "@/lib/api/verificationApi";

// ── Tier resolution ───────────────────────────────────────────────────────────
function resolveTier(detail: ApiVerificationDetail, summary: ApiVerificationSummary): VerificationTier {
  const n = Number(detail.tier);
  if (n === 3) return "tier3";
  if (n === 2) return "tier2";
  if (n === 1) return "tier1";
  if (summary.tier === "tier3" || summary.tier === "tier2" || summary.tier === "tier1") {
    return summary.tier;
  }
  return "tier1";
}

const toApiType = (tier: VerificationTier): VerificationType =>
  tier === "tier3" ? "tas" : "expert";

// ── Priority-based status ──────────────────────────────────────────────────────
//   any document rejected → rejected   (highest priority)
//   all documents verified → approved
//   otherwise               → pending
export type ComputedStatus = "pending" | "rejected" | "approved";

export function computeStatus(docs: { verified: boolean; rejected: boolean }[]): ComputedStatus {
  if (docs.some((d) => d.rejected)) return "rejected";
  if (docs.length > 0 && docs.every((d) => d.verified)) return "approved";
  return "pending";
}

// ── Cloudinary download fix ────────────────────────────────────────────────────
// The HTML `download` attribute is ignored by browsers for cross-origin URLs
// (these files live on res.cloudinary.com, the app runs elsewhere), so it
// silently just opens the file instead of downloading it. Cloudinary's
// `fl_attachment` flag forces a real download regardless of origin.
function toDownloadUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("/fl_attachment")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}

// ── Email helpers ──────────────────────────────────────────────────────────────

const isValidEmail = (email?: string | null): boolean =>
  typeof email === "string" && /\S+@\S+\.\S+/.test(email);

function buildMailto(email: string | undefined, name: string, tier: VerificationTier): string | undefined {
  if (!isValidEmail(email)) return undefined;
  const subject = tier === "tier3"
    ? "Action Needed: Your TAS Verification"
    : "Action Needed: Your Verification Application";
  const body =
`Hi ${name},

Thank you for submitting your ${tier === "tier3" ? "TAS " : ""}verification application with inSmartio.

We're currently reviewing it and need a bit more information before we can proceed. Could you please reply to this email with any of the following that apply:

- Updated or clearer copies of any documents that may be missing or hard to read
- Any additional details relevant to your verification

Once we receive this, we'll continue processing your application right away.

Thank you for your patience.

Best regards,
inSmartio Team`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280", margin: "0 0 12px" }}>
      {title}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", alignItems: "flex-start" }}>
      <span style={{ width: "130px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", flex: 1, wordBreak: "break-word" }}>{value ?? "—"}</span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#F9FAFB", borderRadius: "12px", padding: "14px 16px", marginBottom: "10px" }}>
      {children}
    </div>
  );
}

// ── Status banner ─────────────────────────────────────────────────────────────

const STATUS_META: Record<ComputedStatus, { bg: string; border: string; text: string; sub: string; icon: React.ReactNode; title: string }> = {
  approved: {
    bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", sub: "#166534",
    icon: <CheckCircle2 size={18} color="#16a34a" />,
    title: "Approved — all documents verified",
  },
  rejected: {
    bg: "#fef2f2", border: "#fecaca", text: "#dc2626", sub: "#b91c1c",
    icon: <XCircle size={18} color="#dc2626" />,
    title: "Rejected — at least one document rejected",
  },
  pending: {
    bg: "#F9FAFB", border: "#E5E7EB", text: "#374151", sub: "#6B7280",
    icon: <Clock size={18} color="#6B7280" />,
    title: "Pending review",
  },
};

function StatusBanner({ status, verifiedCount, total }: { status: ComputedStatus; verifiedCount: number; total: number }) {
  const meta = STATUS_META[status];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "12px 16px", borderRadius: "12px", marginBottom: "10px",
      backgroundColor: meta.bg, border: `1px solid ${meta.border}`,
    }}>
      {meta.icon}
      <div>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: meta.text }}>
          {meta.title}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: meta.sub }}>
          {verifiedCount} of {total} document{total === 1 ? "" : "s"} verified
        </p>
      </div>
    </div>
  );
}

// ── Document row ──────────────────────────────────────────────────────────────
// Verify + Reject checkboxes, always switchable. Rejecting opens an inline
// reason box; unrejecting (unchecking Reject) needs no reason.

function DocumentRow({
  name, url, verified, rejected, reason, busy,
  onToggleVerify, onToggleReject,
  popupOpen, reasonDraft, onReasonChange, onConfirmReject, onCancelReject,
}: {
  name:             string;
  url?:             string;
  verified:         boolean;
  rejected:         boolean;
  reason?:          string;
  busy:             boolean;
  onToggleVerify:   () => void;
  onToggleReject:   () => void;
  popupOpen:        boolean;
  reasonDraft:      string;
  onReasonChange:   (v: string) => void;
  onConfirmReject:  () => void;
  onCancelReject:   () => void;
}) {
  const has = !!url && url.length > 10;

  return (
    <div style={{ padding: "9px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{name}</span>
        {has ? (
          <>
            <a href={url} target="_blank" rel="noreferrer" title="View"
              style={{ color: "#9CA3AF", display: "flex" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </a>
            <a href={toDownloadUrl(url)} download title="Download"
              style={{ color: "#9CA3AF", display: "flex" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
            <label style={{
              display: "flex", alignItems: "center", gap: "5px",
              cursor: busy ? "default" : "pointer",
              fontSize: "12px", color: verified ? "#16a34a" : "#6B7280",
              fontWeight: 500, whiteSpace: "nowrap",
            }}>
              <input
                type="checkbox" checked={verified}
                onChange={busy ? undefined : onToggleVerify}
                readOnly={busy}
                style={{ accentColor: "#16a34a", width: 13, height: 13 }}
              />
              Verify
            </label>
            <label style={{
              display: "flex", alignItems: "center", gap: "5px",
              cursor: busy ? "default" : "pointer",
              fontSize: "12px", color: rejected ? "#dc2626" : "#6B7280",
              fontWeight: 500, whiteSpace: "nowrap",
            }}>
              <input
                type="checkbox" checked={rejected}
                onChange={busy ? undefined : onToggleReject}
                readOnly={busy}
                style={{ accentColor: "#dc2626", width: 13, height: 13 }}
              />
              Reject
            </label>
            {busy && <Loader2 size={12} className="animate-spin" color="#9CA3AF" />}
          </>
        ) : (
          <span style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>N/A</span>
        )}
      </div>

      {rejected && reason && !popupOpen && (
        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#b91c1c" }}>
          Reason: {reason}
        </p>
      )}

      {popupOpen && (
        <div style={{
          marginTop: "8px", padding: "10px 12px", borderRadius: "10px",
          border: "1px solid #FECACA", backgroundColor: "#FEF2F2",
          display: "flex", flexDirection: "column", gap: "8px",
        }}>
          <textarea
            value={reasonDraft}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Reason for rejecting this document…"
            rows={2} autoFocus disabled={busy}
            style={{
              width: "100%", borderRadius: "8px", border: "1px solid #FCA5A5",
              padding: "8px 10px", fontSize: "12px", resize: "none", outline: "none",
              backgroundColor: "#fff", color: "#111827", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={onCancelReject} disabled={busy}
              style={{
                padding: "5px 12px", borderRadius: "8px", border: "1px solid #E5E7EB",
                backgroundColor: "#fff", fontSize: "12px", color: "#6B7280",
                cursor: busy ? "not-allowed" : "pointer",
              }}>
              Cancel
            </button>
            <button onClick={onConfirmReject} disabled={busy}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 12px", borderRadius: "8px", border: "none",
                backgroundColor: "#dc2626", color: "#fff", fontSize: "12px", fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1,
              }}>
              {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
              Confirm Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Doc parsing ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  "ninslip":         "NIN Slip",
  "bvnconsent":      "BVN Consent Form",
  "governmentid":    "Government ID",
  "profilephoto":    "Profile Photo",
  "addressproof":    "Proof of Address",
  "guarantorform":   "Guarantor Form",
  "policeclearance": "Police Clearance Certificate",
  "portfolio":       "Portfolio",
};

const normaliseKey = (s: string) => s.toLowerCase().replace(/[\s_\-]/g, "");

const TIER12_KEYS = new Set([
  "ninslip",
  "governmentid",
  "profilephoto",
  "addressproof",
  "portfolio",
]);

interface Doc {
  key:       string;
  name:      string;
  url?:      string;
  publicId?: string;
  verified:  boolean;
  rejected:  boolean;
  reason?:   string;
}

function parseDocs(detail: ApiVerificationDetail, tier: VerificationTier): Doc[] {
  const raw = detail.document as Record<string, unknown> | null | undefined;
  if (!raw || typeof raw !== "object") return [];

  const docs: Doc[] = [];
  const indices = Object.keys(raw).sort((a, b) => Number(a) - Number(b));

  for (const idx of indices) {
    const el = raw[idx] as Record<string, unknown> | undefined;
    if (!el || typeof el !== "object") continue;

    const typeKey  = normaliseKey(typeof el.type === "string" ? el.type : "");
    const url      = typeof el.url      === "string" && el.url.length > 10     ? el.url      : undefined;
    const publicId = typeof el.publicId === "string" && el.publicId.length > 0 ? el.publicId : undefined;
    const label    = TYPE_LABEL[typeKey] ?? (typeof el.type === "string" ? el.type : "Document");
    const verified = el.verify === true;
    const rejected = el.reject === true;
    const reason   = typeof el.reason === "string" && el.reason.length > 0 ? el.reason : undefined;

    // Tier 1 & 2: only show TIER12_KEYS; Tier 3: show everything
    if ((tier === "tier1" || tier === "tier2") && !TIER12_KEYS.has(typeKey)) continue;

    docs.push({ key: typeKey || idx, name: label, url, publicId, verified, rejected, reason });
  }
  return docs;
}

// ── Footer ───────────────────────────────────────────────────────────────────

function RequestInfoLink({ mailtoHref, style }: { mailtoHref?: string; style?: React.CSSProperties }) {
  if (mailtoHref) {
    return (
      <a href={mailtoHref} style={{ fontSize: "13px", fontWeight: 500, color: "#6B7280", textDecoration: "none", ...style }}>
        Request More Info
      </a>
    );
  }
  return (
    <span title="No email on file for this applicant"
      style={{ fontSize: "13px", fontWeight: 500, color: "#D1D5DB", cursor: "not-allowed", ...style }}>
      Request More Info
    </span>
  );
}

// Approve/Reject here are read-only status checks — no API call. They just
// tell the admin whether the condition ("all verified" / "any rejected") is
// currently met, based on the same per-document checkboxes above.
function Footer({ onClose, mailtoHref, status, verifiedCount, total }: {
  onClose:       () => void;
  mailtoHref?:   string;
  status:        ComputedStatus;
  verifiedCount: number;
  total:         number;
}) {
  const checkApprove = () => {
    if (status === "approved") {
      toast.success("All documents are verified — this application is Approved.");
    } else {
      toast.warning(`Not yet approved — ${verifiedCount}/${total} documents verified.`);
    }
  };
  const checkReject = () => {
    if (status === "rejected") {
      toast.success("At least one document is rejected — this application is Rejected.");
    } else {
      toast.warning("Not rejected — no documents have been marked Reject yet.");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button onClick={checkApprove}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 22px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: "pointer" }}>
        <CheckCircle2 size={14} /> Approve
      </button>
      <button onClick={checkReject}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fff", border: "1.5px solid #fecaca", cursor: "pointer" }}>
        <XCircle size={13} /> Reject
      </button>
      <button onClick={onClose}
        style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#374151", backgroundColor: "#F3F4F6", border: "none", cursor: "pointer" }}>
        Close
      </button>
      <RequestInfoLink mailtoHref={mailtoHref} style={{ marginLeft: "auto" }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIER 1 & 2 MODAL
// ══════════════════════════════════════════════════════════════════════════════

function Tier12Modal({
  expert, summary, tier, onClose, docs, busyKey, popupKey, reasonDraft,
  onToggleVerify, onOpenReject, onCloseReject, onReasonChange, onConfirmReject, onClearReject,
}: {
  expert:          ApiVerificationDetail;
  summary:         ApiVerificationSummary;
  tier:            VerificationTier;
  onClose:         () => void;
  docs:            Doc[];
  busyKey:         string | null;
  popupKey:        string | null;
  reasonDraft:     string;
  onToggleVerify:  (d: Doc) => void;
  onOpenReject:    (d: Doc) => void;
  onCloseReject:   () => void;
  onReasonChange:  (v: string) => void;
  onConfirmReject: (d: Doc) => void;
  onClearReject:   (d: Doc) => void;
}) {
  const nin = summary.ninVerification;

  const verifiedCount = docs.filter(d => d.verified).length;
  const status = computeStatus(docs);
  const mailtoHref = buildMailto(expert.email, expert.name, tier);

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "9px 0", borderBottom: "1px solid #F3F4F6", fontSize: "13px",
  };
  const lbl: React.CSSProperties = { width: "130px", flexShrink: 0, color: "#6B7280" };

  return (
    <Modal
      open
      onClose={onClose}
      title="Verification Detail"
      footer={<Footer onClose={onClose} mailtoHref={mailtoHref} status={status} verifiedCount={verifiedCount} total={docs.length} />}
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <StatusBanner status={status} verifiedCount={verifiedCount} total={docs.length} />

        <Card>
          <SectionTitle title="Expert Information" />
          <InfoRow label="Name:"         value={expert.name} />
          <InfoRow label="Phone:"        value={expert.phone} />
          <InfoRow label="Email:"        value={expert.email} />
          <InfoRow label="Applied Tier:" value={`Tier ${Number(expert.tier)}`} />
          <InfoRow label="Submitted:"    value={summary.submitted ? new Date(summary.submitted).toLocaleDateString("en-GB") : "—"} />
        </Card>

        <Card>
          <SectionTitle title="Documents" />
          {docs.length === 0
            ? <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No documents found.</p>
            : docs.map(d => (
                <DocumentRow
                  key={d.key}
                  name={d.name}
                  url={d.url}
                  verified={d.verified}
                  rejected={d.rejected}
                  reason={d.reason}
                  busy={busyKey === d.key}
                  onToggleVerify={() => onToggleVerify(d)}
                  onToggleReject={() => d.rejected ? onClearReject(d) : onOpenReject(d)}
                  popupOpen={popupKey === d.key}
                  reasonDraft={reasonDraft}
                  onReasonChange={onReasonChange}
                  onConfirmReject={() => onConfirmReject(d)}
                  onCancelReject={onCloseReject}
                />
              ))
          }
        </Card>

        <Card>
          <SectionTitle title="NIN Verification" />
          <div style={{ ...rowStyle }}>
            <span style={lbl}>NIN Number:</span>
            <span style={{ color: "#111827", fontFamily: "monospace", fontWeight: 600 }}>{nin?.ninNumber || "—"}</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={lbl}>NIN Status:</span>
            <span style={{ color: "#111827", flex: 1 }}>{nin?.ninStatus || "—"}</span>
          </div>
        </Card>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIER 3 MODAL
// ══════════════════════════════════════════════════════════════════════════════

function Tier3Modal({
  expert, summary, onClose, docs, busyKey, popupKey, reasonDraft,
  onToggleVerify, onOpenReject, onCloseReject, onReasonChange, onConfirmReject, onClearReject,
}: {
  expert:          ApiVerificationDetail;
  summary:         ApiVerificationSummary;
  onClose:         () => void;
  docs:            Doc[];
  busyKey:         string | null;
  popupKey:        string | null;
  reasonDraft:     string;
  onToggleVerify:  (d: Doc) => void;
  onOpenReject:    (d: Doc) => void;
  onCloseReject:   () => void;
  onReasonChange:  (v: string) => void;
  onConfirmReject: (d: Doc) => void;
  onClearReject:   (d: Doc) => void;
}) {
  const guarantor = summary.guarantor;
  const policeClr = summary.policeClearance;

  const verifiedCount = docs.filter(d => d.verified).length;
  const status = computeStatus(docs);
  const mailtoHref = buildMailto(expert.email, expert.name, "tier3");

  return (
    <Modal
      open
      onClose={onClose}
      title="Verification Detail (Tier 3 – TAS)"
      footer={<Footer onClose={onClose} mailtoHref={mailtoHref} status={status} verifiedCount={verifiedCount} total={docs.length} />}
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <StatusBanner status={status} verifiedCount={verifiedCount} total={docs.length} />

        <Card>
          <SectionTitle title="Expert Information" />
          <InfoRow label="Name:"         value={expert.name} />
          <InfoRow label="Phone:"        value={expert.phone} />
          <InfoRow label="Email:"        value={expert.email} />
          <InfoRow label="Applied Tier:" value="Tier 3 (TAS)" />
          <InfoRow label="Submitted:"    value={summary.submitted ? new Date(summary.submitted).toLocaleDateString("en-GB") : "—"} />
          {summary.verificationFee && <InfoRow label="Verification Fee:" value={summary.verificationFee} />}
        </Card>

        <Card>
          <SectionTitle title="Documents" />
          {docs.length === 0
            ? <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No documents found.</p>
            : docs.map(d => (
                <DocumentRow
                  key={d.key}
                  name={d.name}
                  url={d.url}
                  verified={d.verified}
                  rejected={d.rejected}
                  reason={d.reason}
                  busy={busyKey === d.key}
                  onToggleVerify={() => onToggleVerify(d)}
                  onToggleReject={() => d.rejected ? onClearReject(d) : onOpenReject(d)}
                  popupOpen={popupKey === d.key}
                  reasonDraft={reasonDraft}
                  onReasonChange={onReasonChange}
                  onConfirmReject={() => onConfirmReject(d)}
                  onCancelReject={onCloseReject}
                />
              ))
          }
        </Card>

        {guarantor ? (
          <Card>
            <SectionTitle title="Guarantor Verification" />
            <InfoRow label="Name:"       value={guarantor.name} />
            <InfoRow label="Phone:"      value={guarantor.phone} />
            <InfoRow label="Occupation:" value={guarantor.occupation} />
            <InfoRow label="Contact:"
              value={
                <a href={`tel:${guarantor.phone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#374151", textDecoration: "none", fontWeight: 500 }}>
                  <Phone size={13} /> Call Guarantor
                </a>
              }
            />
          </Card>
        ) : (
          <Card>
            <SectionTitle title="Guarantor Verification" />
            <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No guarantor information submitted.</p>
          </Card>
        )}

        {policeClr ? (
          <Card>
            <SectionTitle title="Police Clearance Verification" />
            <InfoRow label="Certificate #:" value={policeClr.certificateNo} />
            <InfoRow label="Issued:"         value={policeClr.issued} />
            <InfoRow label="Issuing State:"  value={policeClr.issuingState} />
            <InfoRow label="Status:"
              value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#374151", fontWeight: 500 }}>
                  <CheckCircle2 size={13} color="#16a34a" /> {policeClr.status}
                </span>
              }
            />
          </Card>
        ) : (
          <Card>
            <SectionTitle title="Police Clearance Verification" />
            <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No police clearance submitted.</p>
          </Card>
        )}
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ══════════════════════════════════════════════════════════════════════════════

interface Props {
  expert:         ApiVerificationDetail | null;
  onClose:        () => void;
  onStatusChange: (id: string, status: ComputedStatus) => void;
}

export default function VerificationModal({ expert, onClose, onStatusChange }: Props) {
  const { selectedStatus, selectedSummary } = useAppSelector(s => s.verifications);
  const { admin } = useAppSelector(s => s.auth);

  const [docs,        setDocs]        = useState<Doc[]>([]);
  const [busyKey,      setBusyKey]     = useState<string | null>(null);
  const [popupKey,     setPopupKey]    = useState<string | null>(null);
  const [reasonDraft,  setReasonDraft] = useState("");

  const isLoadingDetail = selectedStatus === "loading";

  const tier: VerificationTier = (expert && selectedSummary)
    ? resolveTier(expert, selectedSummary)
    : "tier1";

  const adminId = admin?.id ?? "";

  // Seed docs from real backend state whenever a different applicant opens
  useEffect(() => {
    setDocs(expert ? parseDocs(expert, tier) : []);
    setBusyKey(null);
    setPopupKey(null);
    setReasonDraft("");
  }, [expert?.id]);

  const status = useMemo(() => computeStatus(docs), [docs]);

  // Report every status change up so the list page's badge stays in sync.
  const lastReported = useMemo(() => ({ current: null as ComputedStatus | null }), [expert?.id]);
  useEffect(() => {
    if (!expert) return;
    if (lastReported.current === status) return;
    // eslint-disable-next-line react-hooks/immutability
    lastReported.current = status;
    onStatusChange(expert.id, status);
  }, [status, expert?.id]);

  const handleToggleVerify = async (doc: Doc) => {
    if (!expert || !doc.publicId) return;
    const nextVerified = !doc.verified;
    setBusyKey(doc.key);
    try {
      await verifyExpert(expert.id, toApiType(tier), {
        documentKey: doc.publicId,
        verify:      nextVerified,
        reject:      false,
        adminId,
      });
      setDocs(prev => prev.map(d => d.key === doc.key ? { ...d, verified: nextVerified, rejected: false, reason: undefined } : d));
    } catch (err) {
      toast.error("Failed to update document", { description: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusyKey(null);
    }
  };

  const handleOpenReject = (doc: Doc) => {
    setPopupKey(doc.key);
    setReasonDraft(doc.reason ?? "");
  };

  const handleCloseReject = () => {
    setPopupKey(null);
    setReasonDraft("");
  };

  // Confirm a new rejection — requires a reason, called from the popup.
  const handleConfirmReject = async (doc: Doc) => {
    if (!expert || !doc.publicId) return;
    if (!reasonDraft.trim()) { toast.warning("Please provide a reason"); return; }
    setBusyKey(doc.key);
    try {
      await verifyExpert(expert.id, toApiType(tier), {
        documentKey: doc.publicId,
        verify:      false,
        reject:      true,
        reason:      reasonDraft.trim(),
        adminId,
      });
      setDocs(prev => prev.map(d => d.key === doc.key
        ? { ...d, verified: false, rejected: true, reason: reasonDraft.trim() }
        : d));
      setPopupKey(null);
      setReasonDraft("");
    } catch (err) {
      toast.error("Failed to reject document", { description: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusyKey(null);
    }
  };

  // Un-reject (clear both flags) — no reason needed, called directly from
  // unchecking an already-rejected document's Reject checkbox.
  const handleClearReject = async (doc: Doc) => {
    if (!expert || !doc.publicId) return;
    setBusyKey(doc.key);
    try {
      await verifyExpert(expert.id, toApiType(tier), {
        documentKey: doc.publicId,
        verify:      false,
        reject:      false,
        adminId,
      });
      setDocs(prev => prev.map(d => d.key === doc.key
        ? { ...d, verified: false, rejected: false, reason: undefined }
        : d));
    } catch (err) {
      toast.error("Failed to update document", { description: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusyKey(null);
    }
  };

  if (isLoadingDetail) {
    return (
      <Modal open onClose={onClose} title="Verification Detail" size="md">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", gap: "8px", color: "#9CA3AF", fontSize: "14px" }}>
          <Loader2 size={18} className="animate-spin" /> Loading details…
        </div>
      </Modal>
    );
  }

  if (!expert || !selectedSummary) {
    return (
      <Modal open onClose={onClose} title="Verification Detail" size="md">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", fontSize: "14px", color: "#ef4444" }}>
          Failed to load verification detail.
        </div>
      </Modal>
    );
  }

  const commonProps = {
    expert,
    summary: selectedSummary,
    onClose,
    docs,
    busyKey,
    popupKey,
    reasonDraft,
    onToggleVerify:  handleToggleVerify,
    onOpenReject:    handleOpenReject,
    onCloseReject:   handleCloseReject,
    onReasonChange:  setReasonDraft,
    onConfirmReject: handleConfirmReject,
    onClearReject:   handleClearReject,
  };

  return (
    <>
      {(tier === "tier1" || tier === "tier2") && (
        <Tier12Modal {...commonProps} tier={tier} />
      )}
      {tier === "tier3" && (
        <Tier3Modal {...commonProps} />
      )}
    </>
  );
}