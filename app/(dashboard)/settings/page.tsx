// app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Topbar                 from "@/components/layout/Navbar";
import CategoriesManagement   from "@/components/settings/CategoriesMnagement";
import FaqManagement          from "@/components/settings/FaqManagement";
import BannerManagement       from "@/components/settings/BannerManagement";
import AnnouncementManagement from "@/components/settings/AnnouncementManagement";
import CommissionSettings     from "@/components/settings/CommisionSettings";
import NotificationTemplates  from "@/components/settings/Notification";
import NotificationSettings   from "@/components/settings/NotificationSettings";
import AdminManagement        from "@/components/settings/AdminManagement";
import SubscriptionManagement from "@/components/settings/SubscriptionManagement";
import type { SettingsView }  from "@/components/settings/types";
import { getPermissions }     from "@/lib/adminPermissions";
import { useAppSelector }     from "@/hooks/redux";

type ExtendedView = SettingsView | "notif-settings" | "app-version" | "cloud-upload";

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

function SettingsInner() {
  const searchParams = useSearchParams();
  const paramView    = searchParams.get("view") as ExtendedView | null;
  const [view, setView] = useState<ExtendedView>(paramView ?? "main");

  // ── Resolve permissions from the auth store ───────────────────────────────
  const role  = useAppSelector((s) => s.auth.admin?.role);
  const perms = getPermissions(role);

  useEffect(() => {
    const param = searchParams.get("view") as ExtendedView | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (param && param !== view) setView(param);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Sub-page routing ──────────────────────────────────────────────────────
  if (view === "categories")     return <CategoriesManagement   onBack={() => setView("main")} />;
  if (view === "faq")            return <FaqManagement          onBack={() => setView("main")} />;
  if (view === "banners")        return <BannerManagement       onBack={() => setView("main")} />;
  if (view === "announcements")  return <AnnouncementManagement onBack={() => setView("main")} />;
  if (view === "commission")     return <CommissionSettings      onBack={() => setView("main")} />;
  if (view === "notifications")  return <NotificationTemplates  onBack={() => setView("main")} />;
  if (view === "notif-settings") return <NotificationSettings   onBack={() => setView("main")} />;
  if (view === "admins")         return <AdminManagement        onBack={() => setView("main")} />;
  if (view === "subscription")   return <SubscriptionManagement onBack={() => setView("main")} />;

  // ── Permission-filtered menu items ────────────────────────────────────────

  // Content Management group
  const contentItems = [
    { label: "Categories Management",   view: "categories"    as ExtendedView, show: perms.canManageCategories   },
    { label: "FAQ Management",          view: "faq"           as ExtendedView, show: perms.canManageFaq          },
    { label: "Banner Management",       view: "banners"       as ExtendedView, show: perms.canManageAnnouncements},
    { label: "Announcement Management", view: "announcements" as ExtendedView, show: perms.canManageAnnouncements},
  ].filter((i) => i.show);

  // System Settings group
  const systemItems = [
    { label: "Commission Settings",    view: "commission"     as ExtendedView, show: perms.canViewCommission      },
    { label: "Notification Templates", view: "notifications"  as ExtendedView, show: perms.canManageNotifications },
    { label: "Notification Settings",  view: "notif-settings" as ExtendedView, show: perms.canManageNotifications },
  ].filter((i) => i.show);

  // Admin group
  const adminItems = [
    { label: "Admin Management",        view: "admins"        as ExtendedView, show: perms.canViewAdmins          },
    { label: "Subscription Management", view: "subscription"  as ExtendedView, show: perms.canManageSubscription  },
  ].filter((i) => i.show);

  // Hide entire groups that have no visible items
  const showContent = contentItems.length > 0;
  const showSystem  = systemItems.length  > 0;
  const showAdmin   = adminItems.length   > 0;
  const nothingVisible = !showContent && !showSystem && !showAdmin;

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Settings" />

      <main className="flex-1 px-8 py-6 space-y-6">

        {nothingVisible && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-text-main font-medium">No settings available</p>
            <p className="text-sm text-text-muted mt-1">
              Your role does not have access to any settings.
            </p>
          </div>
        )}

        {/* Content Management */}
        {showContent && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">
              Content Management
            </p>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              {contentItems.map((item) => (
                <MenuItem key={item.view} label={item.label} onClick={() => setView(item.view)} />
              ))}
            </div>
          </div>
        )}

        {/* System Settings */}
        {showSystem && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3 mt-4">
              System Settings
            </p>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              {systemItems.map((item) => (
                <MenuItem key={item.view} label={item.label} onClick={() => setView(item.view)} />
              ))}
            </div>
          </div>
        )}

        {/* Admin */}
        {showAdmin && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3 mt-4">
              Admin
            </p>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              {adminItems.map((item) => (
                <MenuItem key={item.view} label={item.label} onClick={() => setView(item.view)} />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  );
}