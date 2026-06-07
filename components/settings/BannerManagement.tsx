// components/settings/BannerManagement.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Plus, Pencil, Trash2, Upload, Eye, Calendar, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchBanners, addBanner, editBanner, removeBanner } from "@/lib/redux/bannerSlice";
import type { ApiBanner, CreateBannerPayload } from "@/lib/api/bannerApi";

// ── Image config ──────────────────────────────────────────
const TARGET_W = 1200;
const TARGET_H = 600;
const ASPECT   = TARGET_W / TARGET_H; // 2:1

// ── Canvas: crop image to blob ────────────────────────────
function getCroppedBlob(
  image: HTMLImageElement,
  crop: Crop,
  outputW = TARGET_W,
  outputH = TARGET_H,
): Promise<Blob> {
  const canvas  = document.createElement("canvas");
  canvas.width  = outputW;
  canvas.height = outputH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas context failed"));

  const scaleX = image.naturalWidth  / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY,
    0, 0, outputW, outputH,
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Blob conversion failed"))),
      "image/jpeg",
      0.9,
    ),
  );
}

function initCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ASPECT, width, height),
    width,
    height,
  );
}

// ── Shared styles ─────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)",
  fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "6px",
};

// ── StatusBadge ───────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "999px", backgroundColor: active ? "#dcfce7" : "#f3f4f6", color: active ? "#15803d" : "#6b7280", border: active ? "1px solid #bbf7d0" : "1px solid #e5e7eb", whiteSpace: "nowrap", flexShrink: 0 }}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Crop Modal ────────────────────────────────────────────
function CropModal({
  src, onCancel, onConfirm,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (blob: Blob, preview: string) => void;
}) {
  const imgRef              = useRef<HTMLImageElement>(null);
  const [crop, setCrop]     = useState<Crop>();
  const [processing, setProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(initCrop(width, height));
  }, []);

  const handleConfirm = async () => {
    if (!imgRef.current || !crop) return;
    setProcessing(true);
    try {
      const blob    = await getCroppedBlob(imgRef.current, crop);
      const preview = URL.createObjectURL(blob);
      onConfirm(blob, preview);
    } catch (err) {
      toast.error("Failed to process image", { description: (err as Error).message });
      setProcessing(false);
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
            disabled={processing}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)", opacity: processing ? 0.6 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !crop}
            className="btn-primary"
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: (processing || !crop) ? 0.7 : 1 }}
          >
            {processing
              ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
              : <><Check size={14} /> Use this crop</>
            }
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          Drag the box to choose what appears in the banner. The crop is locked to <strong>2:1</strong> ({TARGET_W}×{TARGET_H}px).
        </p>
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
          Output: {TARGET_W}×{TARGET_H}px JPEG • uploaded via backend to Cloudinary
        </p>
      </div>
    </Modal>
  );
}

// ── Image Uploader ────────────────────────────────────────
function ImageUploader({
  preview, onBlob,
}: {
  /** Either an object URL (new blob) or a Cloudinary URL (existing banner) */
  preview: string;
  /** Called with the cropped blob + a local preview URL */
  onBlob: (blob: Blob, preview: string) => void;
}) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 20 * 1024 * 1024)   { toast.error("File too large — max 20MB");   return; }
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
          <button
            onClick={() => onBlob(new Blob(), "")}
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
            <span style={{ fontSize: "11px" }}>Any size — crop to 2:1 before upload • max 20MB</span>
          </p>
        </div>
      )}

      {cropSrc && (
        <CropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={(blob, previewUrl) => { setCropSrc(null); onBlob(blob, previewUrl); }}
        />
      )}
    </div>
  );
}

// ── Banner Form Modal ─────────────────────────────────────
// imageBlob = the cropped Blob ready for multipart upload
// imagePreview = local object URL shown in the UI
// imageExisting = Cloudinary URL from an existing banner (edit mode)
function BannerFormModal({
  banner, onClose, onSave, saving,
}: {
  banner?: ApiBanner;
  onClose: () => void;
  onSave: (payload: CreateBannerPayload & { status?: string }) => void;
  saving: boolean;
}) {
  const [imageBlob,     setImageBlob]     = useState<Blob | null>(null);
  const [imagePreview,  setImagePreview]  = useState(banner?.image ?? "");
  const [title,         setTitle]         = useState(banner?.title ?? "");
  const [subTitle,      setSubTitle]      = useState(banner?.subTitle ?? "");
  const [ctaText,       setCtaText]       = useState(banner?.ctaButtonText ?? "");
  const [ctaLink,       setCtaLink]       = useState(banner?.ctaLink ?? "");
  const [startDate,     setStartDate]     = useState(banner?.startDate?.slice(0, 10) ?? "");
  const [endDate,       setEndDate]       = useState(banner?.endDate?.slice(0, 10) ?? "");
  const [active,        setActive]        = useState(banner ? banner.status === "active" : true);

  const handleSave = () => {
    // If editing and no new image was selected, pass the existing URL string
    // If new image was cropped, pass the Blob for multipart upload
    const imageValue = imageBlob && imageBlob.size > 0
      ? imageBlob
      : banner?.image ?? "";

    onSave({
      image:         imageValue,
      title,
      subTitle,
      ctaButtonText: ctaText,
      ctaLink,
      startDate,
      endDate,
      status: active ? "active" : "inactive",
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={banner ? "Edit Banner" : "Create Banner"}
      size="lg"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)", opacity: saving ? 0.6 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: saving ? 0.7 : 1 }}
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> {banner ? "Saving..." : "Creating..."}</>
              : banner ? "Save Changes" : "Create Banner"
            }
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <ImageUploader
          preview={imagePreview}
          onBlob={(blob, preview) => {
            if (!preview) {
              // user hit the X to remove
              setImageBlob(null);
              setImagePreview("");
            } else {
              setImageBlob(blob);
              setImagePreview(preview);
            }
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div><label style={labelStyle}>Title *</label><input style={inputStyle} placeholder="Banner title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><label style={labelStyle}>Subtitle</label><input style={inputStyle} placeholder="Short description" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div><label style={labelStyle}>CTA Button Text</label><input style={inputStyle} placeholder="e.g. Hire Now" value={ctaText} onChange={(e) => setCtaText(e.target.value)} /></div>
          <div><label style={labelStyle}>CTA Link</label><input style={inputStyle} placeholder="/experts" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div><label style={labelStyle}>Start Date</label><input style={inputStyle} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><label style={labelStyle}>End Date</label><input style={inputStyle} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "2px" }}>Active Banner</p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Make this banner visible in the app</p>
          </div>
          <button
            onClick={() => setActive((v) => !v)}
            style={{ position: "relative", width: "44px", height: "24px", borderRadius: "999px", border: "none", cursor: "pointer", backgroundColor: active ? "#22c55e" : "#d1d5db", flexShrink: 0 }}
          >
            <span style={{ position: "absolute", top: "2px", left: active ? "22px" : "2px", width: "20px", height: "20px", backgroundColor: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete Modal ──────────────────────────────────────────
function DeleteModal({
  banner, onClose, onConfirm, deleting,
}: {
  banner: ApiBanner;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Delete Banner"
      size="sm"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : "Delete"}
          </button>
        </div>
      }
    >
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        Are you sure you want to delete <strong style={{ color: "var(--color-text-main)" }}>{banner.title}</strong>? This cannot be undone.
      </p>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function BannerManagement({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { list, listStatus, mutateStatus } = useAppSelector((s) => s.banners);

  const [createOpen,   setCreateOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<ApiBanner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiBanner | null>(null);

  const isMutating = mutateStatus === "loading";

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchBanners());
  }, [dispatch, listStatus]);

  const handleCreate = (payload: CreateBannerPayload & { status?: string }) => {
    if (!payload.title) { toast.warning("Title is required"); return; }
    if (!payload.image) { toast.warning("Please upload a banner image"); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _status, ...createPayload } = payload;
    dispatch(addBanner({
      ...createPayload,
      startDate: createPayload.startDate ? new Date(createPayload.startDate).toISOString() : "",
      endDate:   createPayload.endDate   ? new Date(createPayload.endDate).toISOString()   : "",
    }))
      .unwrap()
      .then(() => { toast.success("Banner created"); setCreateOpen(false); })
      .catch((err: string) => toast.error("Failed to create banner", { description: err }));
  };

  const handleEdit = (payload: CreateBannerPayload & { status?: string }) => {
    if (!editTarget) return;
    dispatch(editBanner({
      id: editTarget.id,
      payload: {
        ...payload,
        startDate: payload.startDate ? new Date(payload.startDate).toISOString() : "",
        endDate:   payload.endDate   ? new Date(payload.endDate).toISOString()   : "",
      },
    }))
      .unwrap()
      .then(() => { toast.success("Banner updated"); setEditTarget(null); })
      .catch((err: string) => toast.error("Failed to update banner", { description: err }));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch(removeBanner(deleteTarget.id))
      .unwrap()
      .then(() => { toast.success("Banner deleted"); setDeleteTarget(null); })
      .catch((err: string) => toast.error("Failed to delete banner", { description: err }));
  };

  return (
    <>
      <style>{`
        .banner-card           { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: 16px; border: 1px solid var(--color-border); background: #ffffff; }
        .banner-card-top       { display: flex; align-items: flex-start; gap: 14px; }
        .banner-card-bottom    { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--color-border); }
        .banner-actions-inline { display: none !important; }
        @media (min-width: 560px) {
          .banner-card           { flex-direction: row; align-items: center; gap: 20px; padding: 20px 24px; }
          .banner-card-top       { flex: 1; min-width: 0; }
          .banner-card-bottom    { display: none; }
          .banner-actions-inline { display: flex !important; }
        }
      `}</style>

      <SubPageShell
        title="Banner Management"
        onBack={onBack}
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            <Plus size={15} /> Add Banner
          </button>
        }
      >
        {listStatus === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
            <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading banners...</span>
          </div>
        )}

        {listStatus === "succeeded" && list.length === 0 && (
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", padding: "40px 0" }}>
            No banners yet. Add your first banner.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
          {list.map((banner) => (
            <div key={banner.id} className="banner-card">
              <div className="banner-card-top">
                <div style={{ width: 72, height: 36, borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                  {banner.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={banner.image} alt={banner.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>IMG</div>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{banner.title}</p>
                    <StatusBadge status={banner.status} />
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "6px" }}>{banner.subTitle}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-text-muted)" }}><Calendar size={11} /> {banner.startDate?.slice(0, 10)} – {banner.endDate?.slice(0, 10)}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-text-muted)" }}><Eye size={11} /> {banner.click} clicks</span>
                  </div>
                </div>

                <div className="banner-actions-inline" style={{ alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button onClick={() => setEditTarget(banner)} style={{ padding: "6px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><Pencil size={15} strokeWidth={1.8} /></button>
                  <button onClick={() => setDeleteTarget(banner)} style={{ padding: "6px", borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", color: "#f87171" }}><Trash2 size={15} strokeWidth={1.8} /></button>
                </div>
              </div>

              <div className="banner-card-bottom">
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Manage banner</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setEditTarget(banner)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><Pencil size={13} strokeWidth={1.8} /> Edit</button>
                  <button onClick={() => setDeleteTarget(banner)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", color: "#f87171" }}><Trash2 size={13} strokeWidth={1.8} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SubPageShell>

      {createOpen   && <BannerFormModal onClose={() => setCreateOpen(false)} onSave={handleCreate} saving={isMutating} />}
      {editTarget   && <BannerFormModal banner={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} saving={isMutating} />}
      {deleteTarget && <DeleteModal banner={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={isMutating} />}
    </>
  );
}