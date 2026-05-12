"use client";

import {
	Calendar03Icon,
	ChartRelationshipIcon,
	ChatBotIcon,
	Home04Icon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VorcleLogo } from "@/components/custom-icons/brand-logo";
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
import { segments } from "@/config/segments";
import DashboardSidebarUsageCard from "./dashboard-sidebar-usage-card";

const DASHBOARD_LINKS = [
	{
		title: "Home",
		url: segments.workspace.home,
		icon: <HugeiconsIcon icon={Home04Icon} />,
	},
	{
		title: "Chat with Vorcle",
		url: segments.workspace.chat,
		icon: <HugeiconsIcon icon={ChatBotIcon} />,
	},
	{
		title: "Integrations",
		url: segments.workspace.integrations,
		icon: <HugeiconsIcon icon={ChartRelationshipIcon} />,
	},
	{
		title: "Calendar",
		url: segments.workspace.calendar,
		icon: <HugeiconsIcon icon={Calendar03Icon} />,
	},
	{
		title: "Settings",
		url: segments.workspace.settings,
		icon: <HugeiconsIcon icon={Settings01Icon} />,
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
						<SidebarMenuButton size="lg" asChild className="bg-muted/20">
							<a href={segments.workspace.home}>
								<div className="flex aspect-square size-8 items-center justify-center">
									<VorcleLogo className="size-8" />
								</div>
								<span className="text-xl font-semibold">Vorcle</span>
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
												{item.icon}
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
				<DashboardSidebarUsageCard />
			</SidebarFooter>
		</Sidebar>
	);
}
