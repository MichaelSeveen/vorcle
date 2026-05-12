"use client";

import { Button } from "@heroui/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	slideFromLeft,
	slideFromRight,
	transition,
} from "../config/animation-utils";
import { useCalendar } from "../context/calendar-context";
import { EventDialog } from "../dialogs/event-dialog";
import CurrentDayButton from "./current-day-button";
import DateNavigator from "./date-navigator";
import EventColorFilter from "./event-color-filter";
import { Settings } from "./settings";
import UsersMenu from "./users-menu";
import ViewTabs from "./view-tabs";

export default function CalendarHeader() {
	const { view, filteredEvents } = useCalendar();
	const isMobile = useIsMobile();

	return (
		<div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
			<motion.div
				className="flex items-center gap-3"
				variants={slideFromLeft}
				initial="initial"
				animate="animate"
				transition={transition}
			>
				<CurrentDayButton />
				<DateNavigator view={view} events={filteredEvents} />
			</motion.div>

			<motion.div
				className="flex flex-col gap-2 lg:flex-row lg:items-center"
				variants={slideFromRight}
				initial="initial"
				animate="animate"
				transition={transition}
			>
				{!isMobile ? <EventColorFilter /> : null}
				<ViewTabs />

				<UsersMenu />

				<EventDialog>
					<Button>
						{!isMobile ? <HugeiconsIcon icon={Add01Icon} /> : null}
						Add Event
					</Button>
				</EventDialog>

				<Settings />
			</motion.div>
		</div>
	);
}
