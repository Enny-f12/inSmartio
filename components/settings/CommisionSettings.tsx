// components/settings/CommissionSettings.tsx
"use client";

import { SubPageShell, SaveButton } from "./SettingsShared";

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", marginBottom: "12px" }}>
      {text}
    </p>
  );
}

function SubLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: "8px" }}>
      {text}
    </p>
  );
}

// Label left, value right — both on one row, value never wraps off screen
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", marginBottom: "8px" }}>
      <span style={{ fontSize: "13px", color: "var(--color-text-muted)", flex: 1, minWidth: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", flexShrink: 0, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function TierRow({ text, index }: { text: string; index: number }) {
  const match = text.match(/^(Tier \d+)/);
  const tier  = match?.[1] ?? "";
  const rest  = match ? text.slice(tier.length + 1).trim() : text;
  const colors = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#db2777", "#0891b2"];
  const color  = colors[index % colors.length];

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", marginBottom: "8px" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", whiteSpace: "nowrap", flexShrink: 0, color, backgroundColor: `${color}14`, border: `1px solid ${color}30` }}>
        {tier}
      </span>
      <span style={{ fontSize: "13px", color: "var(--color-text-main)", lineHeight: 1.5 }}>{rest}</span>
    </div>
  );
}

const CARD: React.CSSProperties = {
  borderRadius: "16px",
  border: "1px solid var(--color-border)",
  backgroundColor: "#ffffff",
  padding: "16px",
};

const DIVIDER: React.CSSProperties = {
  borderTop: "1px solid var(--color-border)",
  paddingTop: "14px",
  marginTop: "6px",
  marginBottom: "14px",
};

export default function CommissionSettings({ onBack }: { onBack: () => void }) {
  return (
    <SubPageShell title="System Settings" onBack={onBack} action={<SaveButton />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>

        {/* Commission Settings */}
        <div style={CARD}>
          <SectionLabel text="Commission Settings" />

          <SubLabel text="Expert" />
          <InfoRow label="Model 2 Commission Rate"  value="10%" />
          <InfoRow label="Model 1 Subscription Fee" value="₦50,000 / month" />

          <div style={DIVIDER}>
            <SubLabel text="TAS" />
            <InfoRow label="Registration Bonus"  value="₦7,000" />
            <InfoRow label="Model 2 Commission"  value="1%" />
            <InfoRow label="Model 1 Commission"  value="₦1,000 / month" />
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px" }}>
            <InfoRow label="Effective Date" value="01/04/2026" />
          </div>
        </div>

        {/* Verification Tier Settings */}
        <div style={CARD}>
          <SectionLabel text="Verification Tier Settings" />
          <InfoRow label="Tier 1 Max Job Value"    value="₦20,000" />
          <InfoRow label="Tier 2 Max Job Value"    value="₦100,000" />
          <InfoRow label="Tier 3 Verification Fee" value="₦5,000" />
        </div>

        {/* TAS Tier Settings */}
        <div style={CARD}>
          <SectionLabel text="TAS Tier Settings" />
          {[
            "Tier 1:  0 – 49 experts – 0% bonus",
            "Tier 2:  50 – 199 experts – 5% bonus",
            "Tier 3:  200 – 499 experts – 10% bonus",
            "Tier 4:  500 – 999 experts – 12% bonus",
            "Tier 5:  1,000 – 2,499 experts – 15% bonus",
            "Tier 6:  2,500+ experts – 20% bonus",
          ].map((t, i) => (
            <TierRow key={t} text={t} index={i} />
          ))}
        </div>

      </div>
    </SubPageShell>
  );
}