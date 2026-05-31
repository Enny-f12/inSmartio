// app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/components/layout/Navbar";
import CategoriesManagement   from "@/components/settings/CategoriesMnagement";
import FaqManagement          from "@/components/settings/FaqManagement";
import BannerManagement       from "@/components/settings/BannerManagement";
import AnnouncementManagement from "@/components/settings/AnnouncementManagement";
import CommissionSettings     from "@/components/settings/CommisionSettings";
import NotificationTemplates  from "@/components/settings/Notification";
import NotificationSettings   from "@/components/settings/NotificationSettings";
import AdminManagement        from "@/components/settings/AdminManagement";
import type { SettingsView }  from "@/components/settings/types";

type ExtendedView = SettingsView | "notif-settings";

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-5 py-4 text-[13.5px] text-text-main hover:bg-background transition-colors text-left border-b border-border last:border-b-0"
    >
      <span>{label}</span>
      <ChevronRight size={15} className="text-text-muted" />
    </button>
  );
}

// ── Inner component that uses useSearchParams ─────────────
// Must be wrapped in <Suspense> to satisfy Next.js static generation.
function SettingsInner() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<ExtendedView>("main");

  useEffect(() => {
    const param = searchParams.get("view") as ExtendedView | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (param) setView(param);
  }, [searchParams]);

  if (view === "categories")     return <CategoriesManagement   onBack={() => setView("main")} />;
  if (view === "faq")            return <FaqManagement          onBack={() => setView("main")} />;
  if (view === "banners")        return <BannerManagement       onBack={() => setView("main")} />;
  if (view === "announcements")  return <AnnouncementManagement onBack={() => setView("main")} />;
 if (view === "commission")     return <CommissionSettings      onBack={() => setView("main")} />;
  if (view === "notifications")  return <NotificationTemplates  onBack={() => setView("main")} />;
  if (view === "notif-settings") return <NotificationSettings   onBack={() => setView("main")} />;
  if (view === "admins")         return <AdminManagement        onBack={() => setView("main")} />;

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Settings" />

      <main className="flex-1 px-8 py-6 space-y-6">

        {/* Content Management */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">
            Content Management
          </p>
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <MenuItem label="Categories Management"   onClick={() => setView("categories")} />
            <MenuItem label="FAQ Management"          onClick={() => setView("faq")} />
            <MenuItem label="Banner Management"       onClick={() => setView("banners")} />
            <MenuItem label="Announcement Management" onClick={() => setView("announcements")} />
          </div>
        </div>

        {/* System Settings */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3 mt-4">
            System Settings
          </p>
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <MenuItem label="Commission Settings"    onClick={() => setView("commission")} />
            <MenuItem label="Notification Templates" onClick={() => setView("notifications")} />
            <MenuItem label="Notification Settings"  onClick={() => setView("notif-settings")} />
          </div>
        </div>

        {/* Admin */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3 mt-4">
            Admin
          </p>
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <MenuItem label="Admin Management" onClick={() => setView("admins")} />
          </div>
        </div>

      </main>
    </div>
  );
}

// ── Page export wraps inner component in Suspense ─────────
export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  );
}