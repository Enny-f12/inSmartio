/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
// app/(dashboard)/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Download, Eye, SlidersHorizontal, Loader2,
  UserPlus, XCircle, ChevronDown, Search,
} from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/Badge";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchJobs  } from "@/lib/redux/jobSlice";
import { downloadReport } from "@/lib/api/reportApi";
import { toast } from "sonner";
import type { ApiJob } from "@/lib/api/jobApi";

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

// Read the status straight from the backend payload
const getStatus = (job: ApiJob): string => {
  const raw = job["status"];
  return raw != null && raw !== "" ? String(raw) : "—";
};

const STATUS_OPTIONS = ["All", "completed", "inprogress", "biding", "disputed", "cancelled"] as const;
const MONTH_OPTIONS  = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTH_MAP: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

const val = (job: ApiJob, ...keys: string[]): string => {
  for (const key of keys) {
    const v = job[key];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "—";
};

const fmtMoney = (amount?: number | null, fallback = "—") =>
  amount != null ? `₦${amount.toLocaleString()}` : fallback;

// ─────────────────────────────────────────────────────────
// Assign to Expert Modal
// ─────────────────────────────────────────────────────────
function AssignModal({ count, onClose, onConfirm }: {
  count: number; onClose: () => void; onConfirm: (expertId: string) => void;
}) {
  const [expertId, setExpertId] = useState("");
  return (
    <div className="fixed inset-0 z-999 flex animate-[fadeIn_0.15s_ease-out] items-center justify-center bg-black/40">
      <div className="w-105 animate-[popIn_0.18s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl bg-surface px-8 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <p className="mb-1.5 text-base font-bold text-text-main">
          Assign to Expert
        </p>
        <p className="mb-5 text-[13px] text-text-muted">
          Assign {count} selected job{count > 1 ? "s" : ""} to an expert.
        </p>
        <input
          type="text"
          placeholder="Enter Expert ID"
          value={expertId}
          onChange={e => setExpertId(e.target.value)}
          className="mb-5 w-full rounded-[10px] border border-border px-3.5 py-2.5 text-[13px] text-text-main outline-none transition-colors duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-[10px] border border-border bg-transparent px-4.5 py-2.25 text-[13px] font-medium text-text-muted transition-colors duration-150 hover:bg-background active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(expertId)}
            disabled={!expertId.trim()}
            className="rounded-[10px] border-none bg-primary px-4.5 py-2.25 text-[13px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
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


  const { list, listStatus, listError, page, pages, total } =
    useAppSelector((s) => s.jobs);

  // Basic filters
  const [categoryFilter, setCategoryFilter] = useState("All Jobs");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [monthFilter,    setMonthFilter]    = useState("All");
  const [search,         setSearch]         = useState("");
  const [downloading,    setDownloading]    = useState(false);

  // Advanced filters
  const [locationFilter, setLocationFilter] = useState("All");
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [amountMin,      setAmountMin]      = useState("");
  const [amountMax,      setAmountMax]      = useState("");
  const [showAdvanced,   setShowAdvanced]   = useState(false);

  // Bulk selection
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);

  const categoryOptions = [
    "All Jobs",
    ...Array.from(new Set(list.map((j: ApiJob) => val(j, "category")).filter((c) => c !== "—"))),
  ];

  const locationOptions = [
    "All",
    ...Array.from(new Set(
      list.map((j: ApiJob) => {
        const loc = j["location"] as { city?: string; state?: string } | undefined;
        return loc?.city ?? loc?.state ?? null;
      }).filter(Boolean) as string[]
    )),
  ];

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchJobs());
  }, [dispatch, listStatus]);

  // ── Filtering ─────────────────────────────────────────
  const filtered = list.filter((j: ApiJob) => {
    const status   = getStatus(j);
    const category = val(j, "category");
    const title    = val(j, "title", "description").toLowerCase();

    const matchCategory = categoryFilter === "All Jobs" || category === categoryFilter;
    const matchStatus   = statusFilter   === "All"      || status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch   = !search || title.includes(search.toLowerCase());

    const locObj = j["location"] as { city?: string; state?: string } | undefined;
    const locStr = locObj ? `${locObj.city ?? ""} ${locObj.state ?? ""}`.toLowerCase() : "";
    const matchLocation = locationFilter === "All" || locStr.includes(locationFilter.toLowerCase());

    let matchMonth = true;
    if (monthFilter !== "All") {
      const created = j["createdAt"] as string | undefined;
      if (created) {
        matchMonth = new Date(created).getMonth() === MONTH_MAP[monthFilter];
      } else {
        matchMonth = false;
      }
    }

    let matchDateRange = true;
    if (dateFrom || dateTo) {
      const created = j["createdAt"] as string | undefined;
      if (created) {
        const d = new Date(created).getTime();
        if (dateFrom && d < new Date(dateFrom).getTime()) matchDateRange = false;
        if (dateTo   && d > new Date(dateTo + "T23:59:59").getTime()) matchDateRange = false;
      } else {
        matchDateRange = false;
      }
    }

    let matchAmount = true;
    const amt = j["finalAmount"] as number | undefined;
    if (amountMin && amt != null && amt < Number(amountMin)) matchAmount = false;
    if (amountMax && amt != null && amt > Number(amountMax)) matchAmount = false;

    return matchCategory && matchStatus && matchSearch && matchLocation && matchMonth && matchDateRange && matchAmount;
  });

  // ── Selection helpers ─────────────────────────────────
  const filteredIds  = filtered.map((j: ApiJob) => String(j.id));
  const allSelected  = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
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

  // ── Advanced filter reset ─────────────────────────────
  const resetAdvancedFilters = () => {
    setLocationFilter("All");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const hasActiveAdvancedFilters =
    locationFilter !== "All" || dateFrom !== "" || dateTo !== "" || amountMin !== "" || amountMax !== "";

  // ── Bulk actions ──────────────────────────────────────
  const handleCancelSelected = () => {
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

  const handleViewJob = (_jobId: string) => {
    // TODO: wire up once fetchJobById / clearSelectedJob / selected / selectedStatus
    // exist on jobSlice's JobsState. For now this is a no-op.
    toast.info("Job detail view is temporarily disabled");
  };

  // ── Pagination (backend-driven) ────────────────────────
  const currentPage = page ?? 1;
  const totalPages  = pages ?? 1;
  const totalCount  = total ?? list.length;

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    // Assumes fetchJobs accepts a page number — adjust if your thunk takes
    // an options object instead, e.g. fetchJobs({ page: p }).
    dispatch(fetchJobs({ page: p }));
  };


  return (
    <div className="flex flex-1 flex-col bg-[#F4F5F7]">
      {/* Tailwind's utilities can't define @keyframes on their own — this is the
          one bit of plain CSS needed to register the three entrance animations
          used below (fadeIn, popIn, slideDown). Move these into your global
          stylesheet's @theme block if you'd rather not have it inline here. */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn  { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Topbar title="Jobs Management" />

      {showAssignModal && (
        <AssignModal
          count={selectedCount}
          onClose={() => setShowAssignModal(false)}
          onConfirm={handleAssignConfirm}
        />
      )}

      {/* ── Sub-header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <p className="m-0 text-base font-semibold text-text-main">Jobs List</p>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selectedCount > 0 && (
            <span className="mr-1 animate-[fadeIn_0.15s_ease-out] text-xs font-medium text-text-muted">
              {selectedCount} selected
            </span>
          )}

          <button
            onClick={() => setShowAssignModal(true)}
            disabled={selectedCount === 0}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.75 text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:opacity-45 disabled:active:scale-100 ${
              selectedCount > 0
                ? "border-primary bg-primary text-white hover:opacity-85"
                : "border-border bg-border text-gray-400"
            }`}
          >
            <UserPlus size={13} /> Assign to Expert
          </button>

          <button
            onClick={handleCancelSelected}
            disabled={selectedCount === 0}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.75 text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:opacity-45 disabled:active:scale-100 ${
              selectedCount > 0
                ? "border-red-200 bg-red-50 text-red-600 hover:opacity-85"
                : "border-border bg-background text-gray-400"
            }`}
          >
            <XCircle size={13} /> Cancel Selected
          </button>

          <button
            onClick={selectedCount > 0 ? handleExportSelected : handleExport}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 py-1.75 text-[12.5px] font-semibold text-white transition-all duration-150 hover:opacity-85 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            {downloading
              ? <><Loader2 size={13} className="animate-spin" /> Exporting...</>
              : <><Download size={13} /> {selectedCount > 0 ? "Export Selected" : "Export"}</>}
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 pb-6 sm:px-8 sm:pb-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.05)]">

          {/* ── Filter toolbar ── */}
          <div className="border-b border-border px-6 py-4">

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-text-muted" />
                <span className="text-sm font-semibold text-text-main">Filter</span>
                {hasActiveAdvancedFilters && (
                  <span className="flex h-4.5 w-4.5 animate-[popIn_0.18s_cubic-bezier(0.16,1,0.3,1)] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    ✓
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowAdvanced(p => !p)}
                className={`flex items-center gap-1.5 rounded-lg border-none px-2 py-1 text-[12.5px] font-semibold transition-colors duration-150 ${
                  showAdvanced ? "bg-primary/10 text-primary" : "bg-transparent text-text-muted hover:bg-background"
                }`}
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : "rotate-0"}`}
                />
                Advanced Filters
              </button>
            </div>

            {/* Basic filters */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative min-w-50 flex-1">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-[10px] border border-border bg-background py-2.5 pl-10 pr-4 text-[13px] text-text-main outline-none transition-colors duration-150 placeholder:text-gray-400 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <FilterDropdown value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-xs font-medium text-text-muted">Status:</span>
                  <FilterDropdown value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-xs font-medium text-text-muted">Date:</span>
                  <FilterDropdown value={monthFilter} options={MONTH_OPTIONS} onChange={setMonthFilter} />
                </div>
              </div>
            </div>

            {/* Advanced filters panel */}
            {showAdvanced && (
              <div className="mt-4 animate-[slideDown_0.2s_ease-out] rounded-xl border border-border bg-background p-5">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Advanced Filters
                </p>

                <div className="flex flex-wrap items-end gap-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-semibold text-text-muted">Location</span>
                    <FilterDropdown value={locationFilter} options={locationOptions} onChange={setLocationFilter} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-semibold text-text-muted">Date Range</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.75 text-xs text-text-main outline-none transition-colors duration-150 focus:border-primary"
                      />
                      <span className="shrink-0 text-xs text-gray-400">to</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.75 text-xs text-text-main outline-none transition-colors duration-150 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-semibold text-text-muted">Amount Range (₦)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={amountMin}
                        onChange={e => setAmountMin(e.target.value)}
                        className="w-25 rounded-lg border border-border bg-surface px-2.5 py-1.75 text-xs text-text-main outline-none transition-colors duration-150 focus:border-primary"
                      />
                      <span className="shrink-0 text-xs text-gray-400">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={amountMax}
                        onChange={e => setAmountMax(e.target.value)}
                        className="w-25 rounded-lg border border-border bg-surface px-2.5 py-1.75 text-xs text-text-main outline-none transition-colors duration-150 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="ml-auto flex gap-2 self-end">
                    <button
                      onClick={resetAdvancedFilters}
                      className="rounded-lg border border-border bg-surface px-4 py-2 text-[12.5px] font-medium text-text-muted transition-colors duration-150 hover:bg-background active:scale-[0.97]"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowAdvanced(false)}
                      className="rounded-lg border-none bg-primary px-4 py-2 text-[12.5px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Loading / Error ── */}
          {listStatus === "loading" && (
            <div className="flex items-center justify-center gap-2.5 px-16 py-16 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[13px]">Loading jobs...</span>
            </div>
          )}
          {listStatus === "failed" && (
            <p className="px-16 py-16 text-center text-[13px] text-red-500">{listError}</p>
          )}

          {listStatus === "succeeded" && (
            <>
              {/* ── Desktop table ── */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="w-10 py-3 pl-6 pr-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer accent-primary"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={toggleAll}
                        />
                      </th>
                      {["Job ID", "Client", "Expert", "Amount", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="py-3 pl-0 pr-5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-14 text-center text-sm text-gray-400">
                          {list.length === 0 ? "No jobs have been posted yet." : "No jobs match your filter."}
                        </td>
                      </tr>
                    ) : filtered.map((job: ApiJob) => {
                      const jobId              = String(job.id);
                      const finalAmountDisplay = fmtMoney(job["finalAmount"] as number | undefined);
                      const clientObj          = job["client"] as { name?: string } | undefined;
                      const expertObj          = job["expert"] as { name?: string } | undefined;
                      const clientName         = clientObj?.name ?? val(job, "postedBy");
                      const expertName         = expertObj?.name ?? "—";
                      const status             = getStatus(job);
                      const isChecked          = selectedIds.has(jobId);

                      return (
                        <tr
                          key={jobId}
                          className={`border-b border-gray-100 transition-colors duration-150 ${
                            isChecked ? "bg-blue-50 hover:bg-blue-50" : "hover:bg-gray-50/80"
                          }`}
                        >
                          <td className="py-3.5 pl-6 pr-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 cursor-pointer accent-primary"
                              checked={isChecked}
                              onChange={() => toggleOne(jobId)}
                            />
                          </td>
                          <td className="py-3.5 pl-0 pr-5 font-mono text-xs text-text-muted">
                            {jobId.slice(0, 14)}
                          </td>
                          <td className="py-3.5 pl-0 pr-5 text-[13px] text-text-main">
                            {clientName}
                          </td>
                          <td className="py-3.5 pl-0 pr-5 text-[13px] text-text-main">
                            {expertName}
                          </td>
                          <td className="py-3.5 pl-0 pr-5 text-[13px] font-semibold text-text-main">
                            {finalAmountDisplay}
                          </td>
                          <td className="py-3.5 pl-0 pr-5">
                            <StatusBadge label={status} variant={getStatusVariant(status)} />
                          </td>
                          <td className="py-3.5 pl-0 pr-5">
                            <button
                              onClick={() => handleViewJob(jobId)}
                              title="View job"
                              className="flex items-center rounded-lg border-none bg-transparent p-1.5 text-gray-400 transition-colors duration-150 hover:bg-background hover:text-primary"
                            >
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
              <div className="flex flex-col gap-2.5 p-3 sm:hidden">
                {filtered.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[13px] text-gray-400">
                    {list.length === 0 ? "No jobs posted yet." : "No jobs match your filter."}
                  </p>
                ) : filtered.map((job: ApiJob) => {
                  const jobId      = String(job.id);
                  const clientObj  = job["client"] as { name?: string } | undefined;
                  const expertObj  = job["expert"] as { name?: string } | undefined;
                  const finalAmt   = fmtMoney(job["finalAmount"] as number | undefined);
                  const clientName = clientObj?.name ?? val(job, "postedBy");
                  const expertName = expertObj?.name ?? "—";
                  const status     = getStatus(job);
                  const isChecked  = selectedIds.has(jobId);

                  return (
                    <div
                      key={jobId}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors duration-150 ${
                        isChecked ? "border-blue-200 bg-blue-50" : "border-border bg-surface"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-primary"
                        checked={isChecked}
                        onChange={() => toggleOne(jobId)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-text-main">
                          {clientName}
                          {expertName !== "—" && (
                            <span className="font-normal text-text-muted"> → {expertName}</span>
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={status} variant={getStatusVariant(status)} />
                          <span className="text-xs font-semibold text-text-main">{finalAmt}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewJob(jobId)}
                        className="flex shrink-0 items-center rounded-lg border border-border bg-transparent p-2 text-gray-400 transition-colors duration-150 hover:bg-background hover:text-primary"
                      >
                        <Eye size={16} strokeWidth={1.8} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Pagination (driven by backend page/pages/total) ── */}
          {listStatus === "succeeded" && (
            <div className="flex flex-col items-start justify-between gap-2 border-t border-border bg-background px-5 py-3.5 sm:flex-row sm:items-center">
              <p className="m-0 text-xs text-gray-400">
                Showing {list.length === 0 ? 0 : filtered.length} of {totalCount} results
                {totalPages > 1 && <> · Page {currentPage} of {totalPages}</>}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-muted transition-all duration-150 hover:bg-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface"
                >
                  Previous
                </button>
                <button className="h-8 w-8 cursor-default rounded-lg border-none bg-primary text-xs font-semibold text-white">
                  {currentPage}
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-muted transition-all duration-150 hover:bg-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}