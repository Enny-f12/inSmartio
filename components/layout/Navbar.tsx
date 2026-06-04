/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell, PanelLeftOpen, Menu, X, Trash2, CheckCheck,
  User, Lock, LogOut, ChevronDown, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchNotifications, markReadThunk, markAllReadThunk, deleteNotificationThunk,
} from "@/lib/redux/notificationSlice";
import { logout } from "@/lib/redux/authSlice";
import Modal from "@/components/ui/Modal";
import type { ApiNotification } from "@/lib/api/notificationApi";

interface TopbarProps { title: string; }

const ROLE_LABELS: Record<string, string> = {
  super_admin:          "Super Admin",
  admin:                "Admin",
  verification_officer: "Verification Officer",
  finance_admin:        "Finance Admin",
  support_admin:        "Support Admin",
  view_only_admin:      "View Only Admin",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin:          ["Full system access", "Manage admins", "All settings", "All reports"],
  admin:                ["Full administrative control", "Manage platform modules", "View reports"],
  verification_officer: ["View verifications", "Approve/reject experts", "View users"],
  finance_admin:        ["View payments", "Process payouts", "Download reports"],
  support_admin:        ["View disputes", "Respond to users", "View jobs"],
  view_only_admin:      ["Read-only access to all sections"],
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  super_admin:          { bg: "#EDE9FE", color: "#6D28D9" },
  admin:                { bg: "#EDE9FE", color: "#6D28D9" },
  verification_officer: { bg: "#DBEAFE", color: "#1D4ED8" },
  finance_admin:        { bg: "#D1FAE5", color: "#065F46" },
  support_admin:        { bg: "#FEF3C7", color: "#B45309" },
  view_only_admin:      { bg: "#F3F4F6", color: "#374151" },
};

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
  fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "#6B7280", marginBottom: "6px",
};

// ── Profile Modal ─────────────────────────────────────────
function ProfileModal({ name, email, role, status, createdAt, avatarUrl, onClose }: {
  name: string; email: string; role: string; status: string;
  createdAt: string; avatarUrl?: string; onClose: () => void;
}) {
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColor = ROLE_COLORS[role] ?? { bg: "#F3F4F6", color: "#374151" };
  const perms     = ROLE_PERMISSIONS[role] ?? [];
  const initials  = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const dateJoined = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <Modal open onClose={onClose} title="My Profile" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px",
          padding: "16px", backgroundColor: "#F9FAFB", borderRadius: "12px" }}>
          {avatarUrl ? (
            <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0 }}>
              <Image src={avatarUrl} alt={name} fill style={{ objectFit: "cover" }} unoptimized />
            </div>
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#16a34a",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "20px", fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{name}</p>
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px",
              borderRadius: "999px", backgroundColor: roleColor.bg, color: roleColor.color }}>
              {roleLabel}
            </span>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Email Address</span>
            <p style={{ fontSize: "14px", color: "#111827", margin: "2px 0 0", fontWeight: 500 }}>{email}</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Status</span>
              <p style={{ fontSize: "14px", color: status === "active" ? "#16a34a" : "#ef4444",
                margin: "2px 0 0", fontWeight: 600, textTransform: "capitalize" }}>● {status}</p>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Date Joined</span>
              <p style={{ fontSize: "14px", color: "#111827", margin: "2px 0 0", fontWeight: 500 }}>{dateJoined}</p>
            </div>
          </div>
        </div>
        {perms.length > 0 && (
          <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#6B7280", marginBottom: "12px" }}>Role Permissions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {perms.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#374151" }}>
                  <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />{p}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Change Password Modal ─────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form,    setForm]    = useState({ newPassword: "", confirm: "" });
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.newPassword || !form.confirm || form.newPassword.length < 8 || form.newPassword !== form.confirm) return;
    setLoading(true);
    try { await new Promise((r) => setTimeout(r, 800)); onClose(); }
    finally { setLoading(false); }
  };

  const match = form.confirm.length > 0 ? form.newPassword === form.confirm : null;

  return (
    <Modal open onClose={onClose} title="Change Password" size="sm"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px",
            border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || match === false || !form.newPassword}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none",
              backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600,
              cursor: (loading || match === false || !form.newPassword) ? "not-allowed" : "pointer",
              opacity: (loading || match === false || !form.newPassword) ? 0.6 : 1 }}>
            {loading ? "Saving…" : "Save Password"}
          </button>
        </div>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {[
          { label: "New Password *", key: "newPassword" as const, show: showNew, toggle: () => setShowNew(v => !v), placeholder: "Minimum 8 characters" },
          { label: "Confirm Password *", key: "confirm" as const, show: showCon, toggle: () => setShowCon(v => !v), placeholder: "Re-enter new password" },
        ].map(({ label, key, show, toggle, placeholder }) => (
          <div key={key}>
            <label style={lbl}>{label}</label>
            <div style={{ position: "relative" }}>
              <input type={show ? "text" : "password"} style={{ ...inp, paddingRight: "40px" }}
                placeholder={placeholder} value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              <button type="button" onClick={toggle}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ))}
        {match !== null && (
          <p style={{ fontSize: "12px", margin: 0, color: match ? "#16a34a" : "#ef4444" }}>
            {match ? "✓ Passwords match" : "✗ Passwords do not match"}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ── Notification Panel ────────────────────────────────────
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { list, listStatus, unreadCount } = useAppSelector((s) => s.notifications);
  const isRead = (n: ApiNotification) => n.read === true || n.isRead === true;

  return (
    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "340px",
      maxWidth: "calc(100vw - 32px)", borderRadius: "16px", border: "1px solid #E5E7EB",
      backgroundColor: "#ffffff", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", margin: 0 }}>Notifications</p>
          {unreadCount > 0 && (
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "999px",
              backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {unreadCount > 0 && (
            <button onClick={() => dispatch(markAllReadThunk())}
              style={{ padding: "5px", borderRadius: "8px", border: "none", background: "none",
                cursor: "pointer", color: "#6B7280", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
              <CheckCheck size={14} /> All read
            </button>
          )}
          <button onClick={onClose}
            style={{ padding: "5px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={15} />
          </button>
        </div>
      </div>
      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
        {listStatus === "loading" && <p style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: "#9CA3AF" }}>Loading…</p>}
        {listStatus === "failed"  && <p style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: "#EF4444" }}>Failed to load.</p>}
        {listStatus === "succeeded" && list.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <Bell size={28} style={{ color: "#E5E7EB", margin: "0 auto 8px" }} />
            <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No notifications yet</p>
          </div>
        )}
        {list.map((n) => {
          const read = isRead(n);
          return (
            <div key={n.id} style={{ display: "flex", gap: "10px", padding: "12px 16px",
              borderBottom: "1px solid #F9FAFB", backgroundColor: read ? "#ffffff" : "#FFFBEB" }}>
              <div style={{ flexShrink: 0, marginTop: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%",
                  backgroundColor: read ? "transparent" : "#F59E0B" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {n.title && <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: "0 0 2px", lineHeight: 1.4 }}>{n.title}</p>}
                <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>{n.message ?? n.body ?? "—"}</p>
                <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "4px 0 0" }}>
                  {new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                {!read && (
                  <button onClick={() => dispatch(markReadThunk(n.id))}
                    style={{ padding: "4px", borderRadius: "6px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF" }}>
                    <CheckCheck size={13} />
                  </button>
                )}
                <button onClick={() => dispatch(deleteNotificationThunk(n.id))}
                  style={{ padding: "4px", borderRadius: "6px", border: "none", background: "none", cursor: "pointer", color: "#EF4444" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Profile Dropdown — design 3.4 ─────────────────────────
function ProfileDropdown({ name, role, initials, avatarUrl, onProfile, onPassword, onClose, onLogout }: {
  name: string; email: string; role: string; initials: string; avatarUrl?: string;
  onProfile: () => void; onPassword: () => void; onClose: () => void; onLogout: () => void;
}) {
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColor = ROLE_COLORS[role] ?? { bg: "#F3F4F6", color: "#374151" };
  const router    = useRouter();

  const item = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
    <button onClick={() => { onClose(); onClick(); }}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 12px", borderRadius: "8px", border: "none", background: "none",
        cursor: "pointer", fontSize: "13px", color: danger ? "#EF4444" : "#111827", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = danger ? "#FEF2F2" : "#F3F4F6")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
      <span style={{ color: danger ? "#EF4444" : "#6B7280", display: "flex", flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "220px",
      borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff",
      boxShadow: "0 4px 20px rgba(0,0,0,0.10)", zIndex: 50, overflow: "hidden" }}>

      {/* Header — name + role label (no email, matches design 3.4) */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px",
        padding: "14px 16px", borderBottom: "1px solid #E5E7EB" }}>
        {avatarUrl ? (
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative" }}>
            <Image src={avatarUrl} alt={name} fill style={{ objectFit: "cover" }} unoptimized />
          </div>
        ) : (
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 700, color: "#fff", backgroundColor: "#16a34a" }}>
            {initials}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: "0 0 2px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
          {/* Role label only — no email in dropdown header per design 3.4 */}
          <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
            backgroundColor: roleColor.bg, color: roleColor.color }}>
            {roleLabel}
          </span>
        </div>
      </div>

      <div style={{ padding: "6px 4px" }}>
        {item(<User size={15} />, "My Profile",            onProfile)}
        {item(<Bell size={15} />, "Notification Settings", () => router.push("/settings"))}
        {item(<Lock size={15} />, "Change Password",       onPassword)}
      </div>
      <div style={{ borderTop: "1px solid #E5E7EB", padding: "6px 4px" }}>
        {item(<LogOut size={15} />, "Logout", onLogout, true)}
      </div>
    </div>
  );
}

/* ── Main Navbar ─────────────────────────────────────────── */
export default function Topbar({ title }: TopbarProps) {
  const { collapsed, toggle, setMobileOpen } = useSidebar();
  const dispatch = useAppDispatch();
  const router   = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authState = useAppSelector((s) => s.auth) as any;
  const admin     = authState.admin;
  const { listStatus, unreadCount } = useAppSelector((s) => s.notifications);

  const [mounted,       setMounted]       = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Gate all auth-derived values behind `mounted` — SSR and first client render
  // both use fallbacks, eliminating the hydration mismatch on adminEmail etc.
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchNotifications());
  }, [dispatch, listStatus]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const adminName      = mounted ? (admin?.name      ?? "Admin")           : "Admin";
  const adminEmail     = mounted ? (admin?.email     ?? "")                : "";
  const adminRole      = mounted ? (admin?.role      ?? "view_only_admin") : "view_only_admin";
  const adminStatus    = mounted ? (admin?.status    ?? "active")          : "active";
  const adminCreatedAt = mounted ? (admin?.createdAt ?? "")                : "";
  const adminAvatarUrl = mounted ? (admin?.avatar?.secureUrl ?? admin?.avatar?.url) : undefined;
  const initials       = adminName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => { dispatch(logout()); router.push("/login"); };

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 10, display: "flex",
        alignItems: "center", justifyContent: "space-between", height: "64px",
        padding: "0 16px", backgroundColor: "white",
        borderBottom: "1px solid var(--color-border)", flexShrink: 0, gap: "8px" }}>

        <style>{`
          .nav-mobile-only  { display: flex; }
          .nav-desktop-only { display: none; }
          .nav-logo         { display: none; }
          .nav-admin-detail { display: none; }
          .nav-title        { font-size: 15px; font-weight: 700; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
          @media (min-width: 400px)  { .nav-logo { display: flex; } }
          @media (min-width: 640px)  { .nav-title { font-size: 17px; } .nav-admin-detail { display: block; } }
          @media (min-width: 768px)  { .nav-mobile-only { display: none !important; } .nav-desktop-only { display: flex; } .nav-title { font-size: 19px; } }
        `}</style>

        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="nav-mobile-only"
            style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none",
              cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}>
            <Menu size={20} strokeWidth={1.8} />
          </button>
          {collapsed && (
            <button onClick={toggle} aria-label="Expand sidebar" className="nav-desktop-only"
              style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none",
                cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}>
              <PanelLeftOpen size={19} strokeWidth={1.8} />
            </button>
          )}
          <Image src="/logo/fav.png" alt="inSmartio" width={32} height={32}
            className="nav-logo nav-mobile-only"
            style={{ height: "auto", objectFit: "contain", flexShrink: 0 }} />
          <h1 className="nav-title">{title}</h1>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>

          {/* Bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => { setShowNotifs((v) => !v); setShowProfile(false); }}
              aria-label="Notifications"
              style={{ position: "relative", padding: "8px", borderRadius: "10px", border: "none",
                background: showNotifs ? "#F9FAFB" : "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
              <Bell size={19} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: "5px", right: "5px", minWidth: "8px", height: "8px",
                  borderRadius: "50%", backgroundColor: "#F59E0B", border: "2px solid #fff" }} />
              )}
            </button>
            {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
          </div>

          {/* Profile */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button onClick={() => { setShowProfile((v) => !v); setShowNotifs(false); }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 8px",
                borderRadius: "10px", border: "none", background: showProfile ? "#F9FAFB" : "none",
                cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => { if (!showProfile) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
              onMouseLeave={(e) => { if (!showProfile) e.currentTarget.style.backgroundColor = "transparent"; }}>

              {adminAvatarUrl ? (
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                  <Image src={adminAvatarUrl} alt={adminName} fill style={{ objectFit: "cover" }} unoptimized />
                </div>
              ) : (
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                  color: "#fff", backgroundColor: "#16a34a", flexShrink: 0 }}>
                  {initials}
                </div>
              )}

              <div className="nav-admin-detail" style={{ textAlign: "left" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.2, color: "var(--color-text-main)", margin: 0 }}>{adminName}</p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>{adminEmail}</p>
              </div>
              <ChevronDown size={14} className="nav-admin-detail"
                style={{ color: "var(--color-text-muted)",
                  transform: showProfile ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>

            {showProfile && (
              <ProfileDropdown
                name={adminName} email={adminEmail} role={adminRole}
                initials={initials} avatarUrl={adminAvatarUrl}
                onProfile={()  => { setShowProfile(false); setShowMyProfile(true); }}
                onPassword={()  => { setShowProfile(false); setShowPassword(true); }}
                onClose={() => setShowProfile(false)}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </header>

      {showMyProfile && (
        <ProfileModal name={adminName} email={adminEmail} role={adminRole}
          status={adminStatus} createdAt={adminCreatedAt} avatarUrl={adminAvatarUrl}
          onClose={() => setShowMyProfile(false)} />
      )}
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </>
  );
}