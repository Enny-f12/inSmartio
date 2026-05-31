// components/settings/NotificationSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Eye, X } from "lucide-react";
import { SubPageShell } from "./SettingsShared";
import { getAllTemplates, createTemplate } from "@/lib/api/notificationtemplateApi";
import type { ApiNotificationTemplate, CreateTemplatePayload } from "@/lib/api/notificationtemplateApi";

// ── Notification toggle settings ─────────────────────────
interface NotifSetting {
  id:          string;
  label:       string;
  description: string;
  category:    string;
}

const SETTINGS: NotifSetting[] = [
  { id: "dispute_opened",          label: "New Dispute Opened",            description: "Get notified when a client or expert opens a new dispute.",          category: "Disputes"      },
  { id: "dispute_resolved",        label: "Dispute Resolved",              description: "Get notified when a dispute decision is submitted.",                  category: "Disputes"      },
  { id: "verification_submitted",  label: "Verification Submitted",        description: "Get notified when an expert submits a new verification request.",    category: "Verifications" },
  { id: "verification_approved",   label: "Verification Approved / Rejected", description: "Get notified when a verification is approved or rejected.",       category: "Verifications" },
  { id: "new_user",                label: "New User Registration",         description: "Get notified when a new client, expert, or TAS registers.",          category: "Users"         },
  { id: "user_suspended",          label: "User Suspended / Reinstated",   description: "Get notified when an admin suspends or reinstates a user.",          category: "Users"         },
  { id: "payment_received",        label: "Payment Received",              description: "Get notified when a payment is made on the platform.",               category: "Payments"      },
  { id: "payout_processed",        label: "Payout Processed",              description: "Get notified when a TAS or expert payout is processed.",             category: "Payments"      },
  { id: "tas_application",         label: "New TAS Application",           description: "Get notified when a new TAS application is submitted.",              category: "TAS"           },
  { id: "tas_tier_adjusted",       label: "TAS Tier Adjusted",             description: "Get notified when an admin adjusts a TAS agent's tier.",            category: "TAS"           },
];

const CATEGORIES = Array.from(new Set(SETTINGS.map((s) => s.category)));

const DEFAULT_FORM: CreateTemplatePayload = { name: "", subject: "", body: "" };

// ── Toggle ────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      style={{ width: "44px", height: "24px", borderRadius: "999px", border: "none",
        backgroundColor: value ? "#16a34a" : "#D1D5DB",
        position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
      <span style={{ position: "absolute", top: "3px", left: value ? "23px" : "3px",
        width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
    </button>
  );
}

// ── Field label ───────────────────────────────────────────
function FieldLabel({ text }: { text: string }) {
  return <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>{text}</p>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
  fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box",
};

// ── Preview Modal ─────────────────────────────────────────
function PreviewModal({ template, onClose }: { template: CreateTemplatePayload; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex",
      alignItems: "center", justifyContent: "center", padding: "16px",
      backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%",
        maxWidth: "520px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>
            Template Preview
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none",
            cursor: "pointer", color: "#6B7280", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        {/* Email mock */}
        <div style={{ padding: "20px" }}>
          <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB",
            backgroundColor: "#F9FAFB", overflow: "hidden" }}>
            {/* Email header bar */}
            <div style={{ backgroundColor: "#2563EB", padding: "14px 20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", margin: 0 }}>
                HelpMe Platform
              </p>
            </div>
            {/* Subject */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB",
              backgroundColor: "#fff" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.06em", color: "#9CA3AF", margin: "0 0 4px" }}>Subject</p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>
                {template.subject || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>No subject</span>}
              </p>
            </div>
            {/* Body */}
            <div style={{ padding: "16px 20px", backgroundColor: "#fff" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.06em", color: "#9CA3AF", margin: "0 0 10px" }}>Body</p>
              <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.7, margin: 0,
                whiteSpace: "pre-wrap" }}>
                {template.body || <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>No body content</span>}
              </p>
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "#9CA3AF", textAlign: "center",
            margin: "12px 0 0" }}>
            This is a preview only — actual emails may vary in styling.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function NotificationSettings({ onBack }: { onBack: () => void }) {
  // Toggle settings
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map((s) => [s.id, true]))
  );
  const [saving, setSaving] = useState(false);

  // Template form
  const [templates,    setTemplates]    = useState<ApiNotificationTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [form,         setForm]         = useState<CreateTemplatePayload>(DEFAULT_FORM);
  const [draft,        setDraft]        = useState<CreateTemplatePayload | null>(null);
  const [creating,     setCreating]     = useState(false);
  const [savingDraft,  setSavingDraft]  = useState(false);
  const [previewOpen,  setPreviewOpen]  = useState(false);

  // Load existing templates
  useEffect(() => {
    getAllTemplates()
      .then(setTemplates)
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => setTemplatesLoading(false));
  }, []);

  // ── Toggle handlers ───────────────────────────────────────
  const toggle = (id: string) =>
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAll = (category: string, value: boolean) => {
    const ids = SETTINGS.filter((s) => s.category === category).map((s) => s.id);
    setSettings((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, value])) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800)); // TODO-BACKEND: POST /admin/notification-settings
      toast.success("Notification settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // ── Template form handlers ────────────────────────────────
  const setField = (key: keyof CreateTemplatePayload, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleResetToDefault = () => {
    setForm(DEFAULT_FORM);
    setDraft(null);
    toast.info("Form reset to default");
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    await new Promise((r) => setTimeout(r, 400));
    setDraft({ ...form });
    setSavingDraft(false);
    toast.success("Saved as draft");
  };

  const handleCreate = async () => {
    if (!form.name.trim())    { toast.warning("Template name is required.");    return; }
    if (!form.subject.trim()) { toast.warning("Subject is required.");           return; }
    if (!form.body.trim())    { toast.warning("Body is required.");              return; }

    setCreating(true);
    try {
      const created = await createTemplate({
        name:    form.name.trim(),
        subject: form.subject.trim(),
        body:    form.body.trim(),
      });
      setTemplates((prev) => [...prev, created]);
      setForm(DEFAULT_FORM);
      setDraft(null);
      toast.success("Template created successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create template";
      toast.error("Failed to create template", { description: msg });
    } finally {
      setCreating(false);
    }
  };

  return (
    <SubPageShell title="Notification Settings" onBack={onBack}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* ── Toggle settings ── */}
        {CATEGORIES.map((cat) => {
          const catSettings = SETTINGS.filter((s) => s.category === cat);
          const allOn  = catSettings.every((s) => settings[s.id]);
          const allOff = catSettings.every((s) => !settings[s.id]);
          return (
            <div key={cat}>
              <div style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#6B7280", margin: 0 }}>{cat}</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => toggleAll(cat, true)}
                    style={{ fontSize: "11px", fontWeight: 500,
                      color: allOn ? "#9CA3AF" : "#2563EB", background: "none", border: "none",
                      cursor: allOn ? "default" : "pointer", padding: 0 }}>All on</button>
                  <span style={{ color: "#E5E7EB" }}>|</span>
                  <button onClick={() => toggleAll(cat, false)}
                    style={{ fontSize: "11px", fontWeight: 500,
                      color: allOff ? "#9CA3AF" : "#6B7280", background: "none", border: "none",
                      cursor: allOff ? "default" : "pointer", padding: 0 }}>All off</button>
                </div>
              </div>
              <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
                borderRadius: "14px", overflow: "hidden" }}>
                {catSettings.map((s, i) => (
                  <div key={s.id}
                    style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", gap: "16px", padding: "16px 20px",
                      borderBottom: i < catSettings.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827",
                        margin: "0 0 3px" }}>{s.label}</p>
                      <p style={{ fontSize: "12px", color: "#6B7280", margin: 0,
                        lineHeight: 1.5 }}>{s.description}</p>
                    </div>
                    <Toggle value={settings[s.id]} onChange={() => toggle(s.id)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Save toggles */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "8px",
              padding: "11px 28px", borderRadius: "12px", border: "none",
              backgroundColor: "#2563EB", color: "#fff", fontSize: "13px",
              fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1 }}>
            {saving
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
              : "Save Settings"}
          </button>
        </div>

        {/* ── Notification Templates ── */}
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#6B7280", marginBottom: "12px" }}>
            Notification Templates
          </p>

          {/* Existing templates list */}
          {templatesLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "20px",
              fontSize: "13px", color: "#6B7280" }}>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading templates…
            </div>
          ) : templates.length > 0 ? (
            <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
              borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
              {templates.map((t, i) => (
                <div key={t.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "12px", padding: "14px 20px",
                    borderBottom: i < templates.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827",
                      margin: "0 0 2px" }}>{t.name}</p>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>{t.subject}</p>
                  </div>
                  <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
                    backgroundColor: "#F0FDF4", color: "#15803D",
                    border: "1px solid #BBF7D0", fontWeight: 600, flexShrink: 0 }}>
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Create template form */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
            borderRadius: "14px", padding: "20px", display: "flex",
            flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: 0 }}>
              Create New Template
              {draft && (
                <span style={{ marginLeft: "10px", fontSize: "11px", fontWeight: 500,
                  color: "#16a34a" }}>● Draft saved</span>
              )}
            </p>

            <div>
              <FieldLabel text="Template Name" />
              <input type="text" placeholder="e.g. dispute_opened"
                value={form.name} onChange={(e) => setField("name", e.target.value)}
                style={inputStyle} />
            </div>

            <div>
              <FieldLabel text="Subject" />
              <input type="text" placeholder="e.g. A new dispute has been opened"
                value={form.subject} onChange={(e) => setField("subject", e.target.value)}
                style={inputStyle} />
            </div>

            <div>
              <FieldLabel text="Body" />
              <textarea rows={5}
                placeholder="e.g. Hello {{name}}, a dispute has been opened for job #{{jobId}}..."
                value={form.body} onChange={(e) => setField("body", e.target.value)}
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap",
              justifyContent: "flex-end" }}>
              {/* Reset to default */}
              <button onClick={handleResetToDefault}
                style={{ padding: "9px 16px", borderRadius: "10px",
                  border: "1px solid #E5E7EB", backgroundColor: "#fff",
                  fontSize: "13px", fontWeight: 500, color: "#6B7280", cursor: "pointer" }}>
                Reset to Default
              </button>

              {/* Preview */}
              <button onClick={() => setPreviewOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px",
                  padding: "9px 16px", borderRadius: "10px",
                  border: "1px solid #E5E7EB", backgroundColor: "#fff",
                  fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                <Eye size={14} /> Preview
              </button>

              {/* Save as draft */}
              <button onClick={handleSaveDraft} disabled={savingDraft}
                style={{ padding: "9px 16px", borderRadius: "10px",
                  border: "1px solid #E5E7EB", backgroundColor: "#fff",
                  fontSize: "13px", fontWeight: 500,
                  color: savingDraft ? "#9CA3AF" : "#374151",
                  cursor: savingDraft ? "not-allowed" : "pointer",
                  opacity: savingDraft ? 0.7 : 1 }}>
                {savingDraft ? "Saving…" : "Save as Draft"}
              </button>

              {/* Create */}
              <button onClick={handleCreate} disabled={creating}
                style={{ display: "flex", alignItems: "center", gap: "8px",
                  padding: "9px 20px", borderRadius: "10px", border: "none",
                  backgroundColor: "#2563EB", color: "#fff", fontSize: "13px",
                  fontWeight: 600, cursor: creating ? "not-allowed" : "pointer",
                  opacity: creating ? 0.7 : 1 }}>
                {creating
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating…</>
                  : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <PreviewModal template={form} onClose={() => setPreviewOpen(false)} />
      )}
    </SubPageShell>
  );
}