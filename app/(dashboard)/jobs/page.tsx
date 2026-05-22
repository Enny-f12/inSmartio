// app/(dashboard)/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Download, Eye, SlidersHorizontal, Loader2, ArrowLeft } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/Badge";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchJobs, fetchJobById, clearSelectedJob } from "@/lib/redux/jobSlice";
import type { ApiJob } from "@/lib/api/jobApi";

type StatusVariant = "green" | "yellow" | "purple" | "red" | "gray";

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

const STATUS_OPTIONS = ["All", "completed", "inprogress", "bidding", "disputed", "cancelled"] as const;
const MONTH_OPTIONS  = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

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

// ── Shared detail sub-components ─────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280", margin: "0 0 16px" }}>
      {text}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", flexWrap: "wrap" }}>
      <span style={{ minWidth: "150px", flexShrink: 0, fontWeight: 500, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", wordBreak: "break-word", flex: 1 }}>{value ?? "—"}</span>
    </div>
  );
}

function BidStatusChip({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const color       = s === "accepted" ? "#16a34a" : s === "rejected" ? "#dc2626" : "#d97706";
  const bgColor     = s === "accepted" ? "#f0fdf4"  : s === "rejected" ? "#fef2f2"  : "#fffbeb";
  const borderColor = s === "accepted" ? "#bbf7d0"  : s === "rejected" ? "#fecaca"  : "#fde68a";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", color, backgroundColor: bgColor, border: `1px solid ${borderColor}`, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

// ── Job detail view ──────────────────────────────────────────────
function JobDetailView({ job, onBack }: { job: ApiJob; onBack: () => void }) {
  const locationObj = job["location"] as { city?: string; address?: string } | undefined;
  const location    = locationObj
    ? [locationObj.address, locationObj.city].filter(Boolean).join(", ")
    : val(job, "location");

  const budgetObj     = job["budget"] as { amount?: number } | undefined;
  const budget        = budgetObj?.amount ? `₦${budgetObj.amount.toLocaleString()}` : val(job, "budget");

  const closed        = job["closed"] as boolean | undefined;
  const verified      = job["verified"] as boolean | undefined;
  const derivedStatus = closed ? "closed" : verified ? "active" : "bidding";
  const status        = val(job, "status") !== "—" ? val(job, "status") : derivedStatus;

  const bids = (job["bids"] as {
    id: string;
    expertId: string;
    bidAmount: number;
    currency: string;
    status: string;
    proposalText: string;
    offerCashPayment: boolean;
    createdAt: string;
  }[]) ?? [];

  const acceptedBid = bids.find((b) => b.status === "accepted");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Jobs" />
      <main style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <style>{`@media(min-width:640px){ .jd-main{ padding: 24px 32px !important; } }`}</style>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 500, color: "#111827", background: "none", border: "none", cursor: "pointer", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Jobs
        </button>

        {/* White card container */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>

          {/* ── Job Information ── */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #E5E7EB" }}>
            <SectionLabel text="Job Information" />
            <InfoRow label="Job ID:"         value={val(job, "id", "_id")} />
            <InfoRow label="Title:"          value={val(job, "title")} />
            <InfoRow label="Description:"    value={val(job, "description")} />
            <InfoRow label="Category:"       value={val(job, "category")} />
            <InfoRow label="Sub-Category:"   value={val(job, "subCategory")} />
            <InfoRow label="Location:"       value={location} />
            <InfoRow label="Budget:"         value={budget} />
            <InfoRow label="Payment Method:" value={val(job, "paymentMethod")} />
            <InfoRow label="Verification:"   value={val(job, "verification")} />
            <InfoRow label="Start Date:"     value={fmt(job["startDate"] as string)} />
            <InfoRow label="Deadline:"       value={fmt(job["deadline"] as string)} />
            <InfoRow label="Posted:"         value={fmt(job["createdAt"] as string)} />
            <InfoRow label="Posted By:"      value={val(job, "postedBy")} />
            <InfoRow label="Status:"         value={<StatusBadge label={status} variant={getStatusVariant(status)} />} />
          </div>

          {/* ── Accepted Bid ── */}
          {acceptedBid && (
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #E5E7EB" }}>
              <SectionLabel text="Accepted Bid" />
              <InfoRow label="Expert ID:"    value={acceptedBid.expertId} />
              <InfoRow label="Bid Amount:"   value={`₦${acceptedBid.bidAmount.toLocaleString()} ${acceptedBid.currency}`} />
              <InfoRow label="Cash Payment:" value={acceptedBid.offerCashPayment ? "Yes" : "No"} />
              <InfoRow label="Proposal:"     value={acceptedBid.proposalText} />
              <InfoRow label="Submitted:"    value={fmt(acceptedBid.createdAt)} />
            </div>
          )}

          {/* ── All Bids ── */}
          <div style={{ padding: "24px 32px" }}>
            <SectionLabel text={`Bids (${bids.length})`} />
            {bids.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No bids placed yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {bids.map((bid, i) => (
                  <div key={bid.id ?? i} style={{ borderRadius: "10px", border: "1px solid #E5E7EB", padding: "14px 16px", backgroundColor: "#F9FAFB" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                        ₦{bid.bidAmount.toLocaleString()} <span style={{ fontWeight: 400, fontSize: "12px", color: "#6B7280" }}>{bid.currency}</span>
                      </span>
                      <BidStatusChip status={bid.status} />
                    </div>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 4px" }}>
                      Expert ID: <span style={{ color: "#111827", fontWeight: 500 }}>{bid.expertId}</span>
                    </p>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 6px" }}>
                      {bid.proposalText}
                    </p>
                    <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>
                      Submitted: {fmt(bid.createdAt)} · Cash payment: {bid.offerCashPayment ? "Yes" : "No"}
                    </p>
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

// ── Main list page ───────────────────────────────────────────────
export default function JobsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus } = useAppSelector((s) => s.jobs);

  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter,  setMonthFilter]  = useState("All");
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchJobs());
  }, [dispatch, listStatus]);

  useEffect(() => {
    if (listStatus === "succeeded" && list.length > 0)
      console.log("📋 Jobs list item shape:", list[0]);
  }, [listStatus, list]);

  // ── Loading detail ──
  if (selectedStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="Jobs" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: "10px", color: "#9CA3AF" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "13px" }}>Loading job...</span>
        </div>
      </div>
    );
  }

  // ── Detail view ──
  if (selectedStatus === "succeeded" && selected) {
    return <JobDetailView job={selected} onBack={() => dispatch(clearSelectedJob())} />;
  }

  const filtered = list.filter((j: ApiJob) => {
    const status = val(j, "status");
    const title  = val(j, "title", "description").toLowerCase();
    const matchStatus = statusFilter === "All" || status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch = !search || title.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="flex flex-col flex-1" style={{ backgroundColor: "#F4F5F7" }}>
      <Topbar title="Jobs" />

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

      {/* Sub-header */}
      <div className="jobs-header flex items-center justify-between">
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
          {listStatus === "succeeded" ? `${list.length} jobs total` : "Jobs List"}
        </p>
        <button className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Download size={15} /> Export
        </button>
      </div>

      <main className="jobs-main flex-1">
        {/* White card */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

          {/* Filter toolbar */}
          <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <SlidersHorizontal size={15} style={{ color: "#6B7280" }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Filter</span>
            </div>
            <div className="jobs-filter-row flex">
              <div style={{ position: "relative", flex: 1 }}>
                <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
                />
              </div>
              <div className="jobs-filter-dropdowns">
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

          {/* Loading */}
          {listStatus === "loading" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px", gap: "10px", color: "#9CA3AF" }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: "13px" }}>Loading jobs...</span>
            </div>
          )}

          {/* Error */}
          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "64px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
          )}

          {listStatus === "succeeded" && (
            <>
              {/* Desktop table */}
              <div className="jobs-table" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      {["Job ID", "Title", "Category", "Budget", "Status", "Posted", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>
                        {list.length === 0 ? "No jobs have been posted yet." : "No jobs match your filter."}
                      </td></tr>
                    ) : filtered.map((job: ApiJob) => {
                      const budgetObj     = job["budget"] as { amount?: number } | undefined;
                      const budgetDisplay = budgetObj?.amount ? `₦${budgetObj.amount.toLocaleString()}` : val(job, "budget");
                      const closed        = job["closed"] as boolean | undefined;
                      const verified      = job["verified"] as boolean | undefined;
                      const status        = val(job, "status") !== "—" ? val(job, "status") : closed ? "closed" : verified ? "active" : "bidding";
                      return (
                        <tr key={String(job.id)} style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                          <td style={{ padding: "16px 24px", fontSize: "12px", fontFamily: "monospace", color: "#6B7280", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(job.id)}>
                            {String(job.id).slice(0, 12)}…
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "#111827", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {val(job, "title")}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "#6B7280" }}>{val(job, "category")}</td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", fontWeight: 500, color: "#111827" }}>{budgetDisplay}</td>
                          <td style={{ padding: "16px 24px" }}><StatusBadge label={status} variant={getStatusVariant(status)} /></td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "#6B7280" }}>{fmt(job["createdAt"] as string)}</td>
                          <td style={{ padding: "16px 24px" }}>
                            <button
                              onClick={() => dispatch(fetchJobById(String(job.id)))}
                              style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}
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

              {/* Mobile cards */}
              <div className="jobs-cards">
                {filtered.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF" }}>
                    {list.length === 0 ? "No jobs posted yet." : "No jobs match your filter."}
                  </p>
                ) : filtered.map((job: ApiJob) => {
                  const budgetObj     = job["budget"] as { amount?: number } | undefined;
                  const budgetDisplay = budgetObj?.amount ? `₦${budgetObj.amount.toLocaleString()}` : val(job, "budget");
                  const closed        = job["closed"] as boolean | undefined;
                  const verified      = job["verified"] as boolean | undefined;
                  const status        = val(job, "status") !== "—" ? val(job, "status") : closed ? "closed" : verified ? "active" : "bidding";
                  return (
                    <div key={String(job.id)} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {val(job, "title")}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <StatusBadge label={status} variant={getStatusVariant(status)} />
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>{val(job, "category")}</span>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#111827" }}>{budgetDisplay}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => dispatch(fetchJobById(String(job.id)))}
                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}>
                        <Eye size={16} strokeWidth={1.8} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {listStatus === "succeeded" && (
            <div className="jobs-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
              <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>Showing {filtered.length} of {list.length} jobs</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "not-allowed", opacity: 0.4 }}>Previous</button>
                <button style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none", backgroundColor: "#16a34a", color: "#ffffff", cursor: "pointer" }}>1</button>
                <button style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "pointer" }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}