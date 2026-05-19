// components/settings/NotificationTemplates.tsx
"use client";

import { useState } from "react";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { SubPageShell, SaveButton, FieldInput, FieldTextarea } from "./SettingsShared";
import { notificationTemplates, TEMPLATE_KEYS } from "@/components/settings/types";
import type { TemplateKey } from "@/components/settings/types";

export default function NotificationTemplates({ onBack }: { onBack: () => void }) {
  const [templateKey, setTemplateKey] = useState<TemplateKey>("New Bid Received");
  const template = notificationTemplates[templateKey];

  const [subject, setSubject] = useState(template.subject);
  const [body,    setBody]    = useState(template.body);

  const handleTemplateChange = (key: string) => {
    const k = key as TemplateKey;
    setTemplateKey(k);
    setSubject(notificationTemplates[k].subject);
    setBody(notificationTemplates[k].body);
  };

  return (
    <>
      <style>{`
        .nt-wrap        { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
        .nt-picker      { display: flex; flex-direction: column; gap: 8px; border-radius: 16px; border: 1px solid var(--color-border); background: #ffffff; padding: 14px 16px; }
        .nt-picker-row  { display: flex; align-items: center; gap: 10px; }
        .nt-actions     { display: flex; gap: 10px; }
        .nt-action-btn  { flex: 1; padding: 11px; border-radius: 12px; font-size: 13px; font-weight: 500; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-muted); cursor: pointer; }

        @media (min-width: 480px) {
          .nt-picker     { flex-direction: row; align-items: center; }
        }
        @media (min-width: 640px) {
          .nt-wrap       { max-width: 640px; }
        }
      `}</style>

      <SubPageShell title="Notification Templates" onBack={onBack} action={<SaveButton />}>
        <div className="nt-wrap">

          {/* Template picker — white card */}
          <div className="nt-picker">
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", whiteSpace: "nowrap", flexShrink: 0 }}>
              Template:
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FilterDropdown
                value={templateKey}
                options={TEMPLATE_KEYS}
                onChange={handleTemplateChange}
              />
            </div>
          </div>

          {/* Form card — white */}
          <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", marginBottom: "12px" }}>
                Message Content
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <FieldTextarea label="Subject:" rows={1} value={subject} onChange={(e) => setSubject(e.target.value)} />
                <FieldTextarea label="Body:"    rows={5} value={body}    onChange={(e) => setBody(e.target.value)} />
              </div>
            </div>

            {/* Dynamic fields */}
            {template.fields.length > 0 && (
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)" }}>
                  Dynamic Fields
                </p>
                {template.fields.map((field) => (
                  <FieldInput key={field.label} label={field.label} placeholder={field.placeholder} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="nt-actions">
            <button className="nt-action-btn">Preview</button>
            <button className="nt-action-btn">Reset to Default</button>
          </div>

        </div>
      </SubPageShell>
    </>
  );
}