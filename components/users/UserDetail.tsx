// components/users/UserDetail.tsx
"use client";

import { ArrowLeft, ShieldCheck, Trash2, BriefcaseIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";

export type UserStatus = "Active" | "Tier 1" | "Tier 2" | "Tier 3" | "Pending" | "Suspended";

export interface User {
  id:            string;
  avatarSeed:    number;
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
}

const statusVariant: Record<UserStatus, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active: "green", "Tier 1": "purple", "Tier 2": "purple",
  "Tier 3": "purple", Pending: "yellow", Suspended: "red",
};

const AVATAR_COLORS = ["#2563eb","#16a34a","#d97706","#7c3aed","#db2777","#0891b2","#dc2626","#65a30d"];
const getInitials   = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
const getColor      = (seed: number) => AVATAR_COLORS[seed % AVATAR_COLORS.length];

function Section({ title }: { title: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: "14px 0 8px" }}>
      {title}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "13px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "140px", flexShrink: 0, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-main)", wordBreak: "break-word", flex: 1 }}>{value ?? "—"}</span>
    </div>
  );
}

function ClientRows({ user }: { user: User }) {
  return (
    <>
      <InfoRow label="Name:"      value={user.name} />
      <InfoRow label="Username:"  value={user.username} />
      <InfoRow label="Phone:"     value={user.phone} />
      <InfoRow label="Email:"     value={user.email} />
      <InfoRow label="Referral:"  value={user.referral} />
      <InfoRow label="Verified:"  value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"    value={user.joined} />
    </>
  );
}

function ExpertRows({ user }: { user: User }) {
  const loc  = user.location;
  const skill = user.skill as Record<string, unknown> | undefined;
  const cat   = user.category as Record<string, unknown> | undefined;
  const bank  = user.bankDetails as Record<string, unknown> | undefined;

  const locationStr = loc
    ? [loc.area, loc.city, loc.state, loc.country].filter(Boolean).join(", ")
    : undefined;

  return (
    <>
      {/* Basic */}
      <InfoRow label="Name:"          value={user.name} />
      <InfoRow label="Phone:"         value={user.phone} />
      <InfoRow label="Email:"         value={user.email} />
      <InfoRow label="Gender:"        value={user.gender} />
      <InfoRow label="Bio:"           value={user.bio} />
      <InfoRow label="Verification:"  value={user.verification} />
      <InfoRow label="Payment Model:" value={user.paymentModel} />
      <InfoRow label="Referral:"      value={user.referral} />
      <InfoRow label="Verified:"      value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"        value={user.joined} />

      {/* Location */}
      {loc && (
        <>
          <Section title="Location" />
          <InfoRow label="Location:" value={locationStr} />
        </>
      )}

      {/* Skill */}
      {skill && (
        <>
          <Section title="Skill" />
          <InfoRow label="Role:"        value={Array.isArray(skill.role) ? (skill.role as string[]).join(", ") : String(skill.role ?? "—")} />
          <InfoRow label="Experience:"  value={skill.experience ? `${skill.experience} yrs` : undefined} />
          <InfoRow label="Description:" value={skill.description as string} />
          <InfoRow label="Area:"        value={skill.area as string} />
        </>
      )}

      {/* Category */}
      {cat && (
        <>
          <Section title="Category" />
          <InfoRow label="Name:" value={cat.name as string} />
          {Array.isArray(cat.sub) && cat.sub.length > 0 && (
            <InfoRow label="Sub-categories:" value={(cat.sub as string[]).join(", ")} />
          )}
        </>
      )}

      {/* Bank */}
      {bank && (
        <>
          <Section title="Bank Details" />
          <InfoRow label="Bank Name:"    value={bank.bankName as string} />
          <InfoRow label="Account No:"  value={bank.accountNumber as string} />
          <InfoRow label="Account Name:" value={bank.accountName as string} />
          <InfoRow label="BVN:"          value={bank.bvn as string} />
        </>
      )}
    </>
  );
}

function TasRows({ user }: { user: User }) {
  const loc = user.location;
  const acc = user.account;
  const bank = user.bankDetails as Record<string, string> | undefined;
  const cats = user.category as Record<string, unknown> | string[] | undefined;
  const doc  = user.document as Record<string, string> | undefined;

  const locationStr = loc
    ? [loc.area, loc.city, loc.state, loc.country].filter(Boolean).join(", ")
    : undefined;

  const categoryStr = Array.isArray(cats)
    ? (cats as string[]).join(", ")
    : cats?.name as string | undefined;

  return (
    <>
      <InfoRow label="Name:"           value={user.name} />
      <InfoRow label="Username:"       value={user.username} />
      <InfoRow label="Phone:"          value={user.phone} />
      <InfoRow label="Email:"          value={user.email} />
      <InfoRow label="Gender:"         value={user.gender} />
      <InfoRow label="Date of Birth:"  value={user.dob ? new Date(user.dob).toLocaleDateString("en-GB") : undefined} />
      <InfoRow label="Location:"       value={locationStr} />
      <InfoRow label="Referral:"       value={user.referral} />
      <InfoRow label="Categories:"     value={categoryStr} />
      <InfoRow label="Verified:"       value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"         value={user.joined} />

      {/* Documents */}
      {doc && Object.keys(doc).length > 0 && (
        <>
          <Section title="Documents" />
          {Object.entries(doc).map(([key, val]) => (
            <InfoRow key={key} label={key.replace(/([A-Z])/g, " $1").trim() + ":"} value={val || "—"} />
          ))}
        </>
      )}

      {/* Bank details — from bankDetails field (TAS API) or account field */}
      {(bank?.bankName || acc?.bankName) && (
        <>
          <Section title="Bank Details" />
          <InfoRow label="Bank Name:"    value={bank?.bankName    ?? acc?.bankName} />
          <InfoRow label="Account No:"   value={bank?.accountNo   ?? acc?.accountNumber} />
          <InfoRow label="Account Name:" value={bank?.accountName ?? acc?.accountName} />
          <InfoRow label="BVN:"          value={bank?.bvn         ?? acc?.bvn} />
        </>
      )}
    </>
  );
}

// ── Action bars ───────────────────────────────────────────
const actBtn: React.CSSProperties = {
  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
  gap: "6px", padding: "14px 8px", fontSize: "13px", fontWeight: 500,
  background: "none", border: "none", borderRight: "1px solid var(--color-border)",
  cursor: "pointer", color: "var(--color-text-muted)", transition: "background 0.15s",
};

function ClientActions({ onDelete, onSuspend, isSuspended }: { onDelete?: () => void; onSuspend?: () => void; isSuspended: boolean }) {
  return (
    <>
      <button style={actBtn}><ShieldCheck size={14} /> Verify</button>
      <button onClick={onSuspend} style={{ ...actBtn, color: isSuspended ? "#16a34a" : "#d97706" }}>
        {isSuspended ? "Reinstate" : "Suspend"}
      </button>
      <button onClick={onDelete} style={{ ...actBtn, borderRight: "none", color: "#ef4444" }}>
        <Trash2 size={14} /> Delete
      </button>
    </>
  );
}

function ExpertActions({ onDelete, onSuspend, isSuspended }: { onDelete?: () => void; onSuspend?: () => void; isSuspended: boolean }) {
  return (
    <>
      <button style={actBtn}><ShieldCheck size={14} /> Verify Expert</button>
      <button onClick={onSuspend} style={{ ...actBtn, color: isSuspended ? "#16a34a" : "#d97706" }}>
        {isSuspended ? "Reinstate" : "Suspend"}
      </button>
      <button onClick={onDelete} style={{ ...actBtn, borderRight: "none", color: "#ef4444" }}>
        <Trash2 size={14} /> Delete
      </button>
    </>
  );
}

function TasActions({ onDelete, onSuspend, isSuspended }: { onDelete?: () => void; onSuspend?: () => void; isSuspended: boolean }) {
  return (
    <>
      <button style={actBtn}>Adjust Tier</button>
      <button onClick={onSuspend} style={{ ...actBtn, color: isSuspended ? "#16a34a" : "#d97706" }}>
        {isSuspended ? "Reinstate" : "Suspend"}
      </button>
      <button onClick={onDelete} style={{ ...actBtn, borderRight: "none", color: "#ef4444" }}>
        <Trash2 size={14} /> Delete
      </button>
    </>
  );
}

// ── Main component ────────────────────────────────────────
interface UserDetailProps {
  user:      User;
  onBack:    () => void;
  onDelete?: () => void;
  onSuspend?: () => void;
}

export default function UserDetail({ user, onBack, onDelete, onSuspend }: UserDetailProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <style>{`
        .ud-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
        .ud-profile  { flex-direction: column; align-items: center; gap: 20px; }
        .ud-avatar   { width: 72px !important; height: 72px !important; font-size: 22px !important; }
        .ud-card     { background: #ffffff; border: 1px solid var(--color-border); border-radius: 16px; overflow: hidden; }
        @media (min-width: 640px) {
          .ud-content { padding: 24px 32px; gap: 20px; }
          .ud-profile { flex-direction: row; align-items: flex-start; gap: 32px; }
          .ud-avatar  { width: 96px !important; height: 96px !important; font-size: 26px !important; }
        }
      `}</style>

      <div className="ud-content" style={{ flex: 1, overflowY: "auto" }}>

        {/* Back */}
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 600, color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={16} /> {user.name}
        </button>

        {/* Profile card */}
        <div className="ud-card">
          <div className="ud-profile" style={{ display: "flex", padding: "24px" }}>
            {/* Avatar */}
            <div className="ud-avatar" style={{ borderRadius: "50%", flexShrink: 0, backgroundColor: getColor(user.avatarSeed), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
              {getInitials(user.name)}
            </div>

            {/* Fields */}
            <div style={{ flex: 1 }}>
              {user.type === "Expert" && <ExpertRows user={user} />}
              {user.type === "TAS"    && <TasRows    user={user} />}
              {user.type === "Client" && <ClientRows user={user} />}

              <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", marginTop: "8px" }}>
                <span style={{ minWidth: "140px", flexShrink: 0, color: "var(--color-text-muted)" }}>Status:</span>
                <StatusBadge label={user.status} variant={statusVariant[user.status]} />
              </div>
            </div>
          </div>
        </div>

        {/* Jobs card */}
        <div className="ud-card">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>Jobs</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: "10px", color: "var(--color-text-muted)" }}>
            <BriefcaseIcon size={36} strokeWidth={1.2} />
            <p style={{ fontSize: "13px", margin: 0 }}>No jobs found for this user.</p>
          </div>
        </div>

      </div>

      {/* Action bar */}
      <div className="ud-card" style={{ flexShrink: 0, display: "flex", margin: "0 16px 16px", borderRadius: "16px" }}>
        {user.type === "Expert" && <ExpertActions onDelete={onDelete} onSuspend={onSuspend} isSuspended={user.status === "Suspended"} />}
        {user.type === "TAS"    && <TasActions    onDelete={onDelete} onSuspend={onSuspend} isSuspended={user.status === "Suspended"} />}
        {user.type === "Client" && <ClientActions onDelete={onDelete} onSuspend={onSuspend} isSuspended={user.status === "Suspended"} />}
      </div>
    </div>
  );
}