"use client";

import { useState, useRef } from "react";
import { Eye, EyeOff, Loader2, Upload, CheckCircle2, ChevronRight, ChevronLeft, User, FileText, Briefcase, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch } from "@/hooks/redux";
import { addUser, fetchUsers } from "@/lib/redux/usersSlice";
import type { RegisterUserPayload } from "@/lib/api/usersApi";

type Role = "client" | "expert" | "tas";

// ── Styles ────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #D1D5DB", backgroundColor: "var(--color-background)",
  fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "5px",
};
const row: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "4px" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" };

// ── Categories ────────────────────────────────────────────
const CATEGORIES: Record<string, string[]> = {
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
const TAS_CATEGORIES = Object.keys(CATEGORIES);

// ── Shared widgets ────────────────────────────────────────
function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

function DocPick({ label, required = false, picked, onPick }: {
  label: string; required?: boolean; picked: File | null; onPick: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={row}>
      <label style={lbl}>{label}{required && " *"}</label>
      <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
      {picked ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px",
          borderRadius: "10px", border: "1px solid #86efac", backgroundColor: "#f0fdf4" }}>
          <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#15803d", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{picked.name}</span>
          <button type="button" onClick={() => ref.current?.click()}
            style={{ fontSize: "11px", color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>Change</button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "9px 14px", borderRadius: "10px", border: "1px dashed #D1D5DB",
            backgroundColor: "var(--color-background)", fontSize: "12px", color: "#6B7280",
            cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
          <Upload size={13} />Choose file (image or PDF)
        </button>
      )}
    </div>
  );
}

function AvatarPick({ picked, onPick }: { picked: File | null; onPick: (file: File) => void }) {
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
function StepBar({ steps, current }: { steps: { label: string; icon: React.ReactNode }[]; current: number }) {
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
            <span style={{ fontSize: "10px", color: i === current ? "#2563EB" : "var(--color-text-muted)", fontWeight: i === current ? 600 : 400, whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: "2px", backgroundColor: i < current ? "#16a34a" : "#E5E7EB", margin: "0 6px", marginBottom: "14px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Role Selector ─────────────────────────────────────────
function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
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

// ══════════════════════════════════════════════════════════
// CLIENT FORM (single step)
// ══════════════════════════════════════════════════════════
const defaultClient = () => ({ name: "", email: "", username: "", phone: "", password: "", referral: "" });

function ClientForm({ f, set, showPw, setShowPw }: {
  f: Record<string, string>; set: (k: string, v: string) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={row}><label style={lbl}>Full Name *</label>
        <input style={inp} placeholder="John Doe" value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Email *</label>
        <input style={inp} type="email" placeholder="user@email.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Username *</label>
        <input style={inp} placeholder="johndoe" value={f.username} onChange={(e) => set("username", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Phone</label>
        <PhoneInput value={f.phone} onChange={(v) => set("phone", v)} />
      </div>
      <div style={row}><label style={lbl}>Referral Code</label>
        <input style={inp} placeholder="Optional" value={f.referral} onChange={(e) => set("referral", e.target.value)} />
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
}

// ══════════════════════════════════════════════════════════
// EXPERT FORM — multistep
// ══════════════════════════════════════════════════════════
interface ExpertState {
  // Step 1 — Profile
  name: string; email: string; phone: string; gender: string;
  bio: string; referral: string; avatar: File | null;
  // Step 2 — Service Info
  categoryName: string; subCategories: string[];
  skillRole: string; skillExp: string; skillDesc: string; skillArea: string;
  verification: string; paymentModel: string;
  // Step 3 — Location
  country: string; state: string; city: string; area: string;
  // Step 4 — Bank Details
  bankName: string; accountNumber: string; accountName: string; accountCode: string; bvn: string;
  // Step 5 — Documents & Password
  ninSlip: File | null; passport: File | null; password: string;
}

const defaultExpert = (): ExpertState => ({
  name: "", email: "", phone: "", gender: "male", bio: "", referral: "", avatar: null,
  categoryName: "", subCategories: [],
  skillRole: "", skillExp: "", skillDesc: "", skillArea: "",
  verification: "tier1", paymentModel: "protected",
  country: "", state: "", city: "", area: "",
  bankName: "", accountNumber: "", accountName: "", accountCode: "", bvn: "",
  ninSlip: null, passport: null, password: "",
});

const EXPERT_STEPS = [
  { label: "Profile",    icon: <User size={14} /> },
  { label: "Service",    icon: <Briefcase size={14} /> },
  { label: "Location",   icon: <span style={{ fontSize: "11px" }}>📍</span> },
  { label: "Bank",       icon: <CreditCard size={14} /> },
  { label: "Docs",       icon: <FileText size={14} /> },
];

function ExpertMultiStep({ f, setF, step }: {
  f: ExpertState; setF: React.Dispatch<React.SetStateAction<ExpertState>>; step: number;
}) {
  const [showPw, setShowPw] = useState(false);
  const set = (k: keyof ExpertState, v: string | File | null | string[]) =>
    setF((p) => ({ ...p, [k]: v }));

  const subOptions = f.categoryName ? (CATEGORIES[f.categoryName] ?? []) : [];

  const toggleSub = (sub: string) => {
    setF((p) => ({
      ...p,
      subCategories: p.subCategories.includes(sub)
        ? p.subCategories.filter((s) => s !== sub)
        : [...p.subCategories, sub],
    }));
  };

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "6px 10px", borderRadius: "8px",
    border: `1.5px solid ${active ? "#2563EB" : "#D1D5DB"}`,
    backgroundColor: active ? "#EFF6FF" : "var(--color-background)",
    color: active ? "#2563EB" : "var(--color-text-main)",
    fontSize: "11px", cursor: "pointer", fontWeight: active ? 600 : 400,
  });

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
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
        <div style={row}><label style={lbl}>Verification Tier</label>
          <select style={inp} value={f.verification} onChange={(e) => set("verification", e.target.value)}>
            <option value="tier1">Tier 1</option><option value="tier2">Tier 2</option><option value="tier3">Tier 3</option>
          </select>
        </div>
      </div>
      <div style={row}><label style={lbl}>Payment Model</label>
        <select style={inp} value={f.paymentModel} onChange={(e) => set("paymentModel", e.target.value)}>
          <option value="protected">Protected</option><option value="unprotected">Unprotected</option>
        </select>
      </div>
      <div style={row}><label style={lbl}>Bio *</label>
        <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={3}
          placeholder="Brief description..." value={f.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Referral Code</label>
        <input style={inp} placeholder="Optional" value={f.referral} onChange={(e) => set("referral", e.target.value)} />
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={row}><label style={lbl}>Category *</label>
        <select style={inp} value={f.categoryName} onChange={(e) => { set("categoryName", e.target.value); set("subCategories", []); }}>
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
          <input style={inp} placeholder="e.g. Electrician" value={f.skillRole} onChange={(e) => set("skillRole", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Experience (yrs)</label>
          <input style={inp} type="number" min="0" placeholder="5" value={f.skillExp} onChange={(e) => set("skillExp", e.target.value)} /></div>
      </div>
      <div style={row}><label style={lbl}>Skill Description</label>
        <input style={inp} placeholder="e.g. Electrical installation and repairs" value={f.skillDesc} onChange={(e) => set("skillDesc", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Service Area</label>
        <input style={inp} placeholder="e.g. Ikeja" value={f.skillArea} onChange={(e) => set("skillArea", e.target.value)} />
      </div>
    </div>
  );

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

  if (step === 3) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Bank Name</label>
          <input style={inp} placeholder="e.g. OPay" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Account Number</label>
          <input style={inp} placeholder="0123456789" maxLength={10} value={f.accountNumber}
            onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
        <div style={row}><label style={lbl}>Account Name</label>
          <input style={inp} placeholder="John Doe" value={f.accountName} onChange={(e) => set("accountName", e.target.value)} /></div>
        <div style={row}><label style={lbl}>BVN</label>
          <input style={inp} placeholder="22334455666" maxLength={11} value={f.bvn}
            onChange={(e) => set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))} /></div>
      </div>
    </div>
  );

  // step 4 — Docs & Password
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <DocPick label="NIN Slip" required picked={f.ninSlip} onPick={(file) => set("ninSlip", file)} />
      <DocPick label="Passport Photo" required picked={f.passport} onPick={(file) => set("passport", file)} />
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
}

// ══════════════════════════════════════════════════════════
// TAS FORM — multistep
// ══════════════════════════════════════════════════════════
interface TasState {
  // Step 1 — Profile
  name: string; email: string; username: string; phone: string;
  password: string; gender: string; dateOfBirth: string;
  applicationCode: string; address: string; avatar: File | null;
  // Step 2 — Experience & Categories
  hasRecruitmentExp: "yes" | "no" | "";
  selectedCategories: string[];
  otherCategory: string;
  monthlyRecruitment: string;
  // Step 3 — Bank Details
  bankName: string; accountNumber: string; accountName: string; accountCode: string;
  // Step 4 — Documents & Referral
  ninSlip: File | null; bvnConsent: File | null; governmentId: File | null;
  guarantorForm: File | null; policeClearing: File | null;
  wasReferred: "yes" | "no" | ""; referralCode: string;
}

const defaultTas = (): TasState => ({
  name: "", email: "", username: "", phone: "",
  password: "", gender: "female", dateOfBirth: "",
  applicationCode: "", address: "", avatar: null,
  hasRecruitmentExp: "", selectedCategories: [], otherCategory: "", monthlyRecruitment: "",
  bankName: "", accountNumber: "", accountName: "", accountCode: "0000",
  ninSlip: null, bvnConsent: null, governmentId: null, guarantorForm: null, policeClearing: null,
  wasReferred: "", referralCode: "",
});

const TAS_STEPS = [
  { label: "Profile",    icon: <User size={14} /> },
  { label: "Experience", icon: <Briefcase size={14} /> },
  { label: "Bank",       icon: <CreditCard size={14} /> },
  { label: "Documents",  icon: <FileText size={14} /> },
];

function TasMultiStep({ f, setF, step }: {
  f: TasState; setF: React.Dispatch<React.SetStateAction<TasState>>; step: number;
}) {
  const [showPw, setShowPw] = useState(false);
  const set = (k: keyof TasState, v: string | File | null | string[]) =>
    setF((p) => ({ ...p, [k]: v }));

  const toggleCategory = (cat: string) => {
    setF((p) => ({
      ...p,
      selectedCategories: p.selectedCategories.includes(cat)
        ? p.selectedCategories.filter((c) => c !== cat)
        : [...p.selectedCategories, cat],
    }));
  };

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

  if (step === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <AvatarPick picked={f.avatar} onPick={(file) => set("avatar", file)} />
      <div style={row}><label style={lbl}>Full Name *</label>
        <input style={inp} placeholder="Jane Doe" value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Username *</label>
        <input style={inp} placeholder="tas_user" value={f.username} onChange={(e) => set("username", e.target.value)} />
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
      <div style={row}><label style={lbl}>Application Code *</label>
        <input style={inp} placeholder="e.g. TAS-APP-2024-001" value={f.applicationCode} onChange={(e) => set("applicationCode", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Address *</label>
        <input style={inp} placeholder="e.g. Abule Egba, Lagos, Nigeria" value={f.address} onChange={(e) => set("address", e.target.value)} />
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

  if (step === 2) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={row}><label style={lbl}>Bank Name</label>
        <input style={inp} placeholder="e.g. OPay" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Account Number</label>
        <input style={inp} placeholder="1234567890" maxLength={10} value={f.accountNumber}
          onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
      <div style={row}><label style={lbl}>Account Name</label>
        <input style={inp} placeholder="Jane Doe" value={f.accountName} onChange={(e) => set("accountName", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Account Code</label>
        <input style={inp} placeholder="0000" value={f.accountCode} onChange={(e) => set("accountCode", e.target.value)} /></div>
    </div>
  );

  // step 3 — Documents & Referral
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <DocPick label="NIN Slip" required picked={f.ninSlip} onPick={(file) => set("ninSlip", file)} />
      <DocPick label="BVN Consent" picked={f.bvnConsent} onPick={(file) => set("bvnConsent", file)} />
      <DocPick label="Government ID" picked={f.governmentId} onPick={(file) => set("governmentId", file)} />
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>Optional (for Tier 3 eligibility):</p>
      <DocPick label="Guarantor Form" picked={f.guarantorForm} onPick={(file) => set("guarantorForm", file)} />
      <DocPick label="Police Clearance" picked={f.policeClearing} onPick={(file) => set("policeClearing", file)} />

      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px" }}>
        <label style={lbl}>Were you referred by an existing TAS?</label>
        <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
          {(["yes", "no"] as const).map((opt) => (
            <button key={opt} type="button"
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px",
                borderRadius: "10px", border: `1.5px solid ${f.wasReferred === opt ? "#2563EB" : "#D1D5DB"}`,
                backgroundColor: f.wasReferred === opt ? "#EFF6FF" : "var(--color-background)",
                cursor: "pointer", fontSize: "13px",
                color: f.wasReferred === opt ? "#2563EB" : "var(--color-text-main)",
                fontWeight: f.wasReferred === opt ? 600 : 400 }}
              onClick={() => set("wasReferred", opt)}>
              <span style={{ width: "14px", height: "14px", borderRadius: "50%",
                border: `2px solid ${f.wasReferred === opt ? "#2563EB" : "#9CA3AF"}`,
                backgroundColor: f.wasReferred === opt ? "#2563EB" : "transparent",
                display: "inline-block", flexShrink: 0 }} />
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        {f.wasReferred === "yes" && (
          <div style={{ ...row, marginTop: "12px" }}><label style={lbl}>Referral Code *</label>
            <input style={inp} placeholder="Enter referral code" value={f.referralCode}
              onChange={(e) => set("referralCode", e.target.value)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN MODAL
// ══════════════════════════════════════════════════════════
interface AddUserModalProps { open: boolean; onClose: () => void; }

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const dispatch = useAppDispatch();

  const [stage,      setStage]      = useState<"role" | "form">("role");
  const [role,       setRole]       = useState<Role>("client");
  const [step,       setStep]       = useState(0);
  const [clientF,    setClientF]    = useState(defaultClient());
  const [expertF,    setExpertF]    = useState<ExpertState>(defaultExpert());
  const [tasF,       setTasF]       = useState<TasState>(defaultTas());
  const [showPw,     setShowPw]     = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const expertTotalSteps = EXPERT_STEPS.length;
  const tasTotalSteps    = TAS_STEPS.length;

  const reset = () => {
    setStage("role"); setStep(0);
    setClientF(defaultClient()); setExpertF(defaultExpert()); setTasF(defaultTas());
    setShowPw(false);
  };
  const handleClose      = () => { reset(); onClose(); };
  const handleRoleSelect = (r: Role) => { setRole(r); setStage("form"); setStep(0); };

  // ── Step validation ───────────────────────────────────
  const validateExpertStep = (): boolean => {
    const f = expertF;
    if (step === 0) {
      if (!f.name || !f.email || !f.bio) { toast.warning("Name, email and bio are required"); return false; }
    }
    if (step === 1) {
      if (!f.categoryName) { toast.warning("Please select a category"); return false; }
    }
    if (step === 4) {
      if (!f.ninSlip)   { toast.warning("NIN slip is required"); return false; }
      if (!f.passport)  { toast.warning("Passport photo is required"); return false; }
      if (!f.password)  { toast.warning("Password is required"); return false; }
    }
    return true;
  };

  const validateTasStep = (): boolean => {
    const f = tasF;
    if (step === 0) {
      if (!f.name || !f.email || !f.username || !f.dateOfBirth || !f.password) {
        toast.warning("Name, email, username, date of birth and password are required"); return false;
      }
      if (!f.applicationCode.trim()) { toast.warning("Application code is required"); return false; }
      if (!f.address.trim())         { toast.warning("Address is required"); return false; }
    }
    if (step === 1) {
      if (!f.hasRecruitmentExp) { toast.warning("Please answer the recruitment experience question"); return false; }
      if (f.selectedCategories.length === 0 && !f.otherCategory.trim()) {
        toast.warning("Select at least one category"); return false;
      }
      if (!f.monthlyRecruitment) { toast.warning("Please select monthly recruitment capacity"); return false; }
    }
    if (step === 3) {
      if (!f.ninSlip) { toast.warning("NIN slip is required"); return false; }
      if (f.wasReferred === "yes" && !f.referralCode.trim()) {
        toast.warning("Please enter the referral code"); return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (role === "expert" && !validateExpertStep()) return;
    if (role === "tas"    && !validateTasStep())    return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = () => {
    let payload: RegisterUserPayload;

    if (role === "client") {
      const f = clientF;
      if (!f.name || !f.email || !f.password || !f.username) {
        toast.warning("Name, email, username and password are required"); return;
      }
      payload = {
        role: "client",
        name: f.name, email: f.email, username: f.username,
        phone: f.phone ? `+234${f.phone}` : "",
        password: f.password, referral: f.referral || undefined,
      };

    } else if (role === "expert") {
      if (!validateExpertStep()) return;
      const f = expertF;
      payload = {
        role: "expert",
        name: f.name, email: f.email, password: f.password,
        phone: f.phone ? `+234${f.phone}` : "",
        gender: f.gender as "male" | "female" | "other",
        bio: f.bio, referral: f.referral || undefined,
        verification: (f.verification as "tier1" | "tier2" | "tier3") || "tier1",
        paymentModel: (f.paymentModel as "protected" | "unprotected") || "protected",
        avatar: f.avatar ?? undefined,
        ninSlip:  f.ninSlip  ?? undefined,
        passport: f.passport ?? undefined,
        location: { country: f.country, state: f.state, city: f.city, area: f.area },
        skill: {
          role:        f.skillRole ? [f.skillRole] : [],
          experience:  f.skillExp ? Number(f.skillExp) : 0,
          description: f.skillDesc,
          area:        f.skillArea,
        },
        category: {
          name: f.categoryName,
          sub:  f.subCategories,
        },
        bankDetails: f.bankName ? {
          bankName:      f.bankName,
          accountNumber: f.accountNumber || undefined,
          accountName:   f.accountName   || undefined,
          accountCode:   f.accountCode   || undefined,
          bvn:           f.bvn           || undefined,
        } : undefined,
      } as RegisterUserPayload;

    } else {
      if (!validateTasStep()) return;
      const f = tasF;
      const allCategories = [
        ...f.selectedCategories,
        ...(f.otherCategory.trim() ? [f.otherCategory.trim()] : []),
      ];
      payload = {
        role: "tas",
        name: f.name, email: f.email, username: f.username, password: f.password,
        phone: f.phone ? `+234${f.phone}` : "",
        gender: f.gender as "male" | "female" | "other",
        dateOfBirth: f.dateOfBirth,
        applicationCode: f.applicationCode,
        avatar: f.avatar ?? undefined,
        category: allCategories,
        referral: f.wasReferred === "yes" ? f.referralCode : undefined,
        location: { address: f.address },
        bankDetails: f.bankName ? {
          bankName:      f.bankName,
          accountNumber: f.accountNumber || undefined,
          accountName:   f.accountName   || undefined,
          accountCode:   f.accountCode   || "0000",
        } : undefined,
        ninSlip:        f.ninSlip        ?? undefined,
        bvnConsent:     f.bvnConsent     ?? undefined,
        governmentId:   f.governmentId   ?? undefined,
        guarantorForm:  f.guarantorForm  ?? undefined,
        policeClearing: f.policeClearing ?? undefined,
        recruitExpectations: {
          hasRecruitmentExperience:         f.hasRecruitmentExp as "yes" | "no",
          recruitmentExperienceDescription: "",
          selectedCategories:               allCategories,
          recruitCountMonthly:              f.monthlyRecruitment,
          networkSize:                      f.monthlyRecruitment,
          years: f.hasRecruitmentExp === "no" ? "None" : "",
          area:  "",
        },
      };
    }

    setAddLoading(true);
    dispatch(addUser(payload as RegisterUserPayload))
      .unwrap()
      .then(() => { toast.success("User added successfully"); handleClose(); dispatch(fetchUsers()); })
      .catch((err: string) => toast.error("Failed to add user", { description: err }))
      .finally(() => setAddLoading(false));
  };

  // ── Footer ─────────────────────────────────────────────
  const isExpertLast = role === "expert" && step === expertTotalSteps - 1;
  const isTasLast    = role === "tas"    && step === tasTotalSteps - 1;
  const isLastStep   = isExpertLast || isTasLast || role === "client";

  const title = stage === "role" ? "Select User Type"
    : role === "client" ? "Add Client"
    : role === "expert" ? `Add Expert — ${EXPERT_STEPS[step].label}`
    : `Add TAS — ${TAS_STEPS[step].label}`;

  const footer = stage === "role" ? undefined : (
    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
      <button onClick={stage === "form" && (step > 0) ? handleBack : handleClose}
        style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #D1D5DB",
          backgroundColor: "var(--color-surface)", fontSize: "13px",
          cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
        {step > 0 ? <><ChevronLeft size={14} />Back</> : "Cancel"}
      </button>
      {isLastStep ? (
        <button onClick={handleSubmit} disabled={addLoading}
          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none",
            backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600,
            cursor: addLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: addLoading ? 0.7 : 1 }}>
          {addLoading ? <><Loader2 size={14} className="animate-spin" />Adding...</> : "Add User"}
        </button>
      ) : (
        <button onClick={handleNext}
          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none",
            backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          Next <ChevronRight size={14} />
        </button>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={handleClose} title={title} size="md" footer={footer}>
      {stage === "role" ? (
        <RoleSelector onSelect={handleRoleSelect} />
      ) : role === "client" ? (
        <ClientForm f={clientF} set={(k, v) => setClientF((p) => ({ ...p, [k]: v }))}
          showPw={showPw} setShowPw={setShowPw} />
      ) : role === "expert" ? (
        <>
          <StepBar steps={EXPERT_STEPS} current={step} />
          <ExpertMultiStep f={expertF} setF={setExpertF} step={step} />
        </>
      ) : (
        <>
          <StepBar steps={TAS_STEPS} current={step} />
          <TasMultiStep f={tasF} setF={setTasF} step={step} />
        </>
      )}
    </Modal>
  );
}