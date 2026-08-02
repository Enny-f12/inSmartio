/* eslint-disable react-hooks/set-state-in-effect */
// components/settings/AppVersionSettings.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Download, Smartphone, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchLatestVersion,
  fetchAllVersions,
  uploadVersionThunk,
  deleteVersionThunk,
  resetUploadStatus,
} from "@/lib/redux/appversionSlice";

// ── Helpers ───────────────────────────────────────────────
const fmtBytes = (bytes: number): string => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// ── Sub-components ────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 8, flexWrap: "wrap" }}>
      <span style={{ minWidth: 160, flexShrink: 0, fontWeight: 500, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", wordBreak: "break-all" }}>{value ?? "—"}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function AppVersionSettings({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { latest, history, fetchStatus, uploadStatus, deleteStatus, error } =
    useAppSelector((s) => s.appVersion);

  // ── Form state ────────────────────────────────────────
  const [version,      setVersion]      = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [file,         setFile]         = useState<File | null>(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [confirmId,    setConfirmId]    = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchLatestVersion());
    dispatch(fetchAllVersions());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (uploadStatus === "succeeded") {
      toast.success("APK uploaded successfully");
      setVersion(""); setReleaseNotes(""); setFile(null); setProgress(0);
      setTimeout(() => dispatch(resetUploadStatus()), 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadStatus]);

  // ── File handling ─────────────────────────────────────
  const handleFile = (f: File) => {
    if (!f.name.endsWith(".apk")) { toast.error("Only .apk files are allowed"); return; }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = () => {
    if (!version.trim()) { toast.warning("Please enter a version number"); return; }
    if (!file)           { toast.warning("Please select an APK file");      return; }

    dispatch(uploadVersionThunk({
      payload: { version: version.trim(), releaseNotes: releaseNotes.trim(), file },
      onProgress: (pct) => setProgress(pct),
    }));
  };

  const handleDelete = (id: string) => {
    dispatch(deleteVersionThunk(id))
      .unwrap()
      .then(() => { toast.success("Version deleted"); setConfirmId(null); })
      .catch((e: string) => toast.error(e));
  };

  const isUploading = uploadStatus === "uploading";
  const isLoading   = fetchStatus  === "loading";

  const card: React.CSSProperties = {
    backgroundColor: "#fff", border: "1px solid #E5E7EB",
    borderRadius: 14, overflow: "hidden",
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.08em", color: "#6B7280", margin: "0 0 16px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 14px", borderRadius: 10,
    border: "1px solid #E5E7EB", fontSize: 13, color: "#111827",
    outline: "none", boxSizing: "border-box", backgroundColor: "#fff",
  };

  return (
    <SubPageShell title="App Version Management" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Current Version Card ── */}
        <div style={card}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Smartphone size={20} color="#2563EB" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Current Live Version</p>
              <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>The APK users can download</p>
            </div>
            {latest && (
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 600, color: "#16a34a", backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0", borderRadius: 999, padding: "4px 12px" }}>
                <CheckCircle2 size={13} /> Live
              </span>
            )}
          </div>

          <div style={{ padding: "20px 24px" }}>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9CA3AF", fontSize: 13 }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading…
              </div>
            ) : latest ? (
              <>
                <InfoRow label="Version:"       value={<strong style={{ color: "#2563EB" }}>v{latest.version}</strong>} />
                <InfoRow label="File Name:"     value={latest.fileName} />
                <InfoRow label="File Size:"     value={fmtBytes(latest.fileSize)} />
                <InfoRow label="Released:"      value={fmtDate(latest.createdAt)} />
                <InfoRow label="Release Notes:" value={latest.releaseNotes || "—"} />
                <InfoRow label="Download URL:"  value={
                  <a href={latest.fileUrl} target="_blank" rel="noreferrer"
                    style={{ color: "#2563EB", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Download size={13} /> Download APK
                  </a>
                } />
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9CA3AF", fontSize: 13 }}>
                <AlertCircle size={16} /> No APK uploaded yet.
              </div>
            )}
          </div>
        </div>

        {/* ── Upload New Version ── */}
        <div style={card}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
            <p style={sectionLabel}>Upload New Version</p>

            {/* Version + Release Notes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Version Number *
                </label>
                <input
                  type="text" placeholder="e.g. 1.0.5"
                  value={version} onChange={(e) => setVersion(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Release Notes
                </label>
                <input
                  type="text" placeholder="e.g. Bug fixes, improved performance…"
                  value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => !isUploading && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? "#2563EB" : file ? "#16a34a" : "#D1D5DB"}`,
                borderRadius: 12, padding: "32px 24px", textAlign: "center",
                backgroundColor: dragOver ? "#EFF6FF" : file ? "#f0fdf4" : "#F9FAFB",
                cursor: isUploading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              <input
                ref={fileRef} type="file" accept=".apk" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {file ? (
                <>
                  <CheckCircle2 size={28} color="#16a34a" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#16a34a", margin: "0 0 4px" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{fmtBytes(file.size)}</p>
                  {!isUploading && (
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{ marginTop: 10, fontSize: 12, color: "#dc2626", background: "none",
                        border: "none", cursor: "pointer", fontWeight: 500 }}>
                      Remove file
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Upload size={28} color="#9CA3AF" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>
                    Drop your APK here or click to browse
                  </p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Only .apk files accepted</p>
                </>
              )}
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12,
                  color: "#6B7280", marginBottom: 6 }}>
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: 6, backgroundColor: "#E5E7EB", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, backgroundColor: "#2563EB",
                    borderRadius: 999, transition: "width 0.2s" }} />
                </div>
              </div>
            )}

            {/* Upload button */}
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleUpload} disabled={isUploading || !file || !version.trim()}
                style={{ display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", borderRadius: 12, border: "none",
                  backgroundColor: isUploading || !file || !version.trim() ? "#E5E7EB" : "#2563EB",
                  color: isUploading || !file || !version.trim() ? "#9CA3AF" : "#fff",
                  fontSize: 13, fontWeight: 600,
                  cursor: isUploading || !file || !version.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.15s" }}>
                {isUploading
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</>
                  : <><Upload size={14} /> Upload APK</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Version History ── */}
        {history.length > 0 && (
          <div style={card}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB" }}>
              <p style={{ ...sectionLabel, margin: 0 }}>Version History</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    {["Version", "File", "Size", "Date", "Notes", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "11px 20px",
                        fontSize: 11, fontWeight: 600, color: "#6B7280",
                        textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((v, i) => (
                    <tr key={v.id} style={{ borderBottom: i < history.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <td style={{ padding: "13px 20px", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <strong style={{ fontSize: 13, color: "#111827" }}>v{v.version}</strong>
                          {v.id === latest?.id && (
                            <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#EFF6FF",
                              color: "#2563EB", borderRadius: 999, padding: "2px 8px" }}>
                              LIVE
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {v.fileName}
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {fmtBytes(v.fileSize)}
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {fmtDate(v.createdAt)}
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280", maxWidth: 200 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap", display: "block" }}>
                          {v.releaseNotes || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 20px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <a href={v.fileUrl} target="_blank" rel="noreferrer"
                            style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #E5E7EB",
                              backgroundColor: "#fff", fontSize: 12, color: "#374151",
                              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Download size={12} /> Download
                          </a>
                          {confirmId === v.id ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => handleDelete(v.id)}
                                disabled={deleteStatus === "loading"}
                                style={{ padding: "5px 10px", borderRadius: 8, border: "none",
                                  backgroundColor: "#dc2626", color: "#fff", fontSize: 12,
                                  fontWeight: 600, cursor: "pointer" }}>
                                {deleteStatus === "loading" ? "…" : "Confirm"}
                              </button>
                              <button onClick={() => setConfirmId(null)}
                                style={{ padding: "5px 10px", borderRadius: 8,
                                  border: "1px solid #E5E7EB", backgroundColor: "#fff",
                                  fontSize: 12, cursor: "pointer", color: "#6B7280" }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmId(v.id)}
                              style={{ padding: "5px 8px", borderRadius: 8,
                                border: "1px solid #fecaca", backgroundColor: "#fff",
                                cursor: "pointer", display: "flex", alignItems: "center",
                                color: "#dc2626" }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </SubPageShell>
  );
}