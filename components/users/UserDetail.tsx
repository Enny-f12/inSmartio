// components/users/UserDetail.tsx
"use client";

import Image from "next/image";
import { ArrowLeft, ShieldCheck, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";

export type UserStatus = "Active" | "Tier 1" | "Tier 2" | "Tier 3" | "Pending" | "Suspended";

export interface User {
  id: number;
  name: string;
  type: "Expert" | "Client" | "TAS";
  status: UserStatus;
  joined: string;
  jobs: number | "N/A";
}

const statusVariant: Record<UserStatus, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active:    "green",
  "Tier 1":  "purple",
  "Tier 2":  "purple",
  "Tier 3":  "purple",
  Pending:   "yellow",
  Suspended: "red",
};

const avatarUrl = (id: number) =>
  `https://images.unsplash.com/photo-${
    [
      "1500648767791-00dcc994a43e",
      "1507003211169-0a1dd7228f2d",
      "1494790108377-be9c29b29330",
      "1527980965255-d3b416303d12",
      "1438761681033-6461ffad8d80",
      "1472099645785-5658abf4ff4e",
      "1544005313-94ddf0286df2",
      "1531427186611-4d4c8a799b10",
      "1534528741775-53994a69daeb",
      "1506794778202-cad84cf45f1d",
    ][id % 10]
  }?w=200&h=200&fit=crop&crop=face&auto=format`;

interface UserJob {
  id: string;
  info: string;
  payment: string;
  notes: string;
  review: string;
}

const mockUserJobs: UserJob[] = [
  { id: "Job-001", info: "Plumbing repair - Ikeja",     payment: "₦18,500", notes: "Completed 20/03/2026", review: "Excellent job done." },
  { id: "Job-002", info: "Electrical fix - Surulere",   payment: "₦25,000", notes: "In-progress",          review: "-"                  },
  { id: "Job-003", info: "Bathroom renovation - Lekki", payment: "₦12,000", notes: "Completed 15/03/2026", review: "Excellent job done." },
];

export default function UserDetail({ user, onBack }: { user: User; onBack: () => void }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── Back + Suspend ── */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[13.5px] font-medium text-text-main hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {user.name}
          </button>
          <button className="px-5 py-1.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
            Suspend
          </button>
        </div>

        {/* ── Profile: avatar + info ── */}
        <div className="flex items-start gap-2 mb-8">

          {/* Avatar — fixed 80×80, circular */}
          <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
            <Image
              src={avatarUrl(user.id)}
              alt={user.name}
              width={80}
              height={80}
              style={{ width: 80, height: 80, objectFit: "cover" }}
            />
          </div>

          {/* Info rows */}
          <div className="flex-1 text-[13px] space-y-2.5 pt-1">
            {[
              ["Name:",         user.name],
              ["Phone:",        "+234 801 234 5678"],
              ["Email:",        `${user.name.toLowerCase().replace(/[\s.]/g, "")}@email.com`],
              ["Location:",     "Ikeja, Lagos"],
              ["User Type",     user.type],
              ["Verification:", user.status.startsWith("Tier") ? user.status : "—"],
              ["Joined:",       user.joined],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="w-28 shrink-0 text-text-muted">{label}</span>
                <span className="text-text-main">{value}</span>
              </div>
            ))}
            <div className="flex gap-2 items-center">
              <span className="w-28 shrink-0 text-text-muted">Status:</span>
              <StatusBadge label={user.status} variant={statusVariant[user.status]} />
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-border mb-8" />

        {/* ── Jobs table ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Jobs", "Job Info", "Payments", "Notes", "Reviews"].map((h) => (
                  <th key={h} className="text-left pb-3 text-[13px] font-medium text-text-muted pr-8 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockUserJobs.map((job) => (
                <tr key={job.id} className="hover:bg-background transition-colors">
                  <td className="py-4 text-[13.5px] font-semibold text-text-main pr-8">{job.id}</td>
                  <td className="py-4 text-[13.5px] text-text-muted pr-8">{job.info}</td>
                  <td className="py-4 text-[13.5px] text-text-main pr-8">{job.payment}</td>
                  <td className="py-4 text-[13.5px] text-text-muted pr-8">{job.notes}</td>
                  <td className="py-4 text-[13.5px] text-text-muted">{job.review}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="mt-4 text-[13px] font-medium text-primary hover:opacity-70 transition-opacity">
          Load More
        </button>

      </div>

      {/* ── Sticky action bar ── */}
      <div className="shrink-0 flex border-t border-border bg-surface">
        <button className="flex-1 flex items-center justify-center gap-2 py-4 text-[13px] font-medium text-text-muted hover:bg-background transition-colors border-r border-border">
          <ShieldCheck size={15} /> Verify Tier 2
        </button>
        <button className="flex-1 py-4 text-[13px] font-medium text-text-muted hover:bg-background transition-colors border-r border-border">
          Suspend User
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-4 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={15} /> Delete Account
        </button>
      </div>
    </div>
  );
}