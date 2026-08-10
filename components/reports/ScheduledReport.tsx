// components/ScheduledReports.tsx
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, X, CalendarClock, AlertTriangle } from "lucide-react";
import { colors, card, th, thFirst, td, tdFirst, pillBtn, pillBtnGhost, modalOverlay, modalCard, toolbarInput } from "./shared";
import { SkelTableRows, SkelCardRows } from "./Skeleton";
import type { AppDispatch, RootState } from "@/lib/redux/store"; // ⚠️ adjust to your actual store path
import {
  fetchScheduledReportsThunk,
  createScheduledReportThunk,
  updateScheduledReportThunk,
  deleteScheduledReportThunk,
} from "@/lib/redux/schedduleReportSlice"; // ⚠️ adjust to wherever you place the slice
import type { ScheduledReport, ScheduledReportPayload, ReportFormat } from "@/lib/api/scheduledReportApi";
import { reportTypeOptions } from "./mockData"; // kept as static option list — no "options" endpoint given

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayNameToNumber = (d: string) => WEEKDAYS.indexOf(d) + 1; // 1=Monday..7=Sunday
const dayNumberToName = (n?: number) => (n && n >= 1 && n <= 7 ? WEEKDAYS[n - 1] : WEEKDAYS[0]);

function freqPill(freq: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    Daily: { bg: colors.primaryLight, fg: colors.primary },
    Weekly: { bg: colors.greenBg, fg: colors.green },
    Monthly: { bg: colors.amberBg, fg: colors.amber },
  };
  const c = map[freq] ?? { bg: "#F3F4F6", fg: colors.textMuted };
  return <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>{freq}</span>;
}

function formatPill(format?: ReportFormat) {
  if (!format) return <span style={{ color: colors.textFaint }}>—</span>;
  const map: Record<ReportFormat, { bg: string; fg: string }> = {
    csv: { bg: colors.greenBg, fg: colors.green },
    pdf: { bg: colors.primaryLight, fg: colors.primary },
  };
  const c = map[format];
  return (
    <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>
      {format.toUpperCase()}
    </span>
  );
}

const capFreq = (f: string) => (f.charAt(0).toUpperCase() + f.slice(1)) as "Daily" | "Weekly" | "Monthly";

export default function ScheduledReports() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: schedules, status } = useSelector((s: RootState) => s.scheduledReports);
  const loading = status === "idle" || status === "loading";

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ScheduledReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledReport | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchScheduledReportsThunk());
  }, [dispatch]);

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (r: ScheduledReport) => { setEditing(r); setShowModal(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteScheduledReportThunk(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {showModal && <ScheduleModal initial={editing} onClose={() => setShowModal(false)} />}
      {deleteTarget && (
        <ConfirmModal
          title="Delete schedule?"
          message={`This will permanently delete "${deleteTarget.name}". This can't be undone.`}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

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
              ) : schedules.map((r) => (
                <tr key={r.id} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: colors.textFaint }}>{r.type}</p>
                  </td>
                  <td style={td}>{freqPill(capFreq(r.schedule.frequency))}</td>
                  <td style={td}>{formatPill(r.format)}</td>
                  <td style={td}>{r.recipients.join(", ")}</td>
                  <td style={td}>{r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : "—"}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Pencil size={14} style={{ color: colors.textFaint, cursor: "pointer" }} onClick={() => openEdit(r)} />
                      <Trash2 size={14} style={{ color: colors.red, cursor: "pointer" }} onClick={() => setDeleteTarget(r)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : schedules.map((r) => (
            <div key={r.id} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{r.name}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {freqPill(capFreq(r.schedule.frequency))}
                  {formatPill(r.format)}
                </div>
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{r.recipients.join(", ")}</p>
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
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState(initial?.name ?? "");
  const [reportType, setReportType] = useState(initial?.type ?? reportTypeOptions[0]);
  const [freq, setFreq] = useState<"Daily" | "Weekly" | "Monthly">(
    initial ? capFreq(initial.schedule.frequency) : "Weekly"
  );
  const [day, setDay] = useState(dayNumberToName(initial?.schedule.dayOfWeek));
  const [dayOfMonth, setDayOfMonth] = useState(initial?.schedule.dayOfMonth ?? 1);
  const [time, setTime] = useState(initial?.schedule.time ?? "09:00");
  const [recipients, setRecipients] = useState(initial?.recipients.join(", ") ?? "");
  const [format, setFormat] = useState<ReportFormat>(initial?.format ?? "csv");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const schedule: ScheduledReportPayload["schedule"] = {
      frequency: freq.toLowerCase() as "daily" | "weekly" | "monthly",
      time,
      ...(freq === "Weekly" ? { dayOfWeek: dayNameToNumber(day) } : {}),
      ...(freq === "Monthly" ? { dayOfMonth } : {}),
    };

    const payload: ScheduledReportPayload = {
      name,
      type: reportType,
      schedule,
      recipients: recipients.split(",").map((s) => s.trim()).filter(Boolean),
      format,
    };

    try {
      if (initial) {
        await dispatch(updateScheduledReportThunk({ id: initial.id, payload })).unwrap();
      } else {
        await dispatch(createScheduledReportThunk(payload)).unwrap();
      }
      onClose();
    } catch {
      setSaving(false);
    }
  };

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
          {freq !== "Daily" && (
            <Field label={freq === "Weekly" ? "Day" : "Day of Month"} style={{ flex: 1 }}>
              {freq === "Weekly" ? (
                <select className="rp-select" style={{ width: "100%" }} value={day} onChange={(e) => setDay(e.target.value)}>
                  {WEEKDAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
              ) : (
                <input
                  type="number" min={1} max={31} value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  style={{ ...toolbarInput, width: "100%", boxSizing: "border-box" }}
                />
              )}
            </Field>
          )}
          <Field label="Time" style={{ flex: 1 }}>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...toolbarInput, width: "100%", boxSizing: "border-box" }} />
          </Field>
        </div>

        <Field label="Format">
          <div style={{ display: "flex", gap: "8px" }}>
            {(["csv", "pdf"] as const).map((f) => (
              <button
                key={f} onClick={() => setFormat(f)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${format === f ? colors.primary : colors.border}`,
                  backgroundColor: format === f ? colors.primaryLight : "#fff",
                  color: format === f ? colors.primary : colors.textMuted,
                }}
              >{f.toUpperCase()}</button>
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
          <button onClick={handleSave} style={pillBtn} disabled={!name.trim() || saving}>
            {saving ? "Saving…" : "Save Schedule"}
          </button>
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

function ConfirmModal({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={modalOverlay} onClick={onCancel}>
      <div style={{ ...modalCard, width: "400px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              width: "32px", height: "32px", borderRadius: "999px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: "#FEE2E2",
            }}>
              <AlertTriangle size={16} style={{ color: colors.red }} />
            </span>
            <p style={{ fontSize: "15px", fontWeight: 700, color: colors.textMain, margin: 0 }}>{title}</p>
          </div>
          <button onClick={onCancel} style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "13px", color: colors.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={pillBtnGhost} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "8px 16px", borderRadius: "999px", fontSize: "12.5px", fontWeight: 600,
              border: "none", cursor: loading ? "default" : "pointer", color: "#fff",
              backgroundColor: colors.red,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}