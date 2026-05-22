// app/(dashboard)/layout.tsx
import { SidebarProvider } from "@/context/SidebarContext";
import SidebarWrapper from "@/components/layout/SidebarWrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-background">
        <SidebarWrapper />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}