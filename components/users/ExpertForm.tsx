"use client";

import { useState } from "react";
import { Eye, EyeOff, User as UserIcon, Briefcase, FileText, CreditCard } from "lucide-react";
import {
  inp, lbl, row, grid2,
  CATEGORIES, EXPERT_DOC_TYPES,
  PhoneInput, DocListPicker, AvatarPick,
  DocEntry,
} from "./Shared";

export interface ExpertState {
  // Step 1 — Profile
  name: string; email: string; phone: string; gender: string;
  bio: string; referral: string; avatar: File | null; password: string;
  verification: string; paymentModel: string;
  // Step 2 — Service Info
  categoryName: string; subCategories: string[];
  skillRole: string; skillExp: string; skillDesc: string; skillArea: string;
  // Services
  services: { catalogue: string; price: string }[];
  // Step 3 — Location
  country: string; state: string; city: string; area: string;
  // Step 4 — Bank Details
  bankName: string; accountNumber: string; accountName: string; accountCode: string; bvn: string;
  // Step 5 — Documents
  documents: DocEntry[];
}

export const defaultExpert = (): ExpertState => ({
  name: "", email: "", phone: "", gender: "male", bio: "", referral: "",
  avatar: null, password: "", verification: "tier1", paymentModel: "protected",
  categoryName: "", subCategories: [],
  skillRole: "", skillExp: "", skillDesc: "", skillArea: "",
  services: [],
  country: "", state: "", city: "", area: "",
  bankName: "", accountNumber: "", accountName: "", accountCode: "", bvn: "",
  documents: [],
});

export const EXPERT_STEPS = [
  { label: "Profile",  icon: <UserIcon size={14} /> },
  { label: "Service",  icon: <Briefcase size={14} /> },
  { label: "Location", icon: <span style={{ fontSize: "11px" }}>📍</span> },
  { label: "Bank",     icon: <CreditCard size={14} /> },
  { label: "Docs",     icon: <FileText size={14} /> },
];

export function validateExpertStep(f: ExpertState, step: number, warn: (msg: string) => void): boolean {
  if (step === 0) {
    if (!f.name)     { warn("Full name is required"); return false; }
    if (!f.email)    { warn("Email is required"); return false; }
    if (!f.bio)      { warn("Bio is required"); return false; }
    if (!f.password) { warn("Password is required"); return false; }
  }
  if (step === 1 && !f.categoryName) {
    warn("Please select a category"); return false;
  }
  return true;
}

interface ExpertMultiStepProps {
  f: ExpertState;
  setF: React.Dispatch<React.SetStateAction<ExpertState>>;
  step: number;
}

export default function ExpertMultiStep({ f, setF, step }: ExpertMultiStepProps) {
  const [showPw, setShowPw] = useState(false);
  const set = (k: keyof ExpertState, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const subOptions = f.categoryName ? (CATEGORIES[f.categoryName] ?? []) : [];
  const toggleSub = (sub: string) =>
    setF((p) => ({
      ...p,
      subCategories: p.subCategories.includes(sub)
        ? p.subCategories.filter((s) => s !== sub)
        : [...p.subCategories, sub],
    }));

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "6px 10px", borderRadius: "8px",
    border: `1.5px solid ${active ? "#2563EB" : "#D1D5DB"}`,
    backgroundColor: active ? "#EFF6FF" : "var(--color-background)",
    color: active ? "#2563EB" : "var(--color-text-main)",
    fontSize: "11px", cursor: "pointer", fontWeight: active ? 600 : 400,
  });

  const addService = () => set("services", [...f.services, { catalogue: "", price: "" }]);
  const removeService = (i: number) => set("services", f.services.filter((_, idx) => idx !== i));
  const updateService = (i: number, field: "catalogue" | "price", value: string) =>
    set("services", f.services.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  // Step 1 — Profile
  if (step === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <AvatarPick picked={f.avatar} onPick={(file) => set("avatar", file)} />
      <div style={row}><label style={lbl}>Full Name *</label>
        <input style={inp} placeholder="John Doe" value={f.name} onChange={(e) => set("name", e.target.value)} />
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
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={row}><label style={lbl}>Verification Tier</label>
          <select style={inp} value={f.verification} onChange={(e) => set("verification", e.target.value)}>
            <option value="tier1">Tier 1</option>
            <option value="tier2">Tier 2</option>
            <option value="tier3">Tier 3</option>
          </select>
        </div>
      </div>
      <div style={row}><label style={lbl}>Payment Model</label>
        <select style={inp} value={f.paymentModel} onChange={(e) => set("paymentModel", e.target.value)}>
          <option value="protected">Protected</option>
          <option value="unprotected">Unprotected</option>
        </select>
      </div>
      <div style={row}><label style={lbl}>Bio *</label>
        <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={3}
          placeholder="Brief description..." value={f.bio} onChange={(e) => set("bio", e.target.value)} />
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
      <div style={row}><label style={lbl}>Referral Code</label>
        <input style={inp} placeholder="Optional" value={f.referral} onChange={(e) => set("referral", e.target.value)} />
      </div>
    </div>
  );

  // Step 2 — Service Info + Services catalogue
  if (step === 1) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={row}><label style={lbl}>Category *</label>
        <select style={inp} value={f.categoryName}
          onChange={(e) => { set("categoryName", e.target.value); set("subCategories", []); }}>
          <option value="">Select a category</option>
          {Object.keys(CATEGORIES).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      {subOptions.length > 0 && (
        <div style={row}>
          <label style={lbl}>Sub-categories (select all that apply)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {subOptions.map((sub) => (
              <button key={sub} type="button" style={pill(f.subCategories.includes(sub))}
                onClick={() => toggleSub(sub)}>{sub}</button>
            ))}
          </div>
        </div>
      )}
      <div style={grid2}>
        <div style={row}><label style={lbl}>Role / Title</label>
          <input style={inp} placeholder="e.g. Electrician" value={f.skillRole}
            onChange={(e) => set("skillRole", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Experience (yrs)</label>
          <input style={inp} type="number" min="0" placeholder="5" value={f.skillExp}
            onChange={(e) => set("skillExp", e.target.value)} /></div>
      </div>
      <div style={row}><label style={lbl}>Skill Description</label>
        <input style={inp} placeholder="e.g. Electrical installation and repairs" value={f.skillDesc}
          onChange={(e) => set("skillDesc", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Service Area</label>
        <input style={inp} placeholder="e.g. Ikeja" value={f.skillArea}
          onChange={(e) => set("skillArea", e.target.value)} />
      </div>

      {/* Services catalogue */}
      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "12px" }}>
        <label style={{ ...lbl, marginBottom: "8px" }}>Services & Pricing (optional)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {f.services.map((svc, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 28px", gap: "8px", alignItems: "end" }}>
              <div style={row}>
                {i === 0 && <label style={lbl}>Service Name</label>}
                <input style={inp} placeholder="e.g. Electrical Installation" value={svc.catalogue}
                  onChange={(e) => updateService(i, "catalogue", e.target.value)} />
              </div>
              <div style={row}>
                {i === 0 && <label style={lbl}>Price (₦)</label>}
                <input style={inp} type="number" min="0" placeholder="15000" value={svc.price}
                  onChange={(e) => updateService(i, "price", e.target.value)} />
              </div>
              <button type="button" onClick={() => removeService(i)}
                style={{ width: "28px", height: "38px", borderRadius: "8px", border: "1px solid #fee2e2",
                  backgroundColor: "#fff5f5", color: "#dc2626", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                  marginTop: i === 0 ? "17px" : 0 }}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addService}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              padding: "8px", borderRadius: "8px", border: "1px dashed #D1D5DB",
              backgroundColor: "var(--color-background)", fontSize: "12px", color: "#6B7280", cursor: "pointer" }}>
            + Add Service
          </button>
        </div>
      </div>
    </div>
  );

  // Step 3 — Location
  if (step === 2) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Country</label>
          <input style={inp} placeholder="Nigeria" value={f.country} onChange={(e) => set("country", e.target.value)} /></div>
        <div style={row}><label style={lbl}>State</label>
          <input style={inp} placeholder="Lagos" value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
        <div style={row}><label style={lbl}>City</label>
          <input style={inp} placeholder="Ikeja" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Area</label>
          <input style={inp} placeholder="Opebi" value={f.area} onChange={(e) => set("area", e.target.value)} /></div>
      </div>
    </div>
  );

  // Step 4 — Bank Details
  if (step === 3) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Bank Name</label>
          <input style={inp} placeholder="e.g. Access Bank" value={f.bankName}
            onChange={(e) => set("bankName", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Account Number</label>
          <input style={inp} placeholder="0123456789" maxLength={10} value={f.accountNumber}
            onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
        <div style={row}><label style={lbl}>Account Name</label>
          <input style={inp} placeholder="John Doe" value={f.accountName}
            onChange={(e) => set("accountName", e.target.value)} /></div>
        <div style={row}><label style={lbl}>BVN</label>
          <input style={inp} placeholder="22334455666" maxLength={11} value={f.bvn}
            onChange={(e) => set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))} /></div>
      </div>
      <div style={row}><label style={lbl}>Account Code</label>
        <input style={inp} placeholder="e.g. 123456" value={f.accountCode}
          onChange={(e) => set("accountCode", e.target.value)} />
      </div>
    </div>
  );

  // Step 5 — Documents
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
        Upload documents and select the type for each. All documents are optional.
      </p>
      <DocListPicker
        docs={f.documents}
        onChange={(docs) => set("documents", docs)}
        typeOptions={EXPERT_DOC_TYPES}
      />
    </div>
  );
}