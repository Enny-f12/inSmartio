// app/(dashboard)/reports/components/TASDetailModal.tsx
"use client";

import Modal from "@/components/ui/Modal";
import { pick, fmtNairaCell } from "./rowUtils";
import { colors } from "./shared";

type Row = Record<string, unknown>;

interface Location {
  area?: string;
  city?: string;
  state?: string;
  address?: string;
  country?: string;
}

function getLocation(row: Row): Location | undefined {
  const raw = row["location"];
  return raw && typeof raw === "object" ? (raw as Location) : undefined;
}

// The API's `location` field is an object ({ area, city, state, address,
// country }) — a generic row dump would render that as "[object Object]".
// Prefer the pre-built `address` string; if it's missing, assemble one from
// whichever parts are non-empty instead of showing raw keys.
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
      </div>
    </Modal>
  );
}