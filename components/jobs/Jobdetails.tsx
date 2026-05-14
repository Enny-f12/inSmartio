// components/jobs/JobDetail.tsx
"use client";

import { ArrowLeft, Star } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import { StatusBadge } from "@/components/ui/Badge";
import type { Job, JobStatus } from "@/components/jobs/types";

const statusVariant: Record<JobStatus, "green" | "yellow" | "purple" | "red" | "gray"> = {
  Completed:  "green",
  Inprogress: "yellow",
  Bidding:    "purple",
  Disputed:   "red",
  Cancelled:  "gray",
};

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-4">
      {text}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[13px] mb-2">
      <span className="w-44 shrink-0 font-medium text-text-muted">{label}</span>
      <span className="text-text-main">{value}</span>
    </div>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star size={13} fill="#F9A826" color="#F9A826" />
      {value}
    </span>
  );
}

interface Props {
  job: Job;
  onBack: () => void;
}

export default function JobDetail({ job, onBack }: Props) {
  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Jobs" />

      <main className="flex-1 px-8 py-6 overflow-y-auto">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13.5px] font-medium text-text-main hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Jobs
        </button>

        {/* Content — no card, sections directly on page with dividers */}
        <div className="bg-surface rounded-2xl border border-border divide-y divide-border">

          {/* ── Job Information ── */}
          <div className="px-8 py-6">
            <SectionLabel text="Job Information" />
            <InfoRow label="Job ID:"      value={job.id} />
            <InfoRow label="Title"        value={job.title} />
            <InfoRow label="Category"     value={job.category} />
            <InfoRow label="Location:"    value={job.location} />
            <InfoRow label="Budget:"      value={job.budget} />
            <InfoRow label="Final Price:" value={job.finalPrice} />
            <InfoRow label="Created:"     value={job.created} />
            <InfoRow
              label="Status:"
              value={<StatusBadge label={job.status} variant={statusVariant[job.status]} />}
            />
          </div>

          {/* ── Client + Expert ── */}
          <div className="px-8 py-6 grid grid-cols-2 gap-8">
            <div>
              <SectionLabel text="Client" />
              <InfoRow label="Name:"   value={job.client} />
              <InfoRow label="Phone:"  value={job.clientPhone} />
              <InfoRow label="Email:"  value={job.clientEmail} />
              <InfoRow label="Rating:" value={<Rating value={job.clientRating} />} />
            </div>
            <div>
              <SectionLabel text="Expert" />
              {job.expert ? (
                <>
                  <InfoRow label="Name:"   value={job.expert} />
                  <InfoRow label="Phone:"  value={job.expertPhone!} />
                  <InfoRow label="Email:"  value={job.expertEmail!} />
                  <InfoRow label="Rating:" value={<Rating value={job.expertRating!} />} />
                </>
              ) : (
                <p className="text-[13px] text-text-muted">No expert assigned yet.</p>
              )}
            </div>
          </div>

          {/* ── Payment Information ── */}
          <div className="px-8 py-6">
            <SectionLabel text="Payment Information" />
            <InfoRow label="Payment Method:"                            value={job.paymentMethod} />
            <InfoRow label="Amount"                                     value={job.amount} />
            <InfoRow label={`Platform Commission (${job.commission}):`} value={job.commissionAmt} />
            <InfoRow label="Expert Payout:"                             value={job.expertPayout} />
            <InfoRow label="Payment Status:"                            value={job.paymentStatus} />
          </div>

          {/* ── Timeline ── */}
          <div className="px-8 py-6">
            <SectionLabel text="Timeline" />
            <div className="space-y-3">
              {job.timeline.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-primary" />
                  <p className="text-[13px]">
                    <span className="font-medium text-text-main">{event.datetime} - </span>
                    <span className="text-text-muted">{event.label}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}