// components/settings/BannerManagement.tsx
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, Eye, CheckCircle2, Calendar } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SubPageShell, FieldInput } from "./SettingsShared";
import { initialBanners } from "@/components/settings/types";
import type { Banner } from "@/components/settings/types";

function CreateBannerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title,      setTitle]      = useState("Hire Verified Experts");
  const [subtitle,   setSubtitle]   = useState("Work with trusted professionals reviewed by real users.");
  const [ctaText,    setCtaText]    = useState("Hire Now");
  const [ctaLink,    setCtaLink]    = useState("/insmartio");
  const [startDate,  setStartDate]  = useState("");
  const [endDate,    setEndDate]    = useState("");
  const [activate,   setActivate]   = useState(true);

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
      <div className="space-y-3">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-border bg-surface hover:bg-background transition-colors">
            {/* Placeholder image */}
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary text-[10px] font-medium">
              IMG
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-text-main">{banner.title}</p>
              <p className="text-[12px] text-text-muted truncate">{banner.subtitle}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Calendar size={11} /> {banner.dateRange}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Eye size={11} /> {banner.clicks} clicks
                </span>
              </div>
            </div>

            {/* Status */}
            <span className={`text-[12px] font-medium px-3 py-1 rounded-full ${banner.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {banner.status}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors">
                <Pencil size={15} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setBanners((p) => p.filter((b) => b.id !== banner.id))}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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