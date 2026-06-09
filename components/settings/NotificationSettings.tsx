// components/settings/NotificationSettings.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchNotificationSettings,
  saveNotificationSettings,
} from "@/lib/redux/notificationSettingsSlice";
import type { NotificationSettingsPayload } from "@/lib/api/notificationSettingsApi";

// ── Static config ─────────────────────────────────────────
interface NotifSetting {
  id:          string;               // e.g. "disputes.opened"
  label:       string;
  description: string;
  category:    string;
}

const SETTINGS: NotifSetting[] = [
  { id: "disputes.opened",        label: "New Dispute Opened",               description: "Get notified when a client or expert opens a new dispute.",       category: "Disputes"      },
  { id: "disputes.approved",      label: "Dispute Resolved",                 description: "Get notified when a dispute decision is submitted.",               category: "Disputes"      },
  { id: "verifications.submitted",label: "Verification Submitted",           description: "Get notified when an expert submits a new verification request.", category: "Verifications" },
  { id: "verifications.approved", label: "Verification Approved / Rejected", description: "Get notified when a verification is approved or rejected.",       category: "Verifications" },
  { id: "users.registration",     label: "New User Registration",            description: "Get notified when a new client, expert, or TAS registers.",       category: "Users"         },
  { id: "users.status",           label: "User Suspended / Reinstated",      description: "Get notified when an admin suspends or reinstates a user.",       category: "Users"         },
  { id: "payments.received",      label: "Payment Received",                 description: "Get notified when a payment is made on the platform.",            category: "Payments"      },
  { id: "payments.processed",     label: "Payout Processed",                 description: "Get notified when a TAS or expert payout is processed.",         category: "Payments"      },
  { id: "tas.applied",            label: "New TAS Application",              description: "Get notified when a new TAS application is submitted.",           category: "TAS"           },
  { id: "tas.adjust",             label: "TAS Tier Adjusted",                description: "Get notified when an admin adjusts a TAS agent's tier.",         category: "TAS"           },
];

const CATEGORIES = Array.from(new Set(SETTINGS.map((s) => s.category)));

const DEFAULT_FORM: NotificationSettingsPayload = {
  disputes:      { opened: true,   approved: true  },
  verifications: { submitted: true, approved: true  },
  users:         { registration: true, status: true },
  payments:      { received: true, processed: true  },
  tas:           { applied: true,  adjust: true     },
};

// ── Helpers to get/set nested values ─────────────────────
function getNestedValue(form: NotificationSettingsPayload, dotKey: string): boolean {
  const [section, key] = dotKey.split(".") as [keyof NotificationSettingsPayload, string];
  const sec = form[section];
  if (sec && typeof sec === "object") return (sec as Record<string, boolean>)[key] ?? false;
  return false;
}

function setNestedValue(
  form: NotificationSettingsPayload,
  dotKey: string,
  value: boolean
): NotificationSettingsPayload {
  const [section, key] = dotKey.split(".") as [keyof NotificationSettingsPayload, string];
  return {
    ...form,
    [section]: {
      ...(form[section] as Record<string, boolean>),
      [key]: value,
    },
  };
}

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

// ── Main component ────────────────────────────────────────
export default function NotificationSettings({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { settings, loading, saving, error } = useAppSelector((s) => s.notificationSettings);
  const admin   = useAppSelector((s) => s.auth.admin) as Record<string, string> | null;
  const adminId = admin?.id ?? "";

  const [form, setForm] = useState<NotificationSettingsPayload>(DEFAULT_FORM);

  // Fetch on mount using adminId
  useEffect(() => {
    if (adminId) dispatch(fetchNotificationSettings(adminId));
  }, [dispatch, adminId]);

  // Seed form from settings — runs only when settings.id changes (i.e. first load)
  const settingsId = settings?.id;
  useEffect(() => {
    if (!settings) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      disputes:      settings.disputes,
      verifications: settings.verifications,
      users:         settings.users,
      payments:      settings.payments,
      tas:           settings.tas,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsId]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // ── Handlers ──────────────────────────────────────────────
  const toggle = (dotKey: string) =>
    setForm((prev) => setNestedValue(prev, dotKey, !getNestedValue(prev, dotKey)));

  const toggleAll = (category: string, value: boolean) => {
    const ids = SETTINGS.filter((s) => s.category === category).map((s) => s.id);
    setForm((prev) => ids.reduce((acc, id) => setNestedValue(acc, id, value), prev));
  };

  const handleSave = () => {
    const payload: NotificationSettingsPayload = { ...form, adminId };
    dispatch(saveNotificationSettings({ id: settings?.id ?? null, payload }))
      .unwrap()
      .then(() => toast.success("Notification settings saved"))
      .catch((err: string) => toast.error("Failed to save", { description: err }));
  };

  return (
    <SubPageShell title="Notification Settings" onBack={onBack}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          padding: "64px", gap: "10px", color: "#9CA3AF" }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "13px" }}>Loading settings…</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {CATEGORIES.map((cat) => {
            const catSettings = SETTINGS.filter((s) => s.category === cat);
            const allOn  = catSettings.every((s) => getNestedValue(form, s.id));
            const allOff = catSettings.every((s) => !getNestedValue(form, s.id));

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
                        cursor: allOn ? "default" : "pointer", padding: 0 }}>
                      All on
                    </button>
                    <span style={{ color: "#E5E7EB" }}>|</span>
                    <button onClick={() => toggleAll(cat, false)}
                      style={{ fontSize: "11px", fontWeight: 500,
                        color: allOff ? "#9CA3AF" : "#6B7280", background: "none", border: "none",
                        cursor: allOff ? "default" : "pointer", padding: 0 }}>
                      All off
                    </button>
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
                      <Toggle
                        value={getNestedValue(form, s.id)}
                        onChange={() => toggle(s.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

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

        </div>
      )}
    </SubPageShell>
  );
}