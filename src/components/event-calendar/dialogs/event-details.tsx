"use client";

import { format, parseISO } from "date-fns";
import { Text } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "../context/calendar-context";
import { Event } from "../config/types";
import { EventDialog } from "./event-dialog";
import { formatTime } from "../config/utils";
import RemoveEventDialog from "./remove-event";
import {
  DuoCalendarIcon,
  DuoClockIcon,
  DuoUserIcon,
  DuoUsersIcon,
} from "@/components/custom-icons/duotone";
import { Label } from "@/components/ui/label";

interface Props {
  event: Event;
  children: ReactNode;
}

export function EventDetailsDialog({ event, children }: Props) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const { use24HourFormat } = useCalendar();

  const attendees =
    event?.attendees && event.attendees.length > 0
      ? event.attendees.map((attendee) => attendee.name).join(", ")
      : "No attendees";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Details of the calendar event
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[35rem]">
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <DuoUserIcon className="mt-1 size-4 shrink-0" />
              <div>
                <Label>Responsible</Label>
                <p className="text-sm text-muted-foreground">
                  {event.user.name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DuoUsersIcon className="mt-1 size-4 shrink-0" />
              <div>
                <Label>Attendees</Label>
                <p className="text-sm text-muted-foreground">{attendees}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <DuoCalendarIcon className="mt-1 size-4 shrink-0" />
              <div>
                <Label>Start Date</Label>
                <time
                  dateTime={startDate.toISOString()}
                  className="text-sm text-muted-foreground"
                >
                  {format(startDate, "EEEE dd MMMM")}
                  <span className="mx-1">at</span>
                  {formatTime(parseISO(event.startDate), use24HourFormat)}
                </time>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <DuoClockIcon className="mt-1 size-4 shrink-0" />
              <div>
                <Label>End Date</Label>
                <time
                  dateTime={endDate.toISOString()}
                  className="text-sm text-muted-foreground"
                >
                  {format(endDate, "EEEE dd MMMM")}
                  <span className="mx-1">at</span>
                  {formatTime(parseISO(event.endDate), use24HourFormat)}
                </time>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0 text-[#9FA2AB]" />
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <EventDialog event={event}>
            <Button variant="outline">Edit</Button>
          </EventDialog>
          <RemoveEventDialog eventId={event.id} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
