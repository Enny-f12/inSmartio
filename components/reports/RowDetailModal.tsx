// app/(dashboard)/reports/components/RowDetailModal.tsx
"use client";

import { X } from "lucide-react";
import { colors, modalOverlay, modalCard } from "./shared";

function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function fmtCell(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  // ISO date strings render more usefully as a locale date+time than raw.
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  return String(v);
}

export function RowDetailModal({
  title,
  row,
  onClose,
  excludeKeys = [],
}: {
  title: string;
  row: Record<string, unknown>;
  onClose: () => void;
  excludeKeys?: string[];
}) {
  const entries = Object.entries(row).filter(([k]) => !excludeKeys.includes(k));

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: colors.textMain, margin: 0 }}>{title}</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint }}>
            <X size={18} />
          </button>
        </div>

        {entries.length === 0 ? (
          <p style={{ fontSize: "13px", color: colors.textFaint }}>No details available.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {entries.map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex", justifyContent: "space-between", gap: "16px",
                  padding: "8px 0", borderBottom: `1px solid ${colors.borderSoft}`,
                }}
              >
                <span style={{ fontSize: "12.5px", color: colors.textMuted, flexShrink: 0 }}>{humanize(k)}</span>
                <span style={{ fontSize: "12.5px", color: colors.textMain, fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>
                  {fmtCell(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: colors.primary, color: "#fff", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}