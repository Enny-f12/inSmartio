// lib/utils/premiumIcons.ts
import * as Icons from "lucide-react";
import React from "react";

export interface LucideIconToken {
  code: string;
  name: string;
}

export const PREMIUM_LUCIDE_ICONS: LucideIconToken[] = [
  { code: "Broom", name: "Housekeeping" },
  { code: "Wrench", name: "Appliance Repair" },
  { code: "Car", name: "Auto Repair" },
  { code: "Truck", name: "Moving Services" },
  { code: "Monitor", name: "Computers & IT" },
  { code: "Sparkles", name: "Beauty Services" },
  { code: "Camera", name: "Photo/Videographers" },
  { code: "Hammer", name: "Repair & Construction" }
];

// Helper to split "Broom|#2563eb" into { icon: "Broom", color: "#2563eb" }
export const parseIconPayload = (payload: string | null | undefined) => {
  if (!payload) return { icon: "Tag", color: "#2563eb" };
  const [icon, color] = payload.split("|");
  return {
    icon: icon || "Tag",
    color: color || "#2563eb" // Fallback color if none exists
  };
};

export const renderLucideIcon = (code: string, size = 20, color = "currentColor") => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[code] || Icons.Tag;
  return React.createElement(IconComponent, { size, color, strokeWidth: 1.8 });
};