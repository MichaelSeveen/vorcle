import type { HTMLAttributes } from "react";
import { differenceInMinutes, parseISO } from "date-fns";

import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useCalendar } from "../../context/calendar-context";
import { EventDetailsDialog } from "../../dialogs/event-details";
import { DraggableEvent } from "../../drag-and-drop-utils/draggable-event";
import { ResizableEvent } from "../../drag-and-drop-utils/resizable-event";
import { formatTime } from "../../config/utils";
import { Event } from "../../config/types";
import { weekEventCardVariants } from "../../variant-utils";

interface Props
  extends HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof weekEventCardVariants>, "color"> {
  event: Event;
}

export default function EventBlock({ event, className }: Props) {
  const { badgeVariant, use24HourFormat } = useCalendar();

  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);
  const durationInMinutes = differenceInMinutes(end, start);
  const heightInPixels = (durationInMinutes / 60) * 96 - 8;

  const color = (
    badgeVariant === "dot" ? `${event.color}-dot` : event.color
  ) as VariantProps<typeof weekEventCardVariants>["color"];

  const weekEventCardClasses = cn(
    weekEventCardVariants({ color, className }),
    durationInMinutes < 35 && "py-0 justify-center"
  );

  return (
    <ResizableEvent event={event}>
      <DraggableEvent event={event}>
        <EventDetailsDialog event={event}>
          <div
            role="button"
            tabIndex={0}
            className={weekEventCardClasses}
            style={{ height: `${heightInPixels}px` }}
          >
            <div className="flex items-center gap-1.5 truncate">
              {badgeVariant === "dot" && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  className="shrink-0"
                >
                  <circle cx="4" cy="4" r="4" />
                </svg>
              )}

              <p className="truncate font-semibold">{event.title}</p>
            </div>

            {durationInMinutes > 25 && (
              <p>
                {formatTime(start, use24HourFormat)} -{" "}
                {formatTime(end, use24HourFormat)}
              </p>
            )}
          </div>
        </EventDetailsDialog>
      </DraggableEvent>
    </ResizableEvent>
  );
}
