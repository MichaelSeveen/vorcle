"use client";

import {
	Clock01Icon,
	TextAlignLeftIcon,
	UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { VariantProps } from "class-variance-authority";
import { format, parseISO } from "date-fns";
import type { Event } from "../../config/types";
import { useCalendar } from "../../context/calendar-context";
import { EventDetailsDialog } from "../../dialogs/event-details";
import { agendaEventCardVariants } from "../../variant-utils";

interface Props {
	event: Event;
	eventCurrentDay?: number;
	eventTotalDays?: number;
}

export function AgendaEventCard({
	event,
	eventCurrentDay,
	eventTotalDays,
}: Props) {
	const { badgeVariant } = useCalendar();

	const startDate = parseISO(event.startDate);
	const endDate = parseISO(event.endDate);

	const color = (
		badgeVariant === "dot" ? `${event.color}-dot` : event.color
	) as VariantProps<typeof agendaEventCardVariants>["color"];

	const agendaEventCardClasses = agendaEventCardVariants({ color });

	return (
		<EventDetailsDialog event={event}>
			<div className={agendaEventCardClasses}>
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-1.5">
						{["mixed", "dot"].includes(badgeVariant) && (
							<svg
								width="8"
								height="8"
								viewBox="0 0 8 8"
								className="event-dot shrink-0"
								aria-hidden="true"
							>
								<circle cx="4" cy="4" r="4" />
							</svg>
						)}

						<p className="font-medium">
							{eventCurrentDay && eventTotalDays && (
								<span className="mr-1 text-sm">
									Day {eventCurrentDay} of {eventTotalDays} •{" "}
								</span>
							)}
							{event.title}
						</p>
					</div>

					<div className="mt-1 flex items-center gap-2">
						<HugeiconsIcon icon={UserMultiple02Icon} />
						<p className="text-sm text-foreground">{event.user.name}</p>
					</div>

					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={Clock01Icon} />
						<p className="text-sm text-foreground">
							{format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
						</p>
					</div>

					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={TextAlignLeftIcon} />
						<p className="text-sm text-foreground">{event.description}</p>
					</div>
				</div>
			</div>
		</EventDetailsDialog>
	);
}
