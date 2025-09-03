"use client";

import { Command } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { segments } from "@/config/segments";
import {
  ChatMessageIcon,
  HomeIcon,
  IntegrationsIcon,
  PricingIcon,
  SettingsIcon,
} from "@/components/custom-icons";
import DashboardSidebarUsageCard from "./dashboard-sidebar-usage-card";

const DASHBOARD_LINKS = [
  {
    title: "Home",
    url: segments.workspace.home,
    icon: HomeIcon,
  },
  {
    title: "Chat with AI",
    url: segments.workspace.chat,
    icon: ChatMessageIcon,
  },
  {
    title: "Integrations",
    url: segments.workspace.integrations,
    icon: IntegrationsIcon,
  },
  {
    title: "Pricing",
    url: segments.workspace.pricing,
    icon: PricingIcon,
  },
  {
    title: "Settings",
    url: segments.workspace.settings,
    icon: SettingsIcon,
  },
];

export default function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Vorcle Bot</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {DASHBOARD_LINKS.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-1">
          <DashboardSidebarUsageCard />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
