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

// ── Document row ──────────────────────────────────────────────────────────────

function DocumentRow({ name, url, checked, onCheck }: {
  name:    string;
  url?:    string;
  checked: boolean;
  onCheck: () => void;
}) {
  const has = !!url && url.length > 10;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{name}</span>
      {has ? (
        <>
          <a href={url} target="_blank" rel="noreferrer" title="View"
            style={{ color: "#9CA3AF", display: "flex" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </a>
          <a href={url} download={name} title="Download"
            style={{ color: "#9CA3AF", display: "flex" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "12px", color: checked ? "#16a34a" : "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={checked} onChange={onCheck}
              style={{ accentColor: "#16a34a", width: 13, height: 13 }} />
            Verified
          </label>
        </>
      ) : (
        <span style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>N/A</span>
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
};

const n = (s: string) => s.toLowerCase().replace(/[\s_\-]/g, "");

const TIER12_KEYS = new Set(["ninslip", "governmentid", "profilephoto"]);

// Now includes publicId so we can send it as documentKey
interface Doc {
  key:       string;
  name:      string;
  url?:      string;
  publicId?: string;
}

function parseDocs(detail: ApiVerificationDetail, tier: VerificationTier): Doc[] {
  const raw = detail.document as Record<string, unknown> | null | undefined;
  if (!raw || typeof raw !== "object") return [];

  const docs: Doc[] = [];
  const indices = Object.keys(raw).sort((a, b) => Number(a) - Number(b));

  for (const idx of indices) {
    const el = raw[idx] as Record<string, unknown> | undefined;
    if (!el || typeof el !== "object") continue;

    const typeKey  = n(typeof el.type     === "string" ? el.type     : "");
    const url      = typeof el.url        === "string" && el.url.length > 10 ? el.url : undefined;
    const publicId = typeof el.publicId   === "string" && el.publicId.length > 0 ? el.publicId : undefined;
    const label    = TYPE_LABEL[typeKey] ?? (typeof el.type === "string" ? el.type : "Document");

    if (tier === "tier1" || tier === "tier2") {
      if (!TIER12_KEYS.has(typeKey)) continue;
    }
    docs.push({ key: typeKey || idx, name: label, url, publicId });
  }
  return docs;
}

/**
 * documentKey = the `id` field on each document entry (Cloudinary path).
 * Matches the TAS pattern: { id: "experts/documents/abc123", url: "...", type: "...", verify: false }
 * The expert detail endpoint returns document as a keyed object { "0": {...}, "1": {...} }
 * rather than an array, but the inner shape is the same.
 */
function resolveDocumentKey(detail: ApiVerificationDetail): string | undefined {
  const raw = detail.document as Record<string, unknown> | null | undefined;
  if (!raw || typeof raw !== "object") return undefined;
  const indices = Object.keys(raw).sort((a, b) => Number(a) - Number(b));
  for (const idx of indices) {
    const el = raw[idx] as Record<string, unknown> | undefined;
    if (!el) continue;
    if (typeof el.id === "string" && el.id.length > 0) return el.id;
  }
  return undefined;
}

// ── Approve / Reject footer ───────────────────────────────────────────────────

function ModalFooter({ onApprove, onReject, mailtoHref, disabled }: {
  onApprove:  () => void;
  onReject:   () => void;
  mailtoHref: string;
  disabled:   boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button onClick={onApprove} disabled={disabled}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 22px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.7 : 1 }}>
        <CheckCircle2 size={14} /> Approve
      </button>
      <button onClick={onReject} disabled={disabled}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fff", border: "1.5px solid #fecaca", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.7 : 1 }}>
        <X size={13} /> Reject
      </button>
      <a href={mailtoHref} style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 500, color: "#6B7280", textDecoration: "none" }}>
        Request More Info
      </a>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIER 1 & 2 MODAL
// ══════════════════════════════════════════════════════════════════════════════

function Tier12Modal({ expert, summary, tier, onClose, onApprove, onReject, isMutating, warningBanner }: {
  expert:         ApiVerificationDetail;
  summary:        ApiVerificationSummary;
  tier:           VerificationTier;
  onClose:        () => void;
  onApprove:      () => void;
  onReject:       () => void;
  isMutating:     boolean;
  warningBanner?: React.ReactNode;
}) {
  const [docChecks, setDocChecks] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setDocChecks(p => ({ ...p, [k]: !p[k] }));
  const docs = parseDocs(expert, tier);
  const nin  = summary.ninVerification;

  const mailtoHref = `mailto:${expert.email}?subject=${encodeURIComponent("Verification – More Information Needed")}&body=${encodeURIComponent(`Dear ${expert.name},\n\nWe need additional information to process your verification.\n\nPlease respond at your earliest convenience.\n\nThank you.`)}`;

  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", padding: "9px 0", borderBottom: "1px solid #F3F4F6", fontSize: "13px" };
  const lbl: React.CSSProperties = { width: "130px", flexShrink: 0, color: "#6B7280" };
  const chkLbl = (k: string): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "12px", color: docChecks[k] ? "#16a34a" : "#6B7280", fontWeight: 500, whiteSpace: "nowrap", marginLeft: "auto" });

  return (
    <Modal open onClose={onClose} title="Verification Detail"
      footer={<ModalFooter onApprove={onApprove} onReject={onReject} mailtoHref={mailtoHref} disabled={isMutating} />}
      size="md">
      <div style={{ display: "flex", flexDirection: "column" }}>
        {warningBanner}
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
                <DocumentRow key={d.key} name={d.name} url={d.url}
                  checked={!!docChecks[d.key]} onCheck={() => toggle(d.key)} />
              ))
          }
        </Card>

        <Card>
          <SectionTitle title="NIN Verification" />
          <div style={{ ...rowStyle }}>
            <span style={lbl}>NIN Number:</span>
            <span style={{ color: "#111827", fontFamily: "monospace", fontWeight: 600 }}>{nin?.ninNumber || "—"}</span>
          </div>
          <div style={{ ...rowStyle }}>
            <span style={lbl}>NIN Status:</span>
            <span style={{ color: "#111827", flex: 1 }}>{nin?.ninStatus || "—"}</span>
            <label style={chkLbl("ninStatus")}>
              <input type="checkbox" checked={!!docChecks["ninStatus"]} onChange={() => toggle("ninStatus")}
                style={{ accentColor: "#16a34a", width: 13, height: 13 }} /> Verified
            </label>
          </div>
          <div style={{ ...rowStyle }}>
            <span style={lbl}>Name Match:</span>
            <label style={chkLbl("ninNameMatch")}>
              <input type="checkbox" checked={!!docChecks["ninNameMatch"]} onChange={() => toggle("ninNameMatch")}
                style={{ accentColor: "#16a34a", width: 13, height: 13 }} /> Verified
            </label>
          </div>
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={lbl}>DOB Match:</span>
            <label style={chkLbl("ninDobMatch")}>
              <input type="checkbox" checked={!!docChecks["ninDobMatch"]} onChange={() => toggle("ninDobMatch")}
                style={{ accentColor: "#16a34a", width: 13, height: 13 }} /> Verified
            </label>
          </div>
        </Card>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIER 3 MODAL
// ══════════════════════════════════════════════════════════════════════════════

function Tier3Modal({ expert, summary, onClose, onApprove, onReject, isMutating, warningBanner }: {
  expert:         ApiVerificationDetail;
  summary:        ApiVerificationSummary;
  onClose:        () => void;
  onApprove:      () => void;
  onReject:       () => void;
  isMutating:     boolean;
  warningBanner?: React.ReactNode;
}) {
  const [docChecks, setDocChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes]         = useState("");
  const toggle = (k: string) => setDocChecks(p => ({ ...p, [k]: !p[k] }));
  const docs      = parseDocs(expert, "tier3");
  const guarantor = summary.guarantor;
  const policeClr = summary.policeClearance;

  const mailtoHref = `mailto:${expert.email}?subject=${encodeURIComponent("TAS Verification – More Information Needed")}&body=${encodeURIComponent(`Dear ${expert.name},\n\nWe need additional information to process your TAS verification.\n\nPlease respond at your earliest convenience.\n\nThank you.`)}`;

  return (
    <Modal open onClose={onClose} title="Verification Detail (Tier 3 – TAS)"
      footer={<ModalFooter onApprove={onApprove} onReject={onReject} mailtoHref={mailtoHref} disabled={isMutating} />}
      size="md">
      <div style={{ display: "flex", flexDirection: "column" }}>
        {warningBanner}
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
                <DocumentRow key={d.key} name={d.name} url={d.url}
                  checked={!!docChecks[d.key]} onCheck={() => toggle(d.key)} />
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
            <div style={{ marginTop: "10px" }}>
              <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "6px", fontWeight: 500 }}>Admin Notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about the guarantor call…" rows={3}
                style={{ width: "100%", borderRadius: "8px", border: "1px solid #E5E7EB", padding: "10px 12px", fontSize: "13px", color: "#111827", backgroundColor: "#fff", resize: "none", outline: "none", boxSizing: "border-box" }} />
            </div>
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
// CONFIRM MODALS
// ══════════════════════════════════════════════════════════════════════════════

function ApproveModal({ name, open, onClose, onConfirm, isMutating }: {
  name: string; open: boolean; onClose: () => void; onConfirm: () => void; isMutating: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Approval" size="sm"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isMutating}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#16a34a", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: isMutating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
            {isMutating ? <><Loader2 size={14} className="animate-spin" /> Approving…</> : <><CheckCircle2 size={14} /> Confirm Approve</>}
          </button>
        </div>
      }>
      <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
        Are you sure you want to approve <strong style={{ color: "#111827" }}>{name}</strong>&apos;s verification?
        This will mark them as verified.
      </p>
    </Modal>
  );
}

function RejectModal({ name, open, onClose, onConfirm, isMutating, reason, setReason }: {
  name: string; open: boolean; onClose: () => void; onConfirm: () => void;
  isMutating: boolean; reason: string; setReason: (v: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Reject Verification" size="sm"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isMutating}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: isMutating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
            {isMutating ? <><Loader2 size={14} className="animate-spin" /> Rejecting…</> : "Confirm Reject"}
          </button>
        </div>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
          Provide a reason for rejecting <strong style={{ color: "#111827" }}>{name}</strong>&apos;s verification.
        </p>
        <textarea placeholder="e.g. Document unclear, ID expired, information mismatch…"
          value={reason} onChange={e => setReason(e.target.value)} rows={3}
          style={{ width: "100%", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
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
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
}

export default function VerificationModal({ expert, onClose, onStatusChange }: Props) {
  const dispatch = useAppDispatch();
  const { mutateStatus, selectedStatus, selectedSummary } = useAppSelector(s => s.verifications);
  const { admin } = useAppSelector(s => s.auth);

  const [approveOpen,  setApproveOpen]  = useState(false);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isMutating      = mutateStatus   === "loading";
  const isLoadingDetail = selectedStatus === "loading";

  const tier: VerificationTier = (expert && selectedSummary)
    ? resolveTier(expert, selectedSummary)
    : "tier1";

  const adminId = admin?.id ?? "";

  // Resolve documentKey — `id` field on first document entry (Cloudinary path)
  const documentKey = expert ? resolveDocumentKey(expert) : undefined;

  const handleApprove = () => {
    if (!expert || !selectedSummary) return;
    const payload = { documentKey, verify: true, reject: false, adminId };
    dispatch(verifyExpertThunk({
      id:          expert.id,
      type:        toApiType(tier),
      localStatus: "approved" as const,
      payload,
    }))
      .unwrap()
      .then(() => {
        toast.success(`${expert.name} approved`);
        setApproveOpen(false);
        onStatusChange(expert.id, "approved");
      })
      .catch((err: string) => toast.error("Approval failed", { description: err }));
  };

  const handleReject = () => {
    if (!expert || !selectedSummary) return;
    if (!rejectReason.trim()) { toast.warning("Please provide a reason"); return; }
    const payload = { documentKey, verify: false, reject: true, reason: rejectReason.trim(), adminId };
    dispatch(verifyExpertThunk({
      id:          expert.id,
      type:        toApiType(tier),
      localStatus: "rejected" as const,
      payload,
    }))
      .unwrap()
      .then(() => {
        toast.success(`${expert.name} rejected`);
        setRejectOpen(false);
        onStatusChange(expert.id, "rejected");
      })
      .catch((err: string) => toast.error("Rejection failed", { description: err }));
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
    onApprove:  () => setApproveOpen(true),
    onReject:   () => setRejectOpen(true),
    isMutating,
  };

  return (
    <>
      {(tier === "tier1" || tier === "tier2") && (
        <Tier12Modal {...commonProps} tier={tier} />
      )}
      {tier === "tier3" && (
        <Tier3Modal {...commonProps} />
      )}

      <ApproveModal
        name={expert.name} open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove} isMutating={isMutating}
      />
      <RejectModal
        name={expert.name} open={rejectOpen}
        onClose={() => { setRejectOpen(false); setRejectReason(""); }}
        onConfirm={handleReject} isMutating={isMutating}
        reason={rejectReason} setReason={setRejectReason}
      />
    </>
  );
}