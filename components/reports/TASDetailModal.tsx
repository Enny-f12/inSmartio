// app/(dashboard)/reports/components/TASDetailModal.tsx
"use client";

import Modal from "@/components/ui/Modal";
import { pick, fmtNairaCell } from "./rowUtils";
import { colors } from "./shared";
import type { TasLocation, TasBankDetails } from "@/lib/api/detailedReportApi";

type Row = Record<string, unknown>;

function getLocation(row: Row): TasLocation | undefined {
  const raw = row["location"];
  return raw && typeof raw === "object" ? (raw as TasLocation) : undefined;
}

function getBankDetails(row: Row): TasBankDetails | undefined {
  const raw = row["bankDetails"];
  return raw && typeof raw === "object" ? (raw as TasBankDetails) : undefined;
}


function pickAddress(row: Row): string {
  const loc = getLocation(row);
  if (loc?.address && loc.address.trim()) return loc.address.trim();
  const parts = [loc?.area, loc?.city, loc?.state, loc?.country].filter((p) => p && p.trim());
  return parts.length ? parts.join(", ") : "—";
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "13px", marginBottom: "8px", alignItems: "flex-start" }}>
      <span style={{ width: "130px", flexShrink: 0, color: "#6B7280" }}>{label}</span>
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

interface Props {
  row: Row;
  onClose: () => void;
}

export default function TASDetailModal({ row, onClose }: Props) {
  const status = pick(row, ["status"], "—");
  const bank = getBankDetails(row);

  return (
    <Modal open onClose={onClose} title="TAS Agent Detail" size="md">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Card>
          <SectionTitle title="Agent Information" />
          <InfoRow label="Name:" value={pick(row, ["name"])} />
          <InfoRow label="Phone:" value={pick(row, ["phone"])} />
          <InfoRow label="Email:" value={pick(row, ["email"])} />
          <InfoRow label="Tier:" value={pick(row, ["tier"])} />
          <InfoRow
            label="Status:"
            value={
              <span style={{ textTransform: "capitalize", fontWeight: 600, color: status === "active" ? colors.green : colors.textMain }}>
                {status}
              </span>
            }
          />
        </Card>

        <Card>
          <SectionTitle title="Performance" />
          <InfoRow label="Experts Recruited:" value={pick(row, ["expertsRecruited"])} />
          <InfoRow label="Earnings:" value={fmtNairaCell(row, ["earnings"])} />
          <InfoRow
            label="Joined:"
            value={(() => {
              const raw = pick(row, ["joined"], "");
              const d = raw ? new Date(raw) : null;
              return d && !isNaN(d.getTime()) ? d.toLocaleDateString("en-GB") : raw || "—";
            })()}
          />
        </Card>

        <Card>
          <SectionTitle title="Location" />
          <InfoRow label="Address:" value={pickAddress(row)} />
        </Card>

        {bank && (
          <Card>
            <SectionTitle title="Bank Details" />
            <InfoRow label="Bank:" value={bank.bankName || "—"} />
            <InfoRow label="Account Name:" value={bank.accountName || "—"} />
            <InfoRow label="Account Number:" value={bank.accountNumber || "—"} />
            {bank.bvn ? <InfoRow label="BVN:" value={bank.bvn} /> : null}
          </Card>
        )}
      </div>
    </Modal>
  );
}