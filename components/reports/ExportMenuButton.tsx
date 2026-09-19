// app/(dashboard)/reports/components/ExportMenuButton.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { colors, exportBtn } from "./shared";
import type { ReportFormat } from "@/lib/api/detailedReportApi";


export function ExportMenuButton({
  onExport,
  exporting = false,
}: {
  onExport: (format: ReportFormat) => void;
  exporting?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (format: ReportFormat) => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={exporting}
        style={{ ...exportBtn("primary"), opacity: exporting ? 0.7 : 1, cursor: exporting ? "wait" : "pointer" }}
      >
        <Download size={13} /> {exporting ? "Exporting..." : "Export"} <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            backgroundColor: "#ffffff", border: `1px solid ${colors.border}`,
            borderRadius: "10px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            width: "168px", zIndex: 50, padding: "6px",
          }}
        >
          <MenuItem icon={<FileText size={14} />} label="CSV" onClick={() => choose("csv")} />
          <MenuItem icon={<FileType size={14} />} label="PDF" onClick={() => choose("pdf")} />
          <MenuItem icon={<FileSpreadsheet size={14} />} label="Excel" disabled title="Not supported by the API yet — use CSV or PDF" />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon, label, onClick, disabled = false, title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "flex", alignItems: "center", gap: "8px", width: "100%",
        padding: "8px 10px", borderRadius: "8px", border: "none", background: "none",
        cursor: disabled ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500,
        color: disabled ? colors.textFaint : colors.textMain, opacity: disabled ? 0.6 : 1,
        textAlign: "left",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {icon} {label}
    </button>
  );
}