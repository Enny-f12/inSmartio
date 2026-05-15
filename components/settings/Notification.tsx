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
    <SubPageShell
      title="Notification Templates"
      onBack={onBack}
      action={<SaveButton />}
    >
      <div className="max-w-2xl space-y-5">

        {/* Template picker */}
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-text-main whitespace-nowrap">Template:</span>
          <FilterDropdown
            value={templateKey}
            options={TEMPLATE_KEYS}
            onChange={handleTemplateChange}
          />
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <FieldTextarea label="Subject:" rows={1} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <FieldTextarea label="Body:"    rows={5} value={body}    onChange={(e) => setBody(e.target.value)} />

          {/* Dynamic fields */}
          {template.fields.map((field) => (
            <FieldInput key={field.label} label={field.label} placeholder={field.placeholder} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
            Preview
          </button>
          <button className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
            Reset to Default
          </button>
        </div>

      </div>
    </SubPageShell>
  );
}