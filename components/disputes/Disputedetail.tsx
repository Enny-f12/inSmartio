// components/disputes/DisputeDetail.tsx
"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PriorityLabel, DisputeStatusBadge } from "./DisputeBadges";
import type { Dispute, Resolution } from "@/components/disputes/types";

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-text-muted">
      {text}
    </p>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-[13px] mb-1.5">
      <span className="w-36 shrink-0 text-text-muted">{label}</span>
      <span className="text-text-main">{children}</span>
    </div>
  );
}

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: "full_expert", label: "Full payment to expert"  },
  { value: "full_client", label: "Full refund to client"   },
  { value: "dismiss",     label: "Dismiss dispute"         },
  { value: "partial",     label: "Partial payment (__%)"   },
  { value: "reperform",   label: "Re-performance ordered"  },
];

interface Props {
  dispute: Dispute;
  onBack: () => void;
}

export default function DisputeDetail({ dispute, onBack }: Props) {
  const [resolution,     setResolution]     = useState<Resolution>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [partialPct,     setPartialPct]     = useState("");

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-background">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13.5px] font-medium text-text-main hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Disputes
        </button>

        <div className="rounded-2xl bg-surface border border-border divide-y divide-border">

          {/* ── Case Information ── */}
          <div className="px-8 py-6">
            <SectionLabel text="Case Information" />
            <InfoRow label="Case ID:">{dispute.id}</InfoRow>
            <InfoRow label="Job ID:">{dispute.jobId}</InfoRow>
            <InfoRow label="Opened:">{dispute.opened}</InfoRow>
            <InfoRow label="Priority:"><PriorityLabel priority={dispute.priority} /></InfoRow>
            <InfoRow label="Amount in Escrow:">{dispute.escrowAmount}</InfoRow>
            <InfoRow label="Status:"><DisputeStatusBadge status={dispute.status} /></InfoRow>
          </div>

          {/* ── Statements ── */}
          <div className="px-8 py-6 grid grid-cols-2 gap-8">
            {/* Client */}
            <div>
              <SectionLabel text="Client Statement" />
              <p className="text-[13px] italic text-text-main mb-4">
                &ldquo;{dispute.clientStatement}&rdquo;
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-text-muted">
                Evidence:
              </p>
              <div className="flex gap-2 mb-3">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center text-[10px] text-text-muted"
                  >
                    IMG
                  </div>
                ))}
              </div>
              <button className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-primary text-primary hover:bg-primary/5 transition-colors">
                View chat Log
              </button>
            </div>

            {/* Expert */}
            <div>
              <SectionLabel text="Expert Statement" />
              <p className="text-[13px] italic text-text-main mb-4">
                &ldquo;{dispute.expertStatement}&rdquo;
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-text-muted">
                Evidence:
              </p>
              <div className="flex gap-2 mb-3">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center text-[10px] text-text-muted"
                  >
                    IMG
                  </div>
                ))}
              </div>
              <button className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-primary text-primary hover:bg-primary/5 transition-colors">
                View chat Log
              </button>
            </div>
          </div>

          {/* ── Mediation Notes ── */}
          <div className="px-8 py-6">
            <SectionLabel text="Mediation Notes" />
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              {dispute.mediationNotes.map((n, i) => (
                <div
                  key={i}
                  className={`flex gap-4 px-4 py-3 text-[13px] ${
                    i < dispute.mediationNotes.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="shrink-0 font-medium text-text-muted whitespace-nowrap">
                    [{n.timestamp}]
                  </span>
                  <span className="text-text-main">{n.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Resolution ── */}
          <div className="px-8 py-6">
            <SectionLabel text="Resolution" />
            <div className="space-y-2.5 mb-5">
              {RESOLUTION_OPTIONS.map((opt) => (
                <label
                  key={String(opt.value)}
                  className="flex items-center gap-2.5 cursor-pointer text-[13px] text-text-main"
                >
                  <input
                    type="radio"
                    name="resolution"
                    value={opt.value ?? ""}
                    checked={resolution === opt.value}
                    onChange={() => setResolution(opt.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  {opt.label}
                  {opt.value === "partial" && resolution === "partial" && (
                    <input
                      type="text"
                      placeholder="e.g. 70"
                      value={partialPct}
                      onChange={(e) => setPartialPct(e.target.value)}
                      className="ml-1 w-16 px-2 py-0.5 rounded-lg text-[12px] outline-none border border-border bg-background text-text-main focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  )}
                </label>
              ))}
            </div>

            <p className="text-[13px] font-medium text-text-main mb-1.5">Decision reason:</p>
            <textarea
              rows={3}
              placeholder="[Insufficient evidence of pre-damage, 70% payment...]"
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="shrink-0 flex items-center gap-3 px-8 py-4 bg-surface border-t border-border">
        <button className="btn-primary flex-1 py-3 rounded-xl text-[13px] font-semibold">
          Submit Decision
        </button>
        <button className="flex-1 py-3 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
          Save Draft
        </button>
        <button className="flex-1 py-3 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
          Appeal Later
        </button>
      </div>
    </div>
  );
}