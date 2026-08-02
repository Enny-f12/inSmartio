"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchTemplates, saveTemplate } from "@/lib/redux/notificationtemplateSlice";
import type { ApiNotificationTemplate } from "@/lib/api/notificationtemplateApi";

// ── Draft shape stored in localStorage ───────────────────
interface Draft {
  name:       string;
  subject:    string;
  body:       string;
  bidAmount:  string;
  viewAllUrl: string;
}

const DRAFTS_KEY = "nt_drafts";

const loadDrafts = (): Draft[] => {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]"); }
  catch { return []; }
};

const saveDrafts = (drafts: Draft[]) => {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
};

// ── Default "New Bid Received" template ───────────────────
const DEFAULT: Draft = {
  name:       "New Bid Received",
  subject:    "New bid received for your job",
  body:       "Hello Sarah Okoro,\n\nYou have received a new bid from Adebayo Kunle for your job \"Fix kitchen sink\"",
  bidAmount:  "₦ 15,000",
  viewAllUrl: "www.inSmartio",
};

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #E5E7EB", backgroundColor: "#ffffff",
  fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box",
};

export default function NotificationTemplates({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();

  // ✅ Fixed: was s.notifications — now correctly points at notificationtemplateSlice
  const { templates, templateStatus, saveStatus } = useAppSelector(
    (s) => s.notificationTemplates
  );

  const isSaving  = saveStatus     === "loading";
  const isLoading = templateStatus === "loading" || templateStatus === "idle";

  // ── State ─────────────────────────────────────────────
  const [drafts,     setDrafts]     = useState<Draft[]>(loadDrafts);
  const [selected,   setSelected]   = useState("New Bid Received");
  const [subject,    setSubject]    = useState(DEFAULT.subject);
  const [body,       setBody]       = useState(DEFAULT.body);
  const [bidAmount,  setBidAmount]  = useState(DEFAULT.bidAmount);
  const [viewAllUrl, setViewAllUrl] = useState(DEFAULT.viewAllUrl);

  useEffect(() => {
    if (templateStatus === "idle") dispatch(fetchTemplates());
  }, [dispatch, templateStatus]);

  // Build dropdown options: default + drafts + api templates
  const apiTemplateNames = templates.map((t: ApiNotificationTemplate) => t.name);
  const draftNames       = drafts.map((d: Draft) => d.name);
  const allOptions       = ["New Bid Received", ...apiTemplateNames, ...draftNames]
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe

  const handleSelect = (name: string) => {
    setSelected(name);
    const draft = drafts.find((d: Draft) => d.name === name);
    if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
      setBidAmount(draft.bidAmount);
      setViewAllUrl(draft.viewAllUrl);
      return;
    }
    const api = templates.find((t: ApiNotificationTemplate) => t.name === name);
    if (api) {
      setSubject(api.subject);
      setBody(api.body);
      setBidAmount("");
      setViewAllUrl("");
      return;
    }
    setSubject(DEFAULT.subject);
    setBody(DEFAULT.body);
    setBidAmount(DEFAULT.bidAmount);
    setViewAllUrl(DEFAULT.viewAllUrl);
  };

  // ── Save Draft ────────────────────────────────────────
  const handleSaveDraft = () => {
    const draft: Draft = { name: selected, subject, body, bidAmount, viewAllUrl };
    const existing = drafts.findIndex((d: Draft) => d.name === selected);
    const updated  = existing !== -1
      ? drafts.map((d: Draft, i: number) => i === existing ? draft : d)
      : [...drafts, draft];
    setDrafts(updated);
    saveDrafts(updated);
    toast.success(`"${selected}" saved as draft`);
  };

  // ── Create / Save to API ──────────────────────────────
  const handleCreate = () => {
    dispatch(saveTemplate({ name: selected, subject, body }))
      .unwrap()
      .then(() => {
        toast.success("Template created successfully");
        const updated = drafts.filter((d: Draft) => d.name !== selected);
        setDrafts(updated);
        saveDrafts(updated);
      })
      .catch((err: string) => toast.error("Failed to create template", { description: err }));
  };

  // ── Reset ─────────────────────────────────────────────
  const handleReset = () => {
    handleSelect(selected);
    toast.info("Reset to saved version");
  };

  return (
    <>
      <style>{`
        .nt-wrap    { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
        .nt-actions { display: flex; gap: 10px; }
        .nt-action-btn { flex: 1; padding: 11px; border-radius: 12px; font-size: 13px; font-weight: 500; border: 1px solid #E5E7EB; background: #ffffff; color: #6B7280; cursor: pointer; transition: background 0.15s; }
        .nt-action-btn:hover { background: #F9FAFB; }
        @media (min-width: 640px) { .nt-wrap { max-width: 640px; } }
      `}</style>

      <SubPageShell
        title="Notification Templates"
        onBack={onBack}
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSaveDraft}
              style={{ padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#374151", cursor: "pointer" }}>
              Save as Draft
            </button>
            <button
              onClick={handleCreate}
              disabled={isSaving}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? <><Loader2 size={13} className="animate-spin" /> Creating...</> : "Create"}
            </button>
          </div>
        }
      >
        <div className="nt-wrap">

          {/* Template picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
              Template:
            </span>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9CA3AF", fontSize: "13px" }}>
                <Loader2 size={14} className="animate-spin" /> Loading...
              </div>
            ) : (
              <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "400px" }}>
                <select
                  value={selected}
                  onChange={(e) => handleSelect(e.target.value)}
                  style={{ ...inp, appearance: "none", paddingRight: "36px", cursor: "pointer", backgroundColor: "#ffffff" } as React.CSSProperties}>
                  {allOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}{drafts.some((d: Draft) => d.name === name) ? " (draft)" : ""}
                    </option>
                  ))}
                </select>
                <svg style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B7280" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            )}
          </div>

          {/* Form card */}
          <div style={{ borderRadius: "16px", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Subject:</label>
              <input style={inp} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New bid received for your job" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Body:</label>
              <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Template body..."
                style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 } as React.CSSProperties} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>Bid amount:</label>
              <input style={inp} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="₦ 15,000" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>View all bids:</label>
              <input style={inp} value={viewAllUrl} onChange={(e) => setViewAllUrl(e.target.value)} placeholder="www.inSmartio" />
            </div>

          </div>

          {/* Actions */}
          <div className="nt-actions">
            <button className="nt-action-btn">Preview</button>
            <button className="nt-action-btn" onClick={handleReset}>Reset to Default</button>
          </div>

        </div>
      </SubPageShell>
    </>
  );
}