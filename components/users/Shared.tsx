"use client";

import { useRef } from "react";
import { Upload, CheckCircle2, User } from "lucide-react";

// ── Styles ────────────────────────────────────────────────
export const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #D1D5DB", backgroundColor: "var(--color-background)",
  fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
};
export const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "5px",
};
export const row: React.CSSProperties   = { display: "flex", flexDirection: "column", gap: "4px" };
export const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" };

// ── Categories ────────────────────────────────────────────
export const CATEGORIES: Record<string, string[]> = {
  "Home Repair":              ["Plumbing Repairs","Electrical Repairs","Carpentry & Woodwork","Painting & Drywall Repair","Roofing & Gutter Repairs","HVAC & Appliance Repairs"],
  "Entertainment":            ["Movies & Cinema","Music","Television & Streaming","Gaming","Live Events & Shows","Celebrity & Pop Culture"],
  "Electrical Services":      ["Electrical Installation","Electrical Repairs","Lighting Services","Generator & Backup Power Systems","Panel & Circuit Breaker Services","Electrical Inspection & Maintenance"],
  "Web Development":          ["Website Design","Frontend Development","Backend Development","E-commerce Development","CMS Development","Website Maintenance & Support"],
  "Plumbing Services":        ["Leak Detection & Repair","Drain Cleaning","Pipe Installation & Replacement","Water Heater Services","Bathroom & Kitchen Plumbing","Emergency Plumbing Services"],
  "Legal Services":           ["Family Law","Corporate & Business Law","Real Estate Law","Criminal Defense","Immigration Law","Civil Litigation"],
  "Design Services":          ["Graphic Design","Web Design","Interior Design","Fashion Design","Product Design","Motion Graphics & Animation"],
  "Events Services":          ["Wedding Planning","Corporate Events","Birthday & Private Parties","Event Decoration & Styling","Catering Services","Entertainment & MC Services"],
  "Creative Services":        ["Graphic Design","Content Writing","Photography","Videography & Editing","Illustration & Digital Art","Animation & Motion Graphics"],
  "Repair & Construction":    ["Building Construction","Home Renovation & Remodeling","Masonry & Concrete Work","Roofing Services","Painting & Finishing","General Repairs & Maintenance"],
  "Photo & Videography":      ["Event Photography & Videography","Portrait Photography","Commercial Photography","Cinematic Videography","Editing & Post-Production","Drone & Aerial Coverage"],
  "Beauty Services":          ["Hair Styling & Care","Makeup Services","Skincare & Facials","Nail Care Services","Spa & Body Treatments","Barber Services"],
  "Computer & IT Services":   ["IT Support & Maintenance","Software Development","Network & Security Services","Hardware Services","Web & App Development","Data Services"],
  "Moving Services":          ["Residential Moving","Commercial Moving","Packing & Unpacking Services","Loading & Unloading Services","Local & Long-Distance Moving","Storage Services"],
  "Auto Repair (Automobile)": ["Engine Repair & Diagnostics","Brake & Suspension Services","Electrical & Battery Services","Transmission Services","Oil Change & Routine Maintenance","Body Work & Painting"],
  "Appliance Repair Services":["Refrigerator Repair","Washing Machine Repair","Air Conditioner Repair","Microwave Oven Repair","Television Repair","Small Appliance Repair"],
  "Housekeeping Services":    ["Residential Cleaning","Commercial Cleaning","Deep Cleaning Services","Laundry & Ironing Services","Sanitization & Disinfection","Janitorial Services"],
};
export const TAS_CATEGORIES = Object.keys(CATEGORIES);

// ── Document type options ─────────────────────────────────
export const EXPERT_DOC_TYPES = ["National ID", "Passport", "Utility Bill", "Driver's License", "Voter's Card"];
export const TAS_DOC_TYPES    = ["National ID", "Utility Bill", "Driver's License", "Voter's Card", "BVN Consent", "Guarantor Form", "Police Clearance"];

// ── Document entry (file + type + idNumber) ───────────────
export interface DocEntry { file: File; type: string; idNumber: string; }

// ── Shared widgets ────────────────────────────────────────
export function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ padding: "10px 12px", borderRadius: "10px 0 0 10px", border: "1px solid #D1D5DB",
        borderRight: "none", fontSize: "13px", color: "var(--color-text-muted)",
        flexShrink: 0, backgroundColor: "var(--color-background)" }}>+234</div>
      <input style={{ ...inp, borderRadius: "0 10px 10px 0", borderLeft: "none" }}
        placeholder="801 234 5678" maxLength={10} value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))} />
    </div>
  );
}

export function DocListPicker({
  docs, onChange, typeOptions,
}: {
  docs: DocEntry[];
  onChange: (docs: DocEntry[]) => void;
  typeOptions: string[];
}) {
  const ref = useRef<HTMLInputElement>(null);

  const addDoc = (file: File) => {
    onChange([...docs, { file, type: typeOptions[0], idNumber: "" }]);
  };

  const removeDoc = (i: number) => {
    onChange(docs.filter((_, idx) => idx !== i));
  };

  const updateDoc = (i: number, field: "type" | "idNumber", value: string) => {
    const next = docs.map((d, idx) => idx === i ? { ...d, [field]: value } : d);
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {docs.map((doc, i) => (
        <div key={i} style={{ border: "1px solid #D1D5DB", borderRadius: "10px", padding: "12px",
          display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "var(--color-background)" }}>
          {/* File name row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#15803d", flex: 1, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file.name}</span>
            <button type="button" onClick={() => removeDoc(i)}
              style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fee2e2",
                border: "none", cursor: "pointer", padding: 0, flexShrink: 0, color: "#dc2626",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
              ✕
            </button>
          </div>
          {/* Type + ID number */}
          <div style={grid2}>
            <div style={row}>
              <label style={lbl}>Document Type</label>
              <select style={inp} value={doc.type} onChange={(e) => updateDoc(i, "type", e.target.value)}>
                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={row}>
              <label style={lbl}>ID Number (optional)</label>
              <input style={inp} placeholder="e.g. A12345678" value={doc.idNumber}
                onChange={(e) => updateDoc(i, "idNumber", e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      {/* Add file button */}
      <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addDoc(f); e.target.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "9px 14px", borderRadius: "10px", border: "1px dashed #D1D5DB",
          backgroundColor: "var(--color-background)", fontSize: "12px", color: "#6B7280",
          cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
        <Upload size={13} /> Add Document
      </button>
    </div>
  );
}

export function AvatarPick({ picked, onPick }: { picked: File | null; onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = picked ? URL.createObjectURL(picked) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{ width: "90px", height: "90px", borderRadius: "50%", border: "2px dashed #D1D5DB",
          backgroundColor: "var(--color-background)", cursor: "pointer", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <User size={32} color="#9CA3AF" />}
      </button>
      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
        {picked ? picked.name : "Tap to upload photo"}
      </span>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────
export function StepBar({ steps, current }: { steps: { label: string; icon: React.ReactNode }[]; current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              backgroundColor: i < current ? "#16a34a" : i === current ? "#2563EB" : "#E5E7EB",
              color: i <= current ? "#fff" : "#9CA3AF",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600,
            }}>
              {i < current ? <CheckCircle2 size={16} /> : s.icon}
            </div>
            <span style={{ fontSize: "10px", color: i === current ? "#2563EB" : "var(--color-text-muted)",
              fontWeight: i === current ? 600 : 400, whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: "2px", backgroundColor: i < current ? "#16a34a" : "#E5E7EB",
              margin: "0 6px", marginBottom: "14px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Role type ─────────────────────────────────────────────
export type Role = "client" | "expert" | "tas";

// ── Role Selector ─────────────────────────────────────────
export function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
  const roles: { value: Role; label: string; desc: string }[] = [
    { value: "client", label: "Client",  desc: "Can post jobs and hire experts" },
    { value: "expert", label: "Expert",  desc: "Provides services on the platform" },
    { value: "tas",    label: "TAS",     desc: "Talent Acquisition Specialist" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>Select the type of user to create:</p>
      {roles.map((r) => (
        <button key={r.value} onClick={() => onSelect(r.value)}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",
            padding: "14px 16px", borderRadius: "12px", border: "1px solid #D1D5DB",
            backgroundColor: "var(--color-background)", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{r.label}</span>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{r.desc}</span>
        </button>
      ))}
    </div>
  );
}