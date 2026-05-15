// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard, Users, ShieldCheck, Briefcase, Crown,
  CreditCard, Scale, BarChart2, Settings, LogOut, PanelLeftClose,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",      href: "/dashboard",    icon: LayoutDashboard },
  { label: "Users",          href: "/users",         icon: Users },
  { label: "Verifications",  href: "/verifications", icon: ShieldCheck },
  { label: "Jobs",           href: "/jobs",          icon: Briefcase },
  { label: "TAS Management", href: "/tas",           icon: Crown },
  { label: "Payments",       href: "/payments",       icon: CreditCard },
  { label: "Disputes",       href: "/dispute",       icon: Scale },
  { label: "Reports",        href: "/report",        icon: BarChart2 },
  { label: "Settings",       href: "/settings",      icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`
        flex flex-col h-screen sticky top-0 shrink-0
        border-r border-border bg-surface
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-18" : "w-65"}
      `}
    >
      {/* ── Logo + collapse toggle ── */}
      <div className="flex items-center justify-between px-4 border-b border-border h-16 shrink-0">
        {collapsed ? (
          <Link href="/" className="mx-auto">
            <Image
              src="/logo/fav.png"
              alt="inSmartio"
              width={32}
              height={32}
              style={{ height: "auto" }}
              className="w-8 object-contain"
              priority
            />
          </Link>
        ) : (
          <>
            <Link href="/" className="shrink-0">
              <Image
                src="/logo/insmartio.png"
                alt="inSmartio Logo"
                width={120}
                height={35}
                style={{ height: "auto" }}
                className="w-auto object-contain"
                priority
              />
            </Link>
            <button
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors shrink-0"
            >
              <PanelLeftClose size={19} strokeWidth={1.8} />
            </button>
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto pt-8 py-3 px-2.5">
        <ul className="space-y-2.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
                    transition-all duration-150
                    ${active ? "bg-primary text-white" : "text-text-muted hover:bg-background hover:text-text-main"}
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Logout ── */}
      <div className="px-2.5 pb-4 pt-3 border-t border-border">
        <button
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium w-full
            text-red-500 hover:bg-red-50 transition-colors
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}