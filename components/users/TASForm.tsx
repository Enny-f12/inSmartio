"use client";

import { useState } from "react";
import { Eye, EyeOff, User as UserIcon, Briefcase, FileText, CreditCard } from "lucide-react";
import {
  inp, lbl, row, grid2,
  TAS_CATEGORIES, TAS_DOC_TYPES,
  PhoneInput, DocListPicker, AvatarPick,
  DocEntry,
} from "./Shared";

export interface TasState {
  name: string; email: string; username: string; phone: string;
  password: string; gender: string; dateOfBirth: string;
  address: string; area: string; city: string; state: string; country: string; tier: string;
  avatar: File | null;
  hasRecruitmentExp: "yes" | "no" | "";
  selectedCategories: string[];
  otherCategory: string;
  monthlyRecruitment: string;
  // bankDetails
  bankName: string; accountNumber: string; accountName: string; accountCode: string; bvn: string;
  // documents
  documents: DocEntry[];
  // referral
  referralCode: string;
}

export const defaultTas = (): TasState => ({
  name: "", email: "", username: "", phone: "",
  password: "", gender: "female", dateOfBirth: "",
  address: "", area: "", city: "", state: "", country: "", tier: "",
  avatar: null,
  hasRecruitmentExp: "", selectedCategories: [], otherCategory: "", monthlyRecruitment: "",
  bankName: "", accountNumber: "", accountName: "", accountCode: "", bvn: "",
  documents: [],
  referralCode: "",
});

export const TAS_STEPS = [
  { label: "Profile",    icon: <UserIcon size={14} /> },
  { label: "Experience", icon: <Briefcase size={14} /> },
  { label: "Bank",       icon: <CreditCard size={14} /> },
  { label: "Documents",  icon: <FileText size={14} /> },
];

export function validateTasStep(f: TasState, step: number, warn: (msg: string) => void): boolean {
  if (step === 0) {
    if (!f.name || !f.email || !f.username || !f.dateOfBirth || !f.password) {
      warn("Name, email, username, date of birth and password are required"); return false;
    }
    if (!f.address.trim()) { warn("Address is required"); return false; }
  }
  if (step === 1) {
    if (!f.hasRecruitmentExp) { warn("Please answer the recruitment experience question"); return false; }
    if (f.selectedCategories.length === 0 && !f.otherCategory.trim()) {
      warn("Select at least one category"); return false;
    }
    if (!f.monthlyRecruitment) { warn("Please select monthly recruitment capacity"); return false; }
  }
  return true;
}

interface TasMultiStepProps {
  f: TasState;
  setF: React.Dispatch<React.SetStateAction<TasState>>;
  step: number;
}

export default function TasMultiStep({ f, setF, step }: TasMultiStepProps) {
  const [showPw, setShowPw] = useState(false);
  const set = (k: keyof TasState, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const toggleCategory = (cat: string) =>
    setF((p) => ({
      ...p,
      selectedCategories: p.selectedCategories.includes(cat)
        ? p.selectedCategories.filter((c) => c !== cat)
        : [...p.selectedCategories, cat],
    }));

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "8px 12px", borderRadius: "10px",
    border: `1.5px solid ${active ? "#2563EB" : "#D1D5DB"}`,
    backgroundColor: active ? "#EFF6FF" : "var(--color-background)",
    color: active ? "#2563EB" : "var(--color-text-main)",
    fontSize: "12px", cursor: "pointer", textAlign: "left", fontWeight: active ? 600 : 400,
  });
  const radio = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px",
    borderRadius: "10px", border: `1.5px solid ${active ? "#2563EB" : "#D1D5DB"}`,
    backgroundColor: active ? "#EFF6FF" : "var(--color-background)",
    cursor: "pointer", fontSize: "13px",
    color: active ? "#2563EB" : "var(--color-text-main)", fontWeight: active ? 600 : 400,
  });
  const dot = (active: boolean): React.CSSProperties => ({
    width: "14px", height: "14px", borderRadius: "50%",
    border: `2px solid ${active ? "#2563EB" : "#9CA3AF"}`,
    backgroundColor: active ? "#2563EB" : "transparent",
    display: "inline-block", flexShrink: 0,
  });

  // Step 0 — Profile
  if (step === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <AvatarPick picked={f.avatar} onPick={(file) => set("avatar", file)} />
      <div style={row}><label style={lbl}>Full Name *</label>
        <input style={inp} placeholder="Jane Doe" value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Username *</label>
        <input style={inp} placeholder="tas_jane" value={f.username} onChange={(e) => set("username", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Email *</label>
        <input style={inp} type="email" placeholder="user@email.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Phone</label>
        <PhoneInput value={f.phone} onChange={(v) => set("phone", v)} />
      </div>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Gender *</label>
          <select style={inp} value={f.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
        <div style={row}><label style={lbl}>Date of Birth *</label>
          <input style={inp} type="date" value={f.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </div>
      </div>
      {/* Location fields */}
      <div style={row}><label style={lbl}>Address *</label>
        <input style={inp} placeholder="e.g. 12 Allen Avenue" value={f.address}
          onChange={(e) => set("address", e.target.value)} />
      </div>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Area</label>
          <input style={inp} placeholder="e.g. Opebi" value={f.area} onChange={(e) => set("area", e.target.value)} /></div>
        <div style={row}><label style={lbl}>City</label>
          <input style={inp} placeholder="e.g. Ikeja" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div style={row}><label style={lbl}>State</label>
          <input style={inp} placeholder="e.g. Lagos" value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Country</label>
          <input style={inp} placeholder="Nigeria" value={f.country} onChange={(e) => set("country", e.target.value)} /></div>
      </div>
      <div style={row}><label style={lbl}>Password *</label>
        <div style={{ position: "relative" }}>
          <input style={{ ...inp, paddingRight: "40px" }} type={showPw ? "text" : "password"}
            placeholder="StrongPass123!" value={f.password} onChange={(e) => set("password", e.target.value)} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );

  // Step 1 — Experience
  if (step === 1) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={row}>
        <label style={lbl}>Do you have experience in recruitment? *</label>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" style={radio(f.hasRecruitmentExp === "yes")} onClick={() => set("hasRecruitmentExp", "yes")}>
            <span style={dot(f.hasRecruitmentExp === "yes")} /> Yes
          </button>
          <button type="button" style={radio(f.hasRecruitmentExp === "no")} onClick={() => set("hasRecruitmentExp", "no")}>
            <span style={dot(f.hasRecruitmentExp === "no")} /> No
          </button>
        </div>
      </div>
      <div style={row}>
        <label style={lbl}>Which categories can you recruit? *</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {TAS_CATEGORIES.map((cat) => (
            <button key={cat} type="button" style={pill(f.selectedCategories.includes(cat))}
              onClick={() => toggleCategory(cat)}>{cat}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
          <span style={dot(!!f.otherCategory)} />
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", flexShrink: 0 }}>Other:</span>
          <input style={{ ...inp, flex: 1 }} placeholder="specify here..."
            value={f.otherCategory} onChange={(e) => set("otherCategory", e.target.value)} />
        </div>
      </div>
      <div style={row}>
        <label style={lbl}>How many experts can you recruit monthly? *</label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["1-5", "5-10", "10-20", "20+"].map((opt) => (
            <button key={opt} type="button"
              style={{ ...pill(f.monthlyRecruitment === opt), flex: "1 1 auto", textAlign: "center" }}
              onClick={() => set("monthlyRecruitment", opt)}>{opt}</button>
          ))}
        </div>
      </div>
    </div>
  );

  // Step 2 — Bank (account)
  if (step === 2) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={row}><label style={lbl}>Bank Name</label>
        <input style={inp} placeholder="e.g. Access Bank" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Account Number</label>
        <input style={inp} placeholder="0123456789" maxLength={10} value={f.accountNumber}
          onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
      <div style={row}><label style={lbl}>Account Name</label>
        <input style={inp} placeholder="Jane Doe" value={f.accountName} onChange={(e) => set("accountName", e.target.value)} /></div>
      <div style={row}><label style={lbl}>BVN</label>
        <input style={inp} placeholder="22334455666" maxLength={11} value={f.bvn}
          onChange={(e) => set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))} /></div>
      <div style={row}><label style={lbl}>Account Code</label>
        <input style={inp} placeholder="e.g. 123456" value={f.accountCode}
          onChange={(e) => set("accountCode", e.target.value)} /></div>
    </div>
  );

  // Step 3 — Documents & Referral
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
        Upload documents and select the type for each.
      </p>
      <DocListPicker
        docs={f.documents}
        onChange={(docs) => set("documents", docs)}
        typeOptions={TAS_DOC_TYPES}
      />
      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px" }}>
        <div style={row}><label style={lbl}>Referral Code (optional)</label>
          <input style={inp} placeholder="e.g. TAS20240001" value={f.referralCode}
            onChange={(e) => set("referralCode", e.target.value)} />
        </div>
      </div>
    </div>
  );
}