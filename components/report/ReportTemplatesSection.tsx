"use client";

import { useEffect, useState } from "react";
import { Upload, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchReportTemplatesThunk,
  createReportTemplateThunk,
  updateReportTemplateThunk,
  deleteReportTemplateThunk,
} from "@/lib/redux/reportTemplatesSlice";
import type { ReportTemplate } from "@/lib/api/reportTemplateApi";
import type { ReportType } from "@/components/report/types";
import { ALL_REPORT_TYPES } from "@/app/(dashboard)/report/page";

const MOCK: ReportTemplate[] = [
  { id: "1", name: "Monthly Executive", type: "Revenue Report",        lastUsed: new Date().toISOString() },
  { id: "2", name: "TAS Performance",   type: "TAS Performance Report", lastUsed: new Date().toISOString() },
];

const TH: React.CSSProperties = {
  textAlign: "left", padding: "12px 20px", fontSize: "12px",
  fontWeight: 600, color: "#9CA3AF", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap",
};
const TD: React.CSSProperties = {
  padding: "14px 20px", fontSize: "13px", color: "#374151",
  borderBottom: "1px solid #F3F4F6",
};

const fmtDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
};

export default function ReportTemplatesSection() {
  const dispatch = useAppDispatch();
  const { list, status } = useAppSelector((s) => s.reportTemplates);

  const [showAdd,  setShowAdd]  = useState(false);
  const [editItem, setEditItem] = useState<ReportTemplate | null>(null);
  const [form,     setForm]     = useState<{ name: string; type: ReportType; content: string }>(
    { name: "", type: ALL_REPORT_TYPES[0], content: "" },
  );

  useEffect(() => {
    if (status === "idle") dispatch(fetchReportTemplatesThunk());
  }, [dispatch, status]);

  const rows = status === "succeeded" && list.length > 0 ? list : MOCK;

  const resetForm = () => {
    setForm({ name: "", type: ALL_REPORT_TYPES[0], content: "" });
    setShowAdd(false);
    setEditItem(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.type) { toast.warning("All fields required"); return; }
    if (editItem) {
      await dispatch(updateReportTemplateThunk({ id: editItem.id, payload: form })).unwrap()
        .then(() => toast.success("Template updated"))
        .catch(() => toast.error("Failed to update"));
    } else {
      await dispatch(createReportTemplateThunk(form)).unwrap()
        .then(() => toast.success("Template saved"))
        .catch(() => toast.error("Failed to save"));
    }
    resetForm();
  };

  const handleEdit = (item: ReportTemplate) => {
    setEditItem(item);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setForm({ name: item.name, type: item.type as ReportType, content: (item as any).content ?? "" });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteReportTemplateThunk(id)).unwrap()
      .then(() => toast.success("Template removed"))
      .catch(() => toast.error("Failed to delete"));
  };

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Saved Report Templates</p>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#F9FAFB" }}>
            <th style={TH}>Template Name</th>
            <th style={TH}>Type</th>
            <th style={TH}>Last Used</th>
            <th style={TH}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {status === "loading" ? (
            <tr>
              <td colSpan={4} style={{ ...TD, textAlign: "center", color: "#9CA3AF" }}>Loading…</td>
            </tr>
          ) : (
            rows.map((t) => (
              <tr key={t.id}>
                <td style={{ ...TD, fontWeight: 500, color: "#111827" }}>{t.name}</td>
                <td style={TD}>{t.type}</td>
                <td style={TD}>{fmtDate(t.lastUsed)}</td>
                <td style={TD}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button title="Load" onClick={() => toast.info("Loading template…")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", padding: 0 }}>
                      <Upload size={15} />
                    </button>
                    <button title="Edit" onClick={() => handleEdit(t)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", padding: 0 }}>
                      <Edit2 size={15} />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(t.id)}
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
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "4px" }}>
              Template Name
            </label>
            <input
              value={form.name}
              placeholder="e.g. Monthly Executive"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "4px" }}>
              Report Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ReportType }))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none", boxSizing: "border-box", backgroundColor: "#fff" }}>
              {ALL_REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
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
            <Plus size={14} /> Save New Template
          </button>
        </div>
      )}
    </div>
  );
}