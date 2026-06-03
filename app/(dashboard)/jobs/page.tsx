/* eslint-disable @typescript-eslint/no-unused-expressions */
// app/(dashboard)/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Download, Eye, SlidersHorizontal, Loader2, ArrowLeft, Star,
  UserPlus, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/Badge";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchJobs, fetchJobById, clearSelectedJob } from "@/lib/redux/jobSlice";
import { downloadReport } from "@/lib/api/reportApi";
import { toast } from "sonner";
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

const deriveStatus = (job: ApiJob): string => {
  const explicit = val(job, "status");
  if (explicit !== "—") return explicit;
  const closed   = job["closed"]   as boolean | undefined;
  const verified = job["verified"] as boolean | undefined;
  return closed ? "closed" : verified ? "active" : "biding";
};

const STATUS_OPTIONS   = ["All", "completed", "inprogress", "biding", "disputed", "cancelled"] as const;
const MONTH_OPTIONS    = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTH_MAP: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

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

const fmtMoney = (amount?: number | null, fallback = "—") =>
  amount != null ? `₦${amount.toLocaleString()}` : fallback;

// ─────────────────────────────────────────────────────────
// Small shared components
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
      <span style={{ minWidth: "160px", flexShrink: 0, fontWeight: 500, color: "#6B7280" }}>{label}</span>
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
// Job Detail View
// ─────────────────────────────────────────────────────────
function JobDetailView({ job, onBack }: { job: ApiJob; onBack: () => void }) {
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  // ── Location ──────────────────────────────────────────
  const locationObj = job["location"] as { city?: string; state?: string; address?: string } | undefined;
  const location = locationObj
    ? [locationObj.address, locationObj.city, locationObj.state].filter(Boolean).join(", ")
    : val(job, "location");

  // ── Budget / Financial ────────────────────────────────
  const budgetObj  = job["budget"] as { amount?: number; min?: number; max?: number } | undefined;
  // Display budget as range if min/max exist, else single amount
  const budget = budgetObj
    ? budgetObj.min != null && budgetObj.max != null
      ? `₦${budgetObj.min.toLocaleString()} – ₦${budgetObj.max.toLocaleString()}`
      : fmtMoney(budgetObj.amount)
    : "—";

  // finalAmount comes from the accepted bid amount
  const finalAmount = fmtMoney(job["finalAmount"] as number | undefined);

  const commissionPct   = (job["commissionPercent"] as number | undefined) ?? null;
  const commissionAmt   = fmtMoney(job["commissionAmount"] as number | undefined);
  const expertPayout    = fmtMoney(job["expertPayout"]    as number | undefined);
  const paymentStatus   = val(job, "paymentStatus");
  const paymentMethod   = job["paymentMethod"] === "any" ? "Any" : val(job, "paymentMethod");

  // ── Client — comes from /jobs list response ───────────
  const clientObj   = job["client"] as { name?: string; phone?: string; email?: string; rating?: number } | undefined;
  const clientName  = clientObj?.name  ?? val(job, "postedBy");
  const clientPhone = clientObj?.phone ?? "—";
  const clientEmail = clientObj?.email ?? "—";
  const clientRating = clientObj?.rating ?? null;

  // ── Expert — comes from /jobs list response ───────────
  const expertObj   = job["expert"] as { name?: string; phone?: string; email?: string; rating?: number } | undefined;
  const expertName  = expertObj?.name  ?? null;
  const expertPhone = expertObj?.phone ?? "—";
  const expertEmail = expertObj?.email ?? "—";
  const expertRating = expertObj?.rating ?? null;

  // ── Status ────────────────────────────────────────────
  const status = deriveStatus(job);
  const isCompleted = status.toLowerCase() === "completed";

  // ── Dates ─────────────────────────────────────────────
  const createdAt = fmt(job["createdAt"] as string);
  const deadline  = fmt(job["deadline"]  as string);

  // ── Timeline ──────────────────────────────────────────
  const allTimeline = (job["timeline"] as { datetime: string; label: string }[] | undefined) ?? [];
  // Deduplicate: keep only unique labels (take first occurrence)
  const seen = new Set<string>();
  const uniqueTimeline = allTimeline.filter(t => {
    const key = `${t.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const TIMELINE_LIMIT = 10;
  const visibleTimeline = timelineExpanded ? uniqueTimeline : uniqueTimeline.slice(0, TIMELINE_LIMIT);
  const hasMoreTimeline = uniqueTimeline.length > TIMELINE_LIMIT;

  // ── Reviews ───────────────────────────────────────────
  const reviews = (job["reviews"] as { reviewerName?: string; reviewer?: string; rating: number; comment?: string; createdAt?: string }[] | undefined) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Jobs Management" />
      <main style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "#F4F5F7" }}>
        <style>{`@media(min-width:640px){ .jd-main{ padding: 24px 32px !important; } }`}</style>

        {/* Back button */}
        <button onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px",
            fontWeight: 500, color: "#111827", background: "none", border: "none",
            cursor: "pointer", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Jobs
        </button>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #E5E7EB",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>

          {/* ── Job Information ── */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Job Information" />
            <InfoRow label="Job ID:"         value={val(job, "id", "_id")} />
            <InfoRow label="Title:"          value={val(job, "title")} />
            <InfoRow label="Category:"       value={val(job, "category")} />
            <InfoRow label="Description:"    value={val(job, "description")} />
            <InfoRow label="Location:"       value={location} />
            <InfoRow label="Budget:"         value={budget} />
            <InfoRow label="Final Amount:"   value={finalAmount} />
            <InfoRow label="Created:"        value={createdAt} />
            {isCompleted && (
              <InfoRow label="Deadline:"     value={deadline} />
            )}
            <InfoRow label="Status:"
              value={<StatusBadge label={status} variant={getStatusVariant(status)} />} />
          </div>

          {/* ── Client + Expert ── */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #E5E7EB",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <SectionLabel text="Client" />
              <InfoRow label="Name:"   value={clientName} />
              <InfoRow label="Phone:"  value={clientPhone} />
              <InfoRow label="Email:"  value={clientEmail} />
              <InfoRow label="Rating:" value={<StarRating value={clientRating} />} />
            </div>
            <div>
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
            <InfoRow label="Payment Method:" value={paymentMethod} />
            <InfoRow label="Final Amount:"   value={finalAmount} />
            <InfoRow label={`Platform Commission${commissionPct != null ? ` (${commissionPct}%)` : ""}:`}
              value={commissionAmt} />
            <InfoRow label="Expert Payout:"  value={expertPayout} />
            <InfoRow label="Payment Status:" value={paymentStatus !== "—" ? paymentStatus : "Pending"} />
          </div>

          {/* ── Timeline ── */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #E5E7EB" }}>
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
                          {fmt(event.datetime)}
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
                      border: "none", cursor: "pointer", padding: "6px 0" }}>
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

          {/* ── Reviews ── */}
          <div style={{ padding: "24px 32px" }}>
            <SectionLabel text="Reviews" />
            {reviews.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No reviews found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reviews.map((review, i) => (
                  <div key={i} style={{ padding: "14px 16px", borderRadius: "10px",
                    border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                        {review.reviewerName ?? review.reviewer ?? "Anonymous"}
                      </span>
                      <StarRating value={review.rating} />
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Assign to Expert Modal (simple)
// ─────────────────────────────────────────────────────────
function AssignModal({ count, onClose, onConfirm }: {
  count: number; onClose: () => void; onConfirm: (expertId: string) => void;
}) {
  const [expertId, setExpertId] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "28px 32px",
        width: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
          Assign to Expert
        </p>
        <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>
          Assign {count} selected job{count > 1 ? "s" : ""} to an expert.
        </p>
        <input
          type="text"
          placeholder="Enter Expert ID"
          value={expertId}
          onChange={e => setExpertId(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "10px",
            border: "1px solid #E5E7EB", fontSize: "13px", outline: "none",
            boxSizing: "border-box", marginBottom: "20px" }}
        />
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #E5E7EB",
              fontSize: "13px", fontWeight: 500, color: "#6B7280", background: "none", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(expertId)} disabled={!expertId.trim()}
            style={{ padding: "9px 18px", borderRadius: "10px", border: "none",
              fontSize: "13px", fontWeight: 600, backgroundColor: "#2563EB", color: "#fff",
              cursor: expertId.trim() ? "pointer" : "not-allowed", opacity: expertId.trim() ? 1 : 0.5 }}>
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main List Page
// ─────────────────────────────────────────────────────────
export default function JobsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus } =
    useAppSelector((s) => s.jobs);

  const [categoryFilter, setCategoryFilter] = useState("All Jobs");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [monthFilter,    setMonthFilter]    = useState("All");
  const [search,         setSearch]         = useState("");
  const [downloading,    setDownloading]    = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);

  const categoryOptions = [
    "All Jobs",
    ...Array.from(new Set(list.map((j: ApiJob) => val(j, "category")).filter((c) => c !== "—"))),
  ];

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchJobs());
  }, [dispatch, listStatus]);

  // ── Filtering ─────────────────────────────────────────
  const filtered = list.filter((j: ApiJob) => {
    const status   = deriveStatus(j);
    const category = val(j, "category");
    const title    = val(j, "title", "description").toLowerCase();

    const matchCategory = categoryFilter === "All Jobs" || category === categoryFilter;
    const matchStatus   = statusFilter   === "All"      || status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch   = !search || title.includes(search.toLowerCase());

    let matchMonth = true;
    if (monthFilter !== "All") {
      const created = j["createdAt"] as string | undefined;
      if (created) {
        matchMonth = new Date(created).getMonth() === MONTH_MAP[monthFilter];
      } else {
        matchMonth = false;
      }
    }
    return matchCategory && matchStatus && matchSearch && matchMonth;
  });

  // ── Selection helpers ─────────────────────────────────
  const filteredIds = filtered.map((j: ApiJob) => String(j.id));
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
  const someSelected = filteredIds.some(id => selectedIds.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const next = new Set(prev); filteredIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelectedIds(prev => new Set([...prev, ...filteredIds]));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedCount = [...selectedIds].filter(id => filteredIds.includes(id)).length;

  // ── Bulk actions ──────────────────────────────────────
  const handleCancelSelected = () => {
    // TODO: wire to API
    toast.success(`${selectedCount} job${selectedCount > 1 ? "s" : ""} cancelled`);
    setSelectedIds(new Set());
  };

  const handleExportSelected = async () => {
    setDownloading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const url   = await downloadReport({ reportType: "jobs", type: "pdf", fromDate: "2024-01-01", toDate: today });
      const a     = document.createElement("a");
      a.href      = url;
      a.download  = `jobs_export_${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedCount} job${selectedCount > 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to export");
    } finally {
      setDownloading(false);
    }
  };

  const handleAssignConfirm = (expertId: string) => {
    // TODO: wire to API
    toast.success(`${selectedCount} job${selectedCount > 1 ? "s" : ""} assigned to ${expertId}`);
    setShowAssignModal(false);
    setSelectedIds(new Set());
  };

  const handleExport = async () => {
    setDownloading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const url   = await downloadReport({ reportType: "jobs", type: "pdf", fromDate: "2024-01-01", toDate: today });
      const a     = document.createElement("a");
      a.href      = url;
      a.download  = `jobs_report_${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Jobs report downloaded");
    } catch {
      toast.error("Failed to download jobs report");
    } finally {
      setDownloading(false);
    }
  };

  // ── Detail loading ────────────────────────────────────
  if (selectedStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="Jobs Management" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          flex: 1, gap: "10px", color: "#9CA3AF" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "13px" }}>Loading job...</span>
        </div>
      </div>
    );
  }

  if (selectedStatus === "succeeded" && selected) {
    // The /job/:id response has the job directly or nested
    const raw     = selected as unknown as Record<string, unknown>;
    const rawJob  = (raw.id ? raw : (raw.data ?? raw)) as ApiJob;

    // Find matching job from list to get client/expert data
    const listJob = list.find((j: ApiJob) => String(j.id) === String(rawJob.id));

    // Merge: list job has client/expert objects, detail job has more timeline/bid data
    const enrichedJob: ApiJob = {
      ...(listJob ?? {}),
      ...rawJob,
      // Prefer list-level client/expert since they have name/email/phone
      client: (listJob?.["client"] ?? rawJob["client"]) as ApiJob[string],
      expert: (listJob?.["expert"] ?? rawJob["expert"]) as ApiJob[string],
      // Use finalAmount from list job if present
      finalAmount: (listJob?.["finalAmount"] ?? rawJob["finalAmount"]) as ApiJob[string],
    } as ApiJob;

    return <JobDetailView job={enrichedJob} onBack={() => dispatch(clearSelectedJob())} />;
  }

  // ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1" style={{ backgroundColor: "#F4F5F7" }}>
      <Topbar title="Jobs Management" />

      {showAssignModal && (
        <AssignModal
          count={selectedCount}
          onClose={() => setShowAssignModal(false)}
          onConfirm={handleAssignConfirm}
        />
      )}

      <style>{`
        .jobs-header { padding: 16px !important; }
        .jobs-main   { padding: 0 16px 24px !important; }
        .jobs-filter-row { flex-direction: column !important; gap: 10px !important; }
        .jobs-filter-dropdowns { display: flex; gap: 10px; flex-wrap: wrap; }
        .jobs-table  { display: none !important; }
        .jobs-cards  { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .jobs-pagination { flex-direction: column !important; gap: 8px !important; align-items: flex-start !important; }
        @media (min-width: 640px) {
          .jobs-header { padding: 20px 32px !important; }
          .jobs-main   { padding: 0 32px 32px !important; }
          .jobs-filter-row { flex-direction: row !important; align-items: center !important; }
          .jobs-table  { display: block !important; }
          .jobs-cards  { display: none !important; }
          .jobs-pagination { flex-direction: row !important; align-items: center !important; }
        }
        .bulk-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; font-size: 12.5px;
          font-weight: 600; cursor: pointer; border: 1px solid transparent;
          transition: opacity 0.15s;
        }
        .bulk-btn:hover { opacity: 0.85; }
        .bulk-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .row-cb { width: 16px; height: 16px; accent-color: #2563EB; cursor: pointer; }
      `}</style>

      {/* ── Sub-header ── */}
      <div className="jobs-header flex items-center justify-between" style={{ gap: "12px", flexWrap: "wrap" }}>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Jobs List</p>

        {/* Bulk Actions — always visible */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginLeft: "auto" }}>
          {selectedCount > 0 && (
            <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500, marginRight: "4px" }}>
              {selectedCount} selected
            </span>
          )}

          {/* Assign to Expert */}
          <button
            className="bulk-btn"
            onClick={() => setShowAssignModal(true)}
            disabled={selectedCount === 0}
            style={{
              backgroundColor: selectedCount > 0 ? "#2563EB" : "#E5E7EB",
              color: selectedCount > 0 ? "#fff" : "#9CA3AF",
              borderColor: selectedCount > 0 ? "#2563EB" : "#E5E7EB",
            }}>
            <UserPlus size={13} /> Assign to Expert
          </button>

          {/* Cancel Selected */}
          <button
            className="bulk-btn"
            onClick={handleCancelSelected}
            disabled={selectedCount === 0}
            style={{
              backgroundColor: selectedCount > 0 ? "#FEF2F2" : "#F9FAFB",
              color: selectedCount > 0 ? "#DC2626" : "#9CA3AF",
              borderColor: selectedCount > 0 ? "#FECACA" : "#E5E7EB",
            }}>
            <XCircle size={13} /> Cancel Selected
          </button>

          {/* Export Selected */}
          <button
            className="bulk-btn"
            onClick={selectedCount > 0 ? handleExportSelected : handleExport}
            disabled={downloading}
            style={{
              backgroundColor: "#2563EB", color: "#ffffff", borderColor: "#2563EB",
              opacity: downloading ? 0.7 : 1,
            }}>
            {downloading
              ? <><Loader2 size={13} className="animate-spin" /> Exporting...</>
              : <><Download size={13} /> {selectedCount > 0 ? "Export Selected" : "Export"}</>}
          </button>
        </div>
      </div>

      <main className="jobs-main flex-1">
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "16px",
          overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

          {/* ── Filter toolbar ── */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <SlidersHorizontal size={15} style={{ color: "#6B7280" }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Filter</span>
            </div>
            <div className="jobs-filter-row flex" style={{ gap: "12px" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <svg style={{ position: "absolute", left: "14px", top: "50%",
                  transform: "translateY(-50%)", color: "#9CA3AF" }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" placeholder="Search name..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px",
                    paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px",
                    fontSize: "13px", outline: "none", border: "1px solid #E5E7EB",
                    backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
              </div>
              <div className="jobs-filter-dropdowns" style={{ gap: "12px" }}>
                <FilterDropdown value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>Status:</span>
                  <FilterDropdown value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>Date:</span>
                  <FilterDropdown value={monthFilter} options={MONTH_OPTIONS} onChange={setMonthFilter} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Loading / Error ── */}
          {listStatus === "loading" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
              padding: "64px", gap: "10px", color: "#9CA3AF" }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: "13px" }}>Loading jobs...</span>
            </div>
          )}
          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "64px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
          )}

          {listStatus === "succeeded" && (
            <>
              {/* ── Desktop table ── */}
              <div className="jobs-table" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      {/* Select all checkbox */}
                      <th style={{ padding: "12px 16px 12px 24px", width: "40px" }}>
                        <input
                          type="checkbox"
                          className="row-cb"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={toggleAll}
                        />
                      </th>
                      {["Job ID", "Client", "Expert", "Amount", "Status", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 20px 12px 0", fontSize: "11px",
                          fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px",
                        fontSize: "14px", color: "#9CA3AF" }}>
                        {list.length === 0 ? "No jobs have been posted yet." : "No jobs match your filter."}
                      </td></tr>
                    ) : filtered.map((job: ApiJob) => {
                      const jobId  = String(job.id);
                      const finalAmountDisplay = fmtMoney(job["finalAmount"] as number | undefined);
                      const clientObj  = job["client"] as { name?: string } | undefined;
                      const expertObj  = job["expert"] as { name?: string } | undefined;
                      const clientName = clientObj?.name ?? val(job, "postedBy");
                      const expertName = expertObj?.name ?? "—";
                      const status     = deriveStatus(job);
                      const isChecked  = selectedIds.has(jobId);

                      return (
                        <tr key={jobId}
                          style={{
                            borderBottom: "1px solid #F3F4F6",
                            backgroundColor: isChecked ? "#EFF6FF" : "transparent",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={e => { if (!isChecked) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = isChecked ? "#EFF6FF" : "transparent"; }}>

                          <td style={{ padding: "14px 16px 14px 24px" }}>
                            <input
                              type="checkbox"
                              className="row-cb"
                              checked={isChecked}
                              onChange={() => toggleOne(jobId)}
                            />
                          </td>
                          <td style={{ padding: "14px 20px 14px 0", fontSize: "12px",
                            fontFamily: "monospace", color: "#6B7280" }}>
                            {jobId.slice(0, 14)}
                          </td>
                          <td style={{ padding: "14px 20px 14px 0", fontSize: "13px", color: "#111827" }}>
                            {clientName}
                          </td>
                          <td style={{ padding: "14px 20px 14px 0", fontSize: "13px", color: "#111827" }}>
                            {expertName}
                          </td>
                          <td style={{ padding: "14px 20px 14px 0", fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                            {finalAmountDisplay}
                          </td>
                          <td style={{ padding: "14px 20px 14px 0" }}>
                            <StatusBadge label={status} variant={getStatusVariant(status)} />
                          </td>
                          <td style={{ padding: "14px 20px 14px 0" }}>
                            <button onClick={() => dispatch(fetchJobById(jobId))}
                              style={{ padding: "6px", borderRadius: "8px", border: "none",
                                background: "none", cursor: "pointer", color: "#9CA3AF",
                                display: "flex", alignItems: "center" }}
                              title="View job">
                              <Eye size={17} strokeWidth={1.8} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="jobs-cards">
                {filtered.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF" }}>
                    {list.length === 0 ? "No jobs posted yet." : "No jobs match your filter."}
                  </p>
                ) : filtered.map((job: ApiJob) => {
                  const jobId      = String(job.id);
                  const clientObj  = job["client"] as { name?: string } | undefined;
                  const expertObj  = job["expert"] as { name?: string } | undefined;
                  const finalAmt   = fmtMoney(job["finalAmount"] as number | undefined);
                  const clientName = clientObj?.name ?? val(job, "postedBy");
                  const expertName = expertObj?.name ?? "—";
                  const status     = deriveStatus(job);
                  const isChecked  = selectedIds.has(jobId);

                  return (
                    <div key={jobId}
                      style={{ padding: "14px 16px", borderRadius: "12px",
                        border: `1px solid ${isChecked ? "#BFDBFE" : "#E5E7EB"}`,
                        backgroundColor: isChecked ? "#EFF6FF" : "#ffffff",
                        display: "flex", alignItems: "center", gap: "12px" }}>
                      <input type="checkbox" className="row-cb"
                        checked={isChecked} onChange={() => toggleOne(jobId)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827",
                          marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {clientName}
                          {expertName !== "—" && (
                            <span style={{ fontWeight: 400, color: "#6B7280" }}> → {expertName}</span>
                          )}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <StatusBadge label={status} variant={getStatusVariant(status)} />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{finalAmt}</span>
                        </div>
                      </div>
                      <button onClick={() => dispatch(fetchJobById(jobId))}
                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB",
                          background: "none", cursor: "pointer", color: "#9CA3AF",
                          flexShrink: 0, display: "flex", alignItems: "center" }}>
                        <Eye size={16} strokeWidth={1.8} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {listStatus === "succeeded" && (
            <div className="jobs-pagination"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
              <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                Showing 1 to {filtered.length} of {list.length} results
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px",
                  fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff",
                  color: "#6B7280", cursor: "not-allowed", opacity: 0.4 }}>Previous</button>
                <button style={{ width: "32px", height: "32px", borderRadius: "8px",
                  fontSize: "12px", fontWeight: 600, border: "none",
                  backgroundColor: "#2563EB", color: "#ffffff", cursor: "pointer" }}>1</button>
                <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px",
                  fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff",
                  color: "#6B7280", cursor: "pointer" }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}