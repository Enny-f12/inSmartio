// components/ReportPicker.tsx
"use client";

import {
  LayoutDashboard, Receipt, Users, IdCard, ShieldCheck,
  Wallet, CalendarClock, LayoutTemplate, ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { colors } from "./shared";

export type ReportKey =
  | "dashboard"
  | "transactions"
  | "user-growth"
  | "experts"
  | "verification"
  | "revenue"
  | "jobs"
  | "tas-performance"
  | "disputes"
  | "scheduled"
  | "templates";

export const REPORT_ITEMS: { key: ReportKey; label: string; icon: React.ReactNode; group: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} />, group: "Overview" },
  { key: "transactions", label: "Transaction Detail Report", icon: <Receipt size={15} />, group: "Reports" },
  { key: "user-growth", label: "User Growth Report", icon: <Users size={15} />, group: "Reports" },
  { key: "experts", label: "Expert Details Report", icon: <IdCard size={15} />, group: "Reports" },
  { key: "verification", label: "Verification Report", icon: <ShieldCheck size={15} />, group: "Reports" },
  { key: "tas-performance", label: "TAS Performance Report", icon: <Wallet size={15} />, group: "Reports" },
  { key: "scheduled", label: "Scheduled Reports", icon: <CalendarClock size={15} />, group: "Manage" },
  { key: "templates", label: "Report Templates", icon: <LayoutTemplate size={15} />, group: "Manage" },
];

export function ReportPicker({
  value,
  onChange,
}: {
  value: ReportKey;
  onChange: (key: ReportKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = REPORT_ITEMS.find((i) => i.key === value) ?? REPORT_ITEMS[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const groups = Array.from(new Set(REPORT_ITEMS.map((i) => i.group)));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 14px", borderRadius: "10px",
          border: `1px solid ${open ? colors.primary : colors.border}`,
          backgroundColor: "#ffffff", cursor: "pointer",
          minWidth: "220px", justifyContent: "space-between",
          boxShadow: open ? `0 0 0 3px ${colors.primaryLight}` : "none",
          transition: "all 0.15s",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 600, color: colors.textMain }}>
          <span style={{ color: colors.primary, display: "flex" }}>{current.icon}</span>
          {current.label}
        </span>
        <ChevronDown size={15} style={{ color: colors.textFaint, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            backgroundColor: "#ffffff", border: `1px solid ${colors.border}`,
            borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            width: "260px", maxHeight: "70vh", overflowY: "auto",
            zIndex: 60, padding: "8px",
          }}
        >
          {groups.map((g) => (
            <div key={g} style={{ marginBottom: "4px" }}>
              <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.textFaint, margin: "8px 10px 4px" }}>
                {g}
              </p>
              {REPORT_ITEMS.filter((i) => i.group === g).map((item) => {
                const active = item.key === value;
                return (
                  <button
                    key={item.key}
                    onClick={() => { onChange(item.key); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", width: "100%",
                      padding: "8px 10px", borderRadius: "8px", border: "none",
                      backgroundColor: active ? colors.primaryLight : "transparent",
                      color: active ? colors.primary : colors.textMain,
                      fontSize: "13px", fontWeight: active ? 600 : 500,
                      cursor: "pointer", textAlign: "left",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <span style={{ display: "flex", flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}