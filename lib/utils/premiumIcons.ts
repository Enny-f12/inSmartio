// lib/utils/premiumIcons.ts
import * as Icons from "lucide-react";
import React from "react";

export interface LucideIconToken {
  code: string;
  name: string; // kept for accessibility/title only, not shown in UI
}

export const PREMIUM_LUCIDE_ICONS: LucideIconToken[] = [
  // ── Existing categories ───────────────────────────────
  { code: "Broom",         name: "Housekeeping" },
  { code: "Wrench",        name: "Appliance Repair" },
  { code: "Car",           name: "Auto Repair" },
  { code: "Truck",         name: "Moving Services" },
  { code: "Monitor",       name: "Computers & IT" },
  { code: "Sparkles",      name: "Beauty Services" },
  { code: "Camera",        name: "Photo/Videographers" },
  { code: "Hammer",        name: "Repair & Construction" },
  // ── New categories from Figma ─────────────────────────
  { code: "Palette",       name: "Creativity" },
  { code: "CalendarDays",  name: "Events" },
  { code: "PenTool",       name: "Designers" },
  { code: "Scale",         name: "Legal Services" },
  { code: "Briefcase",     name: "Business Services" },
  { code: "Home",          name: "Rentals" },
  { code: "GraduationCap", name: "Tutors & Training" },
  // ── Extra general-purpose icons ───────────────────────
  { code: "Zap",           name: "Electrical" },
  { code: "Scissors",      name: "Hair & Beauty" },
  { code: "UtensilsCrossed", name: "Catering" },
  { code: "HeartPulse",    name: "Health & Wellness" },
  { code: "ShieldCheck",   name: "Security" },
  { code: "Leaf",          name: "Gardening" },
  { code: "Baby",          name: "Childcare" },
  { code: "PawPrint",      name: "Pet Services" },
  { code: "Music",         name: "Entertainment" },
  { code: "Shirt",         name: "Fashion & Tailoring" },
  { code: "Package",       name: "Logistics" },
  { code: "Wifi",          name: "Tech Support" },
  { code: "Paintbrush",    name: "Painting" },
  { code: "Sofa",          name: "Interior Design" },
  { code: "Building2",     name: "Real Estate" },
  { code: "ChefHat",       name: "Cooking" },
];

// ── Parse "Broom|#2563eb" → { icon, color } ──────────────
export const parseIconPayload = (payload: string | null | undefined): { icon: string; color: string } => {
  if (!payload) return { icon: "Tag", color: "#2563eb" };
  const [icon, color] = payload.split("|");
  return {
    icon:  icon  || "Tag",
    color: color || "#2563eb",
  };
};

// ── Render a lucide icon by code string ───────────────────
export const renderLucideIcon = (code: string, size = 20, color = "currentColor") => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[code] || Icons.Tag;
  return React.createElement(IconComponent, { size, color, strokeWidth: 1.8 });
};