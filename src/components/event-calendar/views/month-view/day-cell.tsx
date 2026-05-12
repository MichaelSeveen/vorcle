"use client";

import { Button } from "@heroui/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { isSameMonth, isSunday, isToday, startOfDay } from "date-fns";
import { motion } from "motion/react";
import { useCallback, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { transition } from "../../config/animation-utils";
import type { CalendarCell, Event } from "../../config/types";
import { getMonthCellEvents } from "../../config/utils";
import { EventDialog } from "../../dialogs/event-dialog";
import { EventListDialog } from "../../dialogs/event-list";
import { DroppableArea } from "../../drag-and-drop-utils/droppable-area";
import { EventBullet } from "../../helpers/event-bullet";
import MonthEventBadge from "./month-event-badge";

interface Props {
	cell: CalendarCell;
	events: Event[];
	eventPositions: Record<string, number>;
}

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({ cell, events, eventPositions }: Props) {
	const { day, currentMonth, date } = cell;
	const isMobile = useIsMobile();

	const { cellEvents, currentCellMonth } = useMemo(() => {
		const cellEvents = getMonthCellEvents(date, events, eventPositions);
		const currentCellMonth = startOfDay(
			new Date(date.getFullYear(), date.getMonth(), 1),
		);
		return { cellEvents, currentCellMonth };
	}, [date, events, eventPositions]);

	const renderEventAtPosition = useCallback(
		(position: number) => {
			const event = cellEvents.find((e) => e.position === position);
			if (!event) {
				return (
					<motion.div
						key={`empty-${position}`}
						className="lg:flex-1"
						initial={false}
						animate={false}
					/>
				);
			}
			const showBullet = isSameMonth(
				new Date(event.startDate),
				currentCellMonth,
			);

			return (
				<motion.div
					key={`event-${event.id}-${position}`}
					className="lg:flex-1"
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: position * 0.1, ...transition }}
				>
					{showBullet && (
						<EventBullet className="lg:hidden" color={event.color} />
					)}
					<MonthEventBadge
						className="hidden lg:flex"
						event={event}
						cellDate={startOfDay(date)}
					/>
				</motion.div>
			);
		},
		[cellEvents, currentCellMonth, date],
	);

	const showMoreCount = cellEvents.length - MAX_VISIBLE_EVENTS;

	const showMobileMore = isMobile && currentMonth && showMoreCount > 0;
	const showDesktopMore = !isMobile && currentMonth && showMoreCount > 0;

	const cellContent = useMemo(
		() => (
			<motion.div
				className={cn(
					"flex h-[4.5rem] lg:min-h-[10rem] flex-col gap-1 border-l border-t py-1.5",
					isSunday(date) && "border-l-0",
				)}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={transition}
			>
				<DroppableArea date={date}>
					<motion.span
						className={cn(
							"h-6 px-1 text-xs font-semibold lg:px-2",
							!currentMonth && "opacity-20",
							isToday(date) &&
								"flex w-6 translate-x-1 items-center justify-center rounded-full bg-primary px-0 font-bold text-foreground",
						)}
					>
						{day}
					</motion.span>

					<motion.div
						className={cn(
							"flex h-fit gap-1 px-2 mt-1 lg:h-[94px] lg:flex-col lg:gap-2 lg:px-0",
							!currentMonth && "opacity-50",
						)}
					>
						{cellEvents.length === 0 && !isMobile ? (
							<div className="w-full h-full flex justify-center items-center group">
								<EventDialog startDate={date}>
									<Button
										variant="ghost"
										className="border opacity-0 group-hover:opacity-100 transition-opacity duration-200"
									>
										<HugeiconsIcon icon={Add01Icon} size={16} />
										<span className="max-sm:hidden">Add Event</span>
									</Button>
								</EventDialog>
							</div>
						) : (
							[0, 1, 2].map(renderEventAtPosition)
						)}
					</motion.div>

					{showMobileMore && (
						<div className="flex justify-end items-end mx-2">
							<span className="text-[0.6rem] font-semibold text-accent-foreground">
								+{showMoreCount}
							</span>
						</div>
					)}

					{showDesktopMore && (
						<motion.div
							className={cn(
								"h-4.5 px-1.5 my-2 text-end text-xs font-semibold text-foreground",
								!currentMonth && "opacity-50",
							)}
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, ...transition }}
						>
							<EventListDialog date={date} events={cellEvents} />
						</motion.div>
					)}
				</DroppableArea>
			</motion.div>
		),
		[
			date,
			day,
			currentMonth,
			cellEvents,
			showMobileMore,
			showDesktopMore,
			showMoreCount,
			renderEventAtPosition,
			isMobile,
		],
	);

	if (isMobile && currentMonth) {
		return (
			<EventListDialog date={date} events={cellEvents}>
				{cellContent}
			</EventListDialog>
		);
	}

	return cellContent;
}
