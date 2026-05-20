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
import { fetchUsers, fetchUserById, removeUser, clearSelected, addUser, suspendUserThunk, activateUserThunk } from "@/lib/redux/usersSlice";
import type { ApiUser, RegisterUserPayload } from "@/lib/api/usersApi";

// ── Helpers ──────────────────────────────────────────────────
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
  id:           u.id,
  avatarSeed,
  name:         u.name,
  email:        u.email,
  username:     u.username,
  phone:        u.phone,
  type:         normalizeType(u.role ?? u.mode ?? "client"),
  status:       normalizeStatus(u.status),
  joined:       new Date(u.createdAt).toLocaleDateString("en-GB"),
  verify:       u.verify,
  gender:       u.gender,
  bio:          u.bio,
  verification: u.verification,
  category:     u.category,
  skill:        u.skill,
  services:     u.services,
  bankDetails:  u.bankDetails,
  document:     u.document,
  paymentModel: u.paymentModel,
  location:     u.location,
  dob:          u.dob,
  referral:     u.referral,
  account:      u.account,
});

const statusVariant: Record<string, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active: "green", "Tier 1": "purple", "Tier 2": "purple",
  "Tier 3": "purple", Pending: "yellow", Suspended: "red",
};

const FILTER_OPTIONS = ["All Users", "Client", "Expert", "TAS"] as const;

// ── Per-role form state ───────────────────────────────────────
type Role = "client" | "expert" | "tas";

interface ClientFields { username: string; }
interface ExpertFields { gender: "male" | "female" | "other"; bio: string; referral: string; }
interface TasFields    { gender: "male" | "female" | "other"; dob: string; }

interface BaseFields { name: string; email: string; phone: string; password: string; }

type FormState =
  | (BaseFields & ClientFields & { role: "client" })
  | (BaseFields & ExpertFields & { role: "expert" })
  | (BaseFields & TasFields    & { role: "tas" });

const defaultBase: BaseFields = { name: "", email: "", phone: "", password: "" };
const byRole = (role: Role): FormState => {
  if (role === "expert") return { ...defaultBase, role: "expert", gender: "male", bio: "", referral: "" };
  if (role === "tas")    return { ...defaultBase, role: "tas", gender: "male", dob: "" };
  return { ...defaultBase, role: "client", username: "" };
};

// Updated styling with explicit structural input borders
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #ced4da", backgroundColor: "var(--color-background, #fff)",
  fontSize: "13px", color: "var(--color-text-main, #333)", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "6px",
};

const seedMap = new Map<string, number>();

// ── Role selector step ────────────────────────────────────────
function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
  const roles: { value: Role; label: string; desc: string }[] = [
    { value: "client", label: "Client",  desc: "Can post jobs and hire experts" },
    { value: "expert", label: "Expert",  desc: "Provides services on the platform" },
    { value: "tas",    label: "TAS",     desc: "Talent Acquisition Specialist" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
        Select the type of user you want to create:
      </p>
      {roles.map((r) => (
        <button
          key={r.value}
          onClick={() => onSelect(r.value)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            padding: "14px 16px", borderRadius: "12px", border: "1px solid #ced4da",
            backgroundColor: "var(--color-background)", cursor: "pointer", textAlign: "left",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ced4da")}
        >
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{r.label}</span>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{r.desc}</span>
        </button>
      ))}
    </div>
  );
}

// ── Dynamic form fields by role ───────────────────────────────
function UserForm({
  form, setForm, showPassword, setShowPassword,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}) {
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch } as FormState));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Role badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)", fontSize: "12px", fontWeight: 600, color: "var(--color-primary)", alignSelf: "flex-start" }}>
        {form.role.charAt(0).toUpperCase() + form.role.slice(1)}
      </div>

      {/* Name */}
      <div><label style={labelStyle}>Full Name *</label>
        <input style={inputStyle} placeholder="e.g. John Doe" value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </div>

      {/* Email */}
      <div><label style={labelStyle}>Email Address *</label>
        <input style={inputStyle} type="email" placeholder="user@email.com" value={form.email} onChange={(e) => set({ email: e.target.value })} />
      </div>

      {/* Username — client only */}
      {form.role === "client" && (
        <div><label style={labelStyle}>Username *</label>
          <input style={inputStyle} placeholder="e.g. johndoe" value={(form as FormState & { username: string }).username} onChange={(e) => set({ username: e.target.value } as Partial<FormState>)} />
        </div>
      )}

      {/* Phone */}
      <div>
        <label style={labelStyle}>Phone Number</label>
        <div style={{ display: "flex" }}>
          <div style={{ padding: "10px 12px", borderRadius: "10px 0 0 10px", border: "1px solid #ced4da", borderRight: "none", backgroundColor: "var(--color-background)", fontSize: "13px", color: "var(--color-text-muted)", flexShrink: 0 }}>+234</div>
          <input
            style={{ ...inputStyle, borderRadius: "0 10px 10px 0", borderLeft: "none" }}
            placeholder="801 234 5678" maxLength={10}
            value={form.phone.replace(/^\+234/, "")}
            onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 10); set({ phone: d ? `+234${d}` : "" }); }}
          />
        </div>
      </div>

      {/* Expert-only: gender + bio + referral */}
      {form.role === "expert" && (
        <>
          <div><label style={labelStyle}>Gender *</label>
            <select style={inputStyle} value={(form as FormState & ExpertFields).gender} onChange={(e) => set({ gender: e.target.value as "male" | "female" | "other" } as Partial<FormState>)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div><label style={labelStyle}>Bio *</label>
            <textarea style={{ ...inputStyle, resize: "none" } as React.CSSProperties} rows={3} placeholder="Brief description about the expert..." value={(form as FormState & ExpertFields).bio} onChange={(e) => set({ bio: e.target.value } as Partial<FormState>)} />
          </div>
          <div><label style={labelStyle}>Referral Code (Optional)</label>
            <input style={inputStyle} placeholder="e.g. REF123" value={(form as FormState & ExpertFields).referral || ""} onChange={(e) => set({ referral: e.target.value } as Partial<FormState>)} />
          </div>
        </>
      )}

      {/* TAS-only: gender + dob */}
      {form.role === "tas" && (
        <>
          <div><label style={labelStyle}>Gender *</label>
            <select style={inputStyle} value={(form as FormState & TasFields).gender} onChange={(e) => set({ gender: e.target.value as "male" | "female" | "other" } as Partial<FormState>)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div><label style={labelStyle}>Date of Birth *</label>
            <input style={inputStyle} type="date" value={(form as FormState & TasFields).dob} onChange={(e) => set({ dob: e.target.value } as Partial<FormState>)} />
          </div>
        </>
      )}

      {/* Password */}
      <div>
        <label style={labelStyle}>Password *</label>
        <div style={{ position: "relative" }}>
          <input style={{ ...inputStyle, paddingRight: "40px" }} type={showPassword ? "text" : "password"} placeholder="StrongPassword123!" value={form.password} onChange={(e) => set({ password: e.target.value })} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, selected, selectedStatus } = useAppSelector((s) => s.users);

  const [view,           setView]          = useState<"list" | "detail">("list");
  const [addOpen,        setAddOpen]       = useState(false);
  const [addStep,        setAddStep]       = useState<"role" | "form">("role");
  const [deleteOpen,     setDeleteOpen]    = useState(false);
  const [deleteLoading,  setDeleteLoading] = useState(false);
  const [suspendOpen,    setSuspendOpen]   = useState(false);
  const [suspendLoading, setSuspendLoading]= useState(false);
  const [form,           setForm]          = useState<FormState>(byRole("client"));
  const [addLoading,     setAddLoading]    = useState(false);
  const [showPassword,   setShowPassword]  = useState(false);

  useEffect(() => { if (listStatus === "idle") dispatch(fetchUsers()); }, [dispatch, listStatus]);
  useEffect(() => { list.forEach((u, i) => { if (!seedMap.has(u.id)) seedMap.set(u.id, i); }); }, [list]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedStatus === "succeeded" && selected) setView("detail");
  }, [selectedStatus, selected]);

  const closeAdd = () => { setAddOpen(false); setAddStep("role"); setForm(byRole("client")); setShowPassword(false); };
  const handleRoleSelect = (role: Role) => { setForm(byRole(role)); setAddStep("form"); };
  const handleBack = () => { setView("list"); dispatch(clearSelected()); };

  const handleViewUser = (userId: string) => {
    const found = list.find((u) => u.id === userId);
    dispatch(fetchUserById({ id: userId, type: found?.role ?? "client" }));
  };

  const handleDelete = () => {
    if (!selected) return;
    setDeleteLoading(true);
    dispatch(removeUser({ type: selected.role ?? "client", id: selected.id }))
      .unwrap()
      .then(() => { toast.success("User deleted successfully"); setDeleteOpen(false); handleBack(); })
      .catch((err: string) => toast.error("Delete failed", { description: err }))
      .finally(() => setDeleteLoading(false));
  };

  const handleSuspend = () => {
    if (!selected) return;
    const isSuspended = selected.status?.toLowerCase() === "suspended";
    const thunk = isSuspended ? activateUserThunk : suspendUserThunk;
    const successMsg = isSuspended ? `${selected.name} reinstated successfully` : `${selected.name} suspended successfully`;
    setSuspendLoading(true);
    dispatch(thunk({ type: selected.role ?? "client", id: selected.id }))
      .unwrap()
      .then(() => { toast.success(successMsg); setSuspendOpen(false); handleBack(); })
      .catch((err: string) => toast.error(isSuspended ? "Reinstate failed" : "Suspend failed", { description: err }))
      .finally(() => setSuspendLoading(false));
  };

  const handleAddUser = () => {
    if (!form.name || !form.email || !form.password) {
      toast.warning("Missing fields", { description: "Name, email and password are required." });
      return;
    }
    if (form.role === "client" && !(form as FormState & { username: string }).username) {
      toast.warning("Missing fields", { description: "Username is required." });
      return;
    }
    if (form.role === "tas" && !(form as FormState & TasFields).dob) {
      toast.warning("Missing fields", { description: "Date of birth is required." });
      return;
    }
    setAddLoading(true);

    let payload: RegisterUserPayload;
    if (form.role === "expert") {
      const f = form as BaseFields & ExpertFields & { role: "expert" };
      // Explicitly sending the validation-required referral property to fix the API's 400 response
      payload = { 
        role: "expert", 
        name: f.name, 
        email: f.email, 
        phone: f.phone, 
        password: f.password, 
        gender: f.gender, 
        bio: f.bio,
        referral: f.referral || "" 
      };
    } else if (form.role === "tas") {
      const f = form as BaseFields & TasFields & { role: "tas" };
      payload = { role: "tas", name: f.name, email: f.email, phone: f.phone, password: f.password, gender: f.gender, dob: f.dob };
    } else {
      const f = form as BaseFields & { username: string; role: "client" };
      payload = { role: f.role, name: f.name, email: f.email, username: f.username, phone: f.phone, password: f.password };
    }

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

  if (view === "detail" && selected) {
    const detailUser = toUser(selected, seedMap.get(selected.id) ?? 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="User Management" />
        <UserDetail user={detailUser} onBack={handleBack} onDelete={() => setDeleteOpen(true)} onSuspend={() => setSuspendOpen(true)} />
        {/* Suspend/Reinstate Modal */}
        <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title={detailUser.status === "Suspended" ? "Reinstate User" : "Suspend User"} size="sm"
          footer={
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button onClick={() => setSuspendOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #ced4da", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
              <button onClick={handleSuspend} disabled={suspendLoading} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: detailUser.status === "Suspended" ? "#16a34a" : "#f59e0b", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: suspendLoading ? 0.7 : 1 }}>
                {suspendLoading
                  ? <><Loader2 size={14} className="animate-spin" /> {detailUser.status === "Suspended" ? "Reinstating..." : "Suspending..."}</>
                  : detailUser.status === "Suspended" ? "Reinstate" : "Suspend"
                }
              </button>
            </div>
          }
        >
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {detailUser.status === "Suspended"
              ? <>Are you sure you want to reinstate <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? They will regain full access.</>
              : <>Are you sure you want to suspend <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? They will lose access until reinstated.</>
            }
          </p>
        </Modal>
        <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account" size="sm"
          footer={
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button onClick={() => setDeleteOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #ced4da", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: deleteLoading ? 0.7 : 1 }}>
                {deleteLoading ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : "Delete"}
              </button>
            </div>
          }
        >
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? This cannot be undone.
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
          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, backgroundColor: ["#2563eb","#16a34a","#d97706","#7c3aed","#db2777","#0891b2","#dc2626","#65a30d"][u.avatarSeed % 8], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 700 }}>
            {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "13px" }}>{u.name}</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "type",   header: "Type",   render: (u) => <span style={{ color: "var(--color-text-muted)" }}>{u.type}</span> },
    { key: "status", header: "Status", render: (u) => <StatusBadge label={u.status} variant={statusVariant[u.status] ?? "gray"} /> },
    { key: "joined", header: "Joined", render: (u) => <span style={{ color: "var(--color-text-muted)" }}>{u.joined}</span> },
    { key: "jobs" as keyof User, header: "Jobs", render: () => <span style={{ color: "var(--color-text-muted)" }}>—</span> },
    {
      key: "actions", header: "Actions",
      render: (u) => (
        <button onClick={() => handleViewUser(u.id)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }} title="View user">
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
        <button onClick={() => setAddOpen(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "1px solid #ced4da" }}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <main className="users-main" style={{ flex: 1 }}>
        {listStatus === "loading" && <PageLoader text="Loading users..." />}
        {listStatus === "failed" && <div style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>Failed to load users.</div>}
        {listStatus === "succeeded" && (
          <DataTable data={users} columns={columns} filterOptions={FILTER_OPTIONS} filterKey="type" searchKey="name" searchPlaceholder="Search name..." pageSize={10} onExport={() => console.log("export")} />
        )}
      </main>

      {/* Add User Modal — 2 steps */}
      <Modal
        open={addOpen}
        onClose={closeAdd}
        title={addStep === "role" ? "Select User Type" : `Add ${form.role.charAt(0).toUpperCase() + form.role.slice(1)}`}
        size="sm"
        footer={
          addStep === "role" ? undefined : (
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button onClick={() => setAddStep("role")} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #ced4da", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>← Back</button>
              <button onClick={handleAddUser} disabled={addLoading} className="btn-primary" style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: addLoading ? 0.7 : 1 }}>
                {addLoading ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : "Add User"}
              </button>
            </div>
          )
        }
      >
        {addStep === "role"
          ? <RoleSelector onSelect={handleRoleSelect} />
          : <UserForm form={form} setForm={setForm} showPassword={showPassword} setShowPassword={setShowPassword} />
        }
      </Modal>
    </div>
  );
}