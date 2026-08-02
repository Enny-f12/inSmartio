// components/ScheduledReports.tsx
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, CalendarClock } from "lucide-react";
import { colors, card, th, thFirst, td, tdFirst, pillBtn, pillBtnGhost, modalOverlay, modalCard, toolbarInput } from "./shared";
import { SkelTableRows, SkelCardRows } from "./Skeleton";
import { useSimulatedLoad } from "./useSimulatedLoad";
import { scheduledReports, reportTypeOptions, type ScheduledReport } from "./mockData";

function freqPill(freq: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    Daily: { bg: colors.primaryLight, fg: colors.primary },
    Weekly: { bg: colors.greenBg, fg: colors.green },
    Monthly: { bg: colors.amberBg, fg: colors.amber },
  };
  const c = map[freq] ?? { bg: "#F3F4F6", fg: colors.textMuted };
  return <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>{freq}</span>;
}

export default function ScheduledReports() {
  const loading = useSimulatedLoad([], 600);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ScheduledReport | null>(null);

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (r: ScheduledReport) => { setEditing(r); setShowModal(true); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {showModal && <ScheduleModal initial={editing} onClose={() => setShowModal(false)} />}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={{ ...pillBtn, display: "flex", alignItems: "center", gap: "6px" }} onClick={openNew}>
          <Plus size={14} /> New Schedule
        </button>
      </div>

      <div style={card}>
        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["Report Name", "Freq", "Format", "Recipients", "Last Run", "Actions"].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={5} cols={6} />
              ) : scheduledReports.map((r) => (
                <tr key={r.name} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: colors.textFaint }}>{r.type}</p>
                  </td>
                  <td style={td}>{freqPill(r.freq)}</td>
                  <td style={td}>{r.format}</td>
                  <td style={td}>{r.recipients}</td>
                  <td style={td}>{r.lastRun}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Pencil size={14} style={{ color: colors.textFaint, cursor: "pointer" }} onClick={() => openEdit(r)} />
                      <Trash2 size={14} style={{ color: colors.red, cursor: "pointer" }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : scheduledReports.map((r) => (
            <div key={r.name} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{r.name}</span>
                {freqPill(r.freq)}
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{r.format} · {r.recipients}</p>
              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button onClick={() => openEdit(r)} style={{ ...pillBtnGhost, padding: "6px 12px" }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ initial, onClose }: { initial: ScheduledReport | null; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [reportType, setReportType] = useState(initial?.type ?? reportTypeOptions[0]);
  const [freq, setFreq] = useState<"Daily" | "Weekly" | "Monthly">(initial?.freq ?? "Weekly");
  const [day, setDay] = useState("Monday");
  const [time, setTime] = useState("09:00");
  const [format, setFormat] = useState(initial?.format ?? "PDF");
  const [recipients, setRecipients] = useState(initial?.recipients ?? "");

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard, width: "480px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: colors.textMain, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarClock size={17} style={{ color: colors.primary }} /> {initial ? "Edit Schedule" : "Schedule Report"}
          </p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint }}><X size={18} /></button>
        </div>

        <Field label="Report Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly Revenue" style={{ ...toolbarInput, width: "100%", boxSizing: "border-box" }} />
        </Field>

        <Field label="Report Type">
          <select className="rp-select" style={{ width: "100%" }} value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {reportTypeOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Frequency">
          <div style={{ display: "flex", gap: "8px" }}>
            {(["Daily", "Weekly", "Monthly"] as const).map((f) => (
              <button
                key={f} onClick={() => setFreq(f)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${freq === f ? colors.primary : colors.border}`,
                  backgroundColor: freq === f ? colors.primaryLight : "#fff",
                  color: freq === f ? colors.primary : colors.textMuted,
                }}
              >{f}</button>
            ))}
          </div>
        </Field>

        <div style={{ display: "flex", gap: "12px" }}>
          <Field label="Day" style={{ flex: 1 }}>
            <select className="rp-select" style={{ width: "100%" }} value={day} onChange={(e) => setDay(e.target.value)}>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Time" style={{ flex: 1 }}>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...toolbarInput, width: "100%", boxSizing: "border-box" }} />
          </Field>
        </div>

        <Field label="Format">
          <div style={{ display: "flex", gap: "8px" }}>
            {(["PDF", "CSV", "Excel"] as const).map((f) => (
              <button
                key={f} onClick={() => setFormat(f)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${format === f ? colors.primary : colors.border}`,
                  backgroundColor: format === f ? colors.primaryLight : "#fff",
                  color: format === f ? colors.primary : colors.textMuted,
                }}
              >{f}</button>
            ))}
          </div>
        </Field>

        <Field label="Recipients (comma separated)">
          <input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="finance@insmartio.com, ops@insmartio.com" style={{ ...toolbarInput, width: "100%", boxSizing: "border-box" }} />
        </Field>

        <Field label="Filters">
          <div style={{ padding: "9px 12px", borderRadius: "8px", border: `1px dashed ${colors.border}`, fontSize: "12.5px", color: colors.textMuted }}>
            Use current filters
          </div>
        </Field>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button onClick={onClose} style={pillBtnGhost}>Cancel</button>
          <button onClick={onClose} style={pillBtn} disabled={!name.trim()}>Save Schedule</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, style = {} }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px", ...style }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: colors.textMuted }}>{label}</span>
      {children}
    </div>
  );
}