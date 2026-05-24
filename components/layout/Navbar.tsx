// components/layout/Navbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, PanelLeftOpen, Menu, X, Trash2, CheckCheck } from "lucide-react";
import Image from "next/image";
import { useSidebar } from "@/context/SidebarContext";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchNotifications,
  markReadThunk,
  markAllReadThunk,
  deleteNotificationThunk,
} from "@/lib/redux/notificationSlice";
import type { ApiNotification } from "@/lib/api/notificationApi";

interface TopbarProps {
  title: string;
}

/* ── Notification dropdown ─────────────────────────────────── */
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { list, listStatus, unreadCount } = useAppSelector(
    (s) => s.notifications
  );

  const isRead = (n: ApiNotification) => n.read === true || n.isRead === true;

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: "340px",
        maxWidth: "calc(100vw - 32px)",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        backgroundColor: "#ffffff",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            Notifications
          </p>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "999px",
                backgroundColor: "#FEF3C7",
                color: "#D97706",
                border: "1px solid #FDE68A",
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          {unreadCount > 0 && (
            <button
              onClick={() => dispatch(markAllReadThunk())}
              title="Mark all read"
              style={{
                padding: "5px",
                borderRadius: "8px",
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#6B7280",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
              }}
            >
              <CheckCheck size={14} /> All read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "5px",
              borderRadius: "8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#9CA3AF",
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
        {listStatus === "loading" && (
          <p
            style={{
              textAlign: "center",
              padding: "32px",
              fontSize: "13px",
              color: "#9CA3AF",
            }}
          >
            Loading…
          </p>
        )}

        {listStatus === "failed" && (
          <p
            style={{
              textAlign: "center",
              padding: "32px",
              fontSize: "13px",
              color: "#EF4444",
            }}
          >
            Failed to load notifications.
          </p>
        )}

        {listStatus === "succeeded" && list.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <Bell size={28} style={{ color: "#E5E7EB", margin: "0 auto 8px" }} />
            <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>
              No notifications yet
            </p>
          </div>
        )}

        {list.map((n) => {
          const read = isRead(n);
          return (
            <div
              key={n.id}
              style={{
                display: "flex",
                gap: "10px",
                padding: "12px 16px",
                borderBottom: "1px solid #F9FAFB",
                backgroundColor: read ? "#ffffff" : "#FFFBEB",
                transition: "background 0.15s",
              }}
            >
              {/* Unread dot */}
              <div style={{ flexShrink: 0, marginTop: "4px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: read ? "transparent" : "#F59E0B",
                  }}
                />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {n.title && (
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#111827",
                      margin: "0 0 2px",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.title}
                  </p>
                )}
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {n.message ?? n.body ?? "—"}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#9CA3AF",
                    margin: "4px 0 0",
                  }}
                >
                  {new Date(n.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flexShrink: 0,
                }}
              >
                {!read && (
                  <button
                    onClick={() => dispatch(markReadThunk(n.id))}
                    title="Mark read"
                    style={{
                      padding: "4px",
                      borderRadius: "6px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#9CA3AF",
                    }}
                  >
                    <CheckCheck size={13} />
                  </button>
                )}
                <button
                  onClick={() => dispatch(deleteNotificationThunk(n.id))}
                  title="Delete"
                  style={{
                    padding: "4px",
                    borderRadius: "6px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "#EF4444",
                  }}
                >
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

/* ── Main Navbar ──────────────────────────────────────────── */
export default function Topbar({ title }: TopbarProps) {
  const { collapsed, toggle, setMobileOpen } = useSidebar();
  const dispatch = useAppDispatch();

  const { admin } = useAppSelector((s) => s.auth);
  const { listStatus, unreadCount } = useAppSelector((s) => s.notifications);

  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications once on mount (re-fetches if reset to "idle")
  useEffect(() => {
    if (listStatus === "idle") {
      dispatch(fetchNotifications());
    }
  }, [dispatch, listStatus]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  // Admin display
  const adminName = admin?.name ?? "Admin";
  const adminEmail = admin?.email ?? "";
  const initials = adminName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        padding: "0 16px",
        backgroundColor: "white",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
        gap: "8px",
      }}
    >
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="nav-mobile-only"
          style={{
            padding: "6px",
            borderRadius: "8px",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            flexShrink: 0,
          }}
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>

        {collapsed && (
          <button
            onClick={toggle}
            aria-label="Expand sidebar"
            className="nav-desktop-only"
            style={{
              padding: "6px",
              borderRadius: "8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              flexShrink: 0,
            }}
          >
            <PanelLeftOpen size={19} strokeWidth={1.8} />
          </button>
        )}

        <Image
          src="/logo/fav.png"
          alt="inSmartio"
          width={32}
          height={32}
          className="nav-logo nav-mobile-only"
          style={{ height: "auto", objectFit: "contain", flexShrink: 0 }}
        />

        <h1 className="nav-title">{title}</h1>
      </div>

      {/* Right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        {/* Bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            style={{
              position: "relative",
              padding: "8px",
              borderRadius: "10px",
              border: "none",
              background: showNotifs ? "#F9FAFB" : "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
            }}
          >
            <Bell size={19} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  minWidth: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#F59E0B",
                  border: "2px solid #fff",
                }}
              />
            )}
          </button>

          {showNotifs && (
            <NotificationPanel onClose={() => setShowNotifs(false)} />
          )}
        </div>

        {/* Admin info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 8px",
            borderRadius: "10px",
          }}
        >
          {/* Avatar — initials */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "#fff",
              backgroundColor: "#16a34a",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {/* Name + email */}
          <div className="nav-admin-detail" style={{ textAlign: "left" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: 1.2,
                color: "var(--color-text-main)",
                margin: 0,
              }}
            >
              {adminName}
            </p>
            <p
              style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}
            >
              {adminEmail}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}