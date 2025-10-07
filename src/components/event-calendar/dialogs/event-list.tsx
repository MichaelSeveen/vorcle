import { format } from "date-fns";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "../context/calendar-context";
import { formatTime } from "../config/utils";
import { Event } from "../config/types";

import { EventDetailsDialog } from "./event-details";
import { EventBullet } from "../helpers/event-bullet";
import { dayCellVariants } from "../variant-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EventListDialogProps {
  date: Date;
  events: Event[];
  maxVisibleEvents?: number;
  children?: ReactNode;
}

export function EventListDialog({
  date,
  events,
  maxVisibleEvents = 3,
  children,
}: EventListDialogProps) {
  const cellEvents = events;
  const hiddenEventsCount = Math.max(cellEvents.length - maxVisibleEvents, 0);
  const { badgeVariant, use24HourFormat } = useCalendar();

  const defaultTrigger = (
    <span className="cursor-pointer">
      <span className="sm:hidden">+{hiddenEventsCount}</span>
      <span className="hidden sm:inline py-0.5 px-2 my-1 rounded-xl border">
        {hiddenEventsCount}
        <span className="mx-1">more...</span>
      </span>
    </span>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{children || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <EventBullet color={cellEvents[0]?.color} />
            Events on {format(date, "EEEE, MMM d, yyyy")}
          </DialogTitle>
          <DialogDescription>
            You have {cellEvents.length} events on this date.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[35rem]">
          {cellEvents.length > 0 ? (
            cellEvents.map((event) => (
              <EventDetailsDialog event={event} key={event.id}>
                <div
                  className={cn("mb-2", {
                    [dayCellVariants({ color: event.color })]:
                      badgeVariant === "colored",
                  })}
                >
                  <div className="flex justify-between items-center w-full">
                    <p className="text-sm font-medium">{event.title}</p>
                    <time dateTime={event.startDate} className="text-xs">
                      {formatTime(event.startDate, use24HourFormat)}
                    </time>
                  </div>
                </div>
              </EventDetailsDialog>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No events for this date.
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
