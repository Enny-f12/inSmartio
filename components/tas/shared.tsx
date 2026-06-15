// components/tas/shared.tsx
// Shared helpers, constants, and small UI primitives

import React from "react";

export type AppTab  = "pending" | "approved" | "rejected";
export type MainTab = "applications" | "active";

export const TAS_TIERS = [
  { value: 1, label: "Tier 1 (Associate, 0% bonus)",           bonus: "0%"   },
  { value: 2, label: "Tier 2 (Senior, +5% bonus)",             bonus: "+5%"  },
  { value: 3, label: "Tier 3 (Master, +10% bonus)",            bonus: "+10%" },
  { value: 4, label: "Tier 4 (Regional Lead, +12% bonus)",     bonus: "+12%" },
  { value: 5, label: "Tier 5 (National Director, +15% bonus)", bonus: "+15%" },
  { value: 6, label: "Tier 6 (Elite Ambassador, +20% bonus)",  bonus: "+20%" },
];

export const getTierLabel = (tier: number) =>
  TAS_TIERS.find((t) => t.value === tier)?.label ?? `Tier ${tier}`;

export const getTierBonus = (tier: number) =>
  TAS_TIERS.find((t) => t.value === tier)?.bonus ?? "—";

export const fmtMoney = (n?: number | null) =>
  n != null ? `₦${Number(n).toLocaleString()}` : "—";

export const card: React.CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  overflow: "hidden",
};

export const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#6B7280",
  margin: "0 0 14px",
};

export function statusBadge(s: unknown) {
  const str = s != null && typeof s !== "object" ? String(s) : "";
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#FEF3C7", color: "#B45309" },
    approved:  { bg: "#D1FAE5", color: "#065F46" },
    rejected:  { bg: "#FEE2E2", color: "#991B1B" },
    active:    { bg: "#D1FAE5", color: "#065F46" },
    inactive:  { bg: "#FEF3C7", color: "#B45309" },
    suspended: { bg: "#FEE2E2", color: "#991B1B" },
    earned:    { bg: "#EFF6FF", color: "#1d4ed8" },
  };
  const key = str.toLowerCase();
  const c = map[key] ?? { bg: "#F3F4F6", color: "#374151" };
  const label = str ? str.charAt(0).toUpperCase() + str.slice(1) : "—";
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
      backgroundColor: c.bg, color: c.color, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// Derives the TAS "type" label — same logic as the applications table
export function getType(a: Record<string, unknown>): string {
  if (a.type) return String(a.type);
  if (Array.isArray(a.category) && a.category.length) return "Expert TAS";
  const cat = a.category as { name?: string } | null;
  if (cat?.name) return cat.name;
  return "Dedicated";
}

export function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 9, alignItems: "flex-start" }}>
      <span style={{ minWidth: 190, flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", flex: 1 }}>{value ?? "—"}</span>
    </div>
  );
}