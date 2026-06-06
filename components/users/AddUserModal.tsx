"use client";

import { useState, useRef } from "react";
import { Eye, EyeOff, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch } from "@/hooks/redux";
import { addUser, fetchUsers } from "@/lib/redux/usersSlice";
import type { RegisterUserPayload } from "@/lib/api/usersApi";

// ── Types ─────────────────────────────────────────────────
type Role = "client" | "expert" | "tas";

interface UploadedDoc {
  url:      string;
  publicId: string;
  fileName: string;
}

// ── Upload via internal API route ─────────────────────────
// POST /api/upload  →  { url, publicId }
async function uploadDoc(file: File, folder = "expert_docs"): Promise<UploadedDoc> {
  const form = new FormData();
  form.append("file",   file);
  form.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Upload failed");
  }
  const data = await res.json();
  return { url: data.url, publicId: data.publicId, fileName: file.name };
}

// ── Shared styles ─────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #D1D5DB", backgroundColor: "var(--color-background)",
  fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "5px",
};
const row: React.CSSProperties          = { display: "flex", flexDirection: "column", gap: "4px" };
const sectionLabel: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: "4px 0 0",
};
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" };

// ── Phone input ───────────────────────────────────────────
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

// ── File upload widget ────────────────────────────────────
function DocUpload({ label, required = false, uploaded, uploading, onPick }: {
  label:     string;
  required?: boolean;
  uploaded:  UploadedDoc | null;
  uploading: boolean;
  onPick:    (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={row}>
      <label style={lbl}>{label}{required && " *"}</label>
      <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />

      {uploaded ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px",
          borderRadius: "10px", border: "1px solid #86efac", backgroundColor: "#f0fdf4" }}>
          <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#15803d", flex: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {uploaded.fileName}
          </span>
          <button type="button" onClick={() => ref.current?.click()}
            style={{ fontSize: "11px", color: "#6B7280", background: "none",
              border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
            Change
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "9px 14px", borderRadius: "10px", border: "1px dashed #D1D5DB",
            backgroundColor: "var(--color-background)", fontSize: "12px", color: "#6B7280",
            cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1,
            width: "100%", boxSizing: "border-box" as const }}>
          {uploading
            ? <><Loader2 size={13} className="animate-spin" />Uploading...</>
            : <><Upload size={13} />Choose file (image or PDF)</>}
        </button>
      )}
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
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
        Select the type of user to create:
      </p>
      {roles.map((r) => (
        <button key={r.value} onClick={() => onSelect(r.value)}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",
            padding: "14px 16px", borderRadius: "12px", border: "1px solid #D1D5DB",
            backgroundColor: "var(--color-background)", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{r.label}</span>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{r.desc}</span>
        </button>
      ))}
    </div>
  );
}

// ── Default field maps ────────────────────────────────────
const defaultClient = () => ({ name: "", email: "", username: "", phone: "", password: "", referral: "" });
const defaultExpert = () => ({
  name: "", email: "", phone: "", password: "", gender: "male", bio: "", referral: "",
  verification: "tier1", paymentModel: "protected",
  country: "", state: "", city: "", area: "",
  skillRole: "", skillExp: "", skillDesc: "", skillArea: "", categoryName: "",
  bankName: "", accountNumber: "", accountName: "", accountCode: "", bvn: "",
});
const defaultTas = () => ({
  name: "", email: "", username: "", phone: "", password: "", gender: "male", dateOfBirth: "",
  applicationCode: "", recruitExpectations: "",
  bankName: "", accountNo: "",
  category: "", idCard: "", referenceLetter: "",
});

// ── Client Form ───────────────────────────────────────────
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

// ── Expert Form ───────────────────────────────────────────
function ExpertForm({ f, set, showPw, setShowPw, docs, onDocPick, docUploading }: {
  f: Record<string, string>; set: (k: string, v: string) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
  docs:         { nin: UploadedDoc | null; passport: UploadedDoc | null };
  onDocPick:    (type: "nin" | "passport", file: File) => void;
  docUploading: { nin: boolean; passport: boolean };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={sectionLabel}>Basic Info</p>
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
        <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={2}
          placeholder="Brief description..." value={f.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Referral Code</label>
        <input style={inp} placeholder="Optional" value={f.referral} onChange={(e) => set("referral", e.target.value)} />
      </div>

      <p style={sectionLabel}>Documents</p>
      <div style={grid2}>
        <DocUpload label="NIN Slip" required
          uploaded={docs.nin} uploading={docUploading.nin}
          onPick={(file) => onDocPick("nin", file)} />
        <DocUpload label="Passport Photograph" required
          uploaded={docs.passport} uploading={docUploading.passport}
          onPick={(file) => onDocPick("passport", file)} />
      </div>

      <p style={sectionLabel}>Location</p>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Country</label>
          <input style={inp} placeholder="Nigeria" value={f.country} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>State</label>
          <input style={inp} placeholder="Lagos" value={f.state} onChange={(e) => set("state", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>City</label>
          <input style={inp} placeholder="Ikeja" value={f.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>Area</label>
          <input style={inp} placeholder="Opebi" value={f.area} onChange={(e) => set("area", e.target.value)} />
        </div>
      </div>

      <p style={sectionLabel}>Skill</p>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Role / Title</label>
          <input style={inp} placeholder="e.g. Electrician" value={f.skillRole} onChange={(e) => set("skillRole", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>Experience (yrs)</label>
          <input style={inp} type="number" min="0" placeholder="5" value={f.skillExp} onChange={(e) => set("skillExp", e.target.value)} />
        </div>
      </div>
      <div style={row}><label style={lbl}>Skill Description</label>
        <input style={inp} placeholder="e.g. Electrical installation and repairs" value={f.skillDesc} onChange={(e) => set("skillDesc", e.target.value)} />
      </div>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Service Area</label>
          <input style={inp} placeholder="e.g. Ikeja" value={f.skillArea} onChange={(e) => set("skillArea", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>Category Name</label>
          <input style={inp} placeholder="e.g. Home Services" value={f.categoryName} onChange={(e) => set("categoryName", e.target.value)} />
        </div>
      </div>

      <p style={sectionLabel}>Bank Details</p>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Bank Name</label>
          <input style={inp} placeholder="Access Bank" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>Account Number</label>
          <input style={inp} placeholder="0123456789" maxLength={10} value={f.accountNumber}
            onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
        <div style={row}><label style={lbl}>Account Name</label>
          <input style={inp} placeholder="John Doe" value={f.accountName} onChange={(e) => set("accountName", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>Account Code</label>
          <input style={inp} placeholder="e.g. 044" value={f.accountCode} onChange={(e) => set("accountCode", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>BVN</label>
          <input style={inp} placeholder="22334455666" maxLength={11} value={f.bvn}
            onChange={(e) => set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))} />
        </div>
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

// ── TAS Form ──────────────────────────────────────────────
function TasForm({ f, set, showPw, setShowPw }: {
  f: Record<string, string>; set: (k: string, v: string) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={sectionLabel}>Basic Info</p>
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
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={row}><label style={lbl}>Date of Birth *</label>
          <input style={inp} type="date" value={f.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </div>
      </div>
      <div style={row}><label style={lbl}>Application Code</label>
        <input style={inp} placeholder="Optional" value={f.applicationCode} onChange={(e) => set("applicationCode", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Recruitment Expectations</label>
        <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={2}
          placeholder="Optional..." value={f.recruitExpectations} onChange={(e) => set("recruitExpectations", e.target.value)} />
      </div>
      <div style={row}>
        <label style={lbl}>Categories (comma-separated) *</label>
        <input style={inp} placeholder="e.g. Recruitment, Vetting" value={f.category}
          onChange={(e) => set("category", e.target.value)} />
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
          Separate multiple categories with commas
        </span>
      </div>

      <p style={sectionLabel}>Document URLs</p>
      <div style={grid2}>
        <div style={row}><label style={lbl}>ID Card URL *</label>
          <input style={inp} placeholder="https://..." value={f.idCard} onChange={(e) => set("idCard", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>Reference Letter URL</label>
          <input style={inp} placeholder="https://..." value={f.referenceLetter} onChange={(e) => set("referenceLetter", e.target.value)} />
        </div>
      </div>

      <p style={sectionLabel}>Bank Details</p>
      <div style={grid2}>
        <div style={row}><label style={lbl}>Bank Name</label>
          <input style={inp} placeholder="Access Bank" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} />
        </div>
        <div style={row}><label style={lbl}>Account No</label>
          <input style={inp} placeholder="1234567890" maxLength={10} value={f.accountNo}
            onChange={(e) => set("accountNo", e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
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

// ── Main Component ────────────────────────────────────────
interface AddUserModalProps {
  open:    boolean;
  onClose: () => void;
}

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const dispatch = useAppDispatch();

  const [step,       setStep]       = useState<"role" | "form">("role");
  const [role,       setRole]       = useState<Role>("client");
  const [clientF,    setClientF]    = useState(defaultClient());
  const [expertF,    setExpertF]    = useState(defaultExpert());
  const [tasF,       setTasF]       = useState(defaultTas());
  const [showPw,     setShowPw]     = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [expertDocs,         setExpertDocs]         = useState<{ nin: UploadedDoc | null; passport: UploadedDoc | null }>({ nin: null, passport: null });
  const [expertDocUploading, setExpertDocUploading] = useState({ nin: false, passport: false });

  const handleDocPick = async (type: "nin" | "passport", file: File) => {
    setExpertDocUploading((p) => ({ ...p, [type]: true }));
    try {
      const uploaded = await uploadDoc(file, "expert_docs");
      setExpertDocs((p) => ({ ...p, [type]: uploaded }));
      toast.success(`${type === "nin" ? "NIN slip" : "Passport photograph"} uploaded`);
    } catch (err) {
      toast.error(`Failed to upload ${type === "nin" ? "NIN slip" : "passport photograph"}`,
        { description: err instanceof Error ? err.message : undefined });
    } finally {
      setExpertDocUploading((p) => ({ ...p, [type]: false }));
    }
  };

  const reset = () => {
    setStep("role");
    setClientF(defaultClient());
    setExpertF(defaultExpert());
    setTasF(defaultTas());
    setExpertDocs({ nin: null, passport: null });
    setExpertDocUploading({ nin: false, passport: false });
    setShowPw(false);
  };

  const handleClose      = () => { reset(); onClose(); };
  const handleRoleSelect = (r: Role) => { setRole(r); setStep("form"); };

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
        password: f.password,
        referral: f.referral || undefined,
      };

    } else if (role === "expert") {
      const f = expertF;
      if (!f.name || !f.email || !f.password || !f.bio) {
        toast.warning("Name, email, bio and password are required"); return;
      }
      if (!expertDocs.nin)      { toast.warning("NIN slip is required");              return; }
      if (!expertDocs.passport) { toast.warning("Passport photograph is required");   return; }

      payload = {
        role:         "expert",
        name:         f.name,
        email:        f.email,
        password:     f.password,
        phone:        f.phone ? `+234${f.phone}` : "",
        gender:       f.gender as "male" | "female" | "other",
        bio:          f.bio,
        referral:     f.referral || undefined,
        verification: (f.verification as "tier1" | "tier2" | "tier3") || "tier1",
        paymentModel: (f.paymentModel as "protected" | "unprotected") || "protected",
        avatar:       undefined,
        location:     { country: f.country, state: f.state, city: f.city, area: f.area },
        skill: {
          role:        f.skillRole ? [f.skillRole] : [],
          experience:  f.skillExp ? Number(f.skillExp) : 0,
          description: f.skillDesc,
          area:        f.skillArea,
        },
        category: { name: f.categoryName, sub: [] },
        document: {
          ninSlip:            expertDocs.nin.url,
        },
        bankDetails: {
          bankName:      f.bankName      || undefined,
          accountNumber: f.accountNumber || undefined,
          accountName:   f.accountName   || undefined,
          accountCode:   f.accountCode,   // always a string — API requires it
          bvn:           f.bvn           || undefined,
        },
      } as RegisterUserPayload;

    } else {
      const f = tasF;
      if (!f.name || !f.email || !f.password || !f.username || !f.dateOfBirth) {
        toast.warning("Name, email, username, date of birth and password are required"); return;
      }
      if (!f.category.trim()) { toast.warning("At least one category is required"); return; }
      if (!f.idCard.trim())   { toast.warning("ID Card URL is required");           return; }
      payload = {
        role:                "tas",
        name:                f.name,
        email:               f.email,
        username:            f.username,
        password:            f.password,
        phone:               f.phone ? `+234${f.phone}` : "",
        gender:              f.gender as "male" | "female" | "other",
        dateOfBirth:         f.dateOfBirth,
        category:            f.category.split(",").map((c) => c.trim()).filter(Boolean),
        document:            { idCard: f.idCard, referenceLetter: f.referenceLetter || undefined },
        applicationCode:     f.applicationCode     || undefined,
        recruitExpectations: f.recruitExpectations || undefined,
        bankDetails:         f.bankName ? { bankName: f.bankName, accountNo: f.accountNo } : undefined,
        location:            {},
      };
    }

    setAddLoading(true);
    dispatch(addUser(payload as RegisterUserPayload))
      .unwrap()
      .then(() => { toast.success("User added successfully"); handleClose(); dispatch(fetchUsers()); })
      .catch((err: string) => toast.error("Failed to add user", { description: err }))
      .finally(() => setAddLoading(false));
  };

  const title            = step === "role" ? "Select User Type" : `Add ${role.charAt(0).toUpperCase() + role.slice(1)}`;
  const anyDocUploading  = expertDocUploading.nin || expertDocUploading.passport;
  const submitDisabled   = addLoading || anyDocUploading;

  const footer = step === "role" ? undefined : (
    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
      <button onClick={() => setStep("role")}
        style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #D1D5DB",
          backgroundColor: "var(--color-surface)", fontSize: "13px",
          cursor: "pointer", color: "var(--color-text-muted)" }}>
        ← Back
      </button>
      <button onClick={handleSubmit} disabled={submitDisabled}
        style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none",
          backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600,
          cursor: submitDisabled ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          opacity: submitDisabled ? 0.7 : 1 }}>
        {anyDocUploading
          ? <><Loader2 size={14} className="animate-spin" />Uploading docs...</>
          : addLoading
            ? <><Loader2 size={14} className="animate-spin" />Adding...</>
            : "Add User"}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={handleClose} title={title} size="md" footer={footer}>
      {step === "role" ? (
        <RoleSelector onSelect={handleRoleSelect} />
      ) : role === "client" ? (
        <ClientForm f={clientF} set={(k, v) => setClientF((p) => ({ ...p, [k]: v }))} showPw={showPw} setShowPw={setShowPw} />
      ) : role === "expert" ? (
        <ExpertForm f={expertF} set={(k, v) => setExpertF((p) => ({ ...p, [k]: v }))} showPw={showPw} setShowPw={setShowPw}
          docs={expertDocs} onDocPick={handleDocPick} docUploading={expertDocUploading} />
      ) : (
        <TasForm f={tasF} set={(k, v) => setTasF((p) => ({ ...p, [k]: v }))} showPw={showPw} setShowPw={setShowPw} />
      )}
    </Modal>
  );
}