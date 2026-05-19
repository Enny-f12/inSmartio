// components/settings/BannerManagement.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, Eye, Calendar, Loader2, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchBanners, addBanner, editBanner, removeBanner } from "@/lib/redux/bannerSlice";
import type { ApiBanner, CreateBannerPayload } from "@/lib/api/bannerApi";

// ── Mock fallback ─────────────────────────────────────────
const MOCK_BANNERS: ApiBanner[] = [
  { id: "b1", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=160&fit=crop&auto=format", title: "Get Multiple Offers in Minutes", subTitle: "Post your job and receive competitive bids.", ctaButtonText: "Post a Job", ctaLink: "/post-job", startDate: "2026-04-01", endDate: "2026-05-31", status: "active",   click: 1247, createdAt: "", updatedAt: "" },
  { id: "b2", image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=160&fit=crop&auto=format", title: "Hire Verified Experts",          subTitle: "Work with trusted professionals.",        ctaButtonText: "Hire Now",  ctaLink: "/experts",  startDate: "2026-04-01", endDate: "2026-05-31", status: "active",   click: 980,  createdAt: "", updatedAt: "" },
  { id: "b3", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=160&fit=crop&auto=format", title: "100% Payment Protected",          subTitle: "Your money is safe until done.",          ctaButtonText: "Learn More",ctaLink: "/how",      startDate: "2026-04-01", endDate: "2026-05-31", status: "active",   click: 754,  createdAt: "", updatedAt: "" },
  { id: "b4", image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=160&fit=crop&auto=format", title: "Post Your Job Free",             subTitle: "Get offers in less than 60 seconds.",     ctaButtonText: "Start Free",ctaLink: "/post-job", startDate: "2026-05-01", endDate: "2026-05-31", status: "inactive", click: 500,  createdAt: "", updatedAt: "" },
];

// ── Image compression ─────────────────────────────────────
const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down if wider than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context failed")); return; }
        ctx.drawImage(img, 0, 0, width, height);

        // Export as base64
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

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

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "999px", backgroundColor: active ? "#dcfce7" : "#f3f4f6", color: active ? "#15803d" : "#6b7280", border: active ? "1px solid #bbf7d0" : "1px solid #e5e7eb", whiteSpace: "nowrap", flexShrink: 0 }}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Image Uploader component ──────────────────────────────
function ImageUploader({
  preview, onImage, compressing,
}: {
  preview: string;
  onImage: (base64: string) => void;
  compressing: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large — max 10MB"); return; }
    try {
      const base64 = await compressImage(file);
      onImage(base64);
    } catch {
      toast.error("Failed to process image");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label style={labelStyle}>Banner Image *</label>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {preview ? (
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-border)", height: "120px" }}>
          <Image src={preview} alt="Banner preview" fill style={{ objectFit: "cover" }} />
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
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "32px 16px", borderRadius: "12px", border: "2px dashed var(--color-border)", backgroundColor: "var(--color-background)", cursor: "pointer" }}
        >
          {compressing ? (
            <><Loader2 size={20} className="animate-spin" style={{ color: "var(--color-text-muted)" }} /><p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Compressing image...</p></>
          ) : (
            <><Upload size={20} style={{ color: "var(--color-text-muted)" }} /><p style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center" }}>Click to upload or drag & drop<br /><span style={{ fontSize: "11px" }}>JPG, PNG, WEBP — max 10MB (auto-compressed)</span></p></>
          )}
        </div>
      )}
    </div>
  );
}

// ── Banner Form Modal ─────────────────────────────────────
function BannerFormModal({
  banner, onClose, onSave, saving,
}: {
  banner?: ApiBanner;
  onClose: () => void;
  onSave: (payload: CreateBannerPayload & { status?: string }) => void;
  saving: boolean;
}) {
  const [imageBase64,  setImageBase64]  = useState(banner?.image ?? "");
  const [compressing]  = useState(false);
  const [title,        setTitle]        = useState(banner?.title ?? "");
  const [subTitle,     setSubTitle]     = useState(banner?.subTitle ?? "");
  const [ctaText,      setCtaText]      = useState(banner?.ctaButtonText ?? "");
  const [ctaLink,      setCtaLink]      = useState(banner?.ctaLink ?? "");
  const [startDate,    setStartDate]    = useState(banner?.startDate?.slice(0, 10) ?? "");
  const [endDate,      setEndDate]      = useState(banner?.endDate?.slice(0, 10) ?? "");
  const [active,       setActive]       = useState(banner ? banner.status === "active" : true);


  return (
    <Modal open onClose={onClose} title={banner ? "Edit Banner" : "Create Banner"} size="lg"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
          <button
            onClick={() => onSave({ image: imageBase64, title, subTitle, ctaButtonText: ctaText, ctaLink, startDate, endDate, status: active ? "active" : "inactive" })}
            disabled={saving || compressing}
            className="btn-primary"
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: (saving || compressing) ? 0.7 : 1 }}
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />{banner ? "Saving..." : "Creating..."}</> : banner ? "Save Changes" : "Create Banner"}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <ImageUploader
          preview={imageBase64}
          compressing={compressing}
          onImage={(b64) => {
            if (b64 === "") { setImageBase64(""); return; }
            // Called from uploader with already-compressed base64
            setImageBase64(b64);
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
          <button onClick={() => setActive((v) => !v)} style={{ position: "relative", width: "44px", height: "24px", borderRadius: "999px", border: "none", cursor: "pointer", backgroundColor: active ? "#22c55e" : "#d1d5db", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: "2px", left: active ? "22px" : "2px", width: "20px", height: "20px", backgroundColor: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
          </button>
        </div>

        {/* Compression info */}
        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center" }}>
          Images are automatically compressed and converted to base64 before upload
        </p>
      </div>
    </Modal>
  );
}

function DeleteModal({ banner, onClose, onConfirm, deleting }: { banner: ApiBanner; onClose: () => void; onConfirm: () => void; deleting: boolean }) {
  return (
    <Modal open onClose={onClose} title="Delete Banner" size="sm"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? <><Loader2 size={14} className="animate-spin" />Deleting...</> : "Delete"}
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
  const banners    = listStatus === "succeeded" && list.length > 0 ? list : MOCK_BANNERS;

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchBanners());
  }, [dispatch, listStatus]);

  const handleCreate = (payload: CreateBannerPayload & { status?: string }) => {
    if (!payload.title) { toast.warning("Title is required"); return; }
    if (!payload.image) { toast.warning("Please upload a banner image"); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _status, ...createPayload } = payload;
    const isoPayload = {
      ...createPayload,
      startDate: createPayload.startDate ? new Date(createPayload.startDate).toISOString() : "",
      endDate:   createPayload.endDate   ? new Date(createPayload.endDate).toISOString()   : "",
    };
    dispatch(addBanner(isoPayload))
      .unwrap()
      .then(() => { toast.success("Banner created"); setCreateOpen(false); })
      .catch((err: string) => toast.error("Failed to create banner", { description: err }));
  };

  const handleEdit = (payload: CreateBannerPayload & { status?: string }) => {
    if (!editTarget) return;
    const isoPayload = {
      ...payload,
      startDate: payload.startDate ? new Date(payload.startDate).toISOString() : "",
      endDate:   payload.endDate   ? new Date(payload.endDate).toISOString()   : "",
    };
    dispatch(editBanner({ id: editTarget.id, payload: isoPayload }))
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

      <SubPageShell title="Banner Management" onBack={onBack}
        action={
          <button onClick={() => setCreateOpen(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
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
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>No banners on server — showing sample data.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
          {banners.map((banner) => (
            <div key={banner.id} className="banner-card">
              <div className="banner-card-top">
                <div style={{ width: 72, height: 56, borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)", position: "relative" }}>
                  {banner.image
                    ? <Image src={banner.image} alt={banner.title} fill style={{ objectFit: "cover" }} />
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

      {createOpen  && <BannerFormModal onClose={() => setCreateOpen(false)}  onSave={handleCreate} saving={isMutating} />}
      {editTarget  && <BannerFormModal banner={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} saving={isMutating} />}
      {deleteTarget && <DeleteModal banner={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={isMutating} />}
    </>
  );
}