// components/users/UserDetail.tsx
"use client";

import { ArrowLeft, ShieldCheck, Trash2, ShieldOff, UserX } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export type UserStatus =
  | "Active" | "Tier 1" | "Tier 2" | "Tier 3"
  | "Pending" | "Suspended";

export interface UserJob {
  id:       string;       // "Job-001"
  info:     string;       // "Plumbing repair - Ikeja"
  payment:  number;       // 18500
  notes:    string;       // "Completed 20/03/2026" | "In-progress"
  review?:  string;       // "Excellent job done."
}

export interface User {
  id:            string;
  avatarSeed:    number;
  avatarUrl?:    string | null;
  name:          string;
  email:         string;
  phone?:        string;
  type:          "Expert" | "Client" | "TAS";
  status:        UserStatus;
  joined:        string;
  verify?:       boolean;
  username?:     string;
  gender?:       string;
  bio?:          string;
  verification?: string;
  category?:     Record<string, unknown>;
  skill?:        Record<string, unknown>;
  services?:     unknown;
  bankDetails?:  Record<string, unknown>;
  document?:     Record<string, unknown>;
  paymentModel?: string;
  location?:     { area?: string; city?: string; state?: string; country?: string };
  dob?:          string;
  referral?:     string | null;
  account?:      { bvn?: string; bankName?: string; accountCode?: string; accountName?: string; accountNumber?: string };
  /* TODO-BACKEND: jobs array needed for expert/client detail view */
  jobs?:         UserJob[];
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
// Small shared components
// ─────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "13px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "120px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", wordBreak: "break-word", flex: 1 }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.08em", color: "#9CA3AF", margin: "12px 0 8px" }}>
      {text}
    </p>
  );
}

// ─────────────────────────────────────────────────────────
// Per-type info rows
// ─────────────────────────────────────────────────────────
function ExpertRows({ user }: { user: User }) {
  const loc  = user.location;
  const loc2  = loc ? [loc.area, loc.city, loc.state, loc.country].filter(Boolean).join(", ") : undefined;
  const skill = user.skill as Record<string, unknown> | undefined;
  const cat   = user.category as Record<string, unknown> | undefined;
  const bank  = user.bankDetails as Record<string, unknown> | undefined;

  return (
    <>
      <InfoRow label="Name:"          value={user.name} />
      <InfoRow label="Phone:"         value={user.phone} />
      <InfoRow label="Email:"         value={user.email} />
      <InfoRow label="Location:"      value={loc2} />
      <InfoRow label="User Type"      value={user.type} />
      <InfoRow label="Verification:"  value={user.verification} />
      <InfoRow label="Joined:"        value={user.joined} />
      <InfoRow label="Status:"        value={<StatusBadge label={user.status} variant={statusVariant[user.status]} />} />

      {skill && (
        <>
          <SectionTitle text="Skill" />
          <InfoRow label="Role:"        value={Array.isArray(skill.role) ? (skill.role as string[]).join(", ") : String(skill.role ?? "—")} />
          <InfoRow label="Experience:"  value={skill.experience ? `${skill.experience} yrs` : undefined} />
          <InfoRow label="Description:" value={skill.description as string} />
        </>
      )}
      {cat && (
        <>
          <SectionTitle text="Category" />
          <InfoRow label="Name:" value={cat.name as string} />
          {Array.isArray(cat.sub) && cat.sub.length > 0 && (
            <InfoRow label="Sub:" value={(cat.sub as string[]).join(", ")} />
          )}
        </>
      )}
      {bank && (
        <>
          <SectionTitle text="Bank Details" />
          <InfoRow label="Bank Name:"    value={bank.bankName as string} />
          <InfoRow label="Account No:"   value={bank.accountNumber as string} />
          <InfoRow label="Account Name:" value={bank.accountName as string} />
        </>
      )}
    </>
  );
}

function ClientRows({ user }: { user: User }) {
  return (
    <>
      <InfoRow label="Name:"     value={user.name} />
      <InfoRow label="Phone:"    value={user.phone} />
      <InfoRow label="Email:"    value={user.email} />
      <InfoRow label="User Type" value={user.type} />
      <InfoRow label="Verified:" value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"   value={user.joined} />
      <InfoRow label="Status:"   value={<StatusBadge label={user.status} variant={statusVariant[user.status]} />} />
    </>
  );
}

function TasRows({ user }: { user: User }) {
  const loc  = user.location;
  const loc2 = loc ? [loc.area, loc.city, loc.state, loc.country].filter(Boolean).join(", ") : undefined;
  const bank = user.bankDetails as Record<string, string> | undefined;
  const cats = user.category as Record<string, unknown> | undefined;
  const catStr = Array.isArray(cats?.sub)
    ? (cats!.sub as string[]).join(", ")
    : cats?.name as string | undefined;

  return (
    <>
      <InfoRow label="Name:"          value={user.name} />
      <InfoRow label="Username:"      value={user.username} />
      <InfoRow label="Phone:"         value={user.phone} />
      <InfoRow label="Email:"         value={user.email} />
      <InfoRow label="Date of Birth:" value={user.dob ? new Date(user.dob).toLocaleDateString("en-GB") : undefined} />
      <InfoRow label="Location:"      value={loc2} />
      <InfoRow label="Categories:"    value={catStr} />
      <InfoRow label="Referral:"      value={user.referral} />
      <InfoRow label="Verified:"      value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"        value={user.joined} />
      <InfoRow label="Status:"        value={<StatusBadge label={user.status} variant={statusVariant[user.status]} />} />

      {bank?.bankName && (
        <>
          <SectionTitle text="Bank Details" />
          <InfoRow label="Bank Name:"    value={bank.bankName} />
          <InfoRow label="Account No:"   value={bank.accountNumber} />
          <InfoRow label="Account Name:" value={bank.accountName} />
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Jobs table  (matches Image 1 exactly)
// ─────────────────────────────────────────────────────────
function JobsTable({ jobs, userType }: { jobs?: UserJob[]; userType: User["type"] }) {
  // TAS users don't have jobs
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

      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Jobs</p>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F9FAFB" }}>
              <th style={TH}>Jobs</th>
              <th style={TH}>Job Info</th>
              <th style={TH}>Payments</th>
              <th style={TH}>Notes</th>
              <th style={TH}>Reviews</th>
            </tr>
          </thead>
          <tbody>
            {!jobs || jobs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "48px",
                  fontSize: "13px", color: "#9CA3AF" }}>
                  No jobs found for this user.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <td style={{ ...TD, fontWeight: 500, color: "#111827" }}>{job.id}</td>
                  <td style={{ ...TD, color: "#6B7280" }}>{job.info}</td>
                  <td style={{ ...TD, fontWeight: 500, color: "#111827" }}>{fmtMoney(job.payment)}</td>
                  <td style={{ ...TD, color: "#6B7280" }}>{job.notes}</td>
                  <td style={{ ...TD, color: "#6B7280" }}>{job.review ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Load More — only shown when there are jobs */}
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
// Action buttons (bottom bar — matches Image 1)
// ─────────────────────────────────────────────────────────
function ActionBar({
  user, onDelete, onSuspend,
}: {
  user: User;
  onDelete?: () => void;
  onSuspend?: () => void;
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
    color:            isSuspended ? "#16a34a" : "#d97706",
    border:           isSuspended ? "1px solid #bbf7d0" : "1px solid #fde68a",
    backgroundColor:  isSuspended ? "#f0fdf4"            : "#fffbeb",
  };

  // Expert bottom bar: Verify Tier 2 | Suspend User | Delete Account
  if (user.type === "Expert") {
    return (
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <button style={baseBtn}>
          <ShieldCheck size={14} /> Verify Tier 2
        </button>
        <button onClick={onSuspend} style={warnBtn}>
          {isSuspended ? <><ShieldOff size={14} /> Reinstate User</> : <><ShieldOff size={14} /> Suspend User</>}
        </button>
        <button onClick={onDelete} style={dangerBtn}>
          <Trash2 size={14} /> Delete Account
        </button>
      </div>
    );
  }

  // Client bottom bar: Verify | Suspend | Delete
  if (user.type === "Client") {
    return (
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <button style={baseBtn}>
          <ShieldCheck size={14} /> Verify
        </button>
        <button onClick={onSuspend} style={warnBtn}>
          {isSuspended ? <><ShieldOff size={14} /> Reinstate User</> : <><UserX size={14} /> Suspend User</>}
        </button>
        <button onClick={onDelete} style={dangerBtn}>
          <Trash2 size={14} /> Delete Account
        </button>
      </div>
    );
  }

  // TAS bottom bar: Adjust Tier | Suspend | Delete
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <button style={baseBtn}>
        <ShieldCheck size={14} /> Adjust Tier
      </button>
      <button onClick={onSuspend} style={warnBtn}>
        {isSuspended ? <><ShieldOff size={14} /> Reinstate User</> : <><UserX size={14} /> Suspend User</>}
      </button>
      <button onClick={onDelete} style={dangerBtn}>
        <Trash2 size={14} /> Delete Account
      </button>
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
  const isSuspended = user.status === "Suspended";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1,
      minHeight: 0, backgroundColor: "#F4F5F7" }}>
      <style>{`
        .ud-wrap { padding: 16px; }
        @media(min-width:640px){ .ud-wrap { padding: 24px 32px; } }
      `}</style>

      <main className="ud-wrap" style={{ flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── Back + Suspend (top row, matches Image 1) ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px",
              fontSize: "15px", fontWeight: 600, color: "#111827",
              background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={16} /> {user.name ?? "User"}
          </button>

          {/* Top-right Suspend shortcut (visible in Image 1) */}
          <button onClick={onSuspend}
            style={{ padding: "8px 20px", borderRadius: "10px", fontSize: "13px",
              fontWeight: 500, cursor: "pointer",
              border:           isSuspended ? "1px solid #bbf7d0" : "1px solid #E5E7EB",
              backgroundColor:  isSuspended ? "#f0fdf4"           : "#fff",
              color:            isSuspended ? "#16a34a"           : "#374151" }}>
            {isSuspended ? "Reinstate" : "Suspend"}
          </button>
        </div>

        {/* ── Profile card ── */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
          borderRadius: "16px", padding: "24px",
          display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* Avatar — photo if available, else initials */}
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

          {/* Fields */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            {user.type === "Expert" && <ExpertRows user={user} />}
            {user.type === "Client" && <ClientRows user={user} />}
            {user.type === "TAS"    && <TasRows    user={user} />}
          </div>
        </div>

        {/* ── Jobs table (Expert + Client only) ── */}
        <JobsTable jobs={user.jobs} userType={user.type} />

        {/* ── Action buttons (bottom) ── */}
        <ActionBar user={user} onDelete={onDelete} onSuspend={onSuspend} />

      </main>
    </div>
  );
}