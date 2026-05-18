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

type StatusVariant = "green" | "yellow" | "purple" | "red" | "gray";

const getStatusVariant = (status: string): StatusVariant => {
  const map: Record<string, StatusVariant> = {
    completed: "green", inprogress: "yellow", in_progress: "yellow",
    active: "yellow", bidding: "purple", open: "purple",
    disputed: "red", cancelled: "gray", closed: "gray",
  };
  return map[status?.toLowerCase()] ?? "gray";
};

const STATUS_OPTIONS = ["All", "completed", "inprogress", "bidding", "disputed", "cancelled"] as const;
const MONTH_OPTIONS  = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const val = (job: ApiJob, ...keys: string[]): string => {
  for (const key of keys) {
    const v = job[key];
    if (v !== undefined && v !== null) return String(v);
  }
  return "—";
};

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
    if (listStatus === "succeeded" && list.length > 0) console.log("📋 Jobs API response shape:", list[0]);
  }, [listStatus, list]);

  useEffect(() => {
    if (selectedStatus === "succeeded" && selected) console.log("📋 Job detail API response shape:", selected);
  }, [selectedStatus, selected]);

  // ── Detail loading ──
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

  // ── Detail view ──
  if (selectedStatus === "succeeded" && selected) {
    return (
      <div className="flex flex-col flex-1">
        <Topbar title="Jobs" />
        <main className="flex-1 overflow-y-auto" style={{ padding: "16px" }}>
          <style>{`@media(min-width:640px){ .job-detail-main{ padding: 24px 32px !important; } }`}</style>
          <button onClick={() => dispatch(clearSelectedJob())} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)", background: "none", border: "none", cursor: "pointer", marginBottom: "24px" }}>
            ← Jobs
          </button>
          <div className="bg-surface rounded-2xl border border-border p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-4">Job Details</p>
            <div className="space-y-2">
              {Object.entries(selected).map(([key, value]) => (
                <div key={key} style={{ display: "flex", gap: "12px", fontSize: "13px", flexWrap: "wrap" }}>
                  <span style={{ minWidth: "140px", flexShrink: 0, fontWeight: 500, color: "var(--color-text-muted)", textTransform: "capitalize" }}>{key}:</span>
                  <span className="text-text-main" style={{ wordBreak: "break-word", flex: 1 }}>
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
        <p className="text-sm font-semibold text-text-main">
          {listStatus === "succeeded" ? `${list.length} jobs total` : "Jobs List"}
        </p>
        <button className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Download size={15} /> Export
        </button>
      </div>

      <main className="jobs-main flex-1">
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">

          {/* Filter toolbar */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal size={15} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-main">Filter</span>
            </div>
            <div className="jobs-filter-row flex">
              {/* Search */}
              <div className="relative" style={{ flex: 1 }}>
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              {/* Dropdowns */}
              <div className="jobs-filter-dropdowns">
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

          {listStatus === "succeeded" && (
            <>
              {/* Desktop table */}
              <div className="jobs-table overflow-x-auto">
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
                      <tr><td colSpan={7} className="text-center py-14 text-sm text-text-muted">
                        {list.length === 0 ? "No jobs have been posted yet." : "No jobs match your filter."}
                      </td></tr>
                    ) : filtered.map((job: ApiJob) => (
                      <tr key={job.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4 text-[13px] font-semibold text-text-main">{val(job, "id", "jobId")}</td>
                        <td className="px-6 py-4 text-[13px] text-text-muted max-w-45 truncate">{val(job, "title", "jobTitle", "description")}</td>
                        <td className="px-6 py-4 text-[13px] text-text-muted">{val(job, "client", "clientName", "userId")}</td>
                        <td className="px-6 py-4 text-[13px] text-text-muted">{val(job, "expert", "expertName", "assignedTo")}</td>
                        <td className="px-6 py-4 text-[13px] font-medium text-text-main">{val(job, "amount", "budget", "price", "finalPrice")}</td>
                        <td className="px-6 py-4"><StatusBadge label={val(job, "status")} variant={getStatusVariant(val(job, "status"))} /></td>
                        <td className="px-6 py-4">
                          <button onClick={() => dispatch(fetchJobById(job.id))} className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors" title="View job">
                            <Eye size={17} strokeWidth={1.8} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="jobs-cards">
                {filtered.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                    {list.length === 0 ? "No jobs have been posted yet." : "No jobs match your filter."}
                  </p>
                ) : filtered.map((job: ApiJob) => (
                  <div key={job.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {val(job, "title", "jobTitle", "description")}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <StatusBadge label={val(job, "status")} variant={getStatusVariant(val(job, "status"))} />
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{val(job, "client", "clientName")}</span>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-main)" }}>{val(job, "amount", "budget", "price")}</span>
                      </div>
                    </div>
                    <button onClick={() => dispatch(fetchJobById(job.id))} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}>
                      <Eye size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {listStatus === "succeeded" && (
            <div className="jobs-pagination flex items-center justify-between px-4 py-4 border-t border-border bg-background">
              <p className="text-[12px] text-text-muted">Showing {filtered.length} of {list.length} jobs</p>
              <div className="flex items-center gap-1.5">
                <button className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted opacity-40 cursor-not-allowed">Prev</button>
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