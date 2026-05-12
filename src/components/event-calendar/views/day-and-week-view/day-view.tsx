import { Calendar, ScrollShadow } from "@heroui/react";
import {
	Calendar03Icon,
	Clock01Icon,
	User03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarDate } from "@internationalized/date";
import { format, parseISO } from "date-fns";
import { type ComponentProps, useEffect, useRef } from "react";
import type { Event } from "../../config/types";
import {
	formatHourLabel,
	getCurrentEvents,
	groupEvents,
} from "../../config/utils";
import { useCalendar } from "../../context/calendar-context";
import { EventDialog } from "../../dialogs/event-dialog";
import { DroppableArea } from "../../drag-and-drop-utils/droppable-area";
import DayViewMultiDayEventsRow from "./day-view-multi-day-events";
import RenderGroupedEvents from "./render-grouped-events";
import ViewTimeline from "./view-timeline";

interface Props {
	singleDayEvents: Event[];
	multiDayEvents: Event[];
}

type HeroCalendarValue = ComponentProps<typeof Calendar>["value"];

export default function CalendarDayView({
	singleDayEvents,
	multiDayEvents,
}: Props) {
	const { selectedDate, setSelectedDate, users, use24HourFormat } =
		useCalendar();
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const hours = Array.from({ length: 24 }, (_, i) => i);

	useEffect(() => {
		const handleDragOver = (e: DragEvent) => {
			if (!scrollAreaRef.current) return;

			const scrollArea = scrollAreaRef.current;
			const rect = scrollArea.getBoundingClientRect();
			const scrollSpeed = 15;

			const scrollContainer = scrollArea;

			if (e.clientY < rect.top + 60) {
				scrollContainer.scrollTop -= scrollSpeed;
			}

			if (e.clientY > rect.bottom - 60) {
				scrollContainer.scrollTop += scrollSpeed;
			}
		};

		document.addEventListener("dragover", handleDragOver);
		return () => {
			document.removeEventListener("dragover", handleDragOver);
		};
	}, []);

	const currentEvents = getCurrentEvents(singleDayEvents);

	if (!selectedDate) return null;

	const dayEvents = singleDayEvents.filter((event) => {
		const eventDate = parseISO(event.startDate);
		return (
			eventDate.getDate() === selectedDate.getDate() &&
			eventDate.getMonth() === selectedDate.getMonth() &&
			eventDate.getFullYear() === selectedDate.getFullYear()
		);
	});

	const groupedEvents = groupEvents(dayEvents);

	return (
		<div className="flex overflow-hidden h-full">
			<div className="flex min-w-0 flex-1 flex-col">
				<div>
					<DayViewMultiDayEventsRow
						selectedDate={selectedDate}
						multiDayEvents={multiDayEvents}
					/>

					{/* Day header */}
					<div className="relative z-20 flex border-b">
						<div className="w-18" />
						<span className="flex-1 border-l py-2 text-center text-xs font-medium text-foreground">
							{format(selectedDate, "EE")}{" "}
							<span className="font-semibold text-foreground">
								{format(selectedDate, "d")}
							</span>
						</span>
					</div>
				</div>

				<ScrollShadow className="h-[800px] overflow-auto" ref={scrollAreaRef}>
					<div className="flex">
						{/* Hours column */}
						<div className="relative w-18">
							{hours.map((hour, index) => (
								<div key={hour} className="relative" style={{ height: "96px" }}>
									<div className="absolute -top-3 right-2 flex h-6 items-center">
										{index !== 0 && (
											<span className="text-xs text-foreground">
												{formatHourLabel(hour, use24HourFormat)}
											</span>
										)}
									</div>
								</div>
							))}
						</div>

						{/* Day grid */}
						<div className="relative flex-1 border-l">
							<div className="relative">
								{hours.map((hour, index) => (
									<div
										key={hour}
										className="relative"
										style={{ height: "96px" }}
									>
										{index !== 0 && (
											<div className="pointer-events-none absolute inset-x-0 top-0 border-b" />
										)}

										<DroppableArea date={selectedDate} hour={hour} minute={0}>
											<EventDialog
												startDate={selectedDate}
												startTime={{ hour, minute: 0 }}
											>
												<div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
											</EventDialog>
										</DroppableArea>

										<DroppableArea date={selectedDate} hour={hour} minute={15}>
											<EventDialog
												startDate={selectedDate}
												startTime={{ hour, minute: 15 }}
											>
												<div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
											</EventDialog>
										</DroppableArea>

										<div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>

										<DroppableArea date={selectedDate} hour={hour} minute={30}>
											<EventDialog
												startDate={selectedDate}
												startTime={{ hour, minute: 30 }}
											>
												<div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
											</EventDialog>
										</DroppableArea>

										<DroppableArea date={selectedDate} hour={hour} minute={45}>
											<EventDialog
												startDate={selectedDate}
												startTime={{ hour, minute: 45 }}
											>
												<div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
											</EventDialog>
										</DroppableArea>
									</div>
								))}

								<RenderGroupedEvents
									groupedEvents={groupedEvents}
									day={selectedDate}
								/>
							</div>

							<ViewTimeline />
						</div>
					</div>
				</ScrollShadow>
			</div>

			<div className="hidden w-72 shrink-0 divide-y border-l md:block">
				<Calendar
					aria-label="Select a date"
					className="mx-auto w-63 p-3"
					value={
						new CalendarDate(
							selectedDate.getFullYear(),
							selectedDate.getMonth() + 1,
							selectedDate.getDate(),
						) as unknown as HeroCalendarValue
					}
					onChange={(date) => {
						if (date) {
							setSelectedDate(new Date(date.year, date.month - 1, date.day));
						}
					}}
				>
					<Calendar.Header className="pb-4">
						<Calendar.NavButton
							className="text-foreground"
							slot="previous"
						/>
						<Calendar.Heading className="text-center font-semibold text-foreground" />
						<Calendar.NavButton className="text-foreground" slot="next" />
					</Calendar.Header>
					<Calendar.Grid>
						<Calendar.GridHeader>
							{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
						</Calendar.GridHeader>
						<Calendar.GridBody>
							{(date) => <Calendar.Cell date={date} />}
						</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar>

				<div className="flex-1 space-y-3">
					{currentEvents.length > 0 ? (
						<div className="flex items-start gap-2 px-4 pt-4">
							<span className="relative mt-[5px] flex size-2.5">
								<span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
								<span className="relative inline-flex size-2.5 rounded-full bg-green-600" />
							</span>

							<p className="text-sm font-semibold text-foreground">
								Happening now
							</p>
						</div>
					) : (
						<p className="p-4 text-center text-sm italic text-foreground">
							No appointments or consultations at the moment
						</p>
					)}

					{currentEvents.length > 0 && (
						<ScrollShadow className="h-[422px] px-4 overflow-auto">
							<div className="space-y-6 pb-4">
								{currentEvents.map((event) => {
									const user = users.find((user) => user.id === event.user.id);

									return (
										<div key={event.id} className="space-y-1.5">
											<p className="line-clamp-2 text-sm font-semibold">
												{event.title}
											</p>

											{user && (
												<div className="flex items-center gap-1.5 text-foreground">
													<HugeiconsIcon icon={User03Icon} size={16} />
													<span className="text-sm">{user.name}</span>
												</div>
											)}

											<div className="flex items-center gap-1.5 text-foreground">
												<HugeiconsIcon icon={Calendar03Icon} size={16} />
												<span className="text-sm">
													{format(new Date(event.startDate), "MMM d, yyyy")}
												</span>
											</div>

											<div className="flex items-center gap-1.5 text-foreground">
												<HugeiconsIcon icon={Clock01Icon} size={16} />
												<span className="text-sm">
													{format(
														parseISO(event.startDate),
														use24HourFormat ? "HH:mm" : "h:mm a",
													)}{" "}
													-
													{format(
														parseISO(event.endDate),
														use24HourFormat ? "HH:mm" : "h:mm a",
													)}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</ScrollShadow>
					)}
				</div>
			</div>
		</div>
	);
}
