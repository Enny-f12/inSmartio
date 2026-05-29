// components/settings/NotificationSettings.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SubPageShell } from "./SettingsShared";

// ── Notification settings relevant to what's been built ──
interface NotifSetting {
  id:          string;
  label:       string;
  description: string;
  category:    string;
}

const SETTINGS: NotifSetting[] = [
  // Disputes
  {
    id:          "dispute_opened",
    label:       "New Dispute Opened",
    description: "Get notified when a client or expert opens a new dispute.",
    category:    "Disputes",
  },
  {
    id:          "dispute_resolved",
    label:       "Dispute Resolved",
    description: "Get notified when a dispute decision is submitted.",
    category:    "Disputes",
  },
  // Verifications
  {
    id:          "verification_submitted",
    label:       "Verification Submitted",
    description: "Get notified when an expert submits a new verification request.",
    category:    "Verifications",
  },
  {
    id:          "verification_approved",
    label:       "Verification Approved / Rejected",
    description: "Get notified when a verification is approved or rejected.",
    category:    "Verifications",
  },
  // Users
  {
    id:          "new_user",
    label:       "New User Registration",
    description: "Get notified when a new client, expert, or TAS registers.",
    category:    "Users",
  },
  {
    id:          "user_suspended",
    label:       "User Suspended / Reinstated",
    description: "Get notified when an admin suspends or reinstates a user.",
    category:    "Users",
  },
  // Payments
  {
    id:          "payment_received",
    label:       "Payment Received",
    description: "Get notified when a payment is made on the platform.",
    category:    "Payments",
  },
  {
    id:          "payout_processed",
    label:       "Payout Processed",
    description: "Get notified when a TAS or expert payout is processed.",
    category:    "Payments",
  },
  // TAS
  {
    id:          "tas_application",
    label:       "New TAS Application",
    description: "Get notified when a new TAS application is submitted.",
    category:    "TAS",
  },
  {
    id:          "tas_tier_adjusted",
    label:       "TAS Tier Adjusted",
    description: "Get notified when an admin adjusts a TAS agent's tier.",
    category:    "TAS",
  },
];

// Group by category
const CATEGORIES = Array.from(new Set(SETTINGS.map((s) => s.category)));

// Toggle switch component
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: "44px", height: "24px", borderRadius: "999px", border: "none",
        backgroundColor: value ? "#16a34a" : "#D1D5DB",
        position: "relative", cursor: "pointer", flexShrink: 0,
        transition: "background 0.2s",
      }}>
      <span style={{
        position: "absolute", top: "3px",
        left: value ? "23px" : "3px",
        width: "18px", height: "18px",
        borderRadius: "50%", backgroundColor: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

export default function NotificationSettings({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map((s) => [s.id, true]))
  );
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAll = (category: string, value: boolean) => {
    const ids = SETTINGS.filter((s) => s.category === category).map((s) => s.id);
    setSettings((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, value])) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO-BACKEND: POST /admin/notification-settings { settings }
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Notification settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubPageShell title="Notification Settings" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {CATEGORIES.map((cat) => {
          const catSettings = SETTINGS.filter((s) => s.category === cat);
          const allOn  = catSettings.every((s) => settings[s.id]);
          const allOff = catSettings.every((s) => !settings[s.id]);

          return (
            <div key={cat}>
              {/* Category header */}
              <div style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#6B7280", margin: 0 }}>
                  {cat}
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => toggleAll(cat, true)}
                    style={{ fontSize: "11px", fontWeight: 500, color: allOn ? "#9CA3AF" : "#2563EB",
                      background: "none", border: "none", cursor: allOn ? "default" : "pointer",
                      padding: 0 }}>
                    All on
                  </button>
                  <span style={{ color: "#E5E7EB" }}>|</span>
                  <button onClick={() => toggleAll(cat, false)}
                    style={{ fontSize: "11px", fontWeight: 500,
                      color: allOff ? "#9CA3AF" : "#6B7280",
                      background: "none", border: "none",
                      cursor: allOff ? "default" : "pointer", padding: 0 }}>
                    All off
                  </button>
                </div>
              </div>

              {/* Settings rows */}
              <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB",
                borderRadius: "14px", overflow: "hidden" }}>
                {catSettings.map((s, i) => (
                  <div key={s.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: "16px", padding: "16px 20px",
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

        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "8px",
              padding: "11px 28px", borderRadius: "12px", border: "none",
              backgroundColor: "#2563EB", color: "#fff", fontSize: "13px",
              fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : "Save Settings"}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </SubPageShell>
  );
}