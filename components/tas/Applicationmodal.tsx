"use client";

import {
  Download, Eye, CheckCircle2, Circle, X,
  User, Phone, Mail, Briefcase, Star, Hash,
  CalendarDays, Users, Tag, MessageSquare,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Application } from "@/components/tas/types";

interface ApplicationModalProps {
  app: Application | null;
  onClose: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-[13px] mb-3">
      <Icon size={14} className="text-text-muted shrink-0 mt-0.5" />
      <span className="w-44 shrink-0 text-text-muted">{label}</span>
      <span className="text-text-main">{value}</span>
    </div>
  );
}

export default function ApplicationModal({ app, onClose }: ApplicationModalProps) {
  if (!app) return null;

  const footer = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
      <button
        onClick={onClose}
        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: "pointer" }}
      >
        <CheckCircle2 size={15} /> Approve as TAS
      </button>
      <button
        onClick={onClose}
        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", cursor: "pointer" }}
      >
        <X size={15} /> Reject
      </button>
      <button
        style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}
      >
        Request More Info
      </button>
    </div>
  );

  return (
    <Modal open={!!app} onClose={onClose} title="TAS Applications" size="md" footer={footer}>
      <div className="space-y-4">

        {/* ── Applicant Information ── */}
        <div className="rounded-xl p-4 bg-background border border-border">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-text-muted">
            Applicant Information
          </p>
          <InfoRow icon={User}         label="Name:"                  value={app.fullName} />
          <InfoRow icon={Phone}        label="Phone:"                 value={app.phone} />
          <InfoRow icon={Mail}         label="Email:"                 value={app.email} />
          <InfoRow icon={Briefcase}    label="Type:"                  value={`${app.type} (${app.expertId})`} />
          <InfoRow icon={Star}         label="Expert Rating:"         value={`${app.expertRating} / 5`} />
          <InfoRow icon={Hash}         label="Expert Jobs Completed:" value={String(app.jobsCompleted)} />
          <InfoRow icon={CalendarDays} label="Submitted:"             value={app.submitted} />
        </div>

        {/* ── Application Details ── */}
        <div className="rounded-xl p-4 bg-background border border-border">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-text-muted">
            Application Details
          </p>
          <InfoRow icon={MessageSquare} label="Recruitment Experience:" value={`"${app.recruitmentExperience}"`} />
          <InfoRow icon={Users}         label="Network Size:"           value={app.networkSize} />
          <InfoRow icon={Tag}           label="Categories:"             value={app.categories} />
          <InfoRow icon={MessageSquare} label="Why TAS:"                value={`"${app.whyTas}"`} />
        </div>

        {/* ── Documents ── */}
        <div className="rounded-xl p-4 bg-background border border-border">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-text-muted">
            Documents
          </p>
          {app.documents.map(doc => (
            <div key={doc.name} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="flex-1 text-[13px] text-text-main">{doc.name}</span>
              <button className="p-1.5 rounded-lg text-primary hover:bg-background transition-colors" title="View">
                <Eye size={14} />
              </button>
              <button className="p-1.5 rounded-lg text-primary hover:bg-background transition-colors" title="Download">
                <Download size={14} />
              </button>
              {doc.status === "Verified" ? (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-green-700">
                  <CheckCircle2 size={13} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-amber-600">
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