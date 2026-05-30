// app/(dashboard)/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Download, Eye, SlidersHorizontal, Loader2, ArrowLeft, Star } from "lucide-react";
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
    bidding:     "purple",
    open:        "purple",
    disputed:    "red",
    cancelled:   "gray",
    closed:      "gray",
  };
  return map[status?.toLowerCase()] ?? "gray";
};

// Derive a display status from available boolean flags
const deriveStatus = (job: ApiJob): string => {
  const explicit = val(job, "status");
  if (explicit !== "—") return explicit;
  const closed   = job["closed"]   as boolean | undefined;
  const verified = job["verified"] as boolean | undefined;
  return closed ? "closed" : verified ? "active" : "bidding";
};

const STATUS_OPTIONS   = ["All", "completed", "inprogress", "bidding", "disputed", "cancelled"] as const;
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
// Job Detail View  (follows Image 1)
// ─────────────────────────────────────────────────────────
function JobDetailView({ job, onBack }: { job: ApiJob; onBack: () => void }) {
  // ── Location ──────────────────────────────────────────
  const locationObj = job["location"] as { city?: string; address?: string } | undefined;
  const location    = locationObj
    ? [locationObj.address, locationObj.city].filter(Boolean).join(", ")
    : val(job, "location");

  // ── Budget / Financial ────────────────────────────────
  const budgetObj  = job["budget"] as { amount?: number } | undefined;
  const budget     = fmtMoney(budgetObj?.amount);

  /* TODO-BACKEND: finalPrice not in API response — using placeholder */
  const finalPrice      = fmtMoney((job["finalPrice"] as number | undefined) ?? null, "—");
  const paymentAmount   = fmtMoney((job["paymentAmount"] as number | undefined) ?? budgetObj?.amount, "—");
  const commissionPct   = (job["commissionPercent"] as number | undefined) ?? null;
  const commissionAmt   = fmtMoney(job["commissionAmount"] as number | undefined);
  const expertPayout    = fmtMoney(job["expertPayout"]    as number | undefined);
  const paymentStatus   = val(job, "paymentStatus"); // e.g. "Paid on 16/03/2026"

  // ── Client ────────────────────────────────────────────
  /* TODO-BACKEND: postedBy is currently just an ID string ("client_1").
     Needs to be an object: { name, phone, email, rating } */
  const clientObj    = job["client"]  as { name?: string; phone?: string; email?: string; rating?: number } | undefined;
  const clientName   = clientObj?.name  ?? val(job, "postedBy");
  const clientPhone  = clientObj?.phone ?? "—";
  const clientEmail  = clientObj?.email ?? "—";
  const clientRating = clientObj?.rating ?? null;

  // ── Expert ────────────────────────────────────────────
  /* TODO-BACKEND: No expert object in response at all.
     Needs: { name, phone, email, rating } from the accepted bid's expert */
  const expertObj    = job["expert"]  as { name?: string; phone?: string; email?: string; rating?: number } | undefined;
  const expertName   = expertObj?.name  ?? null;
  const expertPhone  = expertObj?.phone ?? "—";
  const expertEmail  = expertObj?.email ?? "—";
  const expertRating = expertObj?.rating ?? null;

  // ── Status ────────────────────────────────────────────
  const status = deriveStatus(job);

  // ── Timeline ──────────────────────────────────────────
  /* TODO-BACKEND: No timeline array in response.
     Needs: [{ datetime: string, label: string }] */
  const timeline = (job["timeline"] as { datetime: string; label: string }[] | undefined) ?? [];

  // ── Reviews ───────────────────────────────────────────
  /* TODO-BACKEND: No reviews array in response.
     Needs: [{ reviewerName: string, rating: number, comment: string }] */
  const reviews = (job["reviews"] as { reviewerName: string; rating: number; comment: string }[] | undefined) ?? [];

  // ── Payment method display ────────────────────────────
  /* TODO-BACKEND: paymentMethod returns "any" — should return human-readable value
     e.g. "Payment Protected (Escrow)" */
  const paymentMethodDisplay =
    job["paymentMethod"] === "any" ? "—" : val(job, "paymentMethod");

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
            <InfoRow label="Title"           value={val(job, "title")} />
            <InfoRow label="Category"        value={val(job, "category")} />
            <InfoRow label="Location:"       value={location} />
            <InfoRow label="Budget:"         value={budget} />
            <InfoRow label="Final Price:"    value={finalPrice} />
            <InfoRow label="Created:"        value={fmt(job["createdAt"] as string)} />
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
            <InfoRow label="Payment Method:"
              value={paymentMethodDisplay} />
            <InfoRow label="Amount"
              value={paymentAmount} />
            <InfoRow label={`Platform Commission${commissionPct != null ? ` (${commissionPct}%)` : ""}:`}
              value={commissionAmt} />
            <InfoRow label="Expert Payout:"
              value={expertPayout} />
            <InfoRow label="Payment Status:"
              value={paymentStatus} />
          </div>

          {/* ── Timeline ── */}
          <div style={{ padding: "24px 32px", borderBottom: reviews.length > 0 ? "1px solid #E5E7EB" : undefined }}>
            <SectionLabel text="Timeline" />
            {timeline.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No timeline events available.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {timeline.map((event, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2563EB",
                      flexShrink: 0, marginTop: "4px" }} />
                    <p style={{ fontSize: "13px", margin: 0 }}>
                      <span style={{ fontWeight: 500, color: "#111827" }}>{event.datetime} - </span>
                      <span style={{ color: "#6B7280" }}>{event.label}</span>
                    </p>
                  </div>
                ))}
              </div>
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
                        {review.reviewerName}
                      </span>
                      <StarRating value={review.rating} />
                    </div>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>{review.comment}</p>
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
// Main List Page  (follows Image 2)
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

  // Derive unique category options from live data
  const categoryOptions = [
    "All Jobs",
    ...Array.from(new Set(list.map((j: ApiJob) => val(j, "category")).filter((c) => c !== "—"))),
  ];

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchJobs());
  }, [dispatch, listStatus]);

  // ── Export ────────────────────────────────────────────
  const handleExport = async () => {
    setDownloading(true);
    try {
      const today    = new Date().toISOString().split("T")[0];
      const url      = await downloadReport({ reportType: "jobs", type: "pdf", fromDate: "2024-01-01", toDate: today });
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = `jobs_report_${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Jobs report downloaded");
    } catch {
      toast.error("Failed to download jobs report");
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading state for detail ──────────────────────────
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
    // API returns { user: {...}, jobs: [...] } — unwrap correctly
    const raw      = selected as unknown as Record<string, unknown>;
    const rawUser  = raw.user  as Record<string, unknown> | undefined;
    const rawJobs  = raw.jobs  as Record<string, unknown>[] | undefined;

    // The actual job is the first item in jobs[], or fall back to selected itself
    const rawJob   = (rawJobs && rawJobs.length > 0 ? rawJobs[0] : selected) as ApiJob;

    // Inject client info from the user object into the job
    const enrichedJob: ApiJob = {
      ...rawJob,
      client: rawUser ? {
        name:  rawUser.name  as string,
        phone: rawUser.phone as string,
        email: rawUser.email as string,
      } : (rawJob as Record<string, unknown>).client,
    } as ApiJob;

    return <JobDetailView job={enrichedJob} onBack={() => dispatch(clearSelectedJob())} />;
  }

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
        const month = new Date(created).getMonth();
        matchMonth  = month === MONTH_MAP[monthFilter];
      } else {
        matchMonth = false;
      }
    }

    return matchCategory && matchStatus && matchSearch && matchMonth;
  });

  // ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1" style={{ backgroundColor: "#F4F5F7" }}>
      <Topbar title="Jobs Management" />

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
      `}</style>

      {/* ── Sub-header: "Jobs List" + Export button ── */}
      <div className="jobs-header flex items-center justify-between">
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Jobs List</p>
        <button
          onClick={handleExport}
          disabled={downloading}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", borderRadius: "10px", border: "none",
            backgroundColor: "#2563EB", color: "#ffffff",
            fontSize: "13px", fontWeight: 600, cursor: downloading ? "not-allowed" : "pointer",
            opacity: downloading ? 0.7 : 1,
          }}>
          {downloading
            ? <><Loader2 size={14} className="animate-spin" /> Exporting...</>
            : <><Download size={15} /> Export</>}
        </button>
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
              {/* Search */}
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
                {/* Category (All Jobs) */}
                <FilterDropdown value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />

                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>Status:</span>
                  <FilterDropdown value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
                </div>

                {/* Date / Month */}
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
                      {["Job ID", "Client", "Expert", "Amount", "Status", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px",
                          fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px",
                        fontSize: "14px", color: "#9CA3AF" }}>
                        {list.length === 0 ? "No jobs have been posted yet." : "No jobs match your filter."}
                      </td></tr>
                    ) : filtered.map((job: ApiJob) => {
                      const budgetObj = job["budget"] as { amount?: number } | undefined;

                      /* TODO-BACKEND: "Amount" in the list should be the final/agreed amount,
                         not the budget estimate. Fallback to budget for now. */
                      const amountDisplay = fmtMoney(
                        (job["finalPrice"] as number | undefined) ??
                        (job["paymentAmount"] as number | undefined) ??
                        budgetObj?.amount
                      );

                      /* TODO-BACKEND: "Client" should be a name. Currently postedBy = "client_1" */
                      const clientObj  = job["client"] as { name?: string } | undefined;
                      const clientName = clientObj?.name ?? val(job, "postedBy");

                      /* TODO-BACKEND: "Expert" not in response — should come from accepted bid or job object */
                      const expertObj  = job["expert"] as { name?: string } | undefined;
                      const expertName = expertObj?.name ?? "—";

                      const status = deriveStatus(job);

                      return (
                        <tr key={String(job.id)}
                          style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>

                          <td style={{ padding: "16px 24px", fontSize: "12px", fontFamily: "monospace",
                            color: "#6B7280" }}>
                            {String(job.id).slice(0, 12)}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "#111827" }}>
                            {clientName}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "#111827" }}>
                            {expertName}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                            {amountDisplay}
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <StatusBadge label={status} variant={getStatusVariant(status)} />
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <button onClick={() => dispatch(fetchJobById(String(job.id)))}
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
                  const budgetObj  = job["budget"] as { amount?: number } | undefined;
                  const clientObj  = job["client"] as { name?: string } | undefined;
                  const expertObj  = job["expert"] as { name?: string } | undefined;
                  const amount     = fmtMoney(
                    (job["finalPrice"] as number | undefined) ??
                    (job["paymentAmount"] as number | undefined) ??
                    budgetObj?.amount
                  );
                  const clientName = clientObj?.name ?? val(job, "postedBy");
                  const expertName = expertObj?.name ?? "—";
                  const status     = deriveStatus(job);

                  return (
                    <div key={String(job.id)}
                      style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB",
                        backgroundColor: "#ffffff", display: "flex", alignItems: "center", gap: "12px" }}>
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
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#111827" }}>{amount}</span>
                        </div>
                      </div>
                      <button onClick={() => dispatch(fetchJobById(String(job.id)))}
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