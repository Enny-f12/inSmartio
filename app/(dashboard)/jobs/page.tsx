// app/(dashboard)/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Download, Eye, SlidersHorizontal, Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/Badge";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchJobs, fetchJobById, clearSelectedJob } from "@/lib/redux/jobSlice";
import type { ApiJob } from "@/lib/api/jobApi";

// ── Status config ─────────────────────────────────────────
// Will update once we see real status values from API
type StatusVariant = "green" | "yellow" | "purple" | "red" | "gray";

const getStatusVariant = (status: string): StatusVariant => {
  const map: Record<string, StatusVariant> = {
    completed:  "green",
    inprogress: "yellow",
    in_progress: "yellow",
    active:     "yellow",
    bidding:    "purple",
    open:       "purple",
    disputed:   "red",
    cancelled:  "gray",
    closed:     "gray",
  };
  return map[status?.toLowerCase()] ?? "gray";
};

const STATUS_OPTIONS = ["All", "completed", "inprogress", "bidding", "disputed", "cancelled"] as const;
const MONTH_OPTIONS  = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

// ── Helper: safely get string value from ApiJob ───────────
const val = (job: ApiJob, ...keys: string[]): string => {
  for (const key of keys) {
    const v = job[key];
    if (v !== undefined && v !== null) return String(v);
  }
  return "—";
};

// ── Page ─────────────────────────────────────────────────
export default function JobsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus } = useAppSelector((s) => s.jobs);

  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter,  setMonthFilter]  = useState("All");
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchJobs());
  }, [dispatch, listStatus]);

  // Log raw API response so we can see the real shape
  useEffect(() => {
    if (listStatus === "succeeded" && list.length > 0) {
      console.log("📋 Jobs API response shape:", list[0]);
    }
  }, [listStatus, list]);

  useEffect(() => {
    if (selectedStatus === "succeeded" && selected) {
      console.log("📋 Job detail API response shape:", selected);
    }
  }, [selectedStatus, selected]);

  // ── Detail view ──
  if (selectedStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="Jobs" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: "10px", color: "var(--color-text-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "13px" }}>Loading job...</span>
        </div>
      </div>
    );
  }

  if (selectedStatus === "succeeded" && selected) {
    return (
      <div className="flex flex-col flex-1">
        <Topbar title="Jobs" />
        <main className="flex-1 px-8 py-6 overflow-y-auto">
          <button
            onClick={() => dispatch(clearSelectedJob())}
            className="flex items-center gap-2 text-[13.5px] font-medium text-text-main hover:text-primary transition-colors mb-6"
          >
            ← Jobs
          </button>

          {/* Raw data display until we know the shape */}
          <div className="bg-surface rounded-2xl border border-border p-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-4">
              Job Details
            </p>
            <div className="space-y-2">
              {Object.entries(selected).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-[13px]">
                  <span className="w-44 shrink-0 font-medium text-text-muted capitalize">{key}:</span>
                  <span className="text-text-main">
                    {typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Filter ──
  const filtered = list.filter((j: ApiJob) => {
    const status = val(j, "status");
    const title  = val(j, "title", "description", "jobTitle").toLowerCase();
    const matchStatus = statusFilter === "All" || status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch = !search || title.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Jobs" />

      {/* Sub-header */}
      <div className="flex items-center justify-between px-8 py-5">
        <p className="text-sm font-semibold text-text-main">
          {listStatus === "succeeded" ? `${list.length} jobs total` : "Jobs List"}
        </p>
        <button className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Download size={15} /> Export
        </button>
      </div>

      <main className="flex-1 px-8 pb-8">
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">

          {/* Filter toolbar */}
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={15} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-main">Filter</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-muted font-medium whitespace-nowrap">Status:</span>
                <FilterDropdown value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-muted font-medium whitespace-nowrap">Date:</span>
                <FilterDropdown value={monthFilter} options={MONTH_OPTIONS} onChange={setMonthFilter} />
              </div>
            </div>
          </div>

          {/* Loading */}
          {listStatus === "loading" && (
            <div className="flex items-center justify-center py-16 gap-3 text-text-muted">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[13px]">Loading jobs...</span>
            </div>
          )}

          {/* Error */}
          {listStatus === "failed" && (
            <p className="text-center py-16 text-[13px] text-red-500">{listError}</p>
          )}

          {/* Table */}
          {listStatus === "succeeded" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background">
                    {["Job ID", "Title", "Client", "Expert", "Amount", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14 text-sm text-text-muted">
                        {list.length === 0 ? "No jobs have been posted yet." : "No jobs match your filter."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((job: ApiJob) => (
                      <tr key={job.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4 text-[13px] font-semibold text-text-main">{val(job, "id", "jobId")}</td>
                        <td className="px-6 py-4 text-[13px] text-text-muted max-w-45 truncate">{val(job, "title", "jobTitle", "description")}</td>
                        <td className="px-6 py-4 text-[13px] text-text-muted">{val(job, "client", "clientName", "userId")}</td>
                        <td className="px-6 py-4 text-[13px] text-text-muted">{val(job, "expert", "expertName", "assignedTo")}</td>
                        <td className="px-6 py-4 text-[13px] font-medium text-text-main">{val(job, "amount", "budget", "price", "finalPrice")}</td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            label={val(job, "status")}
                            variant={getStatusVariant(val(job, "status"))}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => dispatch(fetchJobById(job.id))}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                            title="View job"
                          >
                            <Eye size={17} strokeWidth={1.8} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {listStatus === "succeeded" && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
              <p className="text-[12px] text-text-muted">
                Showing {filtered.length} of {list.length} jobs
              </p>
              <div className="flex items-center gap-1.5">
                <button className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted opacity-40 cursor-not-allowed">Previous</button>
                <button className="w-8 h-8 rounded-lg text-[12px] font-medium btn-primary">1</button>
                <button className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background">Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}