// components/settings/BannerManagement.tsx
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, Eye, CheckCircle2, Calendar } from "lucide-react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { SubPageShell, FieldInput } from "./SettingsShared";
import { initialBanners } from "@/components/settings/types";
import type { Banner } from "@/components/settings/types";

// ── Unsplash images per banner ────────────────────────────
const BANNER_IMAGES: Record<string, string> = {
  "b1": "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=120&h=80&fit=crop&auto=format",
  "b2": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=80&fit=crop&auto=format",
  "b3": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=120&h=80&fit=crop&auto=format",
  "b4": "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=120&h=80&fit=crop&auto=format",
};

function CreateBannerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title,     setTitle]     = useState("Hire Verified Experts");
  const [subtitle,  setSubtitle]  = useState("Work with trusted professionals reviewed by real users.");
  const [ctaText,   setCtaText]   = useState("Hire Now");
  const [ctaLink,   setCtaLink]   = useState("/insmartio");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [activate,  setActivate]  = useState(true);

  return (
    <Modal open onClose={onClose} title="Create Promotional Banner" size="lg">
      <div className="space-y-5">
        <p className="text-[12px] text-text-muted -mt-3">Design a new banner for the app carousel</p>

        {/* Image upload */}
        <div>
          <p className="text-[13px] font-semibold text-text-main mb-2">Banner Image</p>
          <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-border bg-background cursor-pointer hover:bg-surface transition-colors">
            <Upload size={20} className="text-text-muted" />
            <p className="text-[12px] text-text-muted">Click or drag to upload image</p>
          </div>
        </div>

        {/* Title + Subtitle */}
        <div className="grid grid-cols-2 gap-4">
          <FieldInput label="Title" placeholder="Hire Verified Experts" value={title} onChange={(e) => setTitle(e.target.value)} />
          <FieldInput label="Subtitle" placeholder="Work with trusted professionals..." value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-4">
          <FieldInput label="CTA Button Text" placeholder="Hire Now" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
          <FieldInput label="CTA Link" placeholder="/insmartio" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FieldInput label="Start Date" type="date" placeholder="mm/dd/yyyy" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <FieldInput label="End Date"   type="date" placeholder="mm/dd/yyyy" value={endDate}   onChange={(e) => setEndDate(e.target.value)} />
        </div>

        {/* Activate toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-text-main">Activate Banner</p>
            <p className="text-[12px] text-text-muted">Make this banner visible immediately</p>
          </div>
          <button
            onClick={() => setActivate((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${activate ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${activate ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Create button */}
        <button
          onClick={() => { onClose(); onSuccess(); }}
          className="btn-primary w-full py-3 rounded-xl text-[13px] font-semibold"
        >
          Create Banner
        </button>
      </div>
    </Modal>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="">
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-white" />
        </div>
        <p className="text-[20px] font-bold text-text-main">Success!</p>
        <p className="text-[13px] text-text-muted">Banner created successfully.</p>
      </div>
    </Modal>
  );
}

export default function BannerManagement({ onBack }: { onBack: () => void }) {
  const [banners,     setBanners]     = useState<Banner[]>(initialBanners);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <SubPageShell
      title="Banner Management"
      onBack={onBack}
      action={
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Plus size={15} /> Add Banner
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
        {banners.map((banner) => (
          <div key={banner.id} style={{ display: "flex", alignItems: "center", gap: "24px", padding: "20px 24px", borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>

            {/* Banner image */}
            <div style={{ width: 90, height: 68, borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
              {BANNER_IMAGES[banner.id] ? (
                <Image
                  src={BANNER_IMAGES[banner.id]}
                  alt={banner.title}
                  width={90}
                  height={68}
                  style={{ width: 90, height: 68, objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500, color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
                  IMG
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "3px" }}>{banner.title}</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "6px" }}>{banner.subtitle}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                  <Calendar size={11} /> {banner.dateRange}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                  <Eye size={11} /> {banner.clicks} clicks
                </span>
              </div>
            </div>

            {/* Status */}
            <span style={{
              fontSize: "12px", fontWeight: 500, padding: "4px 12px", borderRadius: "999px",
              backgroundColor: banner.status === "Active" ? "#dcfce7" : "#f3f4f6",
              color: banner.status === "Active" ? "#15803d" : "#6b7280",
            }}>
              {banner.status}
            </span>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                <Pencil size={15} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setBanners((p) => p.filter((b) => b.id !== banner.id))}
                style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#f87171" }}
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateBannerModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowSuccess(true)}
        />
      )}
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </SubPageShell>
  );
}