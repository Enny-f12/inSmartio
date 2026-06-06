// components/tas/ApplicationDetailPage.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, X, Loader2, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import type { ApiTas } from "@/lib/api/tasApi";
import { card, sectionLabel, InfoRow, statusBadge, getType, type AppTab } from "./shared";

interface Props {
  agent:     ApiTas;
  appStatus: AppTab;
  onBack:    () => void;
  onApprove: (id: string, documentKey: string) => Promise<void>;
  onReject:  (id: string, reason: string, documentKey: string) => Promise<void>;
}

// ── Document helpers ──────────────────────────────────────────────────────────

const EXCLUDED_TYPES = ["profile photo", "avatar"];

interface DocEntry {
  label:    string;
  url?:     string;
  verified: boolean;
  rejected: boolean;
}

function parseDocuments(rawDoc: unknown): { list: DocEntry[]; documentKey: string } {
  if (!rawDoc || typeof rawDoc !== "object") return { list: [], documentKey: "" };

  // Object shape: { ninSlip: { url, type, verify, reject, ... }, ... }
  if (!Array.isArray(rawDoc)) {
    const obj = rawDoc as Record<string, { url?: string; type?: string; verify?: boolean; reject?: boolean }>;
    const list = Object.values(obj)
      .filter((d) => d?.type && !EXCLUDED_TYPES.includes(d.type.toLowerCase()))
      .map((d) => ({
        label:    d.type!.charAt(0).toUpperCase() + d.type!.slice(1),
        url:      d.url,
        verified: d.verify ?? false,
        rejected: d.reject ?? false,
      }));
    const documentKey = Object.keys(obj).find(
      (k) => !EXCLUDED_TYPES.includes((obj[k]?.type ?? "").toLowerCase())
    ) ?? "";
    return { list, documentKey };
  }

  // Array shape: [{ type, url, verify, reject, publicId? }, ...]
  const arr = rawDoc as { type?: string; url?: string; secureUrl?: string; verify?: boolean; reject?: boolean; publicId?: string }[];
  const list = arr
    .filter((d) => d?.type && !EXCLUDED_TYPES.includes(d.type.toLowerCase()))
    .map((d) => ({
      label:    d.type!.charAt(0).toUpperCase() + d.type!.slice(1),
      url:      d.secureUrl ?? d.url,
      verified: d.verify ?? false,
      rejected: d.reject ?? false,
    }));
  const documentKey = arr.find(
    (d) => d.type && !EXCLUDED_TYPES.includes(d.type.toLowerCase())
  )?.publicId ?? "";
  return { list, documentKey };
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function ApplicationDetailPage({ agent, appStatus, onBack, onApprove, onReject }: Props) {
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [docChecks,    setDocChecks]    = useState<Record<string, boolean>>({});

  const toggleDoc = (key: string) =>
    setDocChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  // Unwrap nested user if present
  const rawAgent = ((agent as Record<string, unknown>).user as ApiTas | undefined) ?? agent;
  const ext      = rawAgent as Record<string, unknown>;

  // ── Parse documents ───────────────────────────────────────────────────────
  const { list: docList, documentKey } = parseDocuments(ext.document);

  // ── Applicant info ────────────────────────────────────────────────────────
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
  // Type: same logic as applications table
  const tasType = getType(ext);

  // ── Location ──────────────────────────────────────────────────────────────
  const loc = ext.location as { city?: string; state?: string; country?: string } | null;
  const locationStr = loc
    ? [loc.city, loc.state, loc.country].filter(Boolean).join(", ")
    : null;

  // ── Category ──────────────────────────────────────────────────────────────
  const categoryStr = parseCategory(ext.category);

  // ── Recruit Expectations ──────────────────────────────────────────────────
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

  // ── Expert-specific fields ────────────────────────────────────────────────
  const expertInfo         = ext.expertInfo as { rating?: number; jobsCompleted?: number; id?: string } | null;
  const expertRating       = expertInfo?.rating       ?? (ext.expertRating       as number | undefined) ?? null;
  const expertJobsCompleted = expertInfo?.jobsCompleted ?? (ext.expertJobsCompleted as number | undefined) ?? null;
  const expertId           = expertInfo?.id           ?? (ext.expertId           as string | undefined) ?? null;

  // ── Bank ──────────────────────────────────────────────────────────────────
  const bank = (ext.bankDetails ?? ext.account) as {
    bankName?: string; accountNumber?: string; accountName?: string;
  } | null;

  // ── mailto ────────────────────────────────────────────────────────────────
  const mailHref = `mailto:${email}?subject=${encodeURIComponent("TAS Application – More Information Needed")}&body=${encodeURIComponent(`Dear ${name},\n\nWe need more information regarding your TAS application.\n\nThank you.`)}`;

  const handleApprove = async () => {
    setLoading(true);
    try { await onApprove(agent.id, documentKey); } finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.warning("Please provide a reason"); return; }
    setLoading(true);
    try { await onReject(agent.id, rejectReason.trim(), documentKey); } finally { setLoading(false); }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: "#F4F5F7" }}>

      {/* ── Page header ── */}
      <div style={{
        padding: "20px 32px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 8, border: "none",
            background: "none", cursor: "pointer", fontSize: 14, color: "#111827", fontWeight: 600,
          }}>
          <ArrowLeft size={16} /> TAS Applications
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{name}</span>
        {appStatus === "pending" ? (
          <button onClick={handleApprove} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 20px",
              borderRadius: 10, border: "none", backgroundColor: "#16a34a", color: "#fff",
              fontSize: 13, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}>
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCircle2 size={14} />}
            Approve
          </button>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        padding: "20px 32px 100px", flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 16,
      }}>

        {/* ── Applicant Information ── */}
        <div style={card}>
          <div style={{ padding: "20px 24px" }}>
            <p style={sectionLabel}>Applicant Information</p>
            <InfoRow label="Name:"           value={name} />
            <InfoRow label="Phone:"          value={phone} />
            <InfoRow label="Email:"          value={email} />
            {gender    && <InfoRow label="Gender:"        value={gender.charAt(0).toUpperCase() + gender.slice(1)} />}
            {dob       && <InfoRow label="Date of Birth:" value={dob} />}
            <InfoRow label="Type:"           value={tasType} />
            <InfoRow label="TAS ID:"         value={tasId} />
            {referral  && <InfoRow label="Referral Code:" value={referral} />}
            {parentTas && <InfoRow label="Parent TAS:"    value={parentTas} />}
            {locationStr && <InfoRow label="Location:"    value={locationStr} />}
            <InfoRow label="Submitted:"      value={submitted} />
            <InfoRow label="Status:"         value={statusBadge(ext.status ?? "inactive")} />
            {/* Expert-specific — only shown when present */}
            {expertId           && <InfoRow label="Existing Expert ID:"     value={expertId} />}
            {expertRating       != null && <InfoRow label="Expert Rating:"          value={`${expertRating} ⭐`} />}
            {expertJobsCompleted != null && <InfoRow label="Expert Jobs Completed:" value={String(expertJobsCompleted)} />}
          </div>
        </div>

        {/* ── Application Details ── */}
        <div style={card}>
          <div style={{ padding: "20px 24px" }}>
            <p style={sectionLabel}>Application Details</p>
            {/* Always shown — even if empty */}
            <InfoRow label="Categories:"            value={categoryStr} />
            <InfoRow label="Network Size:"          value={networkSize ?? "—"} />
            <InfoRow label="Recruitment Experience:" value={experience ?? "—"} />
            <InfoRow label="Why TAS:"               value={whyTas ?? "—"} />
            {/* Shown when present */}
            {area            && <InfoRow label="Area:"                   value={area} />}
            {years           && <InfoRow label="Years Experience:"       value={years} />}
            {monthlyRecruits && <InfoRow label="Monthly Recruits:"       value={monthlyRecruits} />}
            {referralsTarget && <InfoRow label="Referrals Target:"       value={referralsTarget} />}
            {note            && <InfoRow label="Note:"                   value={note} />}
          </div>
        </div>

        {/* ── Bank Details ── */}
        {bank?.bankName && (
          <div style={card}>
            <div style={{ padding: "20px 24px" }}>
              <p style={sectionLabel}>Bank Details</p>
              <InfoRow label="Bank Name:"      value={bank.bankName} />
              <InfoRow label="Account Name:"   value={bank.accountName} />
              <InfoRow label="Account Number:" value={bank.accountNumber} />
            </div>
          </div>
        )}

        {/* ── Documents ── */}
        <div style={card}>
          <div style={{ padding: "20px 24px" }}>
            <p style={sectionLabel}>Documents</p>
            {docList.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic", margin: 0 }}>
                No documents uploaded.
              </p>
            ) : docList.map((doc) => {
              const isChecked = !!docChecks[doc.label]; // always starts unchecked — admin verifies
              return (
                <div key={doc.label} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 0", borderBottom: "1px solid #F3F4F6",
                }}>
                  <span style={{ flex: 1, fontSize: 13, color: "#111827", fontWeight: 500 }}>
                    📄 {doc.label}
                  </span>
                  {doc.url ? (
                    <>
                      <a href={doc.url} target="_blank" rel="noreferrer"
                        style={{
                          fontSize: 12, color: "#2563eb", fontWeight: 500, textDecoration: "none",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                        <Eye size={13} /> View
                      </a>
                      <a href={doc.url} download={`${doc.label}.pdf`}
                        style={{
                          fontSize: 12, color: "#6B7280", fontWeight: 500, textDecoration: "none",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                        <Download size={13} /> Download
                      </a>
                      <label style={{
                        display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                        fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                        color: isChecked ? "#16a34a" : "#6B7280",
                      }}>
                        <input
                          type="checkbox" checked={isChecked}
                          onChange={() => toggleDoc(doc.label)}
                          style={{ accentColor: "#16a34a", width: 14, height: 14 }}
                        />
                        {isChecked ? "✅ Verified" : "Mark as Verified"}
                      </label>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>No URL</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Actions ── */}
        {appStatus === "pending" && (
          <div style={{ ...card, padding: "20px 24px" }}>
            <p style={sectionLabel}>Actions</p>
            {rejectOpen ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                  Reason for rejecting <strong style={{ color: "#111827" }}>{name}</strong>:
                </p>
                <textarea
                  value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Incomplete documents, insufficient experience..."
                  rows={3}
                  style={{
                    width: "100%", borderRadius: 8, border: "1px solid #E5E7EB",
                    padding: "10px 12px", fontSize: 13, resize: "none", outline: "none",
                    boxSizing: "border-box", backgroundColor: "#F9FAFB",
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { setRejectOpen(false); setRejectReason(""); }}
                    style={{
                      flex: 1, padding: 10, borderRadius: 10, border: "1px solid #E5E7EB",
                      backgroundColor: "#fff", fontSize: 13, cursor: "pointer", color: "#6B7280",
                    }}>
                    Cancel
                  </button>
                  <button onClick={handleReject} disabled={loading}
                    style={{
                      flex: 1, padding: 10, borderRadius: 10, border: "none",
                      backgroundColor: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                    {loading
                      ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</>
                      : "Confirm Reject"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button onClick={handleApprove} disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "10px 22px",
                    borderRadius: 10, border: "none", backgroundColor: "#16a34a", color: "#fff",
                    fontSize: 13, fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Approve as TAS
                </button>
                <button onClick={() => setRejectOpen(true)} disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
                    borderRadius: 10, border: "1.5px solid #fecaca", backgroundColor: "#fff",
                    color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                  <X size={14} /> Reject
                </button>
                <a href={mailHref}
                  style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, textDecoration: "none" }}>
                  Request More Info
                </a>
              </div>
            )}
          </div>
        )}

        {appStatus !== "pending" && (
          <div style={{ ...card, padding: "16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
            {statusBadge(appStatus)}
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              This application has been {appStatus}.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}