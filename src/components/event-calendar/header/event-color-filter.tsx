"use client";

import { Button, Dropdown, Separator } from "@heroui/react";
import {
	CheckmarkCircle02Icon,
	Eraser01Icon,
	FilterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EVENT_COLORS, type EventColor } from "../config/types";
import { useCalendar } from "../context/calendar-context";

export default function EventsColorFilter() {
	const { selectedColors, filterEventsBySelectedColors, clearFilter } =
		useCalendar();

	return (
		<Dropdown>
			<Button
				isIconOnly
				variant="outline"
				aria-label="Filter by color"
				className="shrink-0"
			>
				<HugeiconsIcon icon={FilterIcon} />
			</Button>
			<Dropdown.Popover className="w-[150px]" placement="bottom end">
				<Dropdown.Menu
					onAction={(key) => {
						if (key === "clear-filter") {
							clearFilter();
							return;
						}

						const color = String(key) as EventColor;

						if (EVENT_COLORS.includes(color)) {
							filterEventsBySelectedColors(color);
						}
					}}
				>
					<Dropdown.Section>
						{EVENT_COLORS.map((color) => (
							<Dropdown.Item key={color} id={color} textValue={color}>
								<div className="flex items-center gap-1.5">
									<span
										className={`size-3.5 rounded-full bg-${color}-600 dark:bg-${color}-700`}
									/>
									<span className="capitalize">{color}</span>
								</div>
								{selectedColors.includes(color) && (
									<HugeiconsIcon
										icon={CheckmarkCircle02Icon}
										className="ml-auto"
									/>
								)}
							</Dropdown.Item>
						))}
					</Dropdown.Section>
					<Separator />
					<Dropdown.Item
						id="clear-filter"
						textValue="Clear Filter"
						isDisabled={selectedColors.length === 0}
					>
						<HugeiconsIcon icon={Eraser01Icon} className="text-danger" />
						Clear Filter
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
