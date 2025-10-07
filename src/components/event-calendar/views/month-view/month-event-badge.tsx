import { endOfDay, isSameDay, parseISO, startOfDay } from "date-fns";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useCalendar } from "../../context/calendar-context";
import { EventDetailsDialog } from "../../dialogs/event-details";
import { DraggableEvent } from "../../drag-and-drop-utils/draggable-event";
import { formatTime } from "../../config/utils";
import { Event } from "../../config/types";
import { EventBullet } from "../../helpers/event-bullet";
import { eventBadgeVariants } from "../../variant-utils";

interface Props
  extends Omit<
    VariantProps<typeof eventBadgeVariants>,
    "color" | "multiDayPosition"
  > {
  event: Event;
  cellDate: Date;
  eventCurrentDay?: number;
  eventTotalDays?: number;
  className?: string;
  position?: "first" | "middle" | "last" | "none";
}

export default function MonthEventBadge({
  event,
  cellDate,
  eventCurrentDay,
  eventTotalDays,
  className,
  position: propPosition,
}: Props) {
  const { badgeVariant, use24HourFormat } = useCalendar();

  const itemStart = startOfDay(parseISO(event.startDate));
  const itemEnd = endOfDay(parseISO(event.endDate));

  if (cellDate < itemStart || cellDate > itemEnd) return null;

  let position: "first" | "middle" | "last" | "none" | undefined;

  if (propPosition) {
    position = propPosition;
  } else if (eventCurrentDay && eventTotalDays) {
    position = "none";
  } else if (isSameDay(itemStart, itemEnd)) {
    position = "none";
  } else if (isSameDay(cellDate, itemStart)) {
    position = "first";
  } else if (isSameDay(cellDate, itemEnd)) {
    position = "last";
  } else {
    position = "middle";
  }

  const renderBadgeText = ["first", "none"].includes(position);
  const renderBadgeTime = ["last", "none"].includes(position);

  const color = (
    badgeVariant === "dot" ? `${event.color}-dot` : event.color
  ) as VariantProps<typeof eventBadgeVariants>["color"];

  const eventBadgeClasses = cn(
    eventBadgeVariants({ color, multiDayPosition: position, className })
  );

  return (
    <DraggableEvent event={event}>
      <EventDetailsDialog event={event}>
        <div role="button" tabIndex={0} className={eventBadgeClasses}>
          <div className="flex items-center gap-1.5 truncate">
            {!["middle", "last"].includes(position) &&
              badgeVariant === "dot" && <EventBullet color={event.color} />}

            {renderBadgeText && (
              <p className="flex-1 truncate font-semibold">
                {eventCurrentDay && (
                  <span className="text-xs">
                    Day {eventCurrentDay} of {eventTotalDays} •{" "}
                  </span>
                )}
                {event.title}
              </p>
            )}
          </div>

          <div className="hidden sm:block">
            {renderBadgeTime && (
              <span>
                {formatTime(new Date(event.startDate), use24HourFormat)}
              </span>
            )}
          </div>
        </div>
      </EventDetailsDialog>
    </DraggableEvent>
  );
}
