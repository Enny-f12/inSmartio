// components/settings/AdminManagement.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Loader2, ShieldCheck, ShieldOff, Eye, EyeOff, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchAdmins, addAdmin, editAdmin, removeAdmin, toggleAdmin2FA,
} from "@/lib/redux/adminSlice";
import type { RegisterAdminPayload, UpdateAdminPayload } from "@/lib/api/adminApi";

// ── Styles ────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)",
  fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "6px",
};

function AdminAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function AdminManagement({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, mutateStatus } = useAppSelector((s) => s.admin);

  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [addForm,      setAddForm]      = useState<RegisterAdminPayload>({ name: "", email: "", password: "" });
  const [editForm,     setEditForm]     = useState<UpdateAdminPayload>({ name: "", email: "" });

  const isMutating = mutateStatus === "loading";
  const editAdmin_ = list.find((a) => a.id === editTarget);
  const deleteAdmin_ = list.find((a) => a.id === deleteTarget);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchAdmins());
  }, [dispatch, listStatus]);

  const handleAdd = () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.warning("All fields are required");
      return;
    }
    dispatch(addAdmin(addForm))
      .unwrap()
      .then(() => { toast.success("Admin added"); setAddOpen(false); setAddForm({ name: "", email: "", password: "" }); })
      .catch((err: string) => toast.error("Failed to add admin", { description: err }));
  };

  const handleEdit = () => {
    if (!editTarget) return;
    dispatch(editAdmin({ id: editTarget, payload: editForm }))
      .unwrap()
      .then(() => { toast.success("Admin updated"); setEditTarget(null); })
      .catch((err: string) => toast.error("Failed to update admin", { description: err }));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch(removeAdmin(deleteTarget))
      .unwrap()
      .then(() => { toast.success("Admin deleted"); setDeleteTarget(null); })
      .catch((err: string) => toast.error("Failed to delete admin", { description: err }));
  };

  const handleToggle2FA = (id: string, current: boolean, name: string) => {
    dispatch(toggleAdmin2FA(id))
      .unwrap()
      .then(() => toast.success(`2FA ${current ? "disabled" : "enabled"} for ${name}`))
      .catch((err: string) => toast.error("Failed to toggle 2FA", { description: err }));
  };

  return (
    <SubPageShell
      title="Admin Management"
      onBack={onBack}
      action={
        <button onClick={() => setAddOpen(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap", marginBottom: "5px" }}>
          <Plus size={15} /> Add Admin
        </button>
      }
    >
      {/* List */}
      {listStatus === "loading" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "13px" }}>Loading admins...</span>
        </div>
      )}

      {listStatus === "failed" && (
        <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
      )}

      {listStatus === "succeeded" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <style>{`
            .admin-card { display: flex; flex-direction: column; gap: 12px; }
            .admin-card-top { display: flex; align-items: center; gap: 12px; }
            .admin-card-bottom { display: flex; align-items: center; justify-content: space-between; padding-left: 48px; }
            @media (min-width: 640px) {
              .admin-card { flex-direction: row; align-items: center; gap: 16px; }
              .admin-card-top { flex: 1; }
              .admin-card-bottom { padding-left: 0; }
            }
          `}</style>
          {list.length === 0 && (
            <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "var(--color-text-muted)" }}>No admins found.</p>
          )}
          {list.map((admin) => (
            <div key={admin.id} style={{ padding: "16px 20px", borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>
              <div className="admin-card">
                {/* Top: avatar + info */}
                <div className="admin-card-top">
                  <AdminAvatar name={admin.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{admin.name}</p>
                      <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "999px", backgroundColor: admin.status === "active" ? "#dcfce7" : "#f3f4f6", color: admin.status === "active" ? "#15803d" : "#6b7280" }}>
                        {admin.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{admin.email}</p>
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      Role: {admin.role} · Joined {new Date(admin.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                {/* Bottom: 2FA status + actions */}
                <div className="admin-card-bottom">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500, color: admin.twoFactorAuth ? "#16a34a" : "#9ca3af" }}>
                    {admin.twoFactorAuth ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                    <span>2FA {admin.twoFactorAuth ? "On" : "Off"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button onClick={() => handleToggle2FA(admin.id, admin.twoFactorAuth, admin.name)} title="Toggle 2FA" style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                      {admin.twoFactorAuth ? <ShieldOff size={15} strokeWidth={1.8} /> : <ShieldCheck size={15} strokeWidth={1.8} />}
                    </button>
                    <button onClick={() => { setEditTarget(admin.id); setEditForm({ name: admin.name, email: admin.email }); }} title="Edit" style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                      <Pencil size={15} strokeWidth={1.8} />
                    </button>
                    <button onClick={() => setDeleteTarget(admin.id)} title="Delete" style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#f87171" }}>
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        key={addOpen ? "add-open" : "add-closed"}
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddForm({ name: "", email: "", password: "" }); }}
        title="Add New Admin"
        size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
            <button onClick={handleAdd} disabled={isMutating} className="btn-primary" style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
              {isMutating ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : "Add Admin"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} placeholder="e.g. John Doe" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={labelStyle}>Email Address *</label><input style={inputStyle} type="email" placeholder="admin@insmart.io" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} /></div>
          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: "40px" }} type={showPassword ? "text" : "password"} placeholder="StrongPassword123!" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        key={editTarget ?? "edit-closed"}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Admin"
        size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setEditTarget(null)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
            <button onClick={handleEdit} disabled={isMutating} className="btn-primary" style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
              {isMutating ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Changes"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div><label style={labelStyle}>Full Name</label><input style={inputStyle} placeholder="Full name" value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={labelStyle}>Email Address</label><input style={inputStyle} type="email" placeholder="Email" value={editForm.email ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} /></div>
        </div>
        {editAdmin_ && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "12px" }}>Editing: {editAdmin_.name}</p>}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Admin"
        size="sm"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
            <button onClick={handleDelete} disabled={isMutating} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
              {isMutating ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : "Delete"}
            </button>
          </div>
        }
      >
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: "var(--color-text-main)" }}>{deleteAdmin_?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </SubPageShell>
  );
}