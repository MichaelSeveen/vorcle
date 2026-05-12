"use client";

import type { Key } from "@heroui/react";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import {
	Calendar02Icon,
	GridTableIcon,
	LayoutTwoColumnIcon,
	LeftToRightListBulletIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CalendarView } from "../config/types";
import { useCalendar } from "../context/calendar-context";

function ViewTabs() {
	const { view, setView } = useCalendar();
	const isMobile = useIsMobile();

	const VIEW_TABS = [
		{
			id: "agenda",
			name: "Agenda",
			icon: Calendar02Icon,
		},
		{
			id: "day",
			name: "Day",
			icon: LeftToRightListBulletIcon,
		},
		{
			id: "week",
			name: "Week",
			icon: LayoutTwoColumnIcon,
		},
		{
			id: "month",
			name: "Month",
			icon: GridTableIcon,
		},
	];

	return (
		<ToggleButtonGroup
			selectionMode="single"
			selectedKeys={new Set([view])}
			onSelectionChange={(keys: Set<Key> | "all") => {
				if (keys === "all") return;
				const selected = [...keys][0];
				if (selected) {
					setView(selected as CalendarView);
				}
			}}
			disallowEmptySelection
		>
			{VIEW_TABS.map((tabView, index) => (
				<ToggleButton
					key={tabView.id}
					id={tabView.id}
					aria-label={`Toggle ${tabView.id} view`}
				>
					{index > 0 && <ToggleButtonGroup.Separator />}
					{!isMobile ? <HugeiconsIcon icon={tabView.icon} size={16} /> : null}
					{tabView.name}
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}

export default memo(ViewTabs);
