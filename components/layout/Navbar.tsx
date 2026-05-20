// components/layout/Navbar.tsx
"use client";

import { Bell, ChevronDown, PanelLeftOpen, Menu } from "lucide-react";
import Image from "next/image";
import { useSidebar } from "@/context/SidebarContext";

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { collapsed, toggle, setMobileOpen } = useSidebar();

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", padding: "0 16px", backgroundColor: "white", borderBottom: "1px solid var(--color-border)", flexShrink: 0, gap: "8px" }}>
      <style>{`
        .nav-mobile-only  { display: flex; }
        .nav-desktop-only { display: none; }
        .nav-logo         { display: none; }
        .nav-admin-detail { display: none; }
        .nav-title        { font-size: 15px; font-weight: 700; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

        @media (min-width: 400px) {
          .nav-logo { display: flex; }
        }
        @media (min-width: 640px) {
          .nav-title        { font-size: 17px; }
          .nav-admin-detail { display: block; }
        }
        @media (min-width: 768px) {
          .nav-mobile-only  { display: none !important; }
          .nav-desktop-only { display: flex; }
          .nav-title        { font-size: 19px; }
        }
      `}</style>

      {/* Left: hamburger + logo + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="nav-mobile-only"
          style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>

        {/* Expand toggle — desktop collapsed only */}
        {collapsed && (
          <button
            onClick={toggle}
            aria-label="Expand sidebar"
            className="nav-desktop-only"
            style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}
          >
            <PanelLeftOpen size={19} strokeWidth={1.8} />
          </button>
        )}

        {/* Logo — hidden on very narrow screens */}
        <Image
          src="/logo/fav.png"
          alt="inSmartio"
          width={32}
          height={32}
          className="nav-logo nav-mobile-only"
          style={{ height: "auto", objectFit: "contain", flexShrink: 0 }}
        />

        {/* Title — truncates instead of wrapping */}
        <h1 className="nav-title">{title}</h1>
      </div>

      {/* Right: bell + admin */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>

        <button style={{ position: "relative", padding: "8px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
          <Bell size={19} strokeWidth={1.8} />
          <span style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
        </button>

        <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", backgroundColor: "#16a34a", flexShrink: 0 }}>
            AD
          </div>
          <div className="nav-admin-detail" style={{ textAlign: "left" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.2, color: "var(--color-text-main)" }}>Admin</p>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>admin@insmartio.com</p>
          </div>
          <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} className="nav-admin-detail" />
        </button>

      </div>
    </header>
  );
}