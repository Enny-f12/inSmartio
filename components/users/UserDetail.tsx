// components/users/UserDetail.tsx
"use client";

import { ArrowLeft, ShieldCheck, Trash2, BriefcaseIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";

export type UserStatus = "Active" | "Tier 1" | "Tier 2" | "Tier 3" | "Pending" | "Suspended";

export interface User {
  id: string;
  avatarSeed: number;
  name: string;
  email: string;
  username: string;
  phone?: string;
  type: "Expert" | "Client" | "TAS";
  status: UserStatus;
  joined: string;
}

const statusVariant: Record<UserStatus, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active:    "green",
  "Tier 1":  "purple",
  "Tier 2":  "purple",
  "Tier 3":  "purple",
  Pending:   "yellow",
  Suspended: "red",
};

// ── Initials avatar colors ────────────────────────────────────
const avatarColors = [
  "#2563eb", "#16a34a", "#d97706", "#7c3aed",
  "#db2777", "#0891b2", "#dc2626", "#65a30d",
];

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getColor = (seed: number) => avatarColors[seed % avatarColors.length];

interface UserDetailProps {
  user: User;
  onBack: () => void;
  onDelete?: () => void;
}

export default function UserDetail({ user, onBack, onDelete }: UserDetailProps) {
  const rows: [string, string][] = [
    ["Name:",         user.name],
    ["Username:",     user.username],
    ["Phone:",        user.phone ?? "—"],
    ["Email:",        user.email],
    ["User Type",     user.type],
    ["Verification:", user.status.startsWith("Tier") ? user.status : "—"],
    ["Joined:",       user.joined],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 40px" }}>

        {/* ── Back + Suspend ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={16} />
            {user.name}
          </button>
          <button style={{ padding: "6px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
            Suspend
          </button>
        </div>

        {/* ── Profile ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "32px", marginBottom: "36px" }}>

          {/* Initials avatar */}
          <div style={{
            width: 100, height: 100, borderRadius: "50%", flexShrink: 0,
            backgroundColor: getColor(user.avatarSeed),
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "28px", fontWeight: 700, letterSpacing: "0.02em",
          }}>
            {getInitials(user.name)}
          </div>

          {/* Info rows */}
          <div style={{ flex: 1, paddingTop: "4px" }}>
            {rows.map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: "8px", marginBottom: "10px", fontSize: "13px" }}>
                <span style={{ width: "110px", flexShrink: 0, color: "var(--color-text-muted)" }}>{label}</span>
                <span style={{ color: "var(--color-text-main)" }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
              <span style={{ width: "110px", flexShrink: 0, color: "var(--color-text-muted)" }}>Status:</span>
              <StatusBadge label={user.status} variant={statusVariant[user.status]} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--color-border)", marginBottom: "28px" }} />

        {/* ── Jobs section ── */}
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "16px" }}>Jobs</p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: "10px", color: "var(--color-text-muted)" }}>
          <BriefcaseIcon size={36} strokeWidth={1.2} />
          <p style={{ fontSize: "13px" }}>No jobs found for this user.</p>
        </div>

      </div>

      {/* ── Sticky action bar ── */}
      <div style={{ flexShrink: 0, display: "flex", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
          <ShieldCheck size={15} /> Verify Tier 2
        </button>
        <button style={{ flex: 1, padding: "16px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", borderRight: "1px solid var(--color-border)", cursor: "pointer" }}>
          Suspend User
        </button>
        <button
          onClick={onDelete}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", fontSize: "13px", fontWeight: 500, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
        >
          <Trash2 size={15} /> Delete Account
        </button>
      </div>
    </div>
  );
}