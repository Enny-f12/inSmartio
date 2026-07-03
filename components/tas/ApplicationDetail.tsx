// components/tas/ApplicationDetailPage.tsx
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2, Eye, Download, X } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/hooks/redux";
import { verifyTas } from "@/lib/api/tasApi";
import type { ApiTas } from "@/lib/api/tasApi";
import { card, sectionLabel, getType } from "./shared";

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
// (files live on res.cloudinary.com, app runs elsewhere), so it silently
// opens the file instead of downloading it. `fl_attachment` forces a real
// download regardless of origin.
function toDownloadUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("/fl_attachment")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}

interface Props {
  agent:          ApiTas;
  onBack:         () => void;
  onStatusChange: (id: string, status: ComputedStatus) => void;
}

// ── Mobile-aware InfoRow ──────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "2px" : "8px",
      fontSize: 13,
      marginBottom: 10,
    }}>
      <span style={{
        minWidth: isMobile ? "unset" : "200px",
        flexShrink: 0,
        fontWeight: 500,
        color: "#6B7280",
      }}>
        {label}
      </span>
      <span style={{ color: "#111827", wordBreak: "break-word", flex: 1 }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── Document helpers ──────────────────────────────────────────────────────────

const EXCLUDED_TYPES = ["profile photo", "avatar"];

interface DocEntry {
  key:       string;
  label:     string;
  url?:      string;
  verified:  boolean;
  rejected:  boolean;
  reason?:   string;
  publicId?: string;
}

function parseDocuments(rawDoc: unknown): DocEntry[] {
  if (!rawDoc || typeof rawDoc !== "object") return [];

  if (!Array.isArray(rawDoc)) {
    const obj = rawDoc as Record<string, { url?: string; type?: string; verify?: boolean; reject?: boolean; reason?: string; publicId?: string }>;
    return Object.entries(obj)
      .filter(([, d]) => d?.type && !EXCLUDED_TYPES.includes(d.type.toLowerCase()))
      .map(([key, d]) => ({
        key,
        label:    d.type!.charAt(0).toUpperCase() + d.type!.slice(1),
        url:      d.url,
        verified: d.verify ?? false,
        rejected: d.reject ?? false,
        reason:   d.reason ?? undefined,
        publicId: d.publicId ?? key,
      }));
  }

  const arr = rawDoc as { type?: string; url?: string; secureUrl?: string; verify?: boolean; reject?: boolean; reason?: string; publicId?: string }[];
  return arr
    .filter((d) => d?.type && !EXCLUDED_TYPES.includes(d.type.toLowerCase()))
    .map((d, i) => ({
      key:      d.publicId ?? String(i),
      label:    d.type!.charAt(0).toUpperCase() + d.type!.slice(1),
      url:      d.secureUrl ?? d.url,
      verified: d.verify ?? false,
      rejected: d.reject ?? false,
      reason:   d.reason ?? undefined,
      publicId: d.publicId,
    }));
}

// ── Category helper ───────────────────────────────────────────────────────────

function parseCategory(raw: unknown): string {
  if (!raw) return "—";
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "object") {
    const o = raw as { name?: string; sub?: string[] };
    return [o.name, ...(o.sub ?? [])].filter(Boolean).join(", ");
  }
  return String(raw);
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
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", borderRadius: 12,
      backgroundColor: meta.bg, border: `1px solid ${meta.border}`,
    }}>
      {meta.icon}
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: meta.text }}>
          {meta.title}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: meta.sub }}>
          {verifiedCount} of {total} document{total === 1 ? "" : "s"} verified
        </p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ApplicationDetailPage({ agent, onBack, onStatusChange }: Props) {
  const { admin } = useAppSelector((s) => s.auth);
  const adminId   = (admin as Record<string, string> | null)?.id ?? "";

  const [docs,        setDocs]        = useState<DocEntry[]>([]);
  const [busyKey,      setBusyKey]     = useState<string | null>(null);
  const [popupKey,     setPopupKey]    = useState<string | null>(null);
  const [reasonDraft,  setReasonDraft] = useState("");
  const [isMobile,     setIsMobile]    = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const rawAgent = ((agent as Record<string, unknown>).user as ApiTas | undefined) ?? agent;
  const ext      = rawAgent as Record<string, unknown>;

  // Seed docs from real backend state whenever a different agent opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDocs(parseDocuments(ext.document));
    setBusyKey(null);
    setPopupKey(null);
    setReasonDraft("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  const verifiedCount = docs.filter((d) => d.verified).length;
  const status = computeStatus(docs);

  useEffect(() => {
    onStatusChange(agent.id, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, agent.id]);

  const name       = (ext.name     as string) ?? "—";
  const phone      = (ext.phone    as string) ?? "—";
  const email      = (ext.email    as string) ?? "—";
  const gender     = (ext.gender   as string) ?? null;
  const dob        = ext.dateOfBirth
    ? new Date(ext.dateOfBirth as string).toLocaleDateString("en-GB") : null;
  const tasId      = (ext.applicationCode as string) ?? (ext.id as string);
  const submitted  = new Date(ext.createdAt as string).toLocaleDateString("en-GB");
  const referral   = (ext.referral   as string) ?? null;
  const parentTas  = (ext.parentTasId as string) ?? null;
  const tasType    = getType(ext);

  const loc = ext.location as { city?: string; state?: string; country?: string } | null;
  const locationStr = loc
    ? [loc.city, loc.state, loc.country].filter(Boolean).join(", ")
    : null;

  const categoryStr = parseCategory(ext.category);

  const re                = ext.recruitExpectations as Record<string, unknown> | null;
  const whyTas            = re?.whyTas            ? String(re.whyTas)            : null;
  const area              = re?.area              ? String(re.area)              : null;
  const years             = re?.years             ? String(re.years)             : null;
  const networkSize       = re?.networkSize       ? `${re.networkSize}+`         : null;
  const monthlyRecruits   = re?.recruitCountMonthly ? String(re.recruitCountMonthly) : null;
  const referralsTarget   = re?.referralsTarget   ? String(re.referralsTarget)  : null;
  const experience        = re?.recruitmentExperienceDescription
                              ? String(re.recruitmentExperienceDescription)      : null;
  const note              = re?.note              ? String(re.note)              : null;

  const expertInfo          = ext.expertInfo as { rating?: number; jobsCompleted?: number; id?: string } | null;
  const expertRating        = expertInfo?.rating       ?? (ext.expertRating       as number | undefined) ?? null;
  const expertJobsCompleted = expertInfo?.jobsCompleted ?? (ext.expertJobsCompleted as number | undefined) ?? null;
  const expertId            = expertInfo?.id           ?? (ext.expertId           as string | undefined) ?? null;

  const bank = (ext.bankDetails ?? ext.account) as {
    bankName?: string; accountNumber?: string; accountName?: string;
  } | null;

  const hasValidEmail = /\S+@\S+\.\S+/.test(email);
  const mailSubject = `Action Needed: Your TAS Application${tasId ? ` (${tasId})` : ""}`;
  const mailBody =
`Hi ${name},

Thank you for applying to become a TAS agent with inSmartio.

We're currently reviewing your application and need a bit more information before we can proceed. Could you please reply to this email with any of the following that apply:

- Updated or clearer copies of any documents that may be missing or hard to read
- Additional details about your recruitment experience or network
- Any other supporting information relevant to your application

Once we receive this, we'll continue processing your application right away.

Thank you for your patience.

Best regards,
inSmartio Team`;

  const mailHref = hasValidEmail
    ? `mailto:${email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`
    : undefined;

  const handleToggleVerify = async (doc: DocEntry) => {
    if (!doc.publicId) return;
    const nextVerified = !doc.verified;
    setBusyKey(doc.key);
    try {
      await verifyTas(agent.id, { documentKey: doc.publicId, verify: nextVerified, reject: false, adminId });
      setDocs(prev => prev.map(d => d.key === doc.key ? { ...d, verified: nextVerified, rejected: false, reason: undefined } : d));
    } catch (err: unknown) {
      toast.error("Failed to update document", { description: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusyKey(null);
    }
  };

  const handleOpenReject = (doc: DocEntry) => {
    setPopupKey(doc.key);
    setReasonDraft(doc.reason ?? "");
  };

  const handleCloseReject = () => {
    setPopupKey(null);
    setReasonDraft("");
  };

  // Confirm a new rejection — requires a reason, called from the popup.
  const handleConfirmReject = async (doc: DocEntry) => {
    if (!doc.publicId) return;
    if (!reasonDraft.trim()) { toast.warning("Please provide a reason"); return; }
    setBusyKey(doc.key);
    try {
      await verifyTas(agent.id, { documentKey: doc.publicId, verify: false, reject: true, reason: reasonDraft.trim(), adminId });
      setDocs(prev => prev.map(d => d.key === doc.key ? { ...d, verified: false, rejected: true, reason: reasonDraft.trim() } : d));
      setPopupKey(null);
      setReasonDraft("");
    } catch (err: unknown) {
      toast.error("Failed to reject document", { description: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusyKey(null);
    }
  };

  // Un-reject (clear both flags) — no reason needed.
  const handleClearReject = async (doc: DocEntry) => {
    if (!doc.publicId) return;
    setBusyKey(doc.key);
    try {
      await verifyTas(agent.id, { documentKey: doc.publicId, verify: false, reject: false, adminId });
      setDocs(prev => prev.map(d => d.key === doc.key ? { ...d, verified: false, rejected: false, reason: undefined } : d));
    } catch (err: unknown) {
      toast.error("Failed to update document", { description: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusyKey(null);
    }
  };

  // Approve/Reject here are read-only status checks — no API call. They just
  // confirm whether the condition is currently met from the checkboxes above.
  const checkApprove = () => {
    if (status === "approved") toast.success("All documents are verified — this application is Approved.");
    else toast.warning(`Not yet approved — ${verifiedCount}/${docs.length} documents verified.`);
  };
  const checkReject = () => {
    if (status === "rejected") toast.success("At least one document is rejected — this application is Rejected.");
    else toast.warning("Not rejected — no documents have been marked Reject yet.");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: "#F4F5F7" }}>

      {/* ── Page header ── */}
      <div style={{
        padding: isMobile ? "16px 16px 0" : "20px 32px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
      }}>
        <button onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 8, border: "none",
            background: "none", cursor: "pointer", fontSize: 14, color: "#111827", fontWeight: 600,
          }}>
          <ArrowLeft size={16} /> TAS Applications
        </button>
        <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#111827" }}>{name}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={checkApprove}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: isMobile ? "8px 12px" : "9px 16px",
              borderRadius: 10, border: "none", backgroundColor: "#16a34a", color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
            <CheckCircle2 size={14} /> Approve
          </button>
          <button onClick={checkReject}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: isMobile ? "8px 12px" : "9px 16px",
              borderRadius: 10, border: "1.5px solid #fecaca", backgroundColor: "#fff",
              color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
            <XCircle size={14} /> Reject
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        padding: isMobile ? "16px 12px 100px" : "20px 32px 100px",
        flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 16,
      }}>

        <StatusBanner status={status} verifiedCount={verifiedCount} total={docs.length} />

        {/* ── Applicant Information ── */}
        <div style={card}>
          <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
            <p style={sectionLabel}>Applicant Information</p>
            <InfoRow label="Name:"           value={name} />
            <InfoRow label="Phone:"          value={phone} />
            <InfoRow label="Email:"          value={email} />
            {gender      && <InfoRow label="Gender:"          value={gender.charAt(0).toUpperCase() + gender.slice(1)} />}
            {dob         && <InfoRow label="Date of Birth:"   value={dob} />}
            <InfoRow label="Type:"           value={tasType} />
            <InfoRow label="TAS ID:"         value={tasId} />
            {referral    && <InfoRow label="Referral Code:"   value={referral} />}
            {parentTas   && <InfoRow label="Parent TAS:"      value={parentTas} />}
            {locationStr && <InfoRow label="Location:"        value={locationStr} />}
            <InfoRow label="Submitted:"      value={submitted} />
            {expertId            && <InfoRow label="Existing Expert ID:"     value={expertId} />}
            {expertRating       != null && <InfoRow label="Expert Rating:"           value={`${expertRating} ⭐`} />}
            {expertJobsCompleted != null && <InfoRow label="Expert Jobs Completed:"  value={String(expertJobsCompleted)} />}
          </div>
        </div>

        {/* ── Application Details ── */}
        <div style={card}>
          <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
            <p style={sectionLabel}>Application Details</p>
            <InfoRow label="Categories:"              value={categoryStr} />
            <InfoRow label="Network Size:"            value={networkSize ?? "—"} />
            <InfoRow label="Recruitment Experience:"  value={experience ?? "—"} />
            <InfoRow label="Why TAS:"                 value={whyTas ?? "—"} />
            {area            && <InfoRow label="Area:"               value={area} />}
            {years           && <InfoRow label="Years Experience:"   value={years} />}
            {monthlyRecruits && <InfoRow label="Monthly Recruits:"   value={monthlyRecruits} />}
            {referralsTarget && <InfoRow label="Referrals Target:"   value={referralsTarget} />}
            {note            && <InfoRow label="Note:"               value={note} />}
          </div>
        </div>

        {/* ── Bank Details ── */}
        {bank?.bankName && (
          <div style={card}>
            <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
              <p style={sectionLabel}>Bank Details</p>
              <InfoRow label="Bank Name:"      value={bank.bankName} />
              <InfoRow label="Account Name:"   value={bank.accountName} />
              <InfoRow label="Account Number:" value={bank.accountNumber} />
            </div>
          </div>
        )}

        {/* ── Documents ── */}
        <div style={card}>
          <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
            <p style={sectionLabel}>Documents</p>
            {docs.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic", margin: 0 }}>
                No documents uploaded.
              </p>
            ) : docs.map((doc) => {
              const busy = busyKey === doc.key;
              const has  = !!doc.url && doc.url.length > 10;
              return (
                <div key={doc.key} style={{ padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? 8 : 10,
                  }}>
                    <span style={{ flex: 1, fontSize: 13, color: "#111827", fontWeight: 500 }}>
                      📄 {doc.label}
                    </span>
                    {has ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <a href={doc.url} target="_blank" rel="noreferrer"
                          style={{
                            fontSize: 12, color: "#2563eb", fontWeight: 500, textDecoration: "none",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                          <Eye size={13} /> View
                        </a>
                        <a href={toDownloadUrl(doc.url!)} download
                          style={{
                            fontSize: 12, color: "#6B7280", fontWeight: 500, textDecoration: "none",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                          <Download size={13} /> Download
                        </a>
                        <label style={{
                          display: "flex", alignItems: "center", gap: 5,
                          cursor: busy ? "default" : "pointer",
                          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                          color: doc.verified ? "#16a34a" : "#6B7280",
                        }}>
                          <input
                            type="checkbox" checked={doc.verified}
                            onChange={busy ? undefined : () => handleToggleVerify(doc)}
                            readOnly={busy}
                            style={{ accentColor: "#16a34a", width: 14, height: 14 }}
                          />
                          Verify
                        </label>
                        <label style={{
                          display: "flex", alignItems: "center", gap: 5,
                          cursor: busy ? "default" : "pointer",
                          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                          color: doc.rejected ? "#dc2626" : "#6B7280",
                        }}>
                          <input
                            type="checkbox" checked={doc.rejected}
                            onChange={busy ? undefined : () => doc.rejected ? handleClearReject(doc) : handleOpenReject(doc)}
                            readOnly={busy}
                            style={{ accentColor: "#dc2626", width: 14, height: 14 }}
                          />
                          Reject
                        </label>
                        {busy && <Loader2 size={12} className="animate-spin" color="#9CA3AF" />}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>No URL</span>
                    )}
                  </div>

                  {doc.rejected && doc.reason && popupKey !== doc.key && (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#b91c1c" }}>
                      Reason: {doc.reason}
                    </p>
                  )}

                  {popupKey === doc.key && (
                    <div style={{
                      marginTop: 8, padding: "10px 12px", borderRadius: 10,
                      border: "1px solid #FECACA", backgroundColor: "#FEF2F2",
                      display: "flex", flexDirection: "column", gap: 8,
                    }}>
                      <textarea
                        value={reasonDraft}
                        onChange={(e) => setReasonDraft(e.target.value)}
                        placeholder="Reason for rejecting this document…"
                        rows={2} autoFocus disabled={busy}
                        style={{
                          width: "100%", borderRadius: 8, border: "1px solid #FCA5A5",
                          padding: "8px 10px", fontSize: 12, resize: "none", outline: "none",
                          backgroundColor: "#fff", color: "#111827", boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={handleCloseReject} disabled={busy}
                          style={{
                            padding: "5px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
                            backgroundColor: "#fff", fontSize: 12, color: "#6B7280",
                            cursor: busy ? "not-allowed" : "pointer",
                          }}>
                          Cancel
                        </button>
                        <button onClick={() => handleConfirmReject(doc)} disabled={busy}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 12px", borderRadius: 8, border: "none",
                            backgroundColor: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 600,
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
            })}
          </div>
        </div>

        {/* ── Request more info ── */}
        <div style={{ ...card, padding: isMobile ? "16px" : "20px 24px", display: "flex", alignItems: "center" }}>
          {hasValidEmail ? (
            <a href={mailHref}
              style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, textDecoration: "none" }}>
              Request More Info
            </a>
          ) : (
            <span title="No email on file for this applicant"
              style={{ fontSize: 13, color: "#D1D5DB", fontWeight: 500, cursor: "not-allowed" }}>
              Request More Info
            </span>
          )}
        </div>
      </div>
    </div>
  );
}