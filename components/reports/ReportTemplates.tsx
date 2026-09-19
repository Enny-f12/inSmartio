// components/ReportTemplates.tsx
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, X, LayoutTemplate, Check, Download, AlertTriangle, Upload, FileText, CircleX } from "lucide-react";
import { colors, card, th, thFirst, td, tdFirst, pillBtn, pillBtnGhost, modalOverlay, modalCard, toolbarInput } from "./shared";
import { SkelTableRows, SkelCardRows } from "./Skeleton";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import {
  fetchReportTemplatesThunk,
  createReportTemplateThunk,
  updateReportTemplateThunk,
  deleteReportTemplateThunk,
} from "@/lib/redux/reportTemplatesSlice";
import type { ReportTemplate, ReportTemplatePayload } from "@/lib/api/reportTemplateApi";
import { reportTypeOptions, templateColumns } from "./mockData";

const DEFAULT_FILTER_OPTIONS = {
  Status: ["All", "Completed", "In Progress", "Cancelled"],
  Region: ["All", "North", "South", "East", "West"],
  Model:  ["All"],
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReportTemplates() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: templates, status } = useSelector((s: RootState) => s.reportTemplates);
  const loading = status === "idle" || status === "loading";

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ReportTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReportTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchReportTemplatesThunk());
  }, [dispatch]);

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t: ReportTemplate) => { setEditing(t); setShowModal(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteReportTemplateThunk(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {showModal && (
        <TemplateModal
          key={editing?.id ?? "new"}
          initial={editing}
          onClose={() => setShowModal(false)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete template?"
          message={`This will permanently delete "${deleteTarget.name}". This can't be undone.`}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

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
                  <td style={{ ...tdFirst, fontWeight: 600 }}>
                    {t.name}
                    {(t.urls?.csv?.url || t.urls?.pdf?.url) && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        {t.urls?.csv?.url && (
                          <a href={t.urls.csv.url} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: colors.primary, display: "flex", alignItems: "center", gap: "3px", textDecoration: "none" }}>
                            <Download size={10} /> CSV
                          </a>
                        )}
                        {t.urls?.pdf?.url && (
                          <a href={t.urls.pdf.url} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: colors.primary, display: "flex", alignItems: "center", gap: "3px", textDecoration: "none" }}>
                            <Download size={10} /> PDF
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={td}>{t.baseReport || t.type}</td>
                  <td style={td}>{t.used ?? "—"}</td>
                  <td style={td}>{t.createdBy ?? "—"}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Pencil size={14} style={{ color: colors.textFaint, cursor: "pointer" }} onClick={() => openEdit(t)} />
                      <Trash2 size={14} style={{ color: colors.red, cursor: "pointer" }} onClick={() => setDeleteTarget(t)} />
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
                <span style={{ fontSize: "12px", color: colors.textMuted }}>{t.used ?? "—"}</span>
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{t.baseReport || t.type}</p>
              <p style={{ fontSize: "11px", color: colors.textFaint, margin: "2px 0 0" }}>By {t.createdBy ?? "—"}</p>
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
  const [reportType, setReportType] = useState(initial?.type ?? reportTypeOptions[0]);
  const [baseReport, setBaseReport] = useState(initial?.baseReport ?? "");
  const [selectedCols, setSelectedCols] = useState<Set<string>>(
    () => new Set(initial?.columns ?? templateColumns.slice(0, 9))
  );
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initial_: Record<string, string> = { Status: "All", Region: "All", Model: "All" };
    (initial?.filter ?? []).forEach((f) => {
      const [key, value] = f.split(":").map((s) => s.trim());
      if (key && value) initial_[key] = value;
    });
    return initial_;
  });

  // The file already attached to this template on the server (shown when editing)
  const [existingFile, setExistingFile] = useState<{ url: string; kind: "csv" | "pdf" } | null>(() => {
    if (initial?.urls?.csv?.url) return { url: initial.urls.csv.url, kind: "csv" };
    if (initial?.urls?.pdf?.url) return { url: initial.urls.pdf.url, kind: "pdf" };
    return null;
  });
  // A brand-new file chosen in this session (to upload / replace with)
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const toggleCol = (c: string) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  };

  const existingFileName = (url: string) => {
    try {
      const decoded = decodeURIComponent(url.split("?")[0]);
      return decoded.split("/").pop() || "attached-file";
    } catch {
      return "attached-file";
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const filterArray = Object.entries(filters)
      .filter(([, value]) => value && value !== "All")
      .map(([key, value]) => `${key}: ${value}`);

    const payload: ReportTemplatePayload = {
      name,
      type: reportType,
      content: description || name,
      description,
      baseReport: baseReport || undefined,
      columns: Array.from(selectedCols),
      filter: filterArray,
      ...(file ? { file } : {}),
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

        <div style={{ display: "flex", gap: "12px" }}>
          <Field label="Report Type" style={{ flex: 1 }}>
            <select className="rp-select" style={{ width: "100%" }} value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {reportTypeOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Base Report (optional)" style={{ flex: 1 }}>
            <input
              value={baseReport} onChange={(e) => setBaseReport(e.target.value)}
              placeholder="e.g. underlying report id"
              style={{ ...toolbarInput, width: "100%", boxSizing: "border-box" }}
            />
          </Field>
        </div>

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
            {Object.entries(DEFAULT_FILTER_OPTIONS).map(([key, options]) => (
              <select
                key={key} className="rp-select"
                value={filters[key]}
                onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
              >
                {options.map((o) => <option key={o} value={o}>{key}: {o}</option>)}
              </select>
            ))}
          </div>
        </Field>

        <Field label="Attach Sample File (optional)">
          {file ? (
            // A brand-new file was just picked/dropped/replaced in this session
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
              borderRadius: "10px", border: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB",
            }}>
              <span style={{
                width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, display: "flex",
                alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight,
              }}>
                <FileText size={15} style={{ color: colors.primary }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: colors.textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {file.name}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: colors.textFaint }}>
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint, flexShrink: 0, display: "flex" }}
                aria-label="Remove file"
              >
                <CircleX size={18} />
              </button>
            </div>
          ) : existingFile ? (
            // The file already saved on this template (shown on edit, before any new pick)
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
              borderRadius: "10px", border: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB",
            }}>
              <span style={{
                width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, display: "flex",
                alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight,
              }}>
                <FileText size={15} style={{ color: colors.primary }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={existingFile.url} target="_blank" rel="noreferrer"
                  style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: colors.textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", textDecoration: "none" }}
                >
                  {existingFileName(existingFile.url)}
                </a>
                <p style={{ margin: 0, fontSize: "11px", color: colors.textFaint }}>
                  Currently attached · {existingFile.kind.toUpperCase()}
                </p>
              </div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: colors.primary, cursor: "pointer", flexShrink: 0 }}>
                Replace
                <input
                  type="file" accept=".csv,.pdf"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
              </label>
              <button
                onClick={() => setExistingFile(null)}
                style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint, flexShrink: 0, display: "flex" }}
                aria-label="Remove file"
              >
                <CircleX size={18} />
              </button>
            </div>
          ) : (
            // No file at all yet
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) setFile(dropped);
              }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "6px", padding: "22px 12px", borderRadius: "10px", cursor: "pointer",
                border: `1.5px dashed ${isDragging ? colors.primary : colors.border}`,
                backgroundColor: isDragging ? colors.primaryLight : "#F9FAFB",
                transition: "background-color 0.15s, border-color 0.15s",
              }}
            >
              <span style={{
                width: "32px", height: "32px", borderRadius: "999px", display: "flex",
                alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
                border: `1px solid ${colors.border}`,
              }}>
                <Upload size={14} style={{ color: colors.primary }} />
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: colors.textMain }}>
                Click to upload or drag and drop
              </span>
              <span style={{ fontSize: "11px", color: colors.textFaint }}>CSV or PDF, up to 10MB</span>
              <input
                type="file" accept=".csv,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
            </label>
          )}
        </Field>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button onClick={onClose} style={pillBtnGhost}>Cancel</button>
          <button onClick={() => setShowPreview(true)} style={pillBtnGhost} disabled={!name.trim()}>Preview</button>
          <button onClick={handleSave} style={pillBtn} disabled={!name.trim() || saving}>
            {saving ? "Saving…" : "Save Template"}
          </button>
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          name={name}
          description={description}
          reportType={reportType}
          baseReport={baseReport}
          columns={Array.from(selectedCols)}
          filters={Object.entries(filters).filter(([, v]) => v && v !== "All").map(([k, v]) => `${k}: ${v}`)}
          fileLabel={file ? file.name : existingFile ? existingFileName(existingFile.url) : null}
          fileSizeLabel={file ? formatFileSize(file.size) : null}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function PreviewModal({
  name,
  description,
  reportType,
  baseReport,
  columns,
  filters,
  fileLabel,
  fileSizeLabel,
  onClose,
}: {
  name: string;
  description: string;
  reportType: string;
  baseReport: string;
  columns: string[];
  filters: string[];
  fileLabel: string | null;
  fileSizeLabel: string | null;
  onClose: () => void;
}) {
  return (
    <div style={{ ...modalOverlay, zIndex: 60 }} onClick={onClose}>
      <div style={{ ...modalCard, width: "520px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: colors.textMain, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <LayoutTemplate size={17} style={{ color: colors.primary }} /> Preview
          </p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: colors.textMain }}>{name || "Untitled Template"}</p>
            {description && (
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: colors.textMuted }}>{description}</p>
            )}
          </div>

          <div style={{ display: "flex", gap: "24px" }}>
            <PreviewField label="Report Type" value={reportType} />
            <PreviewField label="Base Report" value={baseReport || "—"} />
          </div>

          <div>
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 600, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Columns ({columns.length})
            </p>
            {columns.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {columns.map((c) => (
                  <span key={c} style={{
                    fontSize: "11.5px", padding: "3px 9px", borderRadius: "999px",
                    backgroundColor: colors.primaryLight, color: colors.primary, fontWeight: 600,
                  }}>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "12.5px", color: colors.textFaint }}>No columns selected</p>
            )}
          </div>

          <div>
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 600, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Default Filters
            </p>
            {filters.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {filters.map((f) => (
                  <span key={f} style={{
                    fontSize: "11.5px", padding: "3px 9px", borderRadius: "999px",
                    border: `1px solid ${colors.border}`, color: colors.textMuted, fontWeight: 500,
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "12.5px", color: colors.textFaint }}>No filters applied</p>
            )}
          </div>

          <div>
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 600, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Sample File
            </p>
            {fileLabel ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={14} style={{ color: colors.primary }} />
                <span style={{ fontSize: "12.5px", color: colors.textMain, fontWeight: 600 }}>{fileLabel}</span>
                {fileSizeLabel && <span style={{ fontSize: "11px", color: colors.textFaint }}>({fileSizeLabel})</span>}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "12.5px", color: colors.textFaint }}>No file attached</p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <button onClick={onClose} style={pillBtn}>Close</button>
        </div>
      </div>
    </div>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 600, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "13px", color: colors.textMain, fontWeight: 600 }}>{value}</p>
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