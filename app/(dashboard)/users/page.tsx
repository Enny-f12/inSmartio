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
import { fetchUsers, fetchUserById, removeUser, clearSelected, addUser } from "@/lib/redux/usersSlice";
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

const normalizeType = (mode: string): User["type"] => {
  const map: Record<string, User["type"]> = { client: "Client", expert: "Expert", tas: "TAS" };
  return map[mode?.toLowerCase()] ?? "Client";
};

const toUser = (u: ApiUser, avatarSeed: number): User => ({
  id:         u.id,
  avatarSeed,
  name:       u.name,
  email:      u.email,
  username:   u.username,
  phone:      u.phone,
  type:       normalizeType(u.mode),
  status:     normalizeStatus(u.status),
  joined:     new Date(u.createdAt).toLocaleDateString("en-GB"),
});

const statusVariant: Record<string, "green" | "purple" | "yellow" | "red" | "gray"> = {
  Active: "green", "Tier 1": "purple", "Tier 2": "purple",
  "Tier 3": "purple", Pending: "yellow", Suspended: "red",
};

const FILTER_OPTIONS = ["All Users", "Client", "Expert", "TAS"] as const;

interface AddUserForm {
  name: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  mode: "client" | "expert" | "tas";
}
const emptyForm: AddUserForm = { name: "", email: "", username: "", phone: "", password: "", mode: "client" };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)",
  fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "6px",
};

// ── Avatar seed map (stable across renders) ──────────────────
const seedMap = new Map<string, number>();

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, selected, selectedStatus } = useAppSelector((s) => s.users);

  const [view, setView]                   = useState<"list" | "detail">("list");
  const [addOpen, setAddOpen]             = useState(false);
  const [deleteOpen, setDeleteOpen]       = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm]                   = useState<AddUserForm>(emptyForm);
  const [addLoading, setAddLoading]       = useState(false);
  const [showPassword, setShowPassword]   = useState(false);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchUsers());
  }, [dispatch, listStatus]);

  // Build stable seed map when list loads
  useEffect(() => {
    list.forEach((u, i) => { if (!seedMap.has(u.id)) seedMap.set(u.id, i); });
  }, [list]);

  // Switch to detail view as soon as fetch succeeds
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedStatus === "succeeded" && selected) setView("detail");
  }, [selectedStatus, selected]);

  const handleBack = () => {
    setView("list");
    dispatch(clearSelected());
  };

  const handleViewUser = (userId: string) => {
    dispatch(fetchUserById({ id: userId }));
  };

  const handleDelete = () => {
    if (!selected) return;
    setDeleteLoading(true);
    dispatch(removeUser(selected.id))
      .unwrap()
      .then(() => {
        toast.success("User deleted successfully");
        setDeleteOpen(false);
        handleBack();
      })
      .catch((err: string) => toast.error("Delete failed", { description: err }))
      .finally(() => setDeleteLoading(false));
  };

  const handleAddUser = async () => {
    if (!form.name || !form.email || !form.username || !form.password) {
      toast.warning("Missing fields", { description: "Name, email, username and password are required." });
      return;
    }
    setAddLoading(true);
    const payload: RegisterUserPayload = {
      name:     form.name,
      email:    form.email,
      username: form.username,
      phone:    form.phone,
      password: form.password,
      mode:     form.mode,
    };
    dispatch(addUser(payload))
      .unwrap()
      .then(() => {
        toast.success("User added successfully");
        setForm(emptyForm);
        setAddOpen(false);
        dispatch(fetchUsers()); // refresh list
      })
      .catch((err: string) => {
        toast.error("Failed to add user", { description: err });
      })
      .finally(() => setAddLoading(false));
  };

  const users = list.map((u) => toUser(u, seedMap.get(u.id) ?? 0));

  // ── Loading spinner while fetching user detail ──
  if (selectedStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="User Management" />
        <PageLoader text="Loading user..." />
      </div>
    );
  }

  // ── Error state ──
  if (selectedStatus === "failed") {
    return (
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
  }

  // ── Detail view ──
  if (view === "detail" && selected) {
    const detailUser = toUser(selected, seedMap.get(selected.id) ?? 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="User Management" />
        <UserDetail user={detailUser} onBack={handleBack} onDelete={() => setDeleteOpen(true)} />

        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete Account"
          size="sm"
          footer={
            <>
              <button
                onClick={() => setDeleteOpen(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "var(--color-text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: deleteLoading ? 0.7 : 1 }}
              >
                {deleteLoading ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : "Delete"}
              </button>
            </>
          }
        >
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>?
            This action cannot be undone.
          </p>
        </Modal>
      </div>
    );
  }

  // ── Table columns ──
  const columns: ColumnDef<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Inline initials avatar in table */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            backgroundColor: ["#2563eb","#16a34a","#d97706","#7c3aed","#db2777","#0891b2","#dc2626","#65a30d"][u.avatarSeed % 8],
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "11px", fontWeight: 700,
          }}>
            {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "13px" }}>{u.name}</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (u) => <span style={{ color: "var(--color-text-muted)" }}>{u.type}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge label={u.status} variant={statusVariant[u.status] ?? "gray"} />,
    },
    {
      key: "joined",
      header: "Joined",
      render: (u) => <span style={{ color: "var(--color-text-muted)" }}>{u.joined}</span>,
    },
    {
      key: "jobs" as keyof User,
      header: "Jobs",
      render: () => <span style={{ color: "var(--color-text-muted)" }}>—</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <button
          onClick={() => handleViewUser(u.id)}
          style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
          title="View user"
        >
          <Eye size={17} strokeWidth={1.8} />
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="User Management" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px" }}>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          {listStatus === "succeeded" ? `${list.length} users total` : "Manage all users"}
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none" }}
        >
          <Plus size={15} /> Add User
        </button>
      </div>

      <main style={{ flex: 1, padding: "0 32px 32px" }}>
        {listStatus === "loading" && <PageLoader text="Loading users..." />}
        {listStatus === "failed" && (
          <div style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>
            Failed to load users. Check your connection and try again.
          </div>
        )}
        {listStatus === "succeeded" && (
          <DataTable
            data={users}
            columns={columns}
            filterOptions={FILTER_OPTIONS}
            filterKey="type"
            searchKey="name"
            searchPlaceholder="Search name..."
            pageSize={10}
            onExport={() => console.log("export")}
          />
        )}
      </main>

      {/* ── Add User Modal ── */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setForm(emptyForm); setShowPassword(false); }}
        title="Add New User"
        size="md"
        footer={
          <>
            <button onClick={() => { setAddOpen(false); setForm(emptyForm); setShowPassword(false); }} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "var(--color-text-muted)" }}>
              Cancel
            </button>
            <button onClick={handleAddUser} disabled={addLoading} className="btn-primary" style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: addLoading ? 0.7 : 1 }}>
              {addLoading ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : "Add User"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={labelStyle}>Email Address *</label><input style={inputStyle} type="email" placeholder="user@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
          <div><label style={labelStyle}>Username *</label><input style={inputStyle} placeholder="e.g. john-doe" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <div style={{ position: "relative", display: "flex" }}>
              {/* Fixed +234 prefix */}
              <div style={{
                padding: "10px 12px", borderRadius: "10px 0 0 10px",
                border: "1px solid var(--color-border)", borderRight: "none",
                backgroundColor: "var(--color-background)", fontSize: "13px",
                color: "var(--color-text-muted)", flexShrink: 0, whiteSpace: "nowrap",
              }}>
                +234
              </div>
              <input
                style={{ ...inputStyle, borderRadius: "0 10px 10px 0", borderLeft: "none" }}
                placeholder="801 234 5678"
                maxLength={10}
                value={form.phone.replace(/^\+234/, "")}
                onChange={(e) => {
                  // Only allow digits
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((f) => ({ ...f, phone: digits ? `+234${digits}` : "" }));
                }}
              />
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Enter number without leading 0 — e.g. 801 234 5678
            </p>
          </div>
          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: "40px" }}
                type={showPassword ? "text" : "password"}
                placeholder="StrongPassword123!"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>User Type</label>
            <select style={inputStyle} value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as AddUserForm["mode"] }))}>
              <option value="client">Client</option>
              <option value="expert">Expert</option>
              <option value="tas">TAS</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}