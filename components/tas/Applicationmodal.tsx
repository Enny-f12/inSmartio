"use client";

import {
  Download, Eye, CheckCircle2, Circle, X,
  User, Phone, Mail, Briefcase, Star, Hash,
  CalendarDays, Users, Tag, MessageSquare,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Application } from "@/components/tas/types";

export interface ApplicationModalProps {
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
    <>
      <style>{`
        .appmodal-inforow { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; margin-bottom: 12px; }
        .appmodal-label   { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); margin-bottom: 2px; }
        .appmodal-value   { font-size: 13px; color: var(--color-text-main); word-break: break-word; }

        @media (min-width: 480px) {
          .appmodal-inforow        { flex-direction: row; align-items: flex-start; }
          .appmodal-label          { font-size: 13px; font-weight: 400; text-transform: none; letter-spacing: 0; width: 160px; min-width: 160px; margin-bottom: 0; line-height: 1.5; }
          .appmodal-value          { font-size: 13px; }
        }
      `}</style>
      <div className="appmodal-inforow">
        <Icon size={14} style={{ color: "var(--color-text-muted)", marginTop: "2px", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="appmodal-label">{label}</p>
          <p className="appmodal-value">{value}</p>
        </div>
      </div>
    </>
  );
}

export default function ApplicationModal({ app, onClose }: ApplicationModalProps) {
  if (!app) return null;

  const footer = (
    <>
      <style>{`
        .appmodal-footer        { display: flex; flex-direction: column; gap: 8px; width: 100%; }
        .appmodal-footer-btns   { display: flex; gap: 8px; }
        .appmodal-approve-btn   { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #fff; background-color: #16a34a; border: none; cursor: pointer; flex: 1; white-space: nowrap; }
        .appmodal-reject-btn    { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #dc2626; background-color: #fef2f2; border: 1px solid #fecaca; cursor: pointer; flex: 1; white-space: nowrap; }
        .appmodal-more-btn      { width: 100%; padding: 10px; text-align: center; font-size: 13px; font-weight: 500; color: var(--color-text-muted); background: none; border: 1px solid var(--color-border); border-radius: 10px; cursor: pointer; }

        @media (min-width: 400px) {
          .appmodal-footer      { flex-direction: row; align-items: center; flex-wrap: wrap; }
          .appmodal-footer-btns { flex: 1; }
          .appmodal-more-btn    { width: auto; border: none; padding: 10px 4px; margin-left: auto; }
        }
      `}</style>
      <div className="appmodal-footer">
        <div className="appmodal-footer-btns">
          <button onClick={onClose} className="appmodal-approve-btn">
            <CheckCircle2 size={15} /> Approve as TAS
          </button>
          <button onClick={onClose} className="appmodal-reject-btn">
            <X size={15} /> Reject
          </button>
        </div>
        <button className="appmodal-more-btn">
          Request More Info
        </button>
      </div>
    </>
  );

  return (
    <Modal open={!!app} onClose={onClose} title="TAS Applications" size="md" footer={footer}>
      <style>{`
        .appmodal-section { border-radius: 12px; padding: 12px; background: var(--color-background); border: 1px solid var(--color-border); margin-bottom: 12px; }
        .appmodal-section:last-child { margin-bottom: 0; }
        .appmodal-section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-text-muted); margin-bottom: 12px; }
        .appmodal-doc-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .appmodal-doc-row:last-child { margin-bottom: 0; }
      `}</style>

      {/* Applicant Information */}
      <div className="appmodal-section">
        <p className="appmodal-section-label">Applicant Information</p>
        <InfoRow icon={User}         label="Name"                  value={app.fullName} />
        <InfoRow icon={Phone}        label="Phone"                 value={app.phone} />
        <InfoRow icon={Mail}         label="Email"                 value={app.email} />
        <InfoRow icon={Briefcase}    label="Type"                  value={`${app.type} (${app.expertId})`} />
        <InfoRow icon={Star}         label="Expert Rating"         value={`${app.expertRating} / 5`} />
        <InfoRow icon={Hash}         label="Expert Jobs Completed" value={String(app.jobsCompleted)} />
        <InfoRow icon={CalendarDays} label="Submitted"             value={app.submitted} />
      </div>

      {/* Application Details */}
      <div className="appmodal-section">
        <p className="appmodal-section-label">Application Details</p>
        <InfoRow icon={MessageSquare} label="Recruitment Experience" value={`"${app.recruitmentExperience}"`} />
        <InfoRow icon={Users}         label="Network Size"           value={app.networkSize} />
        <InfoRow icon={Tag}           label="Categories"             value={app.categories} />
        <InfoRow icon={MessageSquare} label="Why TAS"                value={`"${app.whyTas}"`} />
      </div>

      {/* Documents */}
      <div className="appmodal-section">
        <p className="appmodal-section-label">Documents</p>
        {app.documents.map(doc => (
          <div key={doc.name} className="appmodal-doc-row">
            <span style={{ flex: 1, fontSize: "13px", color: "var(--color-text-main)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {doc.name}
            </span>
            <button style={{ padding: "6px", borderRadius: "8px", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }} title="View">
              <Eye size={14} />
            </button>
            <button style={{ padding: "6px", borderRadius: "8px", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }} title="Download">
              <Download size={14} />
            </button>
            {doc.status === "Verified" ? (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 500, color: "#15803d", flexShrink: 0 }}>
                <CheckCircle2 size={13} /> Verified
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 500, color: "#d97706", flexShrink: 0 }}>
                <Circle size={13} /> Pending
              </span>
            )}
          </div>
        ))}
      </div>

    </Modal>
  );
}