import { Separator } from "@heroui/react";
import type { PropsWithChildren } from "react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardBreadcrumbs } from "./_components/dashboard-breadcrumbs";
import DashboardSidebar from "./_components/dashboard-sidebar";
import UserProfileDropdown from "./_components/user-profile-menu";
import { TokenUsageProvider } from "./_context";
import { EventRemindersProvider } from "./_context/event-reminders-provider";

export default function AdminDashboardLayout({
	children,
}: Readonly<PropsWithChildren>) {
	return (
		<TokenUsageProvider>
			<EventRemindersProvider>
				<SidebarProvider>
					<DashboardSidebar variant="inset" />
					<SidebarInset>
						<header className="flex h-16 shrink-0 items-center gap-2">
							<div className="flex items-center gap-2 px-4">
								<SidebarTrigger className="-ml-1" />
								<Separator orientation="vertical" className="mr-2 h-4" />
								<DashboardBreadcrumbs />
							</div>
							<div className="ml-auto mr-4 flex items-center gap-1">
								<ThemeSwitcher />
								<UserProfileDropdown />
							</div>
						</header>
						<main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
							{children}
						</main>
					</SidebarInset>
				</SidebarProvider>
			</EventRemindersProvider>
		</TokenUsageProvider>
	);
}
