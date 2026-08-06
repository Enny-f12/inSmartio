// app/(dashboard)/reports/components/VerificationDetailModal.tsx
"use client";

import { Eye, Download, CheckCircle2, XCircle, Clock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { pick } from "./rowUtils";
import { colors } from "./shared";

type Row = Record<string, unknown>;

// Shape of a single entry in row.document — matches the verification
// detailed-report API (report rows already return `document` as a flat
// array, unlike the single-applicant detail endpoint which returns it as
// an index-keyed object).
interface ApiDoc {
  url?: string;
  type?: string;
  reason?: string | null;
  reject?: boolean;
  verify?: boolean;
  date?: string;
}

type DocStatus = "verified" | "rejected" | "pending";

const TYPE_LABEL: Record<string, string> = {
  ninslip: "NIN Slip",
  bvnconsent: "BVN Consent Form",
  governmentid: "Government ID",
  profilephoto: "Profile Photo",
  addressproof: "Proof of Address",
  guarantorform: "Guarantor Form",
  policeclearance: "Police Clearance Certificate",
  portfolio: "Portfolio",
};

const normaliseKey = (s: string) => s.toLowerCase().replace(/[\s_\-]/g, "");

// Cloudinary ignores the HTML `download` attribute for cross-origin URLs —
// fl_attachment forces a real download instead of just opening the file.
function toDownloadUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("/fl_attachment")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}

// verify/reject are independent booleans on each doc — reject wins if both
// are somehow true, and neither set means the doc is still pending review.
function docStatus(d: ApiDoc): DocStatus {
  if (d.reject === true) return "rejected";
  if (d.verify === true) return "verified";
  return "pending";
}

function getDocs(row: Row): ApiDoc[] {
  const raw = row["document"];
  return Array.isArray(raw) ? (raw as ApiDoc[]) : [];
}

const STATUS_META: Record<DocStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  verified: { bg: "#f0fdf4", text: "#15803d", icon: <CheckCircle2 size={12} />, label: "Verified" },
  rejected: { bg: "#fef2f2", text: "#dc2626", icon: <XCircle size={12} />, label: "Rejected" },
  pending: { bg: "#F3F4F6", text: "#6B7280", icon: <Clock size={12} />, label: "Pending" },
};

function StatusBadge({ status }: { status: DocStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: meta.bg,
        color: meta.text,
        whiteSpace: "nowrap",
      }}
    >
      {meta.icon} {meta.label}
    </span>
  );
}

// Read-only row: view + download icons plus a status badge. No checkboxes,
// no reject-reason inputs, no API calls — this is a report, not an editor.
function DocRow({ doc }: { doc: ApiDoc }) {
  const label = TYPE_LABEL[normaliseKey(doc.type ?? "")] ?? (doc.type || "Document");
  const status = docStatus(doc);
  const has = !!doc.url && doc.url.length > 10;

  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ flex: 1, fontSize: "13px", color: "#111827" }}>{label}</span>

        {has ? (
          <>
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              title="View"
              style={{ color: "#9CA3AF", display: "flex" }}
            >
              <Eye size={15} />
            </a>
            <a
              href={toDownloadUrl(doc.url as string)}
              download
              title="Download"
              style={{ color: "#9CA3AF", display: "flex" }}
            >
              <Download size={15} />
            </a>
          </>
        ) : (
          <span style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>N/A</span>
        )}

        <StatusBadge status={status} />
      </div>

      {status === "rejected" && doc.reason && (
        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#b91c1c" }}>Reason: {doc.reason}</p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", alignItems: "flex-start" }}>
      <span style={{ width: "120px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#111827", flex: 1, wordBreak: "break-word" }}>{value ?? "—"}</span>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p
      style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#6B7280",
        margin: "0 0 12px",
      }}
    >
      {title}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#F9FAFB", borderRadius: "12px", padding: "14px 16px", marginBottom: "10px" }}>
      {children}
    </div>
  );
}

const OVERALL_STATUS_META: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  approved: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: <CheckCircle2 size={18} color="#16a34a" /> },
  rejected: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", icon: <XCircle size={18} color="#dc2626" /> },
  pending: { bg: "#F9FAFB", border: "#E5E7EB", text: "#374151", icon: <Clock size={18} color="#6B7280" /> },
};

interface Props {
  row: Row;
  onClose: () => void;
}

export default function VerificationDetailModal({ row, onClose }: Props) {
  const docs = getDocs(row);
  const verifiedCount = docs.filter((d) => docStatus(d) === "verified").length;
  const rejectedCount = docs.filter((d) => docStatus(d) === "rejected").length;

  const overallStatus = pick(row, ["status"], "pending").toLowerCase();
  const overallMeta = OVERALL_STATUS_META[overallStatus] ?? OVERALL_STATUS_META.pending;

  return (
    <Modal open onClose={onClose} title="Verification Detail" size="md">
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Overall status banner — reflects the report's own status field,
            not recomputed here, since this is a read-only view. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "10px",
            backgroundColor: overallMeta.bg,
            border: `1px solid ${overallMeta.border}`,
          }}
        >
          {overallMeta.icon}
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: overallMeta.text, textTransform: "capitalize" }}>
              {overallStatus}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: colors.textMuted }}>
              {verifiedCount} verified · {rejectedCount} rejected · {docs.length} total document
              {docs.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <Card>
          <SectionTitle title="Applicant Information" />
          <InfoRow label="Name:" value={pick(row, ["name", "fullName"])} />
          <InfoRow label="Phone:" value={pick(row, ["phone", "phoneNumber"])} />
          <InfoRow label="Email:" value={pick(row, ["email"])} />
          <InfoRow label="Tier:" value={`Tier ${pick(row, ["tier", "verificationTier"])}`} />
          <InfoRow label="Officer:" value={pick(row, ["officer", "assignedOfficer"])} />
          <InfoRow
            label="Submitted:"
            value={(() => {
              const raw = pick(row, ["submitted", "submittedAt", "createdAt"], "");
              const d = raw ? new Date(raw) : null;
              return d && !isNaN(d.getTime()) ? d.toLocaleDateString("en-GB") : raw || "—";
            })()}
          />
        </Card>

        <Card>
          <SectionTitle title={`Documents (${docs.length})`} />
          {docs.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No documents found.</p>
          ) : (
            docs.map((d, i) => <DocRow key={d.url ?? i} doc={d} />)
          )}
        </Card>
      </div>
    </Modal>
  );
}