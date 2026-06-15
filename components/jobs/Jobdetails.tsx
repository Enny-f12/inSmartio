// components/jobs/JobDetailView.tsx
"use client";

import React, { useState } from "react";
import { ArrowLeft, Star, ChevronDown, ChevronUp } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/Badge";
import type { ApiJob } from "@/lib/api/jobApi";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type StatusVariant = "green" | "yellow" | "purple" | "red" | "gray";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const getStatusVariant = (status: string): StatusVariant => {
  const map: Record<string, StatusVariant> = {
    completed:   "green",
    inprogress:  "yellow",
    in_progress: "yellow",
    active:      "yellow",
    biding:      "purple",
    bidding:     "purple",
    open:        "purple",
    disputed:    "red",
    cancelled:   "gray",
    closed:      "gray",
  };
  return map[status?.toLowerCase()] ?? "gray";
};

const val = (job: ApiJob, ...keys: string[]): string => {
  for (const key of keys) {
    const v = job[key];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "—";
};

const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB"); }
  catch { return String(iso); }
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch { return String(iso); }
};

const fmtMoney = (amount?: number | null, fallback = "—") =>
  amount != null ? `₦${amount.toLocaleString()}` : fallback;

export const deriveStatus = (job: ApiJob): string => {
  const explicit = val(job, "status");
  if (explicit !== "—") return explicit;
  const closed   = job["closed"]   as boolean | undefined;
  const verified = job["verified"] as boolean | undefined;
  return closed ? "closed" : verified ? "active" : "biding";
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.08em", color: "#6B7280", margin: "0 0 16px" }}>
      {text}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "220px", flexShrink: 0, fontWeight: 500, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", wordBreak: "break-word", flex: 1 }}>{value ?? "—"}</span>
    </div>
  );
}

function StarRating({ value }: { value?: number | null }) {
  if (value == null) return <span style={{ color: "#9CA3AF", fontSize: "13px" }}>—</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#111827" }}>
      <Star size={13} fill="#F9A826" color="#F9A826" style={{ flexShrink: 0 }} />
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
interface Props {
  job: ApiJob;
  onBack: () => void;
}

export default function JobDetailView({ job, onBack }: Props) {
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Location ──────────────────────────────────────────
  const locationObj = job["location"] as { city?: string; state?: string; address?: string } | undefined;
  const location = locationObj
    ? [locationObj.address, locationObj.city, locationObj.state].filter(Boolean).join(", ")
    : val(job, "location");

  // ── Budget / Financial ────────────────────────────────
  const budgetObj = job["budget"] as { amount?: number; min?: number; max?: number } | undefined;
  const budget = budgetObj
    ? budgetObj.min != null && budgetObj.max != null
      ? `₦${budgetObj.min.toLocaleString()} – ₦${budgetObj.max.toLocaleString()}`
      : fmtMoney(budgetObj.amount)
    : "—";

  const finalAmountBeforeInspection = fmtMoney(
    job["finalAmountBeforeInspection"] as number | undefined,
    fmtMoney(job["finalAmount"] as number | undefined),
  );
  const finalAmountAfterInspection = fmtMoney(
    job["finalAmountAfterInspection"] as number | undefined,
  );

  const commissionAmt = fmtMoney(job["commissionAmount"] as number | undefined);
  const expertPayout  = fmtMoney(job["expertPayout"]    as number | undefined);
  const paymentStatus = val(job, "paymentStatus");
  const paymentMethod = job["paymentMethod"] === "any" ? "Any" : val(job, "paymentMethod");

  // ── Client ────────────────────────────────────────────
  const clientObj   = job["client"] as { name?: string; phone?: string; email?: string; rating?: number } | undefined;
  const clientName  = clientObj?.name  ?? val(job, "postedBy");
  const clientPhone = clientObj?.phone ?? "—";
  const clientEmail = clientObj?.email ?? "—";
  const clientRating = clientObj?.rating ?? null;

  // ── Expert ────────────────────────────────────────────
  const bids = (job["bids"] as Array<{
    status: string;
    expert?: { name?: string; phone?: string; email?: string; rating?: number; commission?: number };
  }> | undefined) ?? [];
  const acceptedBid = bids.find(b => b.status === "accepted");

  const expertObj    = job["expert"] as { name?: string; phone?: string; email?: string; rating?: number; commission?: number } | undefined;
  const expertName   = expertObj?.name   ?? acceptedBid?.expert?.name   ?? null;
  const expertPhone  = expertObj?.phone  ?? acceptedBid?.expert?.phone  ?? "—";
  const expertEmail  = expertObj?.email  ?? acceptedBid?.expert?.email  ?? "—";
  const expertRating = expertObj?.rating ?? acceptedBid?.expert?.rating ?? null;
  const expertCommission = (expertObj?.commission ?? acceptedBid?.expert?.commission ?? null) as number | null;

  // ── Status ────────────────────────────────────────────
  const status      = deriveStatus(job);
  const isCompleted = status.toLowerCase() === "completed";

  // ── Dates ─────────────────────────────────────────────
  const createdAt = fmt(job["createdAt"] as string);
  const deadline  = fmt(job["deadline"]  as string);

  // ── Timeline ──────────────────────────────────────────
  const allTimeline = (job["timeline"] as { datetime: string; label: string }[] | undefined) ?? [];
  const seen = new Set<string>();
  const uniqueTimeline = allTimeline.filter(t => {
    const key = `${t.label}||${t.datetime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const TIMELINE_LIMIT = 10;
  const visibleTimeline = timelineExpanded ? uniqueTimeline : uniqueTimeline.slice(0, TIMELINE_LIMIT);
  const hasMoreTimeline = uniqueTimeline.length > TIMELINE_LIMIT;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Jobs Management" />
      <main style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "#F4F5F7" }}>

        {/* Back button */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px",
            fontWeight: 500, color: "#111827", background: "none", border: "none",
            cursor: "pointer", marginBottom: "24px" }}
        >
          <ArrowLeft size={16} /> Jobs
        </button>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #E5E7EB",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>

          {/* ── Job Information ── */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Job Information" />
            <InfoRow label="Job ID:"                         value={val(job, "id", "_id")} />
            <InfoRow label="Title:"                          value={val(job, "title")} />
            <InfoRow label="Category:"                       value={val(job, "category")} />
            <InfoRow label="Description:"                    value={val(job, "description")} />
            <InfoRow label="Location:"                       value={location} />
            <InfoRow label="Budget:"                         value={budget} />
            <InfoRow label="Final Amount Before Inspection:" value={finalAmountBeforeInspection} />
            <InfoRow label="Final Amount After Inspection:"  value={finalAmountAfterInspection} />
            <InfoRow label="Created:"                        value={createdAt} />
            {isCompleted && <InfoRow label="Deadline:" value={deadline} />}
            <InfoRow label="Status:"
              value={<StatusBadge label={status} variant={getStatusVariant(status)} />} />
          </div>

          {/* ── Client + Expert ── */}
          <div
            style={{
              padding: isMobile ? "20px 16px" : "24px 32px",
              borderBottom: "1px solid #E5E7EB",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "0" : "32px",
            }}
          >
            <div>
              <SectionLabel text="Client" />
              <InfoRow label="Name:"   value={clientName} />
              <InfoRow label="Phone:"  value={clientPhone} />
              <InfoRow label="Email:"  value={clientEmail} />
              <InfoRow label="Rating:" value={<StarRating value={clientRating} />} />
            </div>

            <div
              style={
                isMobile
                  ? { borderTop: "1px solid #E5E7EB", paddingTop: "20px", marginTop: "20px" }
                  : {}
              }
            >
              <SectionLabel text="Expert" />
              {expertName ? (
                <>
                  <InfoRow label="Name:"   value={expertName} />
                  <InfoRow label="Phone:"  value={expertPhone} />
                  <InfoRow label="Email:"  value={expertEmail} />
                  <InfoRow label="Rating:" value={<StarRating value={expertRating} />} />
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No expert assigned yet.</p>
              )}
            </div>
          </div>

          {/* ── Payment Information ── */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Payment Information" />
            <InfoRow label="Payment Method:"                 value={paymentMethod} />
            <InfoRow label="Final Amount Before Inspection:" value={finalAmountBeforeInspection} />
            <InfoRow label="Final Amount After Inspection:"  value={finalAmountAfterInspection} />
            <InfoRow
              label={`Platform Commission${expertCommission != null ? ` (${expertCommission}%)` : ""}:`}
              value={commissionAmt !== "—" ? commissionAmt : expertCommission != null ? `₦${expertCommission.toLocaleString()}` : "—"}
            />
            <InfoRow label="Expert Payout:"  value={expertPayout} />
            <InfoRow label="Payment Status:" value={paymentStatus !== "—" ? paymentStatus : "Pending"} />
          </div>

          {/* ── Timeline ── */}
          <div style={{ padding: "24px 32px" }}>
            <SectionLabel text="Timeline" />
            {uniqueTimeline.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No timeline events available.</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {visibleTimeline.map((event, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%",
                        backgroundColor: "#2563EB", flexShrink: 0, marginTop: "4px" }} />
                      <p style={{ fontSize: "13px", margin: 0 }}>
                        <span style={{ fontWeight: 500, color: "#111827" }}>
                          {fmtDateTime(event.datetime)}
                        </span>
                        <span style={{ color: "#6B7280" }}> — {event.label}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {hasMoreTimeline && (
                  <button
                    onClick={() => setTimelineExpanded(!timelineExpanded)}
                    style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px",
                      fontSize: "12.5px", fontWeight: 600, color: "#2563EB", background: "none",
                      border: "none", cursor: "pointer", padding: "6px 0" }}
                  >
                    {timelineExpanded ? (
                      <><ChevronUp size={14} /> Show less</>
                    ) : (
                      <><ChevronDown size={14} /> View {uniqueTimeline.length - TIMELINE_LIMIT} more events</>
                    )}
                  </button>
                )}
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}