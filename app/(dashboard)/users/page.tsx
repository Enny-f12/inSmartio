"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/Navbar";
import { DataTable, ColumnDef } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Loader";
import UserDetail, { type User } from "@/components/users/UserDetail";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchUsers, fetchUserById, removeUser, clearSelected,
  addUser, suspendUserThunk, activateUserThunk,
} from "@/lib/redux/usersSlice";
import { downloadReport } from "@/lib/api/reportApi";
import type { ApiUser, RegisterUserPayload } from "@/lib/api/usersApi";

// ── Helpers ───────────────────────────────────────────────
const normalizeStatus = (raw: string): User["status"] => {
  const map: Record<string, User["status"]> = {
    active: "Active", tier1: "Tier 1", tier2: "Tier 2", tier3: "Tier 3",
    "tier 1": "Tier 1", "tier 2": "Tier 2", "tier 3": "Tier 3",
    pending: "Pending", suspended: "Suspended",
  };
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return map[raw?.toLowerCase()] ?? (cap(raw) as User["status"]);
};

const normalizeType = (role: string): User["type"] => {
  const map: Record<string, User["type"]> = { client: "Client", expert: "Expert", tas: "TAS" };
  return map[role?.toLowerCase()] ?? "Client";
};

const toUser = (u: ApiUser, avatarSeed: number): User => ({
  id: u.id, avatarSeed, name: u.name, email: u.email,
  username: u.username, phone: u.phone,
  type: normalizeType(u.role ?? u.mode ?? "client"),
  status: normalizeStatus(u.status),
  joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB") : "—",
  verify: u.verify, gender: u.gender, bio: u.bio,
  verification: u.verification, category: u.category, skill: u.skill,
  services: u.services,
  bankDetails: u.bankDetails,
  document: u.document,
  paymentModel: u.paymentModel,
  location: u.location,
  dob: (u as unknown as Record<string, unknown>).dateOfBirth as string ?? u.dob,
  referral: u.referral,
  account: u.account ?? (u.bankDetails ? {
    bankName:      (u.bankDetails as Record<string,string>).bankName,
    accountNumber: (u.bankDetails as Record<string,string>).accountNo,
  } : undefined),
});

const statusVariant: Record<string, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active: "green", "Tier 1": "purple", "Tier 2": "purple",
  "Tier 3": "purple", Pending: "yellow", Suspended: "red",
};

const FILTER_OPTIONS = ["All Users", "Client", "Expert", "TAS"] as const;
const AVATARS = ["#2563eb","#16a34a","#d97706","#7c3aed","#db2777","#0891b2","#dc2626","#65a30d"];
const seedMap = new Map<string, number>();

type Role = "client" | "expert" | "tas";

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

function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Select the type of user to create:</p>
      {([
        { value: "client" as Role, label: "Client",  desc: "Can post jobs and hire experts" },
        { value: "expert" as Role, label: "Expert",  desc: "Provides services on the platform" },
        { value: "tas"    as Role, label: "TAS",     desc: "Talent Acquisition Specialist" },
      ]).map((r) => (
        <button key={r.value} onClick={() => onSelect(r.value)}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "14px 16px", borderRadius: "12px", border: "1px solid #D1D5DB", backgroundColor: "var(--color-background)", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{r.label}</span>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{r.desc}</span>
        </button>
      ))}
    </div>
  );
}

function ClientForm({ f, set, showPw, setShowPw }: {
  f: Record<string, string>; set: (k: string, v: string) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={row}><label style={lbl}>Full Name *</label><input style={inp} placeholder="John Doe" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Email *</label><input style={inp} type="email" placeholder="user@email.com" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Username *</label><input style={inp} placeholder="johndoe" value={f.username} onChange={(e) => set("username", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Phone</label>
        <div style={{ display: "flex" }}>
          <div style={{ padding: "10px 12px", borderRadius: "10px 0 0 10px", border: "1px solid #D1D5DB", borderRight: "none", fontSize: "13px", color: "var(--color-text-muted)", flexShrink: 0, backgroundColor: "var(--color-background)" }}>+234</div>
          <input style={{ ...inp, borderRadius: "0 10px 10px 0", borderLeft: "none" }} placeholder="801 234 5678" maxLength={10} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
      </div>
      <div style={row}><label style={lbl}>Referral Code</label><input style={inp} placeholder="Optional" value={f.referral} onChange={(e) => set("referral", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Password *</label>
        <div style={{ position: "relative" }}>
          <input style={{ ...inp, paddingRight: "40px" }} type={showPw ? "text" : "password"} placeholder="StrongPass123!" value={f.password} onChange={(e) => set("password", e.target.value)} />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExpertForm({ f, set, showPw, setShowPw }: {
  f: Record<string, string>; set: (k: string, v: string) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: 0 }}>Basic Info</p>
      <div style={row}><label style={lbl}>Full Name *</label><input style={inp} placeholder="John Doe" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Email *</label><input style={inp} type="email" placeholder="user@email.com" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Phone</label>
        <div style={{ display: "flex" }}>
          <div style={{ padding: "10px 12px", borderRadius: "10px 0 0 10px", border: "1px solid #D1D5DB", borderRight: "none", fontSize: "13px", color: "var(--color-text-muted)", flexShrink: 0, backgroundColor: "var(--color-background)" }}>+234</div>
          <input style={{ ...inp, borderRadius: "0 10px 10px 0", borderLeft: "none" }} placeholder="801 234 5678" maxLength={10} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
      <div style={row}><label style={lbl}>Bio *</label>
        <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={2} placeholder="Brief description..." value={f.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={row}><label style={lbl}>Payment Model</label>
          <select style={inp} value={f.paymentModel} onChange={(e) => set("paymentModel", e.target.value)}>
            <option value="protected">Protected</option><option value="unprotected">Unprotected</option>
          </select>
        </div>
        <div style={row}><label style={lbl}>Referral Code</label><input style={inp} placeholder="Optional" value={f.referral} onChange={(e) => set("referral", e.target.value)} /></div>
      </div>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: "4px 0 0" }}>Location</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={row}><label style={lbl}>Country</label><input style={inp} placeholder="Nigeria" value={f.country} onChange={(e) => set("country", e.target.value)} /></div>
        <div style={row}><label style={lbl}>State</label><input style={inp} placeholder="Lagos" value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
        <div style={row}><label style={lbl}>City</label><input style={inp} placeholder="Ikeja" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Area</label><input style={inp} placeholder="Opebi" value={f.area} onChange={(e) => set("area", e.target.value)} /></div>
      </div>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: "4px 0 0" }}>Skill</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={row}><label style={lbl}>Role / Title</label><input style={inp} placeholder="e.g. Electrician" value={f.skillRole} onChange={(e) => set("skillRole", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Experience (yrs)</label><input style={inp} type="number" min="0" placeholder="5" value={f.skillExp} onChange={(e) => set("skillExp", e.target.value)} /></div>
      </div>
      <div style={row}><label style={lbl}>Skill Description</label><input style={inp} placeholder="e.g. Electrical installation and repairs" value={f.skillDesc} onChange={(e) => set("skillDesc", e.target.value)} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={row}><label style={lbl}>Service Area</label><input style={inp} placeholder="e.g. Ikeja" value={f.skillArea} onChange={(e) => set("skillArea", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Category Name</label><input style={inp} placeholder="e.g. Home Services" value={f.categoryName} onChange={(e) => set("categoryName", e.target.value)} /></div>
      </div>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: "4px 0 0" }}>Bank Details</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={row}><label style={lbl}>Bank Name</label><input style={inp} placeholder="Access Bank" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Account Number</label><input style={inp} placeholder="0123456789" maxLength={10} value={f.accountNumber} onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
        <div style={row}><label style={lbl}>Account Name</label><input style={inp} placeholder="John Doe" value={f.accountName} onChange={(e) => set("accountName", e.target.value)} /></div>
        <div style={row}><label style={lbl}>BVN</label><input style={inp} placeholder="22334455666" maxLength={11} value={f.bvn} onChange={(e) => set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))} /></div>
      </div>
      <div style={row}><label style={lbl}>Password *</label>
        <div style={{ position: "relative" }}>
          <input style={{ ...inp, paddingRight: "40px" }} type={showPw ? "text" : "password"} placeholder="StrongPass123!" value={f.password} onChange={(e) => set("password", e.target.value)} />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function TasForm({ f, set, showPw, setShowPw }: {
  f: Record<string, string>; set: (k: string, v: string) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: 0 }}>Basic Info</p>
      <div style={row}><label style={lbl}>Full Name *</label><input style={inp} placeholder="Jane Doe" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Username *</label><input style={inp} placeholder="tas_user" value={f.username} onChange={(e) => set("username", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Email *</label><input style={inp} type="email" placeholder="user@email.com" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Phone</label>
        <div style={{ display: "flex" }}>
          <div style={{ padding: "10px 12px", borderRadius: "10px 0 0 10px", border: "1px solid #D1D5DB", borderRight: "none", fontSize: "13px", color: "var(--color-text-muted)", flexShrink: 0, backgroundColor: "var(--color-background)" }}>+234</div>
          <input style={{ ...inp, borderRadius: "0 10px 10px 0", borderLeft: "none" }} placeholder="801 234 5678" maxLength={10} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={row}><label style={lbl}>Gender *</label>
          <select style={inp} value={f.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
        <div style={row}><label style={lbl}>Date of Birth *</label>
          <input style={inp} type="date" value={f.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </div>
      </div>
      <div style={row}><label style={lbl}>Application Code</label><input style={inp} placeholder="Optional" value={f.applicationCode} onChange={(e) => set("applicationCode", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Recruitment Expectations</label>
        <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={2} placeholder="Optional..." value={f.recruitExpectations} onChange={(e) => set("recruitExpectations", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Categories (comma-separated) *</label>
        <input style={inp} placeholder="e.g. Recruitment, Vetting" value={f.category} onChange={(e) => set("category", e.target.value)} />
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>e.g. Recruitment, Vetting</span>
      </div>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: "4px 0 0" }}>Document URLs</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={row}><label style={lbl}>ID Card URL *</label><input style={inp} placeholder="https://..." value={f.idCard} onChange={(e) => set("idCard", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Reference Letter URL</label><input style={inp} placeholder="https://..." value={f.referenceLetter} onChange={(e) => set("referenceLetter", e.target.value)} /></div>
      </div>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)", margin: "4px 0 0" }}>Bank Details</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={row}><label style={lbl}>Bank Name</label><input style={inp} placeholder="Access Bank" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} /></div>
        <div style={row}><label style={lbl}>Account No</label><input style={inp} placeholder="1234567890" maxLength={10} value={f.accountNo} onChange={(e) => set("accountNo", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>
      </div>
      <div style={row}><label style={lbl}>Password *</label>
        <div style={{ position: "relative" }}>
          <input style={{ ...inp, paddingRight: "40px" }} type={showPw ? "text" : "password"} placeholder="StrongPass123!" value={f.password} onChange={(e) => set("password", e.target.value)} />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

const defaultClient  = () => ({ name:"", email:"", username:"", phone:"", password:"", referral:"" });
const defaultExpert  = () => ({ name:"", email:"", phone:"", password:"", gender:"male", bio:"", referral:"", verification:"tier1", paymentModel:"protected", country:"", state:"", city:"", area:"", skillRole:"", skillExp:"", skillDesc:"", skillArea:"", categoryName:"", bankName:"", accountNumber:"", accountName:"", bvn:"" });
const defaultTas     = () => ({ name:"", email:"", username:"", phone:"", password:"", gender:"male", dateOfBirth:"", applicationCode:"", recruitExpectations:"", bankName:"", accountNo:"", category:"", idCard:"", referenceLetter:"" });

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, selected, selectedStatus } = useAppSelector((s) => s.users);

  const [addOpen,        setAddOpen]        = useState(false);
  const [addStep,        setAddStep]        = useState<"role"|"form">("role");
  const [role,           setRole]           = useState<Role>("client");
  const [clientF,        setClientF]        = useState(defaultClient());
  const [expertF,        setExpertF]        = useState(defaultExpert());
  const [tasF,           setTasF]           = useState(defaultTas());
  const [addLoading,     setAddLoading]     = useState(false);
  const [showPw,         setShowPw]         = useState(false);
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [suspendOpen,    setSuspendOpen]    = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [downloading,    setDownloading]    = useState(false);

  useEffect(() => { if (listStatus === "idle") dispatch(fetchUsers()); }, [dispatch, listStatus]);
  useEffect(() => { list.forEach((u, i) => { if (!seedMap.has(u.id)) seedMap.set(u.id, i); }); }, [list]);

  const showDetail = selectedStatus === "succeeded" && !!selected;

  const closeAdd = () => {
    setAddOpen(false); setAddStep("role");
    setClientF(defaultClient()); setExpertF(defaultExpert()); setTasF(defaultTas());
    setShowPw(false);
  };

  const handleRoleSelect = (r: Role) => { setRole(r); setAddStep("form"); };
  const handleBack = () => { dispatch(clearSelected()); };

  const handleViewUser = (userId: string) => {
    const found = list.find((u) => u.id === userId);
    const type  = found?.role?.toLowerCase() ?? "client";
    dispatch(fetchUserById({ id: userId, type }));
  };

  // ── Export ────────────────────────────────────────────
  const handleExport = async () => {
    setDownloading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const url   = await downloadReport({
        reportType: "users",
        type:       "pdf",
        fromDate:   "2026-05-15",
        toDate:     today,
      });
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `users_report_${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Users report downloaded");
    } catch {
      toast.error("Failed to download users report");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    if (!selected) return;
    setDeleteLoading(true);
    dispatch(removeUser({ type: selected.role ?? "client", id: selected.id }))
      .unwrap()
      .then(() => { toast.success("User deleted"); setDeleteOpen(false); handleBack(); })
      .catch((err: string) => toast.error("Delete failed", { description: err }))
      .finally(() => setDeleteLoading(false));
  };

  const handleSuspend = () => {
    if (!selected) return;
    const isSuspended = selected.status?.toLowerCase() === "suspended";
    setSuspendLoading(true);
    dispatch((isSuspended ? activateUserThunk : suspendUserThunk)({ type: selected.role ?? "client", id: selected.id }))
      .unwrap()
      .then(() => { toast.success(isSuspended ? `${selected.name} reinstated` : `${selected.name} suspended`); setSuspendOpen(false); handleBack(); })
      .catch((err: string) => toast.error(isSuspended ? "Reinstate failed" : "Suspend failed", { description: err }))
      .finally(() => setSuspendLoading(false));
  };

  const handleAddUser = () => {
    let payload: RegisterUserPayload;
    if (role === "client") {
      const f = clientF;
      if (!f.name || !f.email || !f.password || !f.username) { toast.warning("Name, email, username and password are required"); return; }
      payload = { role: "client", name: f.name, email: f.email, username: f.username, phone: f.phone ? `+234${f.phone}` : "", password: f.password, referral: f.referral || undefined };
    } else if (role === "expert") {
      const f = expertF;
      if (!f.name || !f.email || !f.password || !f.bio) { toast.warning("Name, email, bio and password are required"); return; }
      payload = {
        role: "expert", name: f.name, email: f.email, password: f.password, phone: f.phone ? `+234${f.phone}` : "",
        gender: f.gender as "male"|"female"|"other", bio: f.bio,
        referral: f.referral || undefined,
        verification: (f.verification as "tier1"|"tier2"|"tier3") || "tier1",
        paymentModel: (f.paymentModel as "protected"|"unprotected") || "protected",
        avatar: undefined,
        location: { country: f.country, state: f.state, city: f.city, area: f.area },
        skill: { role: f.skillRole ? [f.skillRole] : [], experience: f.skillExp ? Number(f.skillExp) : 0, description: f.skillDesc, area: f.skillArea },
        category: { name: f.categoryName, sub: [] },
        bankDetails: f.bankName ? { bankName: f.bankName, accountNumber: f.accountNumber, accountName: f.accountName, bvn: f.bvn } : undefined,
      };
    } else {
      const f = tasF;
      if (!f.name || !f.email || !f.password || !f.username || !f.dateOfBirth) { toast.warning("Name, email, username, date of birth and password are required"); return; }
      if (!f.category.trim()) { toast.warning("At least one category is required"); return; }
      if (!f.idCard.trim()) { toast.warning("ID Card URL is required"); return; }
      payload = {
        role: "tas", name: f.name, email: f.email, username: f.username, password: f.password,
        phone: f.phone ? `+234${f.phone}` : "",
        gender: f.gender as "male"|"female"|"other",
        dateOfBirth: f.dateOfBirth,
        category: f.category.split(",").map((c) => c.trim()).filter(Boolean),
        document: { idCard: f.idCard, referenceLetter: f.referenceLetter || undefined },
        applicationCode: f.applicationCode || undefined,
        recruitExpectations: f.recruitExpectations || undefined,
        bankDetails: f.bankName ? { bankName: f.bankName, accountNo: f.accountNo } : undefined,
        location: {},
      };
    }
    setAddLoading(true);
    dispatch(addUser(payload as RegisterUserPayload))
      .unwrap()
      .then(() => { toast.success("User added successfully"); closeAdd(); dispatch(fetchUsers()); })
      .catch((err: string) => toast.error("Failed to add user", { description: err }))
      .finally(() => setAddLoading(false));
  };

  const users = list.map((u) => toUser(u, seedMap.get(u.id) ?? 0));

  if (selectedStatus === "loading") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="User Management" /><PageLoader text="Loading user..." />
    </div>
  );
  if (selectedStatus === "failed") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="User Management" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "12px" }}>
        <p style={{ fontSize: "14px", color: "#ef4444" }}>Failed to load user.</p>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to Users
        </button>
      </div>
    </div>
  );

  if (showDetail && selected) {
    const detailUser  = toUser(selected, seedMap.get(selected.id) ?? 0);
    const isSuspended = detailUser.status === "Suspended";
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="User Management" />
        <UserDetail user={detailUser} onBack={handleBack} onDelete={() => setDeleteOpen(true)} onSuspend={() => setSuspendOpen(true)} />
        <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title={isSuspended ? "Reinstate User" : "Suspend User"} size="sm"
          footer={<div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setSuspendOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #D1D5DB", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
            <button onClick={handleSuspend} disabled={suspendLoading} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: isSuspended ? "#16a34a" : "#f59e0b", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: suspendLoading ? 0.7 : 1 }}>
              {suspendLoading ? <><Loader2 size={14} className="animate-spin" />{isSuspended ? "Reinstating..." : "Suspending..."}</> : isSuspended ? "Reinstate" : "Suspend"}
            </button>
          </div>}>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {isSuspended ? <>Reinstate <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? They will regain full access.</>
              : <>Suspend <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? They will lose access until reinstated.</>}
          </p>
        </Modal>
        <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account" size="sm"
          footer={<div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setDeleteOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #D1D5DB", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleteLoading} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: deleteLoading ? 0.7 : 1 }}>
              {deleteLoading ? <><Loader2 size={14} className="animate-spin" />Deleting...</> : "Delete"}
            </button>
          </div>}>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Delete <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? This cannot be undone.
          </p>
        </Modal>
      </div>
    );
  }

  const columns: ColumnDef<User>[] = [
    {
      key: "name", header: "Name",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, backgroundColor: AVATARS[u.avatarSeed % 8], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 700 }}>
            {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "13px", margin: 0 }}>{u.name}</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "type",   header: "Type",   render: (u) => <span style={{ color: "var(--color-text-muted)" }}>{u.type}</span> },
    { key: "status", header: "Status", render: (u) => <StatusBadge label={u.status} variant={statusVariant[u.status] ?? "gray"} /> },
    { key: "joined", header: "Joined", render: (u) => <span style={{ color: "var(--color-text-muted)" }}>{u.joined}</span> },
    { key: "actions" as keyof User, header: "Actions",
      render: (u) => (
        <button onClick={() => handleViewUser(u.id)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
          <Eye size={17} strokeWidth={1.8} />
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="User Management" />
      <style>{`
        .users-subheader { padding: 16px !important; }
        .users-main { padding: 0 16px 24px !important; }
        @media (min-width: 640px) {
          .users-subheader { padding: 20px 32px !important; }
          .users-main { padding: 0 32px 32px !important; }
        }
      `}</style>

      <div className="users-subheader" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          {listStatus === "succeeded" ? `${list.length} users total` : "Manage all users"}
        </p>
        <button onClick={() => setAddOpen(true)} className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none" }}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <main className="users-main" style={{ flex: 1 }}>
        {listStatus === "loading" && <PageLoader text="Loading users..." />}
        {listStatus === "failed"  && <div style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>Failed to load users.</div>}
        {listStatus === "succeeded" && (
          <DataTable
            data={users}
            columns={columns}
            filterOptions={FILTER_OPTIONS}
            filterKey="type"
            searchKey="name"
            searchPlaceholder="Search name..."
            pageSize={10}
            onExport={handleExport}
            exportLoading={downloading}
          />
        )}
      </main>

      {/* Add User Modal */}
      <Modal
        open={addOpen} onClose={closeAdd}
        title={addStep === "role" ? "Select User Type" : `Add ${role.charAt(0).toUpperCase() + role.slice(1)}`}
        size="md"
        footer={addStep === "role" ? undefined : (
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setAddStep("role")} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #D1D5DB", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>← Back</button>
            <button onClick={handleAddUser} disabled={addLoading} className="btn-primary"
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: addLoading ? 0.7 : 1 }}>
              {addLoading ? <><Loader2 size={14} className="animate-spin" />Adding...</> : "Add User"}
            </button>
          </div>
        )}>
        {addStep === "role"
          ? <RoleSelector onSelect={handleRoleSelect} />
          : role === "client"
            ? <ClientForm f={clientF} set={(k,v) => setClientF((p) => ({ ...p, [k]: v }))} showPw={showPw} setShowPw={setShowPw} />
            : role === "expert"
              ? <ExpertForm f={expertF} set={(k,v) => setExpertF((p) => ({ ...p, [k]: v }))} showPw={showPw} setShowPw={setShowPw} />
              : <TasForm   f={tasF}    set={(k,v) => setTasF((p)    => ({ ...p, [k]: v }))} showPw={showPw} setShowPw={setShowPw} />
        }
      </Modal>
    </div>
  );
}