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
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-surface border-b border-border shrink-0">
      <style>{`
        .nav-mobile-only { display: flex; }
        @media (min-width: 768px) { .nav-mobile-only { display: none !important; } }
        .nav-desktop-only { display: none; }
        @media (min-width: 768px) { .nav-desktop-only { display: flex; } }
      `}</style>

      {/* ── Left: hamburger (mobile) + expand toggle (desktop collapsed) + title ── */}
      <div className="flex items-center gap-3">

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="nav-mobile-only p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>

        {/* Expand toggle — desktop, collapsed state only */}
        {collapsed && (
          <button
            onClick={toggle}
            aria-label="Expand sidebar"
            className="nav-desktop-only p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
          >
            <PanelLeftOpen size={19} strokeWidth={1.8} />
          </button>
        )}

        {/* Logo — mobile only */}
        <Image
          src="/logo/fav.png"
          alt="inSmartio"
          width={36}
          height={36}
          className="nav-mobile-only"
          style={{ height: "auto", objectFit: "contain" }}
        />

        <h1 className="text-[17px] sm:text-[19px] font-bold text-text-main">{title}</h1>
      </div>

      {/* ── Right: bell + admin ── */}
      <div className="flex items-center gap-3">

        <button className="relative p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-background transition-colors">
          <Bell size={19} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
        </button>

        <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-background transition-colors">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white bg-green-600 shrink-0">
            AD
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[13px] font-semibold leading-tight text-text-main">Admin</p>
            <p className="text-[11px] text-text-muted">admin@helpme.com</p>
          </div>
          <ChevronDown size={14} className="text-text-muted hidden sm:block" />
        </button>

      </div>
    </header>
  );
}