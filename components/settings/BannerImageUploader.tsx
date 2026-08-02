// components/settings/ImageUploader.tsx
// Drop-in replacement for the ImageUploader in BannerManagement.tsx
// Requires: npm install react-image-crop

"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

// ── Config ────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME   = "prolomon";
const CLOUDINARY_UPLOAD_PRESET = "banners_unsigned"; // your unsigned preset name
const TARGET_W = 1200;
const TARGET_H = 600;
const ASPECT   = TARGET_W / TARGET_H; // 2

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "6px",
};

// ── Helpers ───────────────────────────────────────────────

/** Initialise a centred 2:1 crop on first image load */
function initCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ASPECT, width, height),
    width,
    height,
  );
}

/** Draw the cropped area onto a canvas and return a Blob */
function getCroppedBlob(
  image: HTMLImageElement,
  crop: Crop,
  outputW = TARGET_W,
  outputH = TARGET_H,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width  = outputW;
  canvas.height = outputH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas context failed"));

  // Translate % crop → pixel crop relative to natural image size
  const scaleX = image.naturalWidth  / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelCrop = {
    x: crop.x * scaleX,
    y: crop.y * scaleY,
    w: crop.width  * scaleX,
    h: crop.height * scaleY,
  };

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.w, pixelCrop.h, // source rect
    0, 0, outputW, outputH,                              // dest rect
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Blob conversion failed"))),
      "image/jpeg",
      0.9,
    ),
  );
}

/** Upload a Blob to Cloudinary unsigned; returns the CDN URL */
async function uploadBlobToCloudinary(blob: Blob): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, "banner.jpg");
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  fd.append("folder", "banners");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? "Upload failed");
  }

  const data = await res.json();
  // Return URL with automatic quality/format optimisation
  const raw: string = data.secure_url;
  return raw.replace("/upload/", "/upload/q_auto,f_auto/");
}

// ── Crop Modal ────────────────────────────────────────────
function CropModal({
  src,
  onCancel,
  onConfirm,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (croppedUrl: string) => void;
}) {
  const imgRef    = useRef<HTMLImageElement>(null);
  const [crop,    setCrop]    = useState<Crop>();
  const [uploading, setUploading] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(initCrop(width, height));
  }, []);

  const handleConfirm = async () => {
    if (!imgRef.current || !crop) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, crop);
      const url  = await uploadBlobToCloudinary(blob);
      onConfirm(url);
    } catch (err) {
      toast.error("Upload failed", { description: (err as Error).message });
      setUploading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title="Crop Banner Image"
      size="lg"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button
            onClick={onCancel}
            disabled={uploading}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)", opacity: uploading ? 0.6 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploading || !crop}
            className="btn-primary"
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: (uploading || !crop) ? 0.7 : 1 }}
          >
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
              : <><Check size={14} /> Use this crop</>
            }
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Hint */}
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          Drag the box to choose what appears in the banner. The crop is locked to <strong>2:1</strong> ({TARGET_W}×{TARGET_H}px).
        </p>

        {/* Crop area */}
        <div style={{ maxHeight: "60vh", overflow: "auto", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={ASPECT}
            minWidth={80}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxWidth: "100%", display: "block" }}
            />
          </ReactCrop>
        </div>

        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center" }}>
          Output: {TARGET_W}×{TARGET_H}px JPEG • hosted on Cloudinary CDN
        </p>
      </div>
    </Modal>
  );
}

// ── Main ImageUploader ────────────────────────────────────
export function ImageUploader({
  preview,
  onImage,
  uploading,
}: {
  preview: string;
  onImage: (url: string) => void;
  /** True while a Cloudinary upload is in progress (from inside CropModal) */
  uploading: boolean;
}) {
  const inputRef        = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 20 * 1024 * 1024)   { toast.error("File too large — max 20MB");   return; }

    // Read into a data-URL for the cropper — no network call yet
    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label style={labelStyle}>
        Banner Image *&nbsp;
        <span style={{ fontWeight: 400, fontSize: "11px" }}>
          (any size — you&apos;ll crop to 2:1 before upload)
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {preview ? (
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-border)", aspectRatio: "2 / 1" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Banner preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {uploading ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "rgba(0,0,0,0.45)" }}>
              <Loader2 size={20} className="animate-spin" style={{ color: "#fff" }} />
              <p style={{ fontSize: "12px", color: "#fff", fontWeight: 500 }}>Uploading...</p>
            </div>
          ) : (
            <>
              <button
                onClick={() => onImage("")}
                style={{ position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
              >
                <X size={14} />
              </button>
              <button
                onClick={() => inputRef.current?.click()}
                style={{ position: "absolute", bottom: "8px", right: "8px", padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", fontSize: "11px", color: "#fff", fontWeight: 500 }}
              >
                Change
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "32px 16px", borderRadius: "12px", border: "2px dashed var(--color-border)", backgroundColor: "var(--color-background)", cursor: "pointer", aspectRatio: "2 / 1" }}
        >
          <Upload size={20} style={{ color: "var(--color-text-muted)" }} />
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center" }}>
            Click to upload or drag & drop<br />
            <span style={{ fontSize: "11px" }}>Any size — you&apos;ll crop it to 2:1 before it&apos;s uploaded</span>
          </p>
        </div>
      )}

      {/* Crop modal — appears after file selection, before upload */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onCancel={() => { setCropSrc(null); }}
          onConfirm={(url) => { setCropSrc(null); onImage(url); }}
        />
      )}
    </div>
  );
}