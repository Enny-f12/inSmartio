// components/settings/AnnouncementManagement.tsx
"use client";

import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SubPageShell, FieldInput, FieldTextarea } from "./SettingsShared";
import { initialAnnouncements } from "@/components/settings/types";
import type { Announcement, AudienceType } from "@/components/settings/types";

const AUDIENCES: AudienceType[] = ["All users", "Clients Only", "Experts Only", "TAS Only"];

function StatusBadge({ status }: { status: string }) {
  const sent = status === "Sent";
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", whiteSpace: "nowrap",
      backgroundColor: sent ? "#dcfce7" : "#fffbeb",
      color:           sent ? "#15803d" : "#d97706",
      border:          sent ? "1px solid #bbf7d0" : "1px solid #fde68a",
    }}>
      {status}
    </span>
  );
}

function CreateAnnouncementModal({ onClose, onSend }: {
  onClose: () => void;
  onSend: (a: Omit<Announcement, "id">) => void;
}) {
  const [title,    setTitle]    = useState("");
  const [message,  setMessage]  = useState("");
  const [audience, setAudience] = useState<AudienceType>("All users");
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [date,     setDate]     = useState("");
  const [time,     setTime]     = useState("");

  const footer = (
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
        Preview
      </button>
      <button
        onClick={() => {
          onSend({ title, audience, date: date || new Date().toLocaleDateString("en-GB"), status: schedule === "now" ? "Sent" : "Scheduled" });
          onClose();
        }}
        className="btn-primary"
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
      >
        Send
      </button>
    </div>
  );

  return (
    <Modal open onClose={onClose} title="Create New Announcement" footer={footer}>
      <style>{`
        .ann-schedule-row { display: flex; flex-direction: column; gap: 10px; }
        .ann-date-inputs  { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (min-width: 480px) {
          .ann-schedule-row { flex-direction: row; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Title + Message */}
        <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <FieldInput label="Title" placeholder="New Category Alert" value={title} onChange={(e) => setTitle(e.target.value)} />
          <FieldTextarea label="Message" placeholder="Enter message description..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        {/* Audience */}
        <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "10px" }}>Audience</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {AUDIENCES.map((a) => (
              <label key={a} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-main)", cursor: "pointer", padding: "8px 10px", borderRadius: "10px", border: `1px solid ${audience === a ? "var(--color-primary)" : "var(--color-border)"}`, backgroundColor: audience === a ? "color-mix(in srgb, var(--color-primary) 6%, transparent)" : "var(--color-background)" }}>
                <input type="radio" name="audience" checked={audience === a} onChange={() => setAudience(a)} style={{ accentColor: "var(--color-primary)", width: "14px", height: "14px", flexShrink: 0 }} />
                {a}
              </label>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "10px" }}>Schedule</p>
          <div className="ann-schedule-row">
            {(["now", "later"] as const).map((s) => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-main)", cursor: "pointer" }}>
                <input type="radio" name="schedule" checked={schedule === s} onChange={() => setSchedule(s)} style={{ accentColor: "var(--color-primary)", width: "14px", height: "14px" }} />
                {s === "now" ? "Send now" : "Schedule for later"}
              </label>
            ))}
          </div>
          {schedule === "later" && (
            <div className="ann-date-inputs" style={{ marginTop: "12px" }}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                style={{ flex: 1, minWidth: "120px", padding: "8px 12px", borderRadius: "10px", fontSize: "13px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", outline: "none" }} />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                style={{ flex: 1, minWidth: "100px", padding: "8px 12px", borderRadius: "10px", fontSize: "13px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", outline: "none" }} />
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}

export default function AnnouncementManagement({ onBack }: { onBack: () => void }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [showCreate,    setShowCreate]    = useState(false);

  return (
    <>
      <style>{`
        .ann-table { display: none; width: 100%; border-collapse: collapse; }
        .ann-cards { display: flex; flex-direction: column; gap: 10px; }
        @media (min-width: 640px) {
          .ann-table { display: table; }
          .ann-cards { display: none; }
        }
      `}</style>

      <SubPageShell
        title="Announcements"
        onBack={onBack}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            <Plus size={15} /> Create
          </button>
        }
      >
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden", marginTop: "20px" }}>

          {/* Desktop table */}
          <table className="ann-table">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                {["Title", "Audience", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px", fontSize: "14px", color: "var(--color-text-muted)" }}>No announcements yet.</td></tr>
              ) : announcements.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 24px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)" }}>{a.title}</td>
                  <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{a.audience}</td>
                  <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{a.date}</td>
                  <td style={{ padding: "16px 24px" }}><StatusBadge status={a.status} /></td>
                  <td style={{ padding: "16px 24px" }}>
                    <button style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                      <Eye size={17} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="ann-cards" style={{ padding: "12px" }}>
            {announcements.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No announcements yet.</p>
            ) : announcements.map((a) => (
              <div key={a.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", flex: 1, minWidth: 0 }}>{a.title}</p>
                  <StatusBadge status={a.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{a.audience}</span>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{a.date}</span>
                  </div>
                  <button style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}>
                    <Eye size={15} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {showCreate && (
          <CreateAnnouncementModal
            onClose={() => setShowCreate(false)}
            onSend={(a) => setAnnouncements((p) => [{ ...a, id: `a${Date.now()}` }, ...p])}
          />
        )}
      </SubPageShell>
    </>
  );
}