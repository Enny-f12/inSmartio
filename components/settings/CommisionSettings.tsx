// components/settings/CommissionSettings.tsx
"use client";

import { SubPageShell, SaveButton } from "./SettingsShared";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[13px] mb-1.5">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-main">{value}</span>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">{text}</p>;
}

export default function CommissionSettings({ onBack }: { onBack: () => void }) {
  return (
    <SubPageShell
      title="System Settings"
      onBack={onBack}
      action={<SaveButton />}
    >
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border">

        {/* Commission Settings */}
        <div className="px-8 py-6">
          <SectionLabel text="Commission Settings" />
          <InfoRow label="Model 2 Commission Rate:"  value="(10) %" />
          <InfoRow label="Model 1 Subscription Fee:" value="₦ (50,000) / month" />
          <div className="mt-3" />
          <InfoRow label="TAS Registration Bonus:"  value="₦ (7,000)" />
          <InfoRow label="TAS Model 2 Commission:"  value="(1) %" />
          <InfoRow label="TAS Model 1 Commission:"  value="₦ (1,000) / month" />
          <div className="mt-3" />
          <InfoRow label="Effective Date:" value="[01/04/2026]" />
        </div>

        {/* Verification Tier Settings */}
        <div className="px-8 py-6">
          <SectionLabel text="Verification Tier Settings" />
          <InfoRow label="Tier 1 Max Job Value:" value="₦ (20,000)" />
          <InfoRow label="Tier 2 Max Job Value:" value="₦ (100,000)" />
          <InfoRow label="Tier 3 Verification Fee:" value="₦ (5,000)" />
        </div>

        {/* TAS Tier Settings */}
        <div className="px-8 py-6">
          <SectionLabel text="TAS Tier Settings" />
          {[
            "Tier 1:  0 - [49] experts - [0]% bonus",
            "Tier 2:  [50] - [199] experts - [5]% bonus",
            "Tier 3:  [200] - [499] experts - [10]% bonus",
            "Tier 4:  [500] - [999] experts - [12]% bonus",
            "Tier 5:  [1,000] - [2,499] experts - [15]% bonus",
            "Tier 6:  [2,500] + experts - [20]% bonus",
          ].map((t) => (
            <p key={t} className="text-[13px] text-text-main mb-1.5">{t}</p>
          ))}
        </div>

      </div>
    </SubPageShell>
  );
}