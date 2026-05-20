// components/users/UserDetail.tsx
"use client";

import { ArrowLeft, ShieldCheck, Trash2, BriefcaseIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";

export type UserStatus = "Active" | "Tier 1" | "Tier 2" | "Tier 3" | "Pending" | "Suspended";

export interface User {
  id:           string;
  avatarSeed:   number;
  name:         string;
  email:        string;
  phone?:       string;
  type:         "Expert" | "Client" | "TAS";
  status:       UserStatus;
  joined:       string;
  verify?:      boolean;
  username?:    string;
  gender?:      string;
  bio?:         string;
  verification?: string;
  category?:    Record<string, unknown>;
  skill?:       Record<string, unknown>;
  services?:    unknown;
  bankDetails?: Record<string, unknown>;
  document?:    Record<string, unknown>;
  paymentModel?: string;
  location?:    { area?: string; city?: string; state?: string; country?: string };
  dob?:         string;
  referral?:    string | null;
  account?:     { bvn?: string; bankName?: string; accountCode?: string; accountName?: string; accountNumber?: string };
}

const statusVariant: Record<UserStatus, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active: "green", "Tier 1": "purple", "Tier 2": "purple",
  "Tier 3": "purple", Pending: "yellow", Suspended: "red",
};

const avatarColors = [
  "#2563eb", "#16a34a", "#d97706", "#7c3aed",
  "#db2777", "#0891b2", "#dc2626", "#65a30d",
];

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
const getColor = (seed: number) => avatarColors[seed % avatarColors.length];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="ud-inforow" style={{ display: "flex", gap: "8px", marginBottom: "10px", fontSize: "13px" }}>
      <span className="ud-label" style={{ flexShrink: 0, color: "var(--color-text-muted)" }}>{label}</span>
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
      <InfoRow label="User Type:" value="Client" />
      <InfoRow label="Verified:"  value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"    value={user.joined} />
    </>
  );
}

function ExpertRows({ user }: { user: User }) {
  return (
    <>
      <InfoRow label="Name:"          value={user.name} />
      <InfoRow label="Phone:"         value={user.phone} />
      <InfoRow label="Email:"         value={user.email} />
      <InfoRow label="Gender:"        value={user.gender} />
      <InfoRow label="Bio:"           value={user.bio} />
      <InfoRow label="Verification:"  value={user.verification} />
      <InfoRow label="Payment Model:" value={user.paymentModel} />
      <InfoRow label="Location:"      value={user.location?.country} />
      <InfoRow label="Verified:"      value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"        value={user.joined} />
    </>
  );
}

function TasRows({ user }: { user: User }) {
  const loc = user.location;
  const locationStr = loc
    ? [loc.area, loc.city, loc.state, loc.country].filter(Boolean).join(", ")
    : undefined;
  const acc = user.account;
  return (
    <>
      <InfoRow label="Name:"           value={user.name} />
      <InfoRow label="Phone:"          value={user.phone} />
      <InfoRow label="Email:"          value={user.email} />
      <InfoRow label="Gender:"         value={user.gender} />
      <InfoRow label="Date of Birth:"  value={user.dob ? new Date(user.dob).toLocaleDateString("en-GB") : undefined} />
      <InfoRow label="Location:"       value={locationStr} />
      <InfoRow label="Referral Code:"  value={user.referral} />
      <InfoRow label="Verified:"       value={user.verify ? "Yes" : "No"} />
      <InfoRow label="Joined:"         value={user.joined} />
      {acc && (
        <>
          <div style={{ borderTop: "1px solid var(--color-border)", margin: "8px 0 10px" }} />
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "8px" }}>Bank Details</p>
          <InfoRow label="Bank Name:"    value={acc.bankName} />
          <InfoRow label="Acct Name:"    value={acc.accountName} />
          <InfoRow label="Acct Number:"  value={acc.accountNumber} />
          <InfoRow label="BVN:"          value={acc.bvn} />
        </>
      )}
    </>
  );
}

function ClientActions({ onDelete, onSuspend, isSuspended }: { onDelete?: () => void; onSuspend?: () => void; isSuspended: boolean }) {
  return (
    <>
      <button className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
        <ShieldCheck size={14} /> Verify Tier 2
      </button>
      <button onClick={onSuspend} className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, color: isSuspended ? "#16a34a" : "#d97706", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
        {isSuspended ? "Reinstate User" : "Suspend User"}
      </button>
      <button onClick={onDelete} className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 500, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
        <Trash2 size={14} /> Delete
      </button>
    </>
  );
}

function ExpertActions({ onDelete, onSuspend, isSuspended }: { onDelete?: () => void; onSuspend?: () => void; isSuspended: boolean }) {
  return (
    <>
      <button className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
        <ShieldCheck size={14} /> Verify Expert
      </button>
      <button onClick={onSuspend} className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, color: isSuspended ? "#16a34a" : "#d97706", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
        {isSuspended ? "Reinstate Expert" : "Suspend Expert"}
      </button>
      <button onClick={onDelete} className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 500, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
        <Trash2 size={14} /> Delete
      </button>
    </>
  );
}

function TasActions({ onDelete, onSuspend, isSuspended }: { onDelete?: () => void; onSuspend?: () => void; isSuspended: boolean }) {
  return (
    <>
      <button className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
        Adjust Tier
      </button>
      <button onClick={onSuspend} className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, color: isSuspended ? "#16a34a" : "#d97706", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
        {isSuspended ? "Reinstate TAS" : "Suspend TAS"}
      </button>
      <button onClick={onDelete} className="ud-act-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 500, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
        <Trash2 size={14} /> Delete
      </button>
    </>
  );
}

interface UserDetailProps {
  onSuspend?: () => void;
  user:      User;
  onBack:    () => void;
  onDelete?: () => void;
}

export default function UserDetail({ user, onBack, onDelete, onSuspend }: UserDetailProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <style>{`
        .ud-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
        .ud-profile { flex-direction: column; align-items: center; gap: 20px; }
        .ud-label   { width: 120px; }
        .ud-avatar  { width: 72px !important; height: 72px !important; font-size: 22px !important; }
        .ud-act-btn { padding: 12px 4px !important; font-size: 11px !important; }

        /* ── card shared style ── */
        .ud-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .ud-content { padding: 24px 32px; gap: 20px; }
          .ud-profile { flex-direction: row; align-items: flex-start; gap: 32px; }
          .ud-avatar  { width: 100px !important; height: 100px !important; font-size: 28px !important; }
          .ud-act-btn { padding: 16px !important; font-size: 13px !important; }
        }
      `}</style>

      <div className="ud-content" style={{ flex: 1, overflowY: "auto" }}>

        {/* ── Back header ── */}
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-main)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> {user.name}
        </button>

        {/* ── Profile card ── */}
        <div className="ud-card">
          <div className="ud-profile" style={{ display: "flex", padding: "24px" }}>

            {/* Avatar */}
            <div
              className="ud-avatar"
              style={{
                borderRadius: "50%",
                flexShrink: 0,
                backgroundColor: getColor(user.avatarSeed),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              {getInitials(user.name)}
            </div>

            {/* Info rows */}
            <div style={{ flex: 1, paddingTop: "4px" }}>
              {user.type === "Expert" && <ExpertRows user={user} />}
              {user.type === "TAS"    && <TasRows    user={user} />}
              {user.type === "Client" && <ClientRows user={user} />}

              <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
                <span className="ud-label" style={{ flexShrink: 0, color: "var(--color-text-muted)" }}>Status:</span>
                <StatusBadge label={user.status} variant={statusVariant[user.status]} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Jobs card ── */}
        <div className="ud-card">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>Jobs</p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
              gap: "10px",
              color: "var(--color-text-muted)",
            }}
          >
            <BriefcaseIcon size={36} strokeWidth={1.2} />
            <p style={{ fontSize: "13px", margin: 0 }}>No jobs found for this user.</p>
          </div>
        </div>

      </div>

      {/* ── Action bar card ── */}
      <div
        className="ud-card"
        style={{
          flexShrink: 0,
          display: "flex",
          margin: "0 16px 16px",
          borderRadius: "16px",
        }}
      >
        {user.type === "Expert" && <ExpertActions onDelete={onDelete} onSuspend={onSuspend} isSuspended={user.status === "Suspended"} />}
        {user.type === "TAS"    && <TasActions    onDelete={onDelete} onSuspend={onSuspend} isSuspended={user.status === "Suspended"} />}
        {user.type === "Client" && <ClientActions onDelete={onDelete} onSuspend={onSuspend} isSuspended={user.status === "Suspended"} />}
      </div>
    </div>
  );
}