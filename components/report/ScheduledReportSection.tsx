"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchScheduledReportsThunk,
  createScheduledReportThunk,
  updateScheduledReportThunk,
  deleteScheduledReportThunk,
} from "@/lib/redux/schedduleReportSlice";
import type { ScheduledReport, ScheduleObject } from "@/lib/api/scheduledReportApi";

const MOCK: ScheduledReport[] = [
  { id: "1", type: "monthly-sales",  name: "Weekly Summary",  schedule: { frequency: "weekly",  dayOfWeek: 1,  time: "08:00" }, recipients: ["admin@helpme.ng"]   },
  { id: "2", type: "revenue-report", name: "Monthly Revenue", schedule: { frequency: "monthly", dayOfMonth: 1, time: "09:00" }, recipients: ["finance@helpme.ng"] },
];

const EMPTY_FORM = {
  type:        "",
  name:        "",
  frequency:   "weekly" as ScheduleObject["frequency"],
  time:        "",
  dayOfWeek:   "",
  dayOfMonth:  "",
  recipients:  "",   // comma-separated in UI → split to array on submit
};

const TH: React.CSSProperties = {
  textAlign: "left", padding: "12px 20px", fontSize: "12px",
  fontWeight: 600, color: "#9CA3AF", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap",
};
const TD: React.CSSProperties = {
  padding: "14px 20px", fontSize: "13px", color: "#374151",
  borderBottom: "1px solid #F3F4F6",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "1px solid #E5E7EB", fontSize: "13px", outline: "none",
  boxSizing: "border-box", backgroundColor: "#fff",
};
const lbl: React.CSSProperties = {
  fontSize: "11px", fontWeight: 600, color: "#6B7280",
  display: "block", marginBottom: "4px",
};

const fmtSchedule = (s: ScheduleObject) => {
  const parts: string[] = [s.frequency];
  if (s.frequency === "weekly"  && s.dayOfWeek)  parts.push(`day ${s.dayOfWeek}`);
  if (s.frequency === "monthly" && s.dayOfMonth) parts.push(`day ${s.dayOfMonth}`);
  if (s.time) parts.push(`@ ${s.time}`);
  return parts.join(" · ");
};

export default function ScheduledReportsSection() {
  const dispatch = useAppDispatch();
  const { list, status } = useAppSelector((s) => s.scheduledReports);

  const [showAdd,  setShowAdd]  = useState(false);
  const [editItem, setEditItem] = useState<ScheduledReport | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);

  useEffect(() => {
    if (status === "idle") dispatch(fetchScheduledReportsThunk());
  }, [dispatch, status]);

  const rows = status === "succeeded" && list.length > 0 ? list : MOCK;

  const resetForm = () => { setForm(EMPTY_FORM); setShowAdd(false); setEditItem(null); };

  const handleSave = async () => {
    if (!form.name || !form.type || !form.recipients) {
      toast.warning("Name, type and recipients are required"); return;
    }
    const schedule: ScheduleObject = {
      frequency:   form.frequency,
      time:        form.time       || undefined,
      dayOfWeek:   form.frequency === "weekly"  && form.dayOfWeek  ? Number(form.dayOfWeek)  : undefined,
      dayOfMonth:  form.frequency === "monthly" && form.dayOfMonth ? Number(form.dayOfMonth) : undefined,
    };
    const payload = {
      type:       form.type,
      name:       form.name,
      schedule,
      recipients: form.recipients.split(",").map((r) => r.trim()).filter(Boolean),
    };

    if (editItem) {
      await dispatch(updateScheduledReportThunk({ id: editItem.id, payload })).unwrap()
        .then(() => toast.success("Updated"))
        .catch(() => toast.error("Failed to update"));
    } else {
      await dispatch(createScheduledReportThunk(payload)).unwrap()
        .then(() => toast.success("Scheduled report added"))
        .catch(() => toast.error("Failed to add"));
    }
    resetForm();
  };

  const handleEdit = (item: ScheduledReport) => {
    setEditItem(item);
    setForm({
      type:       item.type,
      name:       item.name,
      frequency:  item.schedule.frequency,
      time:       item.schedule.time        ?? "",
      dayOfWeek:  item.schedule.dayOfWeek   != null ? String(item.schedule.dayOfWeek)  : "",
      dayOfMonth: item.schedule.dayOfMonth  != null ? String(item.schedule.dayOfMonth) : "",
      recipients: item.recipients.join(", "),
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteScheduledReportThunk(id)).unwrap()
      .then(() => toast.success("Removed"))
      .catch(() => toast.error("Failed to delete"));
  };

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Scheduled Reports</p>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#F9FAFB" }}>
            <th style={TH}>Name</th>
            <th style={TH}>Type</th>
            <th style={TH}>Schedule</th>
            <th style={TH}>Recipients</th>
            <th style={TH}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {status === "loading" ? (
            <tr><td colSpan={5} style={{ ...TD, textAlign: "center", color: "#9CA3AF" }}>Loading…</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td style={{ ...TD, fontWeight: 500, color: "#111827" }}>{r.name}</td>
                <td style={TD}>{r.type}</td>
                <td style={TD}>{fmtSchedule(r.schedule)}</td>
                <td style={TD}>{r.recipients.join(", ")}</td>
                <td style={TD}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button title="Edit" onClick={() => handleEdit(r)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", padding: 0 }}>
                      <Edit2 size={15} />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(r.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 0 }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showAdd && (
        <div style={{ padding: "16px 20px", borderTop: "1px solid #E5E7EB", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* Name */}
          <div style={{ flex: "1 1 150px" }}>
            <label style={lbl}>Report Name *</label>
            <input value={form.name} placeholder="e.g. Monthly Sales Report"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inp} />
          </div>

          {/* Type */}
          <div style={{ flex: "1 1 150px" }}>
            <label style={lbl}>Type *</label>
            <input value={form.type} placeholder="e.g. monthly-sales"
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={inp} />
          </div>

          {/* Frequency */}
          <div style={{ flex: "1 1 120px" }}>
            <label style={lbl}>Frequency *</label>
            <select value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as ScheduleObject["frequency"], dayOfWeek: "", dayOfMonth: "" }))}
              style={inp}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Day of week — only for weekly */}
          {form.frequency === "weekly" && (
            <div style={{ flex: "1 1 120px" }}>
              <label style={lbl}>Day of Week (1=Mon)</label>
              <input value={form.dayOfWeek} placeholder="1" type="number" min={1} max={7}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))} style={inp} />
            </div>
          )}

          {/* Day of month — only for monthly */}
          {form.frequency === "monthly" && (
            <div style={{ flex: "1 1 120px" }}>
              <label style={lbl}>Day of Month</label>
              <input value={form.dayOfMonth} placeholder="1" type="number" min={1} max={31}
                onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))} style={inp} />
            </div>
          )}

          {/* Time */}
          <div style={{ flex: "1 1 110px" }}>
            <label style={lbl}>Time</label>
            <input value={form.time} type="time"
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} style={inp} />
          </div>

          {/* Recipients */}
          <div style={{ flex: "2 1 220px" }}>
            <label style={lbl}>Recipients * (comma-separated)</label>
            <input value={form.recipients} placeholder="admin@helpme.ng, finance@helpme.ng"
              onChange={(e) => setForm((f) => ({ ...f, recipients: e.target.value }))} style={inp} />
          </div>

          <div style={{ display: "flex", gap: "8px", alignSelf: "flex-end" }}>
            <button onClick={handleSave}
              style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {editItem ? "Update" : "Save"}
            </button>
            <button onClick={resetForm}
              style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showAdd && (
        <div style={{ padding: "12px 20px", borderTop: "1px solid #E5E7EB" }}>
          <button onClick={() => setShowAdd(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: "#2563EB", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Plus size={14} /> Add Scheduled Report
          </button>
        </div>
      )}
    </div>
  );
}