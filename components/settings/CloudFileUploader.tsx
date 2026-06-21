"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import {
  CheckCircle2, Upload, Loader2, AlertCircle,
  Copy, Check, Cloud, FileUp, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  generateSignatureThunk,
  uploadToCloudinaryThunk,
  resetCloud,
  setUploadProgress,
} from "@/lib/redux/cloudSlice";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBytes = (bytes: number) => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Small copy button ────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      title="Copy"
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: copied ? "#16a34a" : "#9CA3AF", padding: "2px 4px", flexShrink: 0,
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ─── Step pill ────────────────────────────────────────────────────────────────

function StepPill({ n, label, state }: {
  n: number;
  label: string;
  state: "active" | "done" | "idle";
}) {
  const bg    = state === "done" ? "#f0fdf4" : state === "active" ? "#111827" : "#F3F4F6";
  const color = state === "done" ? "#16a34a" : state === "active" ? "#fff"    : "#9CA3AF";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: bg, color,
        fontSize: 11, fontWeight: 700,
        border: state === "done" ? "1px solid #bbf7d0" : "none",
      }}>
        {state === "done" ? <CheckCircle2 size={13} /> : n}
      </div>
      <span style={{
        fontSize: 13, fontWeight: state === "active" ? 600 : 400,
        color: state === "idle" ? "#9CA3AF" : "#111827",
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CloudFileManager({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const {
    signature, signatureLoading, signatureError,
    uploadResult, uploadLoading, uploadProgress, uploadError,
  } = useAppSelector((s) => s.cloud);

  const [folder,   setFolder]   = useState("app-versions");
  const [file,     setFile]     = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // which step are we on
  const step: 1 | 2 | 3 = uploadResult ? 3 : signature ? 2 : 1;

  function handleGetCredentials() {
    if (!folder.trim()) { toast.warning("Enter a folder name"); return; }
    dispatch(generateSignatureThunk(folder.trim()));
  }

  function handleUpload() {
    if (!file || !signature) return;
    dispatch(uploadToCloudinaryThunk({
      file,
      creds: signature,
      onProgress: (pct) => dispatch(setUploadProgress(pct)),
    }))
      .unwrap()
      .then(() => toast.success("File uploaded successfully"))
      .catch((e: string) => toast.error(e));
  }

  function handleReset() {
    dispatch(resetCloud());
    setFile(null);
    setFolder("app-versions");
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card = (active: boolean, done: boolean): React.CSSProperties => ({
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderLeft: `3px solid ${done ? "#16a34a" : active ? "#111827" : "#E5E7EB"}`,
    borderRadius: 14,
    padding: "20px 24px",
    marginBottom: 12,
    opacity: !active && !done ? 0.5 : 1,
    pointerEvents: !active && !done ? "none" : "auto",
    transition: "opacity 0.2s",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 14px", borderRadius: 10,
    border: "1px solid #E5E7EB", fontSize: 13, color: "#111827",
    outline: "none", boxSizing: "border-box",
    backgroundColor: "#fff",
  };

  return (
    <SubPageShell title="App Upload" onBack={onBack}>

      {/* Step indicators */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <StepPill n={1} label="Get credentials" state={step > 1 ? "done" : step === 1 ? "active" : "idle"} />
        <div style={{ flex: 1, height: 1, backgroundColor: step > 1 ? "#16a34a" : "#E5E7EB" }} />
        <StepPill n={2} label="Upload file"     state={step > 2 ? "done" : step === 2 ? "active" : "idle"} />
        <div style={{ flex: 1, height: 1, backgroundColor: step > 2 ? "#16a34a" : "#E5E7EB" }} />
        <StepPill n={3} label="Done"            state={step === 3 ? "done" : "idle"} />
      </div>

      {/* ── STEP 1: folder + signature ── */}
      <div style={card(step === 1, step > 1)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Cloud size={15} color={step > 1 ? "#16a34a" : "#6B7280"} />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>
            Get upload credentials
          </p>
          {step > 1 && (
            <span style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 600,
              color: "#16a34a", backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0", borderRadius: 999, padding: "2px 10px",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <CheckCircle2 size={10} /> Ready
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280",
              display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Cloudinary folder
            </label>
            <input
              type="text"
              placeholder="e.g. app-versions"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              disabled={!!signature}
              onKeyDown={(e) => e.key === "Enter" && handleGetCredentials()}
              style={{ ...inputStyle, backgroundColor: signature ? "#F9FAFB" : "#fff",
                color: signature ? "#9CA3AF" : "#111827" }}
            />
          </div>
          {!signature ? (
            <button
              onClick={handleGetCredentials}
              disabled={signatureLoading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 10, border: "none",
                backgroundColor: "#111827", color: "#fff",
                fontSize: 13, fontWeight: 600,
                cursor: signatureLoading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {signatureLoading
                ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Getting…</>
                : "Get credentials"}
            </button>
          ) : (
            <button
              onClick={handleReset}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 14px", borderRadius: 10,
                border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
                color: "#6B7280", fontSize: 13, cursor: "pointer",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              <RotateCcw size={12} /> Start over
            </button>
          )}
        </div>

        {signatureError && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "#dc2626", backgroundColor: "#fef2f2",
            border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>
            <AlertCircle size={13} /> {signatureError}
          </div>
        )}

        {/* Credentials returned from backend */}
        {signature && (
          <div style={{ marginTop: 12, backgroundColor: "#F9FAFB",
            borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            {(
              [
                ["signature",  signature.signature],
                ["timestamp",  String(signature.timestamp)],
                ["apiKey",     signature.apiKey],
                ["cloudName",  signature.cloudName],
                ["folder",     signature.folder],
              ] as [string, string][]
            ).map(([key, value], i, arr) => (
              <div key={key} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 12px",
                borderBottom: i < arr.length - 1 ? "1px solid #E5E7EB" : "none",
              }}>
                <span style={{ fontSize: 11, color: "#9CA3AF", width: 76, flexShrink: 0 }}>{key}</span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#374151",
                  flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {value}
                </span>
                <CopyBtn value={value} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── STEP 2: pick file + upload ── */}
      <div style={card(step === 2, step > 2)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <FileUp size={15} color={step > 2 ? "#16a34a" : "#6B7280"} />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>
            Upload file directly to Cloudinary
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => !uploadLoading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files[0]; if (f) setFile(f);
          }}
          style={{
            border: `2px dashed ${dragOver ? "#2563EB" : file ? "#16a34a" : "#D1D5DB"}`,
            borderRadius: 12, padding: "24px",
            textAlign: "center", cursor: uploadLoading ? "not-allowed" : "pointer",
            backgroundColor: dragOver ? "#EFF6FF" : file ? "#f0fdf4" : "#F9FAFB",
            transition: "all 0.15s",
          }}
        >
          <input
            ref={fileRef} type="file" style={{ display: "none" }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0]; if (f) setFile(f);
            }}
          />
          {file ? (
            <>
              <CheckCircle2 size={24} color="#16a34a" style={{ marginBottom: 6 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#15803d", margin: "0 0 2px" }}>
                {file.name}
              </p>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>{fmtBytes(file.size)}</p>
              {!uploadLoading && (
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{ marginTop: 8, fontSize: 11, color: "#dc2626",
                    background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                >
                  Remove
                </button>
              )}
            </>
          ) : (
            <>
              <Upload size={24} color="#9CA3AF" style={{ marginBottom: 6 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 2px" }}>
                Drop file here or click to browse
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                Sends directly to Cloudinary — your server is not involved
              </p>
            </>
          )}
        </div>

        {/* Progress */}
        {uploadLoading && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "#6B7280", marginBottom: 4 }}>
              <span>Uploading to Cloudinary…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ height: 5, backgroundColor: "#E5E7EB", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${uploadProgress}%`,
                backgroundColor: "#111827", borderRadius: 999, transition: "width 0.2s" }} />
            </div>
          </div>
        )}

        {uploadError && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "#dc2626", backgroundColor: "#fef2f2",
            border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>
            <AlertCircle size={13} /> {uploadError}
          </div>
        )}

        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleUpload}
            disabled={!file || uploadLoading}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 20px", borderRadius: 10, border: "none",
              backgroundColor: !file || uploadLoading ? "#E5E7EB" : "#111827",
              color: !file || uploadLoading ? "#9CA3AF" : "#fff",
              fontSize: 13, fontWeight: 600,
              cursor: !file || uploadLoading ? "not-allowed" : "pointer",
            }}
          >
            {uploadLoading
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</>
              : <><Upload size={13} /> Upload to Cloudinary</>}
          </button>
        </div>
      </div>

      {/* ── STEP 3: Result ── */}
      {uploadResult && (
        <div style={{
          backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
          borderLeft: "3px solid #16a34a", borderRadius: 14, padding: "20px 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", margin: 0 }}>
              File uploaded successfully
            </p>
            <button
              onClick={handleReset}
              style={{
                marginLeft: "auto", fontSize: 12, color: "#374151",
                background: "#fff", border: "1px solid #D1D5DB",
                borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
              }}
            >
              <RotateCcw size={11} /> Upload another
            </button>
          </div>

          {(
            [
              ["Public ID",  uploadResult.public_id],
              ["Secure URL", uploadResult.secure_url],
              ["Format",     uploadResult.format],
              ["Size",       fmtBytes(uploadResult.bytes)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 8, fontSize: 12,
              marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ width: 80, flexShrink: 0, color: "#6B7280", fontWeight: 600 }}>
                {label}
              </span>
              <span style={{
                color: "#111827", wordBreak: "break-all", flex: 1,
                fontFamily: label === "Public ID" || label === "Secure URL" ? "monospace" : undefined,
              }}>
                {value}
              </span>
              {(label === "Public ID" || label === "Secure URL") && (
                <CopyBtn value={value} />
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </SubPageShell>
  );
}