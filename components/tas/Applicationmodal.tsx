"use client";

import { Download, Eye, CheckCircle2, Circle, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Application } from "@/components/tas/types";

interface ApplicationModalProps {
  app: Application | null;
  onClose: () => void;
}

export default function ApplicationModal({ app, onClose }: ApplicationModalProps) {
  if (!app) return null;

  const footer = (
    <>
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
      >
        <CheckCircle2 size={16} /> Approve as TAS
      </button>
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
      >
        <X size={15} /> Reject
      </button>
      <button className="text-[13px] font-medium ml-auto text-text-muted hover:text-text-main transition-colors">
        Request More Info
      </button>
    </>
  );

  return (
    <Modal open={!!app} onClose={onClose} title="TAS Applications" size="md" footer={footer}>
      <div className="space-y-4">

        {/* Applicant Information */}
        <div className="rounded-xl p-4 bg-background border border-border">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-text-muted">
            Applicant Information
          </p>
          {[
            ["Name:",                  app.fullName],
            ["Phone:",                 app.phone],
            ["Email:",                 app.email],
            ["Type:",                  `${app.type} (${app.expertId})`],
            ["Expert Rating:",         `⭐ ${app.expertRating}`],
            ["Expert Jobs Completed:", String(app.jobsCompleted)],
            ["Submitted:",             app.submitted],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 text-[13px] mb-1.5">
              <span className="w-44 shrink-0 text-text-muted">{label}</span>
              <span className="text-text-main">{value}</span>
            </div>
          ))}
        </div>

        {/* Application Details */}
        <div className="rounded-xl p-4 bg-background border border-border">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-text-muted">
            Application Details
          </p>
          {[
            ["Recruitment Experience:", `"${app.recruitmentExperience}"`],
            ["Network Size:",           app.networkSize],
            ["Categories:",             app.categories],
            ["Why TAS:",                `"${app.whyTas}"`],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 text-[13px] mb-1.5">
              <span className="w-44 shrink-0 text-text-muted">{label}</span>
              <span className="text-text-main">{value}</span>
            </div>
          ))}
        </div>

        {/* Documents */}
        <div className="rounded-xl p-4 bg-background border border-border">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-text-muted">
            Documents
          </p>
          {app.documents.map(doc => (
            <div key={doc.name} className="flex items-center gap-2 mb-2.5">
              <span className="flex-1 text-[13px] text-text-main">{doc.name}</span>
              <button className="text-primary hover:opacity-70 transition-opacity">
                <Eye size={14} />
              </button>
              <button className="text-primary hover:opacity-70 transition-opacity">
                <Download size={14} />
              </button>
              {doc.status === "Verified" ? (
                <span className="flex items-center gap-1 text-[12px] text-green-700">
                  <CheckCircle2 size={13} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[12px] text-amber-700">
                  <Circle size={13} /> Pending
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </Modal>
  );
}