"use client";

import { Button, Chip } from "@heroui/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDate } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { buttonHover, transition } from "../config/animation-utils";
import type { CalendarView, Event } from "../config/types";
import { getEventsCount, navigateDate, rangeText } from "../config/utils";
import { useCalendar } from "../context/calendar-context";

interface Props {
	view: CalendarView;
	events: Event[];
}

export default function DateNavigator({ view, events }: Props) {
	const { selectedDate, setSelectedDate } = useCalendar();

	const eventCount = useMemo(() => {
		if (!selectedDate) return 0;
		return getEventsCount(events, selectedDate, view);
	}, [events, selectedDate, view]);

	const month = selectedDate ? formatDate(selectedDate, "MMMM") : "";
	const year = selectedDate ? selectedDate.getFullYear() : "";
	const range = selectedDate ? rangeText(view, selectedDate) : "";

	const handlePrevious = () => {
		if (!selectedDate) return;
		setSelectedDate(navigateDate(selectedDate, view, "previous"));
	};

	const handleNext = () => {
		if (!selectedDate) return;
		setSelectedDate(navigateDate(selectedDate, view, "next"));
	};

	return (
		<div className="space-y-0.5">
			<div className="flex items-center gap-2">
				<motion.span
					className="text-lg font-semibold"
					initial={{ x: -20, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={transition}
				>
					{month} {year}
				</motion.span>
				<AnimatePresence mode="wait">
					<motion.div
						key={eventCount}
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.8, opacity: 0 }}
						transition={transition}
					>
						<Chip size="sm" variant="secondary">
							{eventCount} events
						</Chip>
					</motion.div>
				</AnimatePresence>
			</div>

			<div className="flex items-center gap-2">
				<motion.div variants={buttonHover} whileHover="hover" whileTap="tap">
					<Button
						isIconOnly
						variant="outline"
						size="sm"
						className="size-6"
						onPress={handlePrevious}
						aria-label="Previous"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} />
					</Button>
				</motion.div>

				<motion.p
					className="text-sm text-foreground font-medium"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={transition}
				>
					{range}
				</motion.p>

				<motion.div variants={buttonHover} whileHover="hover" whileTap="tap">
					<Button
						isIconOnly
						variant="outline"
						size="sm"
						className="size-6"
						onPress={handleNext}
						aria-label="Next"
					>
						<HugeiconsIcon icon={ArrowRight01Icon} />
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
