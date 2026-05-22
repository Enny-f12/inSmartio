// components/tas/Applicationmodal.tsx
"use client";

import { CheckCircle2, X, User, Phone, Mail, CalendarDays, MapPin, Tag, FileText, Hash } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { ActiveAgent } from "@/components/tas/types";

interface ApplicationModalProps {
  agent:   ActiveAgent;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: "12px", backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)", padding: "16px", marginBottom: "12px" }}>
      <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "12px" }}>{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px", fontSize: "13px" }}>
      <Icon size={14} style={{ color: "#9CA3AF", marginTop: "2px", flexShrink: 0 }} />
      <span style={{ minWidth: "130px", flexShrink: 0, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-main)", wordBreak: "break-word", flex: 1 }}>{value || "—"}</span>
    </div>
  );
}

export default function ApplicationModal({ agent, onClose }: ApplicationModalProps) {
  const doc = agent.document;

  // Build location string safely
  const locationStr = agent.location
    ? [agent.location.area, agent.location.city, agent.location.state, agent.location.country]
        .filter(Boolean).join(", ") || undefined
    : undefined;

  // Format dob safely
  const dobStr = agent.dob
    ? (() => { try { return new Date(agent.dob).toLocaleDateString("en-GB"); } catch { return agent.dob; } })()
    : undefined;

  const footer = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", flexWrap: "wrap" }}>
      <button onClick={onClose}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#fff", backgroundColor: "#16a34a", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
        <CheckCircle2 size={15} /> Approve as TAS
      </button>
      <button onClick={onClose}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", cursor: "pointer", whiteSpace: "nowrap" }}>
        <X size={14} /> Reject
      </button>
      <a href={`mailto:${agent.email}?subject=TAS%20Application%20-%20More%20Info%20Needed`}
        style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 500, color: "var(--color-text-muted)", textDecoration: "none", whiteSpace: "nowrap" }}>
        Request More Info
      </a>
    </div>
  );

  return (
    <Modal open onClose={onClose} title="TAS Application" size="md" footer={footer}>
      <div style={{ display: "flex", flexDirection: "column" }}>

        <Section title="Personal Information">
          <InfoRow icon={User}         label="Full Name:"     value={agent.fullName} />
          <InfoRow icon={Hash}         label="Username:"      value={agent.tasId} />
          <InfoRow icon={Phone}        label="Phone:"         value={agent.phone} />
          <InfoRow icon={Mail}         label="Email:"         value={agent.email} />
          <InfoRow icon={CalendarDays} label="Date of Birth:" value={dobStr} />
          <InfoRow icon={CalendarDays} label="Applied:"       value={agent.joined} />
          <InfoRow icon={Hash}         label="App. Code:"     value={agent.applicationCode} />
        </Section>

        {agent.category && (
          <Section title="Category">
            <InfoRow icon={Tag} label="Category:" value={agent.category} />
          </Section>
        )}

        {locationStr && (
          <Section title="Location">
            <InfoRow icon={MapPin} label="Location:" value={locationStr} />
          </Section>
        )}

        {(agent.bankName || agent.accountNo) && (
          <Section title="Bank Details">
            <InfoRow icon={Hash} label="Bank Name:"  value={agent.bankName} />
            <InfoRow icon={Hash} label="Account No:" value={agent.accountNo} />
          </Section>
        )}

        {doc && Object.keys(doc).length > 0 && (
          <Section title="Documents">
            {Object.entries(doc).map(([key, val]) => (
              <InfoRow key={key} icon={FileText}
                label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()) + ":"}
                value={val || "Not uploaded"}
              />
            ))}
          </Section>
        )}

      </div>
    </Modal>
  );
}