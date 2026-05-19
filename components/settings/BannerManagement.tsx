// components/settings/BannerManagement.tsx
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, Eye, CheckCircle2, Calendar } from "lucide-react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { SubPageShell, FieldInput } from "./SettingsShared";
import { initialBanners } from "@/components/settings/types";
import type { Banner } from "@/components/settings/types";

const BANNER_IMAGES: Record<string, string> = {
  "b1": "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=120&h=80&fit=crop&auto=format",
  "b2": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=80&fit=crop&auto=format",
  "b3": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=120&h=80&fit=crop&auto=format",
  "b4": "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=120&h=80&fit=crop&auto=format",
};

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "999px",
      backgroundColor: active ? "#dcfce7" : "#f3f4f6",
      color: active ? "#15803d" : "#6b7280",
      border: active ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {status}
    </span>
  );
}

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
      <style>{`
        .cbm-grid2 { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 480px) { .cbm-grid2 { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "-8px" }}>
          Design a new banner for the app carousel
        </p>

        {/* Image upload */}
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "10px" }}>Banner Image</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "28px 16px", borderRadius: "12px", border: "2px dashed var(--color-border)", backgroundColor: "var(--color-background)", cursor: "pointer" }}>
            <Upload size={20} style={{ color: "var(--color-text-muted)" }} />
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Click or drag to upload image</p>
          </div>
        </div>

        {/* Content fields */}
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)" }}>Banner Content</p>
          <div className="cbm-grid2">
            <FieldInput label="Title" placeholder="Hire Verified Experts" value={title} onChange={(e) => setTitle(e.target.value)} />
            <FieldInput label="Subtitle" placeholder="Work with trusted professionals..." value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div className="cbm-grid2">
            <FieldInput label="CTA Button Text" placeholder="Hire Now" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            <FieldInput label="CTA Link" placeholder="/insmartio" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
          </div>
        </div>

        {/* Dates */}
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)" }}>Schedule</p>
          <div className="cbm-grid2">
            <FieldInput label="Start Date" type="date" placeholder="mm/dd/yyyy" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <FieldInput label="End Date"   type="date" placeholder="mm/dd/yyyy" value={endDate}   onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Activate toggle */}
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "2px" }}>Activate Banner</p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Make this banner visible immediately</p>
          </div>
          <button
            onClick={() => setActivate((v) => !v)}
            style={{ position: "relative", width: "44px", height: "24px", borderRadius: "999px", border: "none", cursor: "pointer", backgroundColor: activate ? "#22c55e" : "#d1d5db", flexShrink: 0, transition: "background-color 0.2s" }}
          >
            <span style={{ position: "absolute", top: "2px", left: activate ? "22px" : "2px", width: "20px", height: "20px", backgroundColor: "#ffffff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
          </button>
        </div>

        {/* Create button */}
        <button
          onClick={() => { onClose(); onSuccess(); }}
          className="btn-primary"
          style={{ width: "100%", padding: "12px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", gap: "16px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle2 size={28} color="#fff" />
        </div>
        <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-main)" }}>Success!</p>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Banner created successfully.</p>
        <button onClick={onClose} className="btn-primary" style={{ padding: "10px 32px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", marginTop: "8px" }}>
          Done
        </button>
      </div>
    </Modal>
  );
}

export default function BannerManagement({ onBack }: { onBack: () => void }) {
  const [banners,     setBanners]     = useState<Banner[]>(initialBanners);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <>
      <style>{`
        .banner-card        { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: 16px; border: 1px solid var(--color-border); background: #ffffff; }
        .banner-card-top    { display: flex; align-items: flex-start; gap: 14px; }
        .banner-card-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--color-border); }
        .banner-meta        { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

        @media (min-width: 560px) {
          .banner-card        { flex-direction: row; align-items: center; gap: 20px; padding: 20px 24px; }
          .banner-card-top    { flex: 1; min-width: 0; }
          .banner-card-bottom { display: none; }
          .banner-actions-inline { display: flex !important; }
        }
      `}</style>

      <SubPageShell
        title="Banner Management"
        onBack={onBack}
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            <Plus size={15} /> Add Banner
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          {banners.map((banner) => (
            <div key={banner.id} className="banner-card">

              {/* Image + content */}
              <div className="banner-card-top">
                {/* Thumbnail */}
                <div style={{ width: 72, height: 56, borderRadius: "10px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                  {BANNER_IMAGES[banner.id] ? (
                    <Image src={BANNER_IMAGES[banner.id]} alt={banner.title} width={72} height={56} style={{ width: 72, height: 56, objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500, color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
                      IMG
                    </div>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{banner.title}</p>
                    <StatusBadge status={banner.status} />
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "6px" }}>{banner.subtitle}</p>
                  <div className="banner-meta">
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                      <Calendar size={11} /> {banner.dateRange}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                      <Eye size={11} /> {banner.clicks} clicks
                    </span>
                  </div>
                </div>

                {/* Desktop-only action buttons (inline) */}
                <div className="banner-actions-inline" style={{ display: "none", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button style={{ padding: "6px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                    <Pencil size={15} strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={() => setBanners((p) => p.filter((b) => b.id !== banner.id))}
                    style={{ padding: "6px", borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", color: "#f87171" }}
                  >
                    <Trash2 size={15} strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              {/* Mobile-only action row */}
              <div className="banner-card-bottom">
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Manage banner</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                    <Pencil size={13} strokeWidth={1.8} /> Edit
                  </button>
                  <button
                    onClick={() => setBanners((p) => p.filter((b) => b.id !== banner.id))}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", color: "#f87171" }}
                  >
                    <Trash2 size={13} strokeWidth={1.8} /> Delete
                  </button>
                </div>
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
    </>
  );
}