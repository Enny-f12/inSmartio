"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useAppDispatch } from "@/hooks/redux";
import { logout } from "@/lib/redux/authSlice";
import { clearAuth } from "@/lib/api/axiosInstance";
import {
  LayoutDashboard, Users, ShieldCheck, Briefcase, Crown,
  CreditCard, Scale, BarChart2, Settings, LogOut, PanelLeftClose, X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",      href: "/dashboard",    icon: LayoutDashboard },
  { label: "Users",          href: "/users",         icon: Users },
  { label: "Verifications",  href: "/verifications", icon: ShieldCheck },
  { label: "Jobs",           href: "/jobs",          icon: Briefcase },
  { label: "TAS Management", href: "/tas",           icon: Crown },
  { label: "Payments",       href: "/payments",      icon: CreditCard },
  { label: "Disputes",       href: "/dispute",       icon: Scale },
  { label: "Reports",        href: "/report",        icon: BarChart2 },
  { label: "Settings",       href: "/settings",      icon: Settings },
];

interface SidebarContentProps {
  onClose?:  () => void;
  onLogout?: () => void;
}

function SidebarContent({ onClose, onLogout }: SidebarContentProps) {
  const pathname    = usePathname();
  const { collapsed, toggle } = useSidebar();

  const isCollapsed = onClose ? false : collapsed;

  return (
    <aside className={`
      flex flex-col h-full
      border-r border-border bg-surface
      transition-all duration-300 ease-in-out
      ${isCollapsed ? "w-18" : "w-65"}
    `}>
      {/* ── Logo + toggle ── */}
      <div className="flex items-center justify-between px-4 border-b border-border h-16 shrink-0">
        {isCollapsed ? (
          <Link href="/" className="mx-auto">
            <Image src="/logo/fav.png" alt="inSmartio" width={32} height={32} style={{ height: "auto" }} priority />
          </Link>
        ) : (
          <>
            <Link href="/" className="shrink-0">
              <Image src="/insmartio.png" alt="inSmartio Logo" width={180} height={45} style={{ height: "auto", width: "auto", marginLeft: "-20px", marginTop: "-10px" }} priority />
            </Link>
            <button
              onClick={onClose ?? toggle}
              aria-label={onClose ? "Close menu" : "Collapse sidebar"}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors shrink-0"
            >
              {onClose ? <X size={19} strokeWidth={1.8} /> : <PanelLeftClose size={19} strokeWidth={1.8} />}
            </button>
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto pt-8 py-3 px-2.5">
        <ul className="space-y-2.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  title={isCollapsed ? label : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
                    transition-all duration-150
                    ${active ? "bg-primary text-white" : "text-text-muted hover:bg-background hover:text-text-main"}
                    ${isCollapsed ? "justify-center" : ""}
                  `}
                >
                  <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                  {!isCollapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Logout ── */}
      <div className="px-2.5 pb-4 pt-3 border-t border-border">
        <button
          onClick={onLogout}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium w-full
            text-red-500 hover:bg-red-50 transition-colors
            ${isCollapsed ? "justify-center" : ""}
          `}
        >
          <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const dispatch = useAppDispatch();
  const router   = useRouter();

  const handleLogout = () => {
    clearAuth();             // wipe cookie + localStorage
    dispatch(logout());      // clear Redux state
    router.push("/login");   // redirect
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div
        className="hidden md:flex h-screen sticky top-0 shrink-0 transition-all duration-300"
        style={{ width: collapsed ? "72px" : "260px" }}
      >
        <SidebarContent onLogout={handleLogout} />
      </div>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className="fixed top-0 left-0 bottom-0 z-50 w-65 md:hidden"
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
        }}
      >
        <SidebarContent
          onClose={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </>
  );
}