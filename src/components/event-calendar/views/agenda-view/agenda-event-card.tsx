"use client";

import { format, parseISO } from "date-fns";
import { Text } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { useCalendar } from "../../context/calendar-context";

import { EventDetailsDialog } from "../../dialogs/event-details";
import { agendaEventCardVariants } from "../../variant-utils";
import { Event } from "../../config/types";
import { DuoClockIcon, DuoUserIcon } from "@/components/custom-icons/duotone";

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <EventDetailsDialog event={event}>
      <div
        role="button"
        tabIndex={0}
        className={agendaEventCardClasses}
        onKeyDown={handleKeyDown}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            {["mixed", "dot"].includes(badgeVariant) && (
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                className="event-dot shrink-0"
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

          <div className="mt-1 flex items-center gap-1">
            <DuoUserIcon className="size-4 shrink-0" />
            <p className="text-sm text-foreground">{event.user.name}</p>
          </div>

          <div className="flex items-center gap-1">
            <DuoClockIcon className="size-4 shrink-0" />
            <p className="text-sm text-foreground">
              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Text className="size-4 shrink-0 text-[#9FA2AB]" />
            <p className="text-sm text-foreground">{event.description}</p>
          </div>
        </div>
      </div>
    </EventDetailsDialog>
  );
}
