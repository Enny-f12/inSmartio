// components/settings/AnnouncementManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Eye, Pencil, Trash2, Loader2, Calendar, Users, Info, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SubPageShell, FieldInput, FieldTextarea } from "./SettingsShared";

import {
  fetchAnnouncements,
  addAnnouncement,
  editAnnouncement,
  removeAnnouncement,
  resetMutateStatus
} from "@/lib/redux/announcementSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { CreateAnnouncementPayload, UpdateAnnouncementPayload, ApiAnnouncement } from "@/lib/api/announcementApi";

// ── Mock Fallback Config ──────────────────────────────────
const MOCK_FALLBACK_DATA: ApiAnnouncement[] = [
  {
    id: "mock-ann-1",
    title: "System Maintenance Downtime",
    message: "Our primary database servers will undergo a standard update cycles starting midnight.",
    audience: { all: true, client: true, expert: true, tas: true },
    schedule: { now: true, later: false },
    status: "sent",
    createdAt: "2026-05-18T14:30:00.000Z"
  }
];

type ClientAudienceLabel = "All users" | "Clients Only" | "Experts Only" | "TAS Only";
const AUDIENCES: ClientAudienceLabel[] = ["All users", "Clients Only", "Experts Only", "TAS Only"];

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isSent = normalized === "sent";
  const isScheduled = normalized === "scheduled" || normalized === "pending";
  
  let bg = "#f3f4f6";
  let color = "#6b7280";
  let border = "#e5e7eb";

  if (isSent) {
    bg = "#dcfce7"; color = "#15803d"; border = "#bbf7d0";
  } else if (isScheduled) {
    bg = "#fffbeb"; color = "#d97706"; border = "#fde68a";
  }

  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", whiteSpace: "nowrap",
      backgroundColor: bg, color: color, border: `1px solid ${border}`
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────
interface DeleteModalProps {
  id: string;
  onClose: () => void;
}
function DeleteAnnouncementModal({ id, onClose }: DeleteModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { mutateStatus } = useSelector((state: RootState) => state.announcements);

  const handleConfirmDelete = async () => {
    await dispatch(removeAnnouncement(id));
  };

  const isDeleting = mutateStatus === "loading";

  return (
    <Modal open onClose={onClose} title="Remove Announcement">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center", padding: "8px 0" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>Are you absolutely sure?</h4>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>This action is permanent and will instantly retract this notification layout across active target screens.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "8px" }}>
          <button onClick={onClose} disabled={isDeleting} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", backgroundColor: "#ef4444", color: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Confirm Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Detail View Modal ─────────────────────────────────────
function ViewAnnouncementModal({ announcement, onClose }: { announcement: ApiAnnouncement; onClose: () => void }) {
  const getAudienceString = (aud: ApiAnnouncement["audience"]) => {
    if (!aud) return "None Specified";
    if (aud.all) return "All users";
    const targets: string[] = [];
    if (aud.client) targets.push("Clients");
    if (aud.expert) targets.push("Experts");
    if (aud.tas) targets.push("TAS");
    return targets.join(", ") || "None Specified";
  };

  return (
    <Modal open onClose={onClose} title="Announcement Details">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 0" }}>
        <div>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "6px" }}>{announcement.title}</h4>
          <StatusBadge status={announcement.status} />
        </div>
        <div style={{ backgroundColor: "var(--color-background)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "13.5px", color: "var(--color-text-main)", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{announcement.message}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={14} /> <strong>Audience:</strong> {getAudienceString(announcement.audience)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} /> <strong>Created At:</strong> {new Date(announcement.createdAt).toLocaleString()}
          </div>
          {announcement.schedule?.later && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#d97706" }}>
              <Info size={14} /> <strong>Release Schedule:</strong> {announcement.schedule.date} at {announcement.schedule.time}
            </div>
          )}
        </div>
        <button onClick={onClose} className="btn-primary" style={{ width: "100%", padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", marginTop: "8px" }}>
          Close View
        </button>
      </div>
    </Modal>
  );
}

// ── Combined Form Modal (Create and Edit Behavior) ────────
interface FormModalProps {
  onClose: () => void;
  announcementToEdit?: ApiAnnouncement | null;
}
function AnnouncementFormModal({ onClose, announcementToEdit }: FormModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { mutateStatus } = useSelector((state: RootState) => state.announcements);

  const [title, setTitle] = useState(announcementToEdit?.title ?? "");
  const [message, setMessage] = useState(announcementToEdit?.message ?? "");

  // Reverse mapping API audience values to client-friendly label options
  const getInitialAudienceLabel = (aud?: ApiAnnouncement["audience"]): ClientAudienceLabel => {
    if (!aud || aud.all) return "All users";
    if (aud.client && !aud.expert && !aud.tas) return "Clients Only";
    if (aud.expert && !aud.client && !aud.tas) return "Experts Only";
    if (aud.tas && !aud.client && !aud.expert) return "TAS Only";
    return "All users";
  };

  const [audience, setAudience] = useState<ClientAudienceLabel>(getInitialAudienceLabel(announcementToEdit?.audience));
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">(announcementToEdit?.schedule?.later ? "later" : "now");
  const [date, setDate] = useState(announcementToEdit?.schedule?.date ?? "");
  const [time, setTime] = useState(announcementToEdit?.schedule?.time ?? "");

  const handleSave = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please complete the announcement content fields.");
      return;
    }

    const targetAudience = {
      all: audience === "All users",
      client: audience === "All users" || audience === "Clients Only",
      expert: audience === "All users" || audience === "Experts Only",
      tas: audience === "All users" || audience === "TAS Only",
    };

    const scheduleData = {
      now: scheduleMode === "now",
      later: scheduleMode === "later",
      date: scheduleMode === "later" ? date : undefined,
      time: scheduleMode === "later" ? time : undefined,
    };

    if (announcementToEdit) {
      const payload: UpdateAnnouncementPayload = {
        title,
        message,
        audience: targetAudience,
        schedule: scheduleData
      };
      await dispatch(editAnnouncement({ id: announcementToEdit.id, payload }));
    } else {
      const payload: CreateAnnouncementPayload = {
        title,
        message,
        audience: targetAudience,
        schedule: scheduleData
      };
      await dispatch(addAnnouncement(payload));
    }
  };

  const isSaving = mutateStatus === "loading";

  const footer = (
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <button onClick={onClose} disabled={isSaving} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="btn-primary"
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
      >
        {isSaving && <Loader2 size={14} className="animate-spin" />}
        {announcementToEdit ? "Update Changes" : "Dispatch Announcement"}
      </button>
    </div>
  );

  return (
    <Modal open onClose={onClose} title={announcementToEdit ? "Modify Announcement" : "Create New Announcement"} footer={footer}>
      <style>{`
        .ann-schedule-row { display: flex; flex-direction: column; gap: 10px; }
        .ann-date-inputs  { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (min-width: 480px) {
          .ann-schedule-row { flex-direction: row; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <FieldInput label="Title" placeholder="New Feature Update" value={title} onChange={(e) => setTitle(e.target.value)} />
          <FieldTextarea label="Message" placeholder="Provide complete notification descriptions..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "10px" }}>Audience Targeting</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {AUDIENCES.map((a) => (
              <label key={a} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-main)", cursor: "pointer", padding: "8px 10px", borderRadius: "10px", border: `1px solid ${audience === a ? "var(--color-primary)" : "var(--color-border)"}`, backgroundColor: audience === a ? "color-mix(in srgb, var(--color-primary) 6%, transparent)" : "var(--color-background)" }}>
                <input type="radio" name="audience" checked={audience === a} onChange={() => setAudience(a)} style={{ accentColor: "var(--color-primary)", width: "14px", height: "14px", flexShrink: 0 }} />
                {a}
              </label>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "10px" }}>Schedule Dispatch</p>
          <div className="ann-schedule-row">
            {(["now", "later"] as const).map((s) => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-main)", cursor: "pointer" }}>
                <input type="radio" name="schedule" checked={scheduleMode === s} onChange={() => setScheduleMode(s)} style={{ accentColor: "var(--color-primary)", width: "14px", height: "14px" }} />
                {s === "now" ? "Send immediately" : "Schedule for later date"}
              </label>
            ))}
          </div>
          
          {scheduleMode === "later" && (
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

// ── Main Shell Component ──────────────────────────────────
export default function AnnouncementManagement({ onBack }: { onBack: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { list: announcements, listStatus, listError, mutateStatus } = useSelector((state: RootState) => state.announcements);

  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<ApiAnnouncement | null>(null);
  const [activePreview, setActivePreview] = useState<ApiAnnouncement | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  // Intercept valid mutation state streams to clean up overlay toggles safely
  useEffect(() => {
    if (mutateStatus === "succeeded") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormMode(null);
      setSelectedAnnouncement(null);
      setDeleteTargetId(null);
      dispatch(resetMutateStatus());
    }
  }, [mutateStatus, dispatch]);

  const isUsingFallback = listStatus === "succeeded" && announcements.length === 0;
  const displayedAnnouncements = isUsingFallback ? MOCK_FALLBACK_DATA : announcements;

  const stringifyAudience = (aud: ApiAnnouncement["audience"]) => {
    if (!aud) return "Custom";
    if (aud.all) return "All users";
    if (aud.client) return "Clients";
    if (aud.expert) return "Experts";
    if (aud.tas) return "TAS";
    return "Custom";
  };

  const humanizeDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "Pending";
    }
  };

  const handleEditClick = (announcement: ApiAnnouncement) => {
    setSelectedAnnouncement(announcement);
    setFormMode("edit");
  };

  return (
    <>
      <style>{`
        .ann-table   { display: none; width: 100%; border-collapse: collapse; }
        .ann-cards   { display: flex; flex-direction: column; gap: 10px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @media (min-width: 640px) {
          .ann-table { display: table; }
          .ann-cards { display: none; }
        }
      `}</style>

      <SubPageShell
        title="Announcements"
        onBack={onBack}
        action={
          <button onClick={() => setFormMode("create")} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            <Plus size={15} /> Create
          </button>
        }
      >
        {isUsingFallback && (
          <div style={{ padding: "10px 16px", backgroundColor: "#fefcbf", border: "1px solid #fef08a", borderRadius: "10px", fontSize: "12px", color: "#a16207", marginTop: "16px", marginBottom: "-8px" }}>
            💡 Operational logs are empty. Presenting temporary mock schemas. These drop away on manual dispatches.
          </div>
        )}

        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden", marginTop: "20px" }}>
          
          {listStatus === "loading" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px", gap: "8px", color: "var(--color-text-muted)", fontSize: "14px" }}>
              <Loader2 size={18} className="animate-spin" /> Fetching announcement logs...
            </div>
          )}

          {listStatus === "failed" && (
            <div style={{ padding: "24px", textAlign: "center", color: "#ef4444", fontSize: "13.5px" }}>
              Failed loading log context streams: {listError}
            </div>
          )}

          {/* Desktop Table */}
          {listStatus === "succeeded" && (
            <table className="ann-table">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                  {["Title", "Audience", "Date Created", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedAnnouncements.map((a: ApiAnnouncement) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)" }}>{a.title}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{stringifyAudience(a.audience)}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{humanizeDate(a.createdAt)}</td>
                    <td style={{ padding: "16px 24px" }}><StatusBadge status={a.status} /></td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button onClick={() => setActivePreview(a)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }} title="View Details">
                          <Eye size={16} strokeWidth={1.8} />
                        </button>
                        <button onClick={() => handleEditClick(a)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }} title="Edit">
                          <Pencil size={15} strokeWidth={1.8} />
                        </button>
                        <button onClick={() => setDeleteTargetId(a.id)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#f87171" }} title="Delete">
                          <Trash2 size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Mobile Layout Structure */}
          {listStatus === "succeeded" && (
            <div className="ann-cards" style={{ padding: "12px" }}>
              {displayedAnnouncements.map((a: ApiAnnouncement) => (
                <div key={a.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", flex: 1, minWidth: 0 }}>{a.title}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{stringifyAudience(a.audience)}</span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{humanizeDate(a.createdAt)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                      <button onClick={() => setActivePreview(a)} style={{ padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                        <Eye size={14} strokeWidth={1.8} />
                      </button>
                      <button onClick={() => handleEditClick(a)} style={{ padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                        <Pencil size={13} strokeWidth={1.8} />
                      </button>
                      <button onClick={() => setDeleteTargetId(a.id)} style={{ padding: "6px 8px", borderRadius: "8px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", color: "#f87171" }}>
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Creation/Edit Form overlay portal */}
        {formMode !== null && (
          <AnnouncementFormModal
            announcementToEdit={selectedAnnouncement}
            onClose={() => { setFormMode(null); setSelectedAnnouncement(null); }}
          />
        )}

        {/* Info Layout Modal */}
        {activePreview && (
          <ViewAnnouncementModal announcement={activePreview} onClose={() => setActivePreview(null)} />
        )}

        {/* Security Warning Box Modal (Replaces default Window Alerts) */}
        {deleteTargetId && (
          <DeleteAnnouncementModal id={deleteTargetId} onClose={() => setDeleteTargetId(null)} />
        )}
      </SubPageShell>
    </>
  );
}