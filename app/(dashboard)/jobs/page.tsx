// app/(dashboard)/jobs/page.tsx
"use client";

import { useState } from "react";
import { Download, Eye, SlidersHorizontal } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/Badge";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { ColumnDef } from "@/components/ui/Table";
import JobDetail from "@/components/jobs/Jobdetails";
import type { Job, JobStatus } from "@/components/jobs/types";

// ── Mock data ────────────────────────────────────────────────
const mockJobs: Job[] = [
  {
    id: "Job-001", client: "Funke A.", clientPhone: "+234 810 0000 000",
    clientEmail: "funke@email.com", clientRating: 4.9,
    expert: "Adebayo S.", expertPhone: "+234 819 5678 789",
    expertEmail: "adebayo@email.com", expertRating: 4.8,
    amount: "₦10,500", status: "Completed",
    title: "Fix leaking kitchen pipe", category: "Repair & Construction/ Plumbing",
    location: "Ikeja, Lagos", budget: "₦15,000 - ₦25,000", finalPrice: "₦18,500",
    created: "15/03/2026", paymentMethod: "Payment Protected (Escrow)",
    commission: "10%", commissionAmt: "₦1,850", expertPayout: "₦16,650",
    paymentStatus: "Paid on 16/03/2026",
    timeline: [
      { datetime: "15/03/2026 10:30", label: "Job posted by client" },
      { datetime: "15/03/2026 11:15", label: "Bid placed by Adebayo S. (₦18,500)" },
      { datetime: "15/03/2026 12:00", label: "Client accepted bid" },
      { datetime: "16/03/2026 09:00", label: 'Expert marked "On the way"' },
      { datetime: "16/03/2026 09:30", label: 'Expert marked "Working"' },
      { datetime: "16/03/2026 12:00", label: 'Expert marked "Complete"' },
      { datetime: "16/03/2026 14:00", label: "Client approved work" },
      { datetime: "16/03/2026 14:30", label: "Payment released to Expert" },
    ],
  },
  {
    id: "Job-002", client: "Chinedu O.", clientPhone: "+234 811 1111 111",
    clientEmail: "chinedu@email.com", clientRating: 4.7,
    expert: "Peter O.", expertPhone: "+234 812 2222 222",
    expertEmail: "peter@email.com", expertRating: 4.6,
    amount: "₦25,000", status: "Inprogress",
    title: "Paint 3-bedroom apartment", category: "Home Improvement / Painting",
    location: "Lekki, Lagos", budget: "₦20,000 - ₦30,000", finalPrice: "₦25,000",
    created: "14/03/2026", paymentMethod: "Payment Protected (Escrow)",
    commission: "10%", commissionAmt: "₦2,500", expertPayout: "₦22,500",
    paymentStatus: "Pending",
    timeline: [
      { datetime: "14/03/2026 09:00", label: "Job posted by client" },
      { datetime: "14/03/2026 10:30", label: "Bid placed by Peter O. (₦25,000)" },
      { datetime: "14/03/2026 11:00", label: "Client accepted bid" },
      { datetime: "15/03/2026 08:00", label: 'Expert marked "On the way"' },
      { datetime: "15/03/2026 09:00", label: 'Expert marked "Working"' },
    ],
  },
  {
    id: "Job-003", client: "Chioma K.", clientPhone: "+234 813 3333 333",
    clientEmail: "chioma@email.com", clientRating: 4.5,
    expert: null, amount: "₦15,000", status: "Bidding",
    title: "Clean 2-bedroom flat", category: "Cleaning",
    location: "Yaba, Lagos", budget: "₦12,000 - ₦18,000", finalPrice: "-",
    created: "13/03/2026", paymentMethod: "-",
    commission: "10%", commissionAmt: "-", expertPayout: "-",
    paymentStatus: "Awaiting bid acceptance",
    timeline: [{ datetime: "13/03/2026 14:00", label: "Job posted by client" }],
  },
  {
    id: "Job-004", client: "Adeola B.", clientPhone: "+234 814 4444 444",
    clientEmail: "adeola@email.com", clientRating: 4.2,
    expert: "Mary K.", expertPhone: "+234 815 5555 555",
    expertEmail: "mary@email.com", expertRating: 4.4,
    amount: "₦50,000", status: "Disputed",
    title: "Renovate kitchen cabinets", category: "Repair & Construction / Carpentry",
    location: "Surulere, Lagos", budget: "₦40,000 - ₦60,000", finalPrice: "₦50,000",
    created: "10/03/2026", paymentMethod: "Payment Protected (Escrow)",
    commission: "10%", commissionAmt: "₦5,000", expertPayout: "₦45,000",
    paymentStatus: "On hold (Disputed)",
    timeline: [
      { datetime: "10/03/2026 10:00", label: "Job posted by client" },
      { datetime: "10/03/2026 11:30", label: "Bid placed by Mary K. (₦50,000)" },
      { datetime: "10/03/2026 12:00", label: "Client accepted bid" },
      { datetime: "11/03/2026 09:00", label: 'Expert marked "Working"' },
      { datetime: "12/03/2026 15:00", label: "Client raised a dispute" },
    ],
  },
  {
    id: "Job-005", client: "Tunde A.", clientPhone: "+234 816 6666 666",
    clientEmail: "tunde@email.com", clientRating: 5.0,
    expert: "John D.", expertPhone: "+234 817 7777 777",
    expertEmail: "john@email.com", expertRating: 4.9,
    amount: "₦12,000", status: "Completed",
    title: "Fix electrical wiring", category: "Electrical",
    location: "Ajah, Lagos", budget: "₦10,000 - ₦15,000", finalPrice: "₦12,000",
    created: "08/03/2026", paymentMethod: "Payment Protected (Escrow)",
    commission: "10%", commissionAmt: "₦1,200", expertPayout: "₦10,800",
    paymentStatus: "Paid on 09/03/2026",
    timeline: [
      { datetime: "08/03/2026 08:00", label: "Job posted by client" },
      { datetime: "08/03/2026 09:00", label: "Bid placed by John D. (₦12,000)" },
      { datetime: "08/03/2026 09:30", label: "Client accepted bid" },
      { datetime: "09/03/2026 10:00", label: 'Expert marked "Complete"' },
      { datetime: "09/03/2026 11:00", label: "Client approved work" },
      { datetime: "09/03/2026 11:30", label: "Payment released to Expert" },
    ],
  },
  {
    id: "Job-006", client: "Mayowa F.", clientPhone: "+234 818 8888 888",
    clientEmail: "mayowa@email.com", clientRating: 4.3,
    expert: "Josiah O.", expertPhone: "+234 819 9999 999",
    expertEmail: "josiah@email.com", expertRating: 4.7,
    amount: "₦30,000", status: "Bidding",
    title: "Install ceiling fan in 3 rooms", category: "Electrical",
    location: "Gbagada, Lagos", budget: "₦25,000 - ₦35,000", finalPrice: "-",
    created: "07/03/2026", paymentMethod: "-",
    commission: "10%", commissionAmt: "-", expertPayout: "-",
    paymentStatus: "Awaiting bid acceptance",
    timeline: [
      { datetime: "07/03/2026 13:00", label: "Job posted by client" },
      { datetime: "07/03/2026 14:00", label: "Bid placed by Josiah O. (₦30,000)" },
    ],
  },
];

// ── Config ───────────────────────────────────────────────────
const statusVariant: Record<JobStatus, "green" | "yellow" | "purple" | "red" | "gray"> = {
  Completed:  "green",
  Inprogress: "yellow",
  Bidding:    "purple",
  Disputed:   "red",
  Cancelled:  "gray",
};

const JOB_OPTIONS    = ["All Jobs", "Client Jobs", "Expert Jobs"] as const;
const STATUS_OPTIONS = ["All", "Completed", "Inprogress", "Bidding", "Disputed", "Cancelled"] as const;
const MONTH_OPTIONS  = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

// ── Columns ──────────────────────────────────────────────────
function buildColumns(onView: (j: Job) => void): ColumnDef<Job>[] {
  return [
    {
      key: "id",
      header: "Job ID",
      render: (j) => <span className="font-semibold text-text-main">{j.id}</span>,
    },
    {
      key: "client",
      header: "Client",
      render: (j) => <span className="text-text-muted">{j.client}</span>,
    },
    {
      key: "expert",
      header: "Expert",
      render: (j) => <span className="text-text-muted">{j.expert ?? "–"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (j) => <span className="font-medium text-text-main">{j.amount}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (j) => <StatusBadge label={j.status} variant={statusVariant[j.status]} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (j) => (
        <button
          onClick={() => onView(j)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
          title="View job"
        >
          <Eye size={17} strokeWidth={1.8} />
        </button>
      ),
    },
  ];
}

// ── Page ─────────────────────────────────────────────────────
export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobFilter,    setJobFilter]  = useState("All Jobs");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter,  setMonthFilter]  = useState("May");

  // Show detail view
  if (selectedJob) {
    return <JobDetail job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  const filteredData = mockJobs.filter(
    (j) => statusFilter === "All" || j.status === statusFilter
  );

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Jobs" />

      {/* ── Sub-header ── */}
      <div className="flex items-center justify-between px-8 py-5">
        <p className="text-sm font-semibold text-text-main">Jobs List</p>
        <button className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Download size={15} />
          Export
        </button>
      </div>

      <main className="flex-1 px-8 pb-8">
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">

          {/* ── Filter toolbar ── */}
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={15} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-main">Filter</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search — stretches */}
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search name..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              {/* Job type */}
              <FilterDropdown value={jobFilter} options={JOB_OPTIONS} onChange={setJobFilter} />

              {/* Status — label inline */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-muted font-medium whitespace-nowrap">Status:</span>
                <FilterDropdown value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
              </div>

              {/* Date — label inline */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-muted font-medium whitespace-nowrap">Date:</span>
                <FilterDropdown value={monthFilter} options={MONTH_OPTIONS} onChange={setMonthFilter} />
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Job ID", "Client", "Expert", "Amount", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-sm text-text-muted">No jobs found.</td>
                  </tr>
                ) : (
                  filteredData.map((job) => {
                    const cols = buildColumns(setSelectedJob);
                    return (
                      <tr key={job.id} className="hover:bg-background transition-colors">
                        {cols.map((col) => (
                          <td key={String(col.key)} className="px-6 py-4 text-[13.5px]">
                            {col.render ? col.render(job) : String((job as never)[String(col.key)] ?? "")}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
            <p className="text-[12px] text-text-muted">
              Showing 1–{filteredData.length} of 100 results
            </p>
            <div className="flex items-center gap-1.5">
              <button className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors opacity-40 cursor-not-allowed">Previous</button>
              <button className="w-8 h-8 rounded-lg text-[12px] font-medium btn-primary">1</button>
              <button className="w-8 h-8 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background">2</button>
              <button className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">Next</button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}