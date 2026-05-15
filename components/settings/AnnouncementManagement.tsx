// components/settings/AnnouncementManagement.tsx
"use client";

import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SubPageShell, FieldInput, FieldTextarea } from "./SettingsShared";
import { initialAnnouncements } from "@/components/settings/types";
import type { Announcement, AudienceType } from "@/components/settings/types";

const AUDIENCES: AudienceType[] = ["All users", "Clients Only", "Experts Only", "TAS Only"];

function CreateAnnouncementModal({ onClose, onSend }: {
  onClose: () => void;
  onSend: (a: Omit<Announcement, "id">) => void;
}) {
  const [title,      setTitle]    = useState("");
  const [message,    setMessage]  = useState("");
  const [audience,   setAudience] = useState<AudienceType>("All users");
  const [schedule,   setSchedule] = useState<"now" | "later">("now");
  const [date,       setDate]     = useState("");
  const [time,       setTime]     = useState("");

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
        Preview
      </button>
      <button
        onClick={() => {
          onSend({ title, audience, date: date || new Date().toLocaleDateString("en-GB"), status: schedule === "now" ? "Sent" : "Scheduled" });
          onClose();
        }}
        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold btn-primary"
      >
        Send
      </button>
    </>
  );

  return (
    <Modal open onClose={onClose} title="Create New Announcement" footer={footer}>
      <div className="space-y-4">
        <FieldInput label="Title" placeholder="New Category Alert" value={title} onChange={(e) => setTitle(e.target.value)} />
        <FieldTextarea label="Message" placeholder="enter message description..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />

        {/* Audience */}
        <div>
          <span className="text-[13px] font-medium text-text-main mr-3">Audience</span>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {AUDIENCES.map((a) => (
              <label key={a} className="flex items-center gap-1.5 text-[13px] text-text-main cursor-pointer">
                <input type="radio" name="audience" checked={audience === a} onChange={() => setAudience(a)} className="accent-primary" />
                {a}
              </label>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[13px] font-medium text-text-main">Schedule:</span>
          {(["now", "later"] as const).map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-[13px] text-text-main cursor-pointer">
              <input type="radio" name="schedule" checked={schedule === s} onChange={() => setSchedule(s)} className="accent-primary" />
              {s === "now" ? "Send now" : "Schedule for later:"}
            </label>
          ))}
          {schedule === "later" && (
            <div className="flex items-center gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-[12px] border border-border bg-background text-text-main outline-none focus:border-primary/40 transition-all" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-[12px] border border-border bg-background text-text-main outline-none focus:border-primary/40 transition-all" />
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
    <SubPageShell
      title="Announcements Management"
      onBack={onBack}
      action={
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Plus size={15} /> Create
        </button>
      }
    >
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {["Title", "Audience", "Date", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {announcements.map((a) => (
              <tr key={a.id} className="hover:bg-background transition-colors">
                <td className="px-6 py-4 text-[13.5px] text-text-main">{a.title}</td>
                <td className="px-6 py-4 text-[13.5px] text-text-muted">{a.audience}</td>
                <td className="px-6 py-4 text-[13.5px] text-text-muted">{a.date}</td>
                <td className="px-6 py-4 text-[13.5px] text-text-muted">{a.status}</td>
                <td className="px-6 py-4">
                  <button className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors">
                    <Eye size={17} strokeWidth={1.8} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateAnnouncementModal
          onClose={() => setShowCreate(false)}
          onSend={(a) => setAnnouncements((p) => [{ ...a, id: `a${Date.now()}` }, ...p])}
        />
      )}
    </SubPageShell>
  );
}