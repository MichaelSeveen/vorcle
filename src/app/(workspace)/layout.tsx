import type { PropsWithChildren } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import DashboardSidebar from "./_components/dashboard-sidebar";
import { DashboardBreadcrumbs } from "./_components/dashboard-breadcrumbs";
import { TokenUsageProvider } from "./_context";
import UserProfileDropdown from "./_components/user-profile-menu";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export default function AdminDashboardLayout({
  children,
}: Readonly<PropsWithChildren>) {
  return (
    <TokenUsageProvider>
      <SidebarProvider>
        <DashboardSidebar variant="inset" />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DashboardBreadcrumbs />
            </div>
            <div className="ml-auto mr-4 flex items-center gap-1">
              <ThemeSwitcher />
              <UserProfileDropdown />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TokenUsageProvider>
  );
}
