// components/users/UserDetail.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, ShieldCheck, Trash2, ShieldOff, UserX, Eye, StickyNote, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export type UserStatus =
  | "Active" | "Tier 1" | "Tier 2" | "Tier 3"
  | "Pending" | "Suspended";

export interface UserJob {
  id:       string;
  info:     string;
  payment:  number;
  notes:    string;
  review?:  string;
  tas?: {
    id?:         string;
    name?:       string;
    phone?:      string;
    tier?:       number;
    commission?: number | null;
  };
}

export interface User {
  id:                   string;
  avatarSeed:           number;
  avatarUrl?:           string | null;
  name:                 string;
  email:                string;
  phone?:               string;
  type:                 "Expert" | "Client" | "TAS";
  status:               UserStatus;
  joined:               string;
  verify?:              boolean;
  username?:            string;
  gender?:              string;
  bio?:                 string;
  verification?:        string;
  category?:            Record<string, unknown> | string[];
  skill?:               Record<string, unknown>;
  services?:            unknown;
  bankDetails?:         Record<string, unknown>;
  document?:            Record<string, unknown> | unknown[];
  paymentModel?:        string;
  location?:            { area?: string; city?: string; state?: string; country?: string; address?: string };
  dob?:                 string;
  referral?:            string | null;
  account?:             { bvn?: string; bankName?: string; accountCode?: string; accountName?: string; accountNumber?: string };
  jobs?:                UserJob[];
  // TAS-specific
  applicationCode?:     string;
  tier?:                number;
  parentTasId?:         string | null;
  recruitExpectations?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const statusVariant: Record<UserStatus, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active: "green", "Tier 1": "purple", "Tier 2": "purple",
  "Tier 3": "purple", Pending: "yellow", Suspended: "red",
};

const AVATAR_COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#7c3aed",
  "#db2777", "#0891b2", "#dc2626", "#65a30d",
];
const getInitials = (name: string) =>
  (name ?? "?").split(" ").map((n) => n?.[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
const getColor = (seed: number) => AVATAR_COLORS[(seed ?? 0) % AVATAR_COLORS.length];
const fmtMoney = (n: number) => `₦${n.toLocaleString()}`;

// ─────────────────────────────────────────────────────────
// Shared small components
// ─────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "13px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "130px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", wordBreak: "break-word", flex: 1 }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.08em", color: "#9CA3AF", margin: "16px 0 10px" }}>
      {text}
    </p>
  );
}

// ─────────────────────────────────────────────────────────
// Documents section
// ─────────────────────────────────────────────────────────
function DocumentsSection({ document }: { document?: Record<string, unknown> | unknown[] }) {
  if (!document) return null;

  type DocItem = { url?: string; secureUrl?: string; type?: string; verify?: boolean };

  const docs: DocItem[] = Array.isArray(document)
    ? (document as Record<string, unknown>[]).map((d) => ({
        url:    String(d.secureUrl ?? d.url ?? ""),
        type:   d.type as string,
        verify: Boolean(d.verify),
      }))
    : Object.values(document as Record<string, unknown>)
        .filter((d) => d && typeof d === "object")
        .map((d) => {
          const r = d as Record<string, unknown>;
          return { url: String(r.url ?? ""), type: r.type as string, verify: Boolean(r.verify) };
        });

  if (docs.length === 0) return null;

  return (
    <>
      <SectionTitle text="Documents" />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {docs.map((doc, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px",
            padding: "10px 14px", borderRadius: "10px",
            backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}>
            <span style={{ flex: 1, fontSize: "13px", color: "#374151",
              textTransform: "capitalize", fontWeight: 500 }}>
              {doc.type ?? `Document ${i + 1}`}
            </span>
            {doc.url && (
              <button
                onClick={() => {
                  if (doc.url!.startsWith("http")) {
                    window.open(doc.url!, "_blank", "noopener,noreferrer");
                  } else {
                    const a = window.document.createElement("a") as HTMLAnchorElement;
                    a.href = doc.url!;
                    const mime = doc.url!.split(";")[0].split(":")[1] ?? "image/jpeg";
                    const ext  = mime.split("/")[1] ?? "jpg";
                    a.download = `${(doc.type ?? "document").replace(/\s+/g, "-")}.${ext}`;
                    a.click();
                  }
                }}
                style={{ display: "flex", alignItems: "center", gap: "4px",
                  fontSize: "12px", color: "#2563EB", cursor: "pointer",
                  padding: "4px 8px", borderRadius: "6px",
                  border: "1px solid #DBEAFE", backgroundColor: "#EFF6FF",
                  whiteSpace: "nowrap" }}>
                <Eye size={12} /> View
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Per-type info rows
// ─────────────────────────────────────────────────────────
function ExpertRows({ user }: { user: User }) {
  const loc   = user.location;
  const loc2  = loc ? [loc.area, loc.city, loc.state, loc.country].filter(Boolean).join(", ") : undefined;
  const skill = user.skill as Record<string, unknown> | undefined;
  const cat   = user.category as Record<string, unknown> | undefined;
  const bank  = user.bankDetails as Record<string, unknown> | undefined;

  const verificationLabel = user.verification
    ? user.verification.replace("tier", "Tier ").replace(/(\d)/, " $1").trim()
    : undefined;

  return (
    <>
      <InfoRow label="Name:"           value={user.name} />
      <InfoRow label="Phone:"          value={user.phone} />
      <InfoRow label="Email:"          value={user.email} />
      <InfoRow label="Gender:"         value={user.gender} />
      <InfoRow label="Bio:"            value={user.bio} />
      <InfoRow label="Location:"       value={loc2} />
      <InfoRow label="User Type:"      value={user.type} />
      <InfoRow label="Verification:"   value={verificationLabel} />
      <InfoRow label="Payment Model:"  value={user.paymentModel} />
      <InfoRow label="Joined:"         value={user.joined} />
      <InfoRow label="Status:"         value={<StatusBadge label={user.status} variant={statusVariant[user.status]} />} />

      {skill && (
        <>
          <SectionTitle text="Skill" />
          <InfoRow label="Role:"        value={Array.isArray(skill.role) ? (skill.role as string[]).join(", ") : String(skill.role ?? "—")} />
          <InfoRow label="Experience:"  value={skill.experience ? `${skill.experience} yrs` : undefined} />
          <InfoRow label="Area:"        value={skill.area as string} />
          <InfoRow label="Description:" value={skill.description as string} />
        </>
      )}

      {cat && (
        <>
          <SectionTitle text="Category" />
          <InfoRow label="Name:" value={cat.name as string} />
          {Array.isArray(cat.sub) && cat.sub.length > 0 && (
            <InfoRow label="Sub-categories:" value={(cat.sub as string[]).join(", ")} />
          )}
        </>
      )}

      <DocumentsSection document={user.document} />

      {bank && (
        <>
          <SectionTitle text="Bank Details" />
          <InfoRow label="Bank Name:"    value={bank.bankName as string} />
          <InfoRow label="Account No:"   value={bank.accountNumber as string} />
          <InfoRow label="Account Name:" value={bank.accountName as string} />
          {bank.bvn && (
            <InfoRow label="BVN:" value={String(bank.bvn).replace(/\d(?=\d{4})/g, "*")} />
          )}
        </>
      )}
    </>
  );
}

function ClientRows({ user }: { user: User }) {
  const loc  = user.location;
  const loc2 = loc ? [loc.area, loc.city, loc.state, loc.country].filter(Boolean).join(", ") : undefined;

  return (
    <>
      <InfoRow label="Name:"     value={user.name} />
      <InfoRow label="Phone:"    value={user.phone} />
      <InfoRow label="Email:"    value={user.email} />
      <InfoRow label="Location:" value={loc2} />
      <InfoRow label="User Type" value={user.type} />
      <InfoRow label="Verified:" value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"   value={user.joined} />
      <InfoRow label="Status:"   value={<StatusBadge label={user.status} variant={statusVariant[user.status]} />} />
    </>
  );
}

function TasRows({ user }: { user: User }) {
  const loc  = user.location;
  const loc2 = loc?.address
    || [loc?.area, loc?.city, loc?.state, loc?.country].filter(Boolean).join(", ")
    || undefined;

  const bank   = user.bankDetails as Record<string, string> | undefined;
  const re     = user.recruitExpectations as Record<string, unknown> | undefined;

  const catArr = Array.isArray(user.category)
    ? (user.category as string[]).join(", ")
    : undefined;

  return (
    <>
      <InfoRow label="Name:"             value={user.name} />
      <InfoRow label="Username:"         value={user.username} />
      <InfoRow label="Phone:"            value={user.phone} />
      <InfoRow label="Email:"            value={user.email} />
      <InfoRow label="Gender:"           value={user.gender} />
      <InfoRow label="Date of Birth:"    value={user.dob ? new Date(user.dob).toLocaleDateString("en-GB") : undefined} />
      <InfoRow label="Location:"         value={loc2} />
      <InfoRow label="Categories:"       value={catArr} />
      <InfoRow label="Tier:"             value={user.tier ? `Tier ${user.tier}` : undefined} />
      <InfoRow label="Referral:"         value={user.referral} />
      <InfoRow label="Application Code:" value={(user as unknown as Record<string, unknown>).applicationCode as string} />
      <InfoRow label="Parent TAS ID:"    value={(user as unknown as Record<string, unknown>).parentTasId as string} />
      <InfoRow label="Verified:"         value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"           value={user.joined} />
      <InfoRow label="Status:"           value={<StatusBadge label={user.status} variant={statusVariant[user.status]} />} />

      {re && (
        <>
          <SectionTitle text="Recruit Expectations" />
          <InfoRow label="Area:"               value={re.area as string} />
          <InfoRow label="Experience:"         value={re.years as string} />
          <InfoRow label="Network Size:"       value={re.networkSize as string} />
          <InfoRow label="Monthly Recruits:"   value={re.recruitCountMonthly as string} />
          <InfoRow label="Has Experience:"     value={re.hasRecruitmentExperience as string} />
          {re.recruitmentExperienceDescription && (
            <InfoRow label="Experience Desc:"  value={re.recruitmentExperienceDescription as string} />
          )}
          {Array.isArray(re.selectedCategories) && (
            <InfoRow label="Categories:"       value={(re.selectedCategories as string[]).join(", ")} />
          )}
        </>
      )}

      <DocumentsSection document={user.document} />

      {bank?.bankName && (
        <>
          <SectionTitle text="Bank Details" />
          <InfoRow label="Bank Name:"    value={bank.bankName} />
          <InfoRow label="Account No:"   value={bank.accountNumber} />
          <InfoRow label="Account Name:" value={bank.accountName} />
          {bank.bvn && <InfoRow label="BVN:" value={bank.bvn.replace(/\d(?=\d{4})/g, "*")} />}
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Jobs table
// ─────────────────────────────────────────────────────────
function JobsTable({ jobs, userType }: { jobs?: UserJob[]; userType: User["type"] }) {
  if (userType === "TAS") return null;

  const TH: React.CSSProperties = {
    textAlign: "left", padding: "12px 20px", fontSize: "11px",
    fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase",
    letterSpacing: "0.05em", borderBottom: "1px solid #F3F4F6",
    whiteSpace: "nowrap",
  };
  const TD: React.CSSProperties = {
    padding: "14px 20px", fontSize: "13px",
    color: "#374151", borderBottom: "1px solid #F3F4F6",
  };

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
      borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Jobs</p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F9FAFB" }}>
              <th style={TH}>Job ID</th>
              <th style={TH}>Job Info</th>
              <th style={TH}>Payment</th>
              <th style={TH}>Notes</th>
              <th style={TH}>Review</th>
              <th style={TH}>TAS Info</th>
            </tr>
          </thead>
          <tbody>
            {!jobs || jobs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "48px",
                  fontSize: "13px", color: "#9CA3AF" }}>
                  No jobs found for this user.
                </td>
              </tr>
            ) : jobs.map((job) => (
              <tr key={job.id} style={{ borderBottom: "1px solid #F3F4F6" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <td style={{ ...TD, fontWeight: 500, color: "#111827", fontFamily: "monospace", fontSize: "12px" }}>
                  {job.id}
                </td>
                <td style={{ ...TD, color: "#6B7280" }}>{job.info}</td>
                <td style={{ ...TD, fontWeight: 500, color: "#111827" }}>{fmtMoney(job.payment)}</td>
                <td style={{ ...TD, color: "#6B7280" }}>{job.notes}</td>
                <td style={{ ...TD, color: "#6B7280" }}>{job.review ?? "—"}</td>
                <td style={{ ...TD }}>
                  {job.tas?.name ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                        {job.tas.name}
                      </span>
                      {job.tas.phone && (
                        <span style={{ fontSize: "11.5px", color: "#6B7280" }}>{job.tas.phone}</span>
                      )}
                      {job.tas.tier != null && (
                        <span style={{
                          display: "inline-flex", alignSelf: "flex-start",
                          fontSize: "10.5px", fontWeight: 600, color: "#7c3aed",
                          backgroundColor: "#F3E8FF", borderRadius: "5px",
                          padding: "1px 7px", marginTop: "2px",
                        }}>
                          Tier {job.tas.tier}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "#9CA3AF", fontSize: "13px" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {jobs && jobs.length > 0 && (
        <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6" }}>
          <button style={{ fontSize: "13px", fontWeight: 500, color: "#2563EB",
            background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Add Note Modal
// ─────────────────────────────────────────────────────────
function AddNoteModal({ userName, onClose }: { userName: string; onClose: () => void }) {
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    // TODO: wire to API — POST /admin/users/:id/notes
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px 32px",
        width: "440px", maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "16px" }}>

        <div>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            Add Note
          </p>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>
            Add an internal note for <strong>{userName}</strong>. This is only visible to admins.
          </p>
        </div>

        <textarea
          rows={4}
          placeholder="e.g. User contacted support regarding payment issue on 03/06/2026..."
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: "10px",
            border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", fontSize: "13px",
            color: "#111827", outline: "none", resize: "none",
            boxSizing: "border-box", lineHeight: 1.6 }}
        />

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "9px 20px", borderRadius: "10px", border: "1px solid #E5E7EB",
              fontSize: "13px", fontWeight: 500, color: "#6B7280",
              background: "#fff", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!note.trim() || saving}
            style={{ padding: "9px 20px", borderRadius: "10px", border: "none",
              fontSize: "13px", fontWeight: 600, backgroundColor: "#2563EB", color: "#fff",
              cursor: note.trim() && !saving ? "pointer" : "not-allowed",
              opacity: note.trim() && !saving ? 1 : 0.5,
              display: "flex", alignItems: "center", gap: "6px" }}>
            {saving
              ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
              : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Action bar — role-specific
// ─────────────────────────────────────────────────────────
function ActionBar({ user, onDelete, onSuspend, onAddNote }: {
  user:        User;
  onDelete?:   () => void;
  onSuspend?:  () => void;
  onAddNote:   () => void;
}) {
  const isSuspended = user.status === "Suspended";

  const baseBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "10px 20px", borderRadius: "10px", fontSize: "13px",
    fontWeight: 500, cursor: "pointer", border: "1px solid #E5E7EB",
    backgroundColor: "#fff", color: "#374151",
  };
  const dangerBtn: React.CSSProperties = {
    ...baseBtn, color: "#ef4444", border: "1px solid #fecaca",
  };
  const warnBtn: React.CSSProperties = {
    ...baseBtn,
    color:           isSuspended ? "#16a34a" : "#d97706",
    border:          isSuspended ? "1px solid #bbf7d0" : "1px solid #fde68a",
    backgroundColor: isSuspended ? "#f0fdf4" : "#fffbeb",
  };
  const noteBtn: React.CSSProperties = {
    ...baseBtn, color: "#2563EB", border: "1px solid #DBEAFE",
    backgroundColor: "#EFF6FF",
  };

  if (user.type === "Expert") return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <button style={baseBtn}><ShieldCheck size={14} /> Verify Tier 2</button>
      <button onClick={onSuspend} style={warnBtn}>
        <ShieldOff size={14} />
        {isSuspended ? "Reinstate User" : "Suspend User"}
      </button>
      <button onClick={onDelete} style={dangerBtn}><Trash2 size={14} /> Delete Account</button>
      <button onClick={onAddNote} style={noteBtn}><StickyNote size={14} /> Add Note</button>
    </div>
  );

  if (user.type === "Client") return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <button style={baseBtn}><ShieldCheck size={14} /> Verify</button>
      <button onClick={onSuspend} style={warnBtn}>
        {isSuspended ? <><ShieldOff size={14} /> Reinstate User</> : <><UserX size={14} /> Suspend User</>}
      </button>
      <button onClick={onDelete} style={dangerBtn}><Trash2 size={14} /> Delete Account</button>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <button style={baseBtn}><ShieldCheck size={14} /> Adjust Tier</button>
      <button onClick={onSuspend} style={warnBtn}>
        {isSuspended ? <><ShieldOff size={14} /> Reinstate User</> : <><UserX size={14} /> Suspend User</>}
      </button>
      <button onClick={onDelete} style={dangerBtn}><Trash2 size={14} /> Delete Account</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
interface UserDetailProps {
  user:       User;
  onBack:     () => void;
  onDelete?:  () => void;
  onSuspend?: () => void;
}

export default function UserDetail({ user, onBack, onDelete, onSuspend }: UserDetailProps) {
  const isSuspended  = user.status === "Suspended";
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1,
      minHeight: 0, backgroundColor: "#F4F5F7" }}>
      <style>{`
        .ud-wrap { padding: 16px; }
        @media(min-width:640px){ .ud-wrap { padding: 24px 32px; } }
      `}</style>

      {noteOpen && (
        <AddNoteModal userName={user.name} onClose={() => setNoteOpen(false)} />
      )}

      <main className="ud-wrap" style={{ flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Back + Suspend (top bar) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px",
              fontSize: "15px", fontWeight: 600, color: "#111827",
              background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={16} /> {user.name ?? "User"}
          </button>
          <button onClick={onSuspend}
            style={{ padding: "8px 20px", borderRadius: "10px", fontSize: "13px",
              fontWeight: 500, cursor: "pointer",
              border:          isSuspended ? "1px solid #bbf7d0" : "1px solid #E5E7EB",
              backgroundColor: isSuspended ? "#f0fdf4" : "#fff",
              color:           isSuspended ? "#16a34a" : "#374151" }}>
            {isSuspended ? "Reinstate" : "Suspend"}
          </button>
        </div>

        {/* Profile card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
          borderRadius: "16px", padding: "24px",
          display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-start" }}>
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name}
              style={{ width: "90px", height: "90px", borderRadius: "50%",
                objectFit: "cover", flexShrink: 0, border: "2px solid #E5E7EB" }} />
          ) : (
            <div style={{ width: "90px", height: "90px", borderRadius: "50%",
              flexShrink: 0, backgroundColor: getColor(user.avatarSeed),
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "26px", border: "2px solid #E5E7EB" }}>
              {getInitials(user.name)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: "220px" }}>
            {user.type === "Expert" && <ExpertRows user={user} />}
            {user.type === "Client" && <ClientRows user={user} />}
            {user.type === "TAS"    && <TasRows    user={user} />}
          </div>
        </div>

        {/* Jobs table */}
        <JobsTable jobs={user.jobs} userType={user.type} />

        {/* Action bar */}
        <ActionBar
          user={user}
          onDelete={onDelete}
          onSuspend={onSuspend}
          onAddNote={() => setNoteOpen(true)}
        />

      </main>
    </div>
  );
}