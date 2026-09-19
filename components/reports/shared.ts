// components/shared.ts
// Shared style tokens + helpers for the Reports feature.
// Mirrors the inline-style conventions used in app/(dashboard)/jobs/page.tsx
// so every report screen feels like it belongs to the same product.

import type { CSSProperties } from "react";

export const colors = {
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  bg: "#F4F5F7",
  surface: "#ffffff",
  textMain: "#111827",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",
  border: "#E5E7EB",
  borderSoft: "#F3F4F6",
  green: "#059669",
  greenBg: "#ECFDF5",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  amber: "#D97706",
  amberBg: "#FFFBEB",
};

export const card: CSSProperties = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

export const kpiCard: CSSProperties = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: "14px",
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
};

export const kpiLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  fontWeight: 600,
  color: colors.textMuted,
};

export const kpiValue: CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: colors.textMain,
  letterSpacing: "-0.01em",
};

export const kpiDelta = (positive: boolean): CSSProperties => ({
  fontSize: "11.5px",
  fontWeight: 600,
  color: positive ? colors.green : colors.red,
});

export const sectionLabel: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: colors.textFaint,
};

export const th: CSSProperties = {
  textAlign: "left",
  padding: "12px 20px 12px 0",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: colors.textMuted,
  whiteSpace: "nowrap",
};

export const thFirst: CSSProperties = { ...th, paddingLeft: "24px" };

export const td: CSSProperties = {
  padding: "14px 20px 14px 0",
  fontSize: "13px",
  color: colors.textMain,
  whiteSpace: "nowrap",
};

export const tdFirst: CSSProperties = { ...td, paddingLeft: "24px" };

export const tr: CSSProperties = {
  borderBottom: `1px solid ${colors.borderSoft}`,
  transition: "background 0.1s",
};

export const toolbarInput: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  fontSize: "13px",
  outline: "none",
  border: `1px solid ${colors.border}`,
  backgroundColor: "#F9FAFB",
  color: colors.textMain,
  boxSizing: "border-box",
};

export const exportBtn = (kind: "primary" | "ghost" = "ghost"): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 14px",
  borderRadius: "8px",
  fontSize: "12.5px",
  fontWeight: 600,
  cursor: "pointer",
  border: `1px solid ${kind === "primary" ? colors.primary : colors.border}`,
  backgroundColor: kind === "primary" ? colors.primary : "#ffffff",
  color: kind === "primary" ? "#ffffff" : colors.textMuted,
  transition: "opacity 0.15s",
});

export const pillBtn: CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "12.5px",
  fontWeight: 600,
  border: "none",
  backgroundColor: colors.primary,
  color: "#ffffff",
  cursor: "pointer",
};

export const pillBtnGhost: CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "12.5px",
  fontWeight: 500,
  border: `1px solid ${colors.border}`,
  backgroundColor: "#ffffff",
  color: colors.textMuted,
  cursor: "pointer",
};

export const iconBtn: CSSProperties = {
  padding: "6px",
  borderRadius: "8px",
  border: "none",
  background: "none",
  cursor: "pointer",
  color: colors.textFaint,
  display: "flex",
  alignItems: "center",
};

export const modalOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
  padding: "16px",
};

export const modalCard: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "24px 28px",
  width: "460px",
  maxWidth: "100%",
  maxHeight: "88vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
};

export function fmtNaira(amount?: number | null, fallback = "—") {
  if (amount == null) return fallback;
  return `₦${amount.toLocaleString()}`;
}

export function fmtCompactNaira(amount?: number | null, fallback = "—") {
  if (amount == null) return fallback;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount}`;
}

// Injected once per report screen — shared responsive + control styling.
export const sharedResponsiveCSS = `
  .rp-header { padding: 16px !important; }
  .rp-main   { padding: 0 16px 24px !important; }
  .rp-kpis   { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  .rp-toolbar-row { flex-direction: column !important; align-items: stretch !important; }
  .rp-table  { display: none !important; }
  .rp-cards  { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }
  .rp-two-col { grid-template-columns: 1fr !important; }
  @media (min-width: 640px) {
    .rp-header { padding: 20px 32px !important; }
    .rp-main   { padding: 0 32px 32px !important; }
    .rp-kpis   { grid-template-columns: repeat(4, minmax(0,1fr)) !important; }
    .rp-toolbar-row { flex-direction: row !important; align-items: center !important; }
    .rp-table  { display: block !important; }
    .rp-cards  { display: none !important; }
    .rp-two-col { grid-template-columns: 1.6fr 1fr !important; }
  }
  .rp-select {
    padding: 8px 12px; border-radius: 8px; border: 1px solid ${colors.border};
    font-size: 12.5px; font-weight: 500; color: ${colors.textMain};
    background-color: #ffffff; cursor: pointer; outline: none;
  }
  .rp-select:focus { border-color: ${colors.primary}; }
  .rp-bulk-btn:hover { opacity: 0.85; }
  .rp-bulk-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .rp-row:hover { background-color: #F9FAFB; }
  .rp-skel {
    background: linear-gradient(90deg, #EEF0F3 25%, #F6F7F9 37%, #EEF0F3 63%);
    background-size: 400% 100%;
    animation: rp-shimmer 1.4s ease infinite;
    border-radius: 6px;
  }
  @keyframes rp-shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }
`;