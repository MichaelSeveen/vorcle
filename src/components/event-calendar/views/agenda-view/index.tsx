import { ScrollShadow } from "@heroui/react";
import { CalendarRemove01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { endOfDay, format, isSameMonth, parseISO, startOfDay } from "date-fns";
import { useMemo } from "react";
import type { Event } from "../../config/types";
import { useCalendar } from "../../context/calendar-context";
import AgendaDayGroup from "./agenda-day-group";

interface Props {
	singleDayEvents: Event[];
	multiDayEvents: Event[];
}

export default function CalendarAgendaView({
	singleDayEvents,
	multiDayEvents,
}: Props) {
	const { selectedDate } = useCalendar();

	const eventsByDay = useMemo(() => {
		const allDates = new Map<
			string,
			{ date: Date; events: Event[]; multiDayEvents: Event[] }
		>();

		if (!selectedDate) return [];

		singleDayEvents.forEach((event) => {
			const eventDate = parseISO(event.startDate);
			if (!isSameMonth(eventDate, selectedDate)) return;

			const dateKey = format(eventDate, "yyyy-MM-dd");

			if (!allDates.has(dateKey)) {
				allDates.set(dateKey, {
					date: startOfDay(eventDate),
					events: [],
					multiDayEvents: [],
				});
			}

			allDates.get(dateKey)?.events.push(event);
		});

		multiDayEvents.forEach((event) => {
			const eventStart = parseISO(event.startDate);
			const eventEnd = parseISO(event.endDate);

			let currentDate = startOfDay(eventStart);
			const lastDate = endOfDay(eventEnd);

			while (currentDate <= lastDate) {
				if (isSameMonth(currentDate, selectedDate)) {
					const dateKey = format(currentDate, "yyyy-MM-dd");

					if (!allDates.has(dateKey)) {
						allDates.set(dateKey, {
							date: new Date(currentDate),
							events: [],
							multiDayEvents: [],
						});
					}

					allDates.get(dateKey)?.multiDayEvents.push(event);
				}
				currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
			}
		});

		return Array.from(allDates.values()).sort(
			(a, b) => a.date.getTime() - b.date.getTime(),
		);
	}, [singleDayEvents, multiDayEvents, selectedDate]);

	const hasAnyEvents = singleDayEvents.length > 0 || multiDayEvents.length > 0;

	return (
		<div className="h-[50rem]">
			<ScrollShadow className="h-full overflow-auto">
				<div className="space-y-6 p-4">
					{eventsByDay.map((dayGroup) => (
						<AgendaDayGroup
							key={format(dayGroup.date, "yyyy-MM-dd")}
							date={dayGroup.date}
							events={dayGroup.events}
							multiDayEvents={dayGroup.multiDayEvents}
						/>
					))}

					{!hasAnyEvents && (
						<div className="flex flex-col items-center justify-center gap-2 py-20 text-foreground">
							<HugeiconsIcon icon={CalendarRemove01Icon} size={48} />
							<p className="text-sm md:text-base">
								No events scheduled for the selected month
							</p>
						</div>
					)}
				</div>
			</ScrollShadow>
		</div>
	);
}
