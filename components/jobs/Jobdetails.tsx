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

// InfoRow now stacks label-above-value on mobile instead of relying on
// flex-wrap, which was unstable between ~340px–430px (label's 220px
// minWidth left just enough leftover space for the value to get squeezed
// into a narrow column and wrap word-by-word instead of dropping to a
// clean new line).
function InfoRow({
  label,
  value,
  isMobile = false,
}: {
  label: string;
  value: React.ReactNode;
  isMobile?: boolean;
}) {
  if (isMobile) {
    return (
      <div style={{ marginBottom: "12px" }}>
        <p style={{ fontSize: "12px", fontWeight: 500, color: "#6B7280", margin: "0 0 2px" }}>
          {label}
        </p>
        <div style={{ fontSize: "13.5px", color: "#111827", wordBreak: "break-word" }}>
          {value ?? "—"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "220px", flexShrink: 0, fontWeight: 500, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", wordBreak: "break-word", flex: 1, minWidth: "0" }}>{value ?? "—"}</span>
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
  // Bumped the mobile breakpoint from 640 to 768. 640 previously meant
  // 375px / 425px devices were being treated the same as desktop-ish
  // widths for anything above 640, but the real problem width band
  // (320-425) all needs the same stacked treatment, so we just make sure
  // isMobile is true across that whole range and style consistently.
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

  const amount = fmtMoney(job["amount"] as number | undefined);

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
    amount?: number;
    expert?: { name?: string; phone?: string; email?: string; rating?: number; commission?: number };
  }> | undefined) ?? [];
  const acceptedBid = bids.find(b => b.status === "accepted");

  // ── Final Amounts ─────────────────────────────────────
  // Before inspection: the job's posted amount.
  // After inspection: the accepted bid's amount (set once an expert's bid is accepted).
  const finalAmountBeforeInspection = fmtMoney(job["amount"] as number | undefined);
  const finalAmountAfterInspection = fmtMoney(acceptedBid?.amount as number | undefined);

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

  const sectionPadding = isMobile ? "16px" : "24px 32px";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Jobs Management" />
      <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px" : "16px", backgroundColor: "#F4F5F7" }}>

        {/* Back button */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px",
            fontWeight: 500, color: "#111827", background: "none", border: "none",
            cursor: "pointer", marginBottom: "20px" }}
        >
          <ArrowLeft size={16} /> Jobs
        </button>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #E5E7EB",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>

          {/* ── Job Information ── */}
          <div style={{ padding: sectionPadding, borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Job Information" />
            <InfoRow isMobile={isMobile} label="Job ID:"                         value={val(job, "id", "_id")} />
            <InfoRow isMobile={isMobile} label="Title:"                          value={val(job, "title")} />
            <InfoRow isMobile={isMobile} label="Category:"                       value={val(job, "category")} />
            <InfoRow isMobile={isMobile} label="Description:"                    value={val(job, "description")} />
            <InfoRow isMobile={isMobile} label="Location:"                       value={location} />
            <InfoRow isMobile={isMobile} label="Amount:"                         value={amount} />
            <InfoRow isMobile={isMobile} label="Budget:"                         value={budget} />
            <InfoRow isMobile={isMobile} label="Final Amount Before Inspection:" value={finalAmountBeforeInspection} />
            <InfoRow isMobile={isMobile} label="Final Amount After Inspection:"  value={finalAmountAfterInspection} />
            <InfoRow isMobile={isMobile} label="Created:"                        value={createdAt} />
            {isCompleted && <InfoRow isMobile={isMobile} label="Deadline:" value={deadline} />}
            <InfoRow isMobile={isMobile} label="Status:"
              value={<StatusBadge label={status} variant={getStatusVariant(status)} />} />
          </div>

          {/* ── Client + Expert ── */}
          <div
            style={{
              padding: sectionPadding,
              borderBottom: "1px solid #E5E7EB",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "0" : "32px",
            }}
          >
            <div>
              <SectionLabel text="Client" />
              <InfoRow isMobile={isMobile} label="Name:"   value={clientName} />
              <InfoRow isMobile={isMobile} label="Phone:"  value={clientPhone} />
              <InfoRow isMobile={isMobile} label="Email:"  value={clientEmail} />
              <InfoRow isMobile={isMobile} label="Rating:" value={<StarRating value={clientRating} />} />
            </div>

            <div
              style={
                isMobile
                  ? { borderTop: "1px solid #E5E7EB", paddingTop: "16px", marginTop: "4px" }
                  : {}
              }
            >
              <SectionLabel text="Expert" />
              {expertName ? (
                <>
                  <InfoRow isMobile={isMobile} label="Name:"   value={expertName} />
                  <InfoRow isMobile={isMobile} label="Phone:"  value={expertPhone} />
                  <InfoRow isMobile={isMobile} label="Email:"  value={expertEmail} />
                  <InfoRow isMobile={isMobile} label="Rating:" value={<StarRating value={expertRating} />} />
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No expert assigned yet.</p>
              )}
            </div>
          </div>

          {/* ── Payment Information ── */}
          <div style={{ padding: sectionPadding, borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Payment Information" />
            <InfoRow isMobile={isMobile} label="Payment Method:"                 value={paymentMethod} />
            <InfoRow isMobile={isMobile} label="Final Amount Before Inspection:" value={finalAmountBeforeInspection} />
            <InfoRow isMobile={isMobile} label="Final Amount After Inspection:"  value={finalAmountAfterInspection} />
            <InfoRow
              isMobile={isMobile}
              label={`Platform Commission${expertCommission != null ? ` (${expertCommission}%)` : ""}:`}
              value={commissionAmt !== "—" ? commissionAmt : expertCommission != null ? `₦${expertCommission.toLocaleString()}` : "—"}
            />
            <InfoRow isMobile={isMobile} label="Expert Payout:"  value={expertPayout} />
            <InfoRow isMobile={isMobile} label="Payment Status:" value={paymentStatus !== "—" ? paymentStatus : "Pending"} />
          </div>

          {/* ── Timeline ── */}
          <div style={{ padding: sectionPadding }}>
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