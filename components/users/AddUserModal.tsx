// components/users/AddUserModal.tsx
"use client";

import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type Role = "Client" | "Expert" | "TAS";

// ─────────────────────────────────────────────────────────
// Primitive UI helpers
// ─────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "9px",
  border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
  fontSize: "13px", color: "#111827", outline: "none",
  boxSizing: "border-box", transition: "border-color 0.15s",
};
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", cursor: "pointer" };

function Field({
  label, required, half, children,
}: {
  label: string; required?: boolean; half?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "5px",
      flex: half ? "0 0 calc(50% - 6px)" : "1 1 100%",
      minWidth: half ? "120px" : undefined,
    }}>
      <label style={{
        fontSize: "11px", fontWeight: 700, color: "#6B7280",
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {label}{required && <span style={{ color: "#2563EB", marginLeft: "2px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px",
      flex: "1 1 100%", margin: "6px 0 2px" }}>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E7EB" }} />
      <span style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF",
        textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
        {text}
      </span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E7EB" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Form data types & defaults
// ─────────────────────────────────────────────────────────
interface ClientData {
  name: string; email: string; phone: string; password: string;
  address: string; city: string; state: string; country: string;
}
const defaultClient = (): ClientData => ({
  name: "", email: "", phone: "", password: "",
  address: "", city: "", state: "", country: "Nigeria",
});

interface ExpertData {
  name: string; email: string; phone: string; password: string;
  gender: string; bio: string; paymentModel: string; verification: string;
  area: string; city: string; state: string; country: string;
  skillRole: string; skillExperience: string; skillArea: string; skillDescription: string;
  categoryName: string; categorySub: string;
  bankName: string; accountNumber: string; accountName: string; bvn: string;
}
const defaultExpert = (): ExpertData => ({
  name: "", email: "", phone: "", password: "", gender: "", bio: "",
  paymentModel: "", verification: "tier1",
  area: "", city: "", state: "", country: "Nigeria",
  skillRole: "", skillExperience: "", skillArea: "", skillDescription: "",
  categoryName: "", categorySub: "",
  bankName: "", accountNumber: "", accountName: "", bvn: "",
});

interface TasData {
  name: string; username: string; email: string; phone: string; password: string;
  gender: string; dob: string; referral: string; tier: string; categories: string;
  address: string; city: string; state: string; country: string;
  reArea: string; reYears: string; reNetworkSize: string;
  reMonthlyRecruits: string; reHasExperience: string; reExpDescription: string;
  bankName: string; accountNumber: string; accountName: string; bvn: string;
}
const defaultTas = (): TasData => ({
  name: "", username: "", email: "", phone: "", password: "",
  gender: "", dob: "", referral: "", tier: "1", categories: "",
  address: "", city: "", state: "", country: "Nigeria",
  reArea: "", reYears: "", reNetworkSize: "", reMonthlyRecruits: "",
  reHasExperience: "yes", reExpDescription: "",
  bankName: "", accountNumber: "", accountName: "", bvn: "",
});

// ─────────────────────────────────────────────────────────
// Individual role forms
// ─────────────────────────────────────────────────────────
function ClientForm({ data, set }: {
  data: ClientData;
  set: (k: keyof ClientData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <Field label="Full Name" required>
        <input style={inputStyle} placeholder="e.g. Adebayo Olowo" value={data.name} onChange={set("name")} />
      </Field>
      <Field label="Email" required>
        <input style={inputStyle} type="email" placeholder="user@email.com" value={data.email} onChange={set("email")} />
      </Field>
      <Field label="Phone" half>
        <input style={inputStyle} placeholder="+234..." value={data.phone} onChange={set("phone")} />
      </Field>
      <Field label="Password" required half>
        <input style={inputStyle} type="password" placeholder="••••••••" value={data.password} onChange={set("password")} />
      </Field>

      <Divider text="Location" />

      <Field label="Address">
        <input style={inputStyle} placeholder="Street address" value={data.address} onChange={set("address")} />
      </Field>
      <Field label="City" half>
        <input style={inputStyle} placeholder="City" value={data.city} onChange={set("city")} />
      </Field>
      <Field label="State" half>
        <input style={inputStyle} placeholder="State" value={data.state} onChange={set("state")} />
      </Field>
      <Field label="Country">
        <input style={inputStyle} placeholder="Country" value={data.country} onChange={set("country")} />
      </Field>
    </>
  );
}

function ExpertForm({ data, onChange }: {
  data: ExpertData;
  onChange: (d: ExpertData) => void;
}) {
  const set = (k: keyof ExpertData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange({ ...data, [k]: e.target.value });

  return (
    <>
      <Field label="Full Name" required>
        <input style={inputStyle} placeholder="e.g. Nath Olowo" value={data.name}
          onChange={set("name") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Email" required>
        <input style={inputStyle} type="email" placeholder="expert@email.com" value={data.email}
          onChange={set("email") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Phone" half>
        <input style={inputStyle} placeholder="+234..." value={data.phone}
          onChange={set("phone") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Password" required half>
        <input style={inputStyle} type="password" placeholder="••••••••" value={data.password}
          onChange={set("password") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Gender" half>
        <select style={selectStyle} value={data.gender} onChange={set("gender")}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Payment Model" half>
        <select style={selectStyle} value={data.paymentModel} onChange={set("paymentModel")}>
          <option value="">Select</option>
          <option value="escrow">Escrow</option>
          <option value="direct">Direct</option>
          <option value="mixed">Mixed</option>
        </select>
      </Field>
      <Field label="Verification Tier" half>
        <select style={selectStyle} value={data.verification} onChange={set("verification")}>
          <option value="tier1">Tier 1</option>
          <option value="tier2">Tier 2</option>
          <option value="tier3">Tier 3</option>
        </select>
      </Field>
      <Field label="Bio">
        <textarea rows={2} placeholder="Short bio..." value={data.bio}
          onChange={set("bio")} style={{ ...inputStyle, resize: "none" }} />
      </Field>

      <Divider text="Location" />

      <Field label="Area" half>
        <input style={inputStyle} placeholder="Neighbourhood" value={data.area}
          onChange={set("area") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="City" half>
        <input style={inputStyle} placeholder="City" value={data.city}
          onChange={set("city") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="State" half>
        <input style={inputStyle} placeholder="State" value={data.state}
          onChange={set("state") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Country" half>
        <input style={inputStyle} placeholder="Country" value={data.country}
          onChange={set("country") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>

      <Divider text="Skill" />

      <Field label="Role / Title">
        <input style={inputStyle} placeholder="e.g. Makeup Artist" value={data.skillRole}
          onChange={set("skillRole") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Experience (yrs)" half>
        <input style={inputStyle} type="number" min={0} placeholder="0" value={data.skillExperience}
          onChange={set("skillExperience") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Service Area" half>
        <input style={inputStyle} placeholder="e.g. Lagos Island" value={data.skillArea}
          onChange={set("skillArea") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Skill Description">
        <textarea rows={2} placeholder="Describe the skill..." value={data.skillDescription}
          onChange={set("skillDescription")} style={{ ...inputStyle, resize: "none" }} />
      </Field>

      <Divider text="Category" />

      <Field label="Category Name" half>
        <input style={inputStyle} placeholder="e.g. Beauty Services" value={data.categoryName}
          onChange={set("categoryName") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Sub-categories" half>
        <input style={inputStyle} placeholder="Comma-separated" value={data.categorySub}
          onChange={set("categorySub") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>

      <Divider text="Bank Details" />

      <Field label="Bank Name" half>
        <input style={inputStyle} placeholder="e.g. GTBank" value={data.bankName}
          onChange={set("bankName") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Account Number" half>
        <input style={inputStyle} placeholder="0123456789" value={data.accountNumber}
          onChange={set("accountNumber") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Account Name">
        <input style={inputStyle} placeholder="As on bank record" value={data.accountName}
          onChange={set("accountName") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="BVN">
        <input style={inputStyle} placeholder="11 digits" maxLength={11} value={data.bvn}
          onChange={set("bvn") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
    </>
  );
}

function TasForm({ data, onChange }: {
  data: TasData;
  onChange: (d: TasData) => void;
}) {
  const set = (k: keyof TasData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange({ ...data, [k]: e.target.value });

  return (
    <>
      <Field label="Full Name" required>
        <input style={inputStyle} placeholder="e.g. Emeka Nwosu" value={data.name}
          onChange={set("name") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Username" required half>
        <input style={inputStyle} placeholder="@username" value={data.username}
          onChange={set("username") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Email" required half>
        <input style={inputStyle} type="email" placeholder="tas@email.com" value={data.email}
          onChange={set("email") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Phone" half>
        <input style={inputStyle} placeholder="+234..." value={data.phone}
          onChange={set("phone") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Password" required half>
        <input style={inputStyle} type="password" placeholder="••••••••" value={data.password}
          onChange={set("password") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Gender" half>
        <select style={selectStyle} value={data.gender} onChange={set("gender")}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Date of Birth" half>
        <input style={inputStyle} type="date" value={data.dob}
          onChange={set("dob") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Tier" half>
        <select style={selectStyle} value={data.tier} onChange={set("tier")}>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>
      </Field>
      <Field label="Referral Code" half>
        <input style={inputStyle} placeholder="Optional" value={data.referral}
          onChange={set("referral") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Categories (comma-separated)">
        <input style={inputStyle} placeholder="e.g. Beauty Services, Cleaning" value={data.categories}
          onChange={set("categories") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>

      <Divider text="Location" />

      <Field label="Address">
        <input style={inputStyle} placeholder="Street address" value={data.address}
          onChange={set("address") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="City" half>
        <input style={inputStyle} placeholder="City" value={data.city}
          onChange={set("city") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="State" half>
        <input style={inputStyle} placeholder="State" value={data.state}
          onChange={set("state") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Country">
        <input style={inputStyle} placeholder="Country" value={data.country}
          onChange={set("country") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>

      <Divider text="Recruit Expectations" />

      <Field label="Area" half>
        <input style={inputStyle} placeholder="Target area" value={data.reArea}
          onChange={set("reArea") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Years of Experience" half>
        <input style={inputStyle} type="number" min={0} placeholder="0" value={data.reYears}
          onChange={set("reYears") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Network Size" half>
        <input style={inputStyle} placeholder="e.g. 50–100" value={data.reNetworkSize}
          onChange={set("reNetworkSize") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Monthly Recruits" half>
        <input style={inputStyle} type="number" min={0} placeholder="0" value={data.reMonthlyRecruits}
          onChange={set("reMonthlyRecruits") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Has Recruitment Experience" half>
        <select style={selectStyle} value={data.reHasExperience} onChange={set("reHasExperience")}>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </Field>
      {data.reHasExperience === "yes" && (
        <Field label="Experience Description">
          <textarea rows={2} placeholder="Describe prior experience..." value={data.reExpDescription}
            onChange={set("reExpDescription")} style={{ ...inputStyle, resize: "none" }} />
        </Field>
      )}

      <Divider text="Bank Details" />

      <Field label="Bank Name" half>
        <input style={inputStyle} placeholder="e.g. Access Bank" value={data.bankName}
          onChange={set("bankName") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Account Number" half>
        <input style={inputStyle} placeholder="0123456789" value={data.accountNumber}
          onChange={set("accountNumber") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="Account Name">
        <input style={inputStyle} placeholder="As on bank record" value={data.accountName}
          onChange={set("accountName") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
      <Field label="BVN">
        <input style={inputStyle} placeholder="11 digits" maxLength={11} value={data.bvn}
          onChange={set("bvn") as React.ChangeEventHandler<HTMLInputElement>} />
      </Field>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Validate helpers
// ─────────────────────────────────────────────────────────
function validateClient(d: ClientData) {
  if (!d.name.trim())     { toast.warning("Full name is required.");  return false; }
  if (!d.email.trim())    { toast.warning("Email is required.");      return false; }
  if (!d.password.trim()) { toast.warning("Password is required.");   return false; }
  return true;
}
function validateExpert(d: ExpertData) {
  if (!d.name.trim())     { toast.warning("Full name is required.");  return false; }
  if (!d.email.trim())    { toast.warning("Email is required.");      return false; }
  if (!d.password.trim()) { toast.warning("Password is required.");   return false; }
  return true;
}
function validateTas(d: TasData) {
  if (!d.name.trim())     { toast.warning("Full name is required.");  return false; }
  if (!d.username.trim()) { toast.warning("Username is required.");   return false; }
  if (!d.email.trim())    { toast.warning("Email is required.");      return false; }
  if (!d.password.trim()) { toast.warning("Password is required.");   return false; }
  return true;
}

// ─────────────────────────────────────────────────────────
// Main modal component
// ─────────────────────────────────────────────────────────
interface AddUserModalProps {
  open:    boolean;
  onClose: () => void;
}

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const [role,       setRole]       = useState<Role>("Client");
  const [saving,     setSaving]     = useState(false);
  const [clientData, setClientData] = useState<ClientData>(defaultClient());
  const [expertData, setExpertData] = useState<ExpertData>(defaultExpert());
  const [tasData,    setTasData]    = useState<TasData>(defaultTas());

  const handleClose = () => {
    if (saving) return;
    // reset forms on close
    setRole("Client");
    setClientData(defaultClient());
    setExpertData(defaultExpert());
    setTasData(defaultTas());
    onClose();
  };

  const handleSave = async () => {
    const ok =
      role === "Client" ? validateClient(clientData) :
      role === "Expert" ? validateExpert(expertData) :
      validateTas(tasData);

    if (!ok) return;
    setSaving(true);
    try {
      // TODO: replace with real API call
      // POST /admin/users  { role: role.toLowerCase(), ...formData }
      await new Promise(r => setTimeout(r, 900));
      toast.success(`${role} account created successfully`);
      handleClose();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  // client set helper (typed for input only)
  const clientSet = (k: keyof ClientData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setClientData(prev => ({ ...prev, [k]: e.target.value }));

  if (!open) return null;

  const ROLES: Role[] = ["Client", "Expert", "TAS"];

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 998,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* ── Modal ── */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(580px, calc(100vw - 32px))",
        maxHeight: "calc(100vh - 48px)",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Header (fixed) ── */}
        <div style={{
          padding: "20px 24px 0",
          flexShrink: 0,
          backgroundColor: "#ffffff",
        }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <UserPlus size={18} color="#2563EB" />
              </div>
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>
                  Add User
                </p>
                <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>
                  Creating a new <strong style={{ color: "#2563EB" }}>{role}</strong> account
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{ padding: "6px", borderRadius: "8px", border: "none",
                background: "none", cursor: "pointer", color: "#9CA3AF",
                display: "flex", alignItems: "center" }}>
              <X size={18} />
            </button>
          </div>

          {/* Role tabs */}
          <div style={{
            display: "flex", gap: "0",
            backgroundColor: "#F3F4F6",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "4px",
          }}>
            {ROLES.map(r => {
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: "8px 0",
                    borderRadius: "9px",
                    fontSize: "13px", fontWeight: 600,
                    border: "none", cursor: "pointer",
                    transition: "all 0.15s",
                    backgroundColor: active ? "#2563EB" : "transparent",
                    color: active ? "#ffffff" : "#6B7280",
                    boxShadow: active ? "0 1px 6px rgba(37,99,235,0.3)" : "none",
                  }}>
                  {r}
                </button>
              );
            })}
          </div>

          {/* Thin blue line below tabs */}
          <div style={{ height: "1px", backgroundColor: "#E5E7EB", margin: "12px 0 0" }} />
        </div>

        {/* ── Scrollable form body ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 24px 8px",
          // custom scrollbar
          scrollbarWidth: "thin",
          scrollbarColor: "#DBEAFE transparent",
        }}>
          <style>{`
            .aum-body::-webkit-scrollbar { width: 5px; }
            .aum-body::-webkit-scrollbar-track { background: transparent; }
            .aum-body::-webkit-scrollbar-thumb { background: #DBEAFE; border-radius: 10px; }
          `}</style>
          <div
            className="aum-body"
            style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {role === "Client" && (
              <ClientForm data={clientData} set={clientSet} />
            )}
            {role === "Expert" && (
              <ExpertForm data={expertData} onChange={setExpertData} />
            )}
            {role === "TAS" && (
              <TasForm data={tasData} onChange={setTasData} />
            )}
          </div>
        </div>

        {/* ── Footer (fixed) ── */}
        <div style={{
          padding: "14px 24px 20px",
          borderTop: "1px solid #E5E7EB",
          display: "flex", gap: "10px",
          flexShrink: 0,
          backgroundColor: "#ffffff",
        }}>
          <button
            onClick={handleClose}
            disabled={saving}
            style={{
              flex: 1, padding: "10px", borderRadius: "10px",
              border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
              fontSize: "13px", fontWeight: 500, color: "#6B7280",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.5 : 1,
            }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: "10px", borderRadius: "10px",
              border: "none", backgroundColor: "#2563EB", color: "#ffffff",
              fontSize: "13px", fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: "7px",
            }}>
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
              : `Create ${role} Account`}
          </button>
        </div>
      </div>
    </>
  );
}