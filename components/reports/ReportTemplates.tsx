// components/ReportTemplates.tsx
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, X, LayoutTemplate, Check } from "lucide-react";
import { colors, card, th, thFirst, td, tdFirst, pillBtn, pillBtnGhost, modalOverlay, modalCard, toolbarInput } from "./shared";
import { SkelTableRows, SkelCardRows } from "./Skeleton";
import type { AppDispatch, RootState } from "@/lib/redux/store"; // ⚠️ adjust to your actual store path
import {
  fetchReportTemplatesThunk,
  createReportTemplateThunk,
  updateReportTemplateThunk,
  deleteReportTemplateThunk,
} from "@/lib/redux/reportTemplatesSlice"; // ⚠️ adjust to wherever you place the slice
import type { ReportTemplate, ReportTemplatePayload } from "@/lib/api/reportTemplateApi";
import { reportTypeOptions, templateColumns } from "./mockData"; // kept as static option lists — no "options" endpoint given

export default function ReportTemplates() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: templates, status } = useSelector((s: RootState) => s.reportTemplates);
  const loading = status === "idle" || status === "loading";

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ReportTemplate | null>(null);

  useEffect(() => {
    dispatch(fetchReportTemplatesThunk());
  }, [dispatch]);

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t: ReportTemplate) => { setEditing(t); setShowModal(true); };

  const handleDelete = (id: string) => {
    if (confirm("Delete this template?")) dispatch(deleteReportTemplateThunk(id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {showModal && <TemplateModal initial={editing} onClose={() => setShowModal(false)} />}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={{ ...pillBtn, display: "flex", alignItems: "center", gap: "6px" }} onClick={openNew}>
          <Plus size={14} /> New Template
        </button>
      </div>

      <div style={card}>
        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["Template Name", "Base Report", "Used", "Created By", "Actions"].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={4} cols={5} />
              ) : templates.map((t) => (
                <tr key={t.id} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={{ ...tdFirst, fontWeight: 600 }}>{t.name}</td>
                  <td style={td}>{t.type}</td>
                  <td style={td}>{t.lastUsed ? new Date(t.lastUsed).toLocaleDateString() : "—"}</td>
                  <td style={td}>—</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Pencil size={14} style={{ color: colors.textFaint, cursor: "pointer" }} onClick={() => openEdit(t)} />
                      <Trash2 size={14} style={{ color: colors.red, cursor: "pointer" }} onClick={() => handleDelete(t.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : templates.map((t) => (
            <div key={t.id} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{t.name}</span>
                <span style={{ fontSize: "12px", color: colors.textMuted }}>
                  {t.lastUsed ? new Date(t.lastUsed).toLocaleDateString() : "—"}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{t.type}</p>
              <div style={{ marginTop: "10px" }}>
                <button onClick={() => openEdit(t)} style={{ ...pillBtnGhost, padding: "6px 12px" }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateModal({ initial, onClose }: { initial: ReportTemplate | null; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [baseReport, setBaseReport] = useState(initial?.type ?? reportTypeOptions[0]);
  const [selectedCols, setSelectedCols] = useState<Set<string>>(() => {
    if (initial?.content) {
      try {
        const parsed = JSON.parse(initial.content);
        if (Array.isArray(parsed)) return new Set(parsed);
      } catch {
        /* content wasn't a JSON column list — fall back to default */
      }
    }
    return new Set(templateColumns.slice(0, 9));
  });
  const [saving, setSaving] = useState(false);

  const toggleCol = (c: string) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const payload: ReportTemplatePayload = {
      name,
      type: baseReport,
      description,
      content: JSON.stringify(Array.from(selectedCols)), // ⚠️ see note below
    };
    try {
      if (initial) {
        await dispatch(updateReportTemplateThunk({ id: initial.id, payload })).unwrap();
      } else {
        await dispatch(createReportTemplateThunk(payload)).unwrap();
      }
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard, width: "560px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: colors.textMain, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <LayoutTemplate size={17} style={{ color: colors.primary }} /> {initial ? "Edit Template" : "Report Template"}
          </p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Field label="Template Name" style={{ flex: 1 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daily Finance View" style={{ ...toolbarInput, width: "100%", boxSizing: "border-box" }} />
          </Field>
        </div>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" style={{ ...toolbarInput, width: "100%", boxSizing: "border-box" }} />
        </Field>
        <Field label="Base Report">
          <select className="rp-select" style={{ width: "100%" }} value={baseReport} onChange={(e) => setBaseReport(e.target.value)}>
            {reportTypeOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label={`Select Columns (${selectedCols.size} selected)`}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "6px", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "12px",
            backgroundColor: "#F9FAFB",
          }}>
            {templateColumns.map((c) => {
              const checked = selectedCols.has(c);
              return (
                <button
                  key={c} onClick={() => toggleCol(c)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "5px 6px",
                    border: "none", background: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{
                    width: "15px", height: "15px", borderRadius: "4px", flexShrink: 0,
                    border: `1.5px solid ${checked ? colors.primary : colors.border}`,
                    backgroundColor: checked ? colors.primary : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                  </span>
                  <span style={{ fontSize: "12px", color: colors.textMain }}>{c}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Default Filters">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select className="rp-select"><option>Status: Completed</option></select>
            <select className="rp-select"><option>Region: All</option></select>
            <select className="rp-select"><option>Model: All</option></select>
          </div>
        </Field>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button onClick={onClose} style={pillBtnGhost}>Cancel</button>
          <button onClick={onClose} style={pillBtnGhost}>Preview</button>
          <button onClick={handleSave} style={pillBtn} disabled={!name.trim() || saving}>
            {saving ? "Saving…" : "Save Template"}
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