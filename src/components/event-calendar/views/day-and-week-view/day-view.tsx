import { useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock, User } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "../../context/calendar-context";
import { EventDialog } from "../../dialogs/event-dialog";
import { DroppableArea } from "../../drag-and-drop-utils/droppable-area";
import { getCurrentEvents, groupEvents } from "../../config/utils";
import { Event } from "../../config/types";
import DayViewMultiDayEventsRow from "./day-view-multi-day-events";
import RenderGroupedEvents from "./render-grouped-events";
import ViewTimeline from "./view-timeline";

interface Props {
  singleDayEvents: Event[];
  multiDayEvents: Event[];
}

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

      const scrollContainer =
        scrollArea.querySelector("[data-radix-scroll-area-viewport]") ||
        scrollArea;

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
      <div className="flex flex-1 flex-col">
        <div>
          <DayViewMultiDayEventsRow
            selectedDate={selectedDate}
            multiDayEvents={multiDayEvents}
          />

          {/* Day header */}
          <div className="relative z-20 flex border-b">
            <div className="w-18" />
            <span className="flex-1 border-l py-2 text-center text-xs font-medium text-muted-foreground">
              {format(selectedDate, "EE")}{" "}
              <span className="font-semibold text-foreground">
                {format(selectedDate, "d")}
              </span>
            </span>
          </div>
        </div>

        <ScrollArea className="h-[800px]" type="always" ref={scrollAreaRef}>
          <div className="flex">
            {/* Hours column */}
            <div className="relative w-18">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: "96px" }}>
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date().setHours(hour, 0, 0, 0),
                          use24HourFormat ? "HH:00" : "hh a"
                        )}
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
        </ScrollArea>
      </div>

      <div className="hidden w-72 divide-y border-l md:block">
        <Calendar
          className="mx-auto w-fit"
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          autoFocus
        />

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
            <p className="p-4 text-center text-sm italic text-muted-foreground">
              No appointments or consultations at the moment
            </p>
          )}

          {currentEvents.length > 0 && (
            <ScrollArea className="h-[422px] px-4" type="always">
              <div className="space-y-6 pb-4">
                {currentEvents.map((event) => {
                  const user = users.find((user) => user.id === event.user.id);

                  return (
                    <div key={event.id} className="space-y-1.5">
                      <p className="line-clamp-2 text-sm font-semibold">
                        {event.title}
                      </p>

                      {user && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="size-3.5" />
                          <span className="text-sm">{user.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarIcon className="size-3.5" />
                        <span className="text-sm">
                          {format(new Date(event.startDate), "MMM d, yyyy")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span className="text-sm">
                          {format(
                            parseISO(event.startDate),
                            use24HourFormat ? "HH:mm" : "h:mm a"
                          )}{" "}
                          -
                          {format(
                            parseISO(event.endDate),
                            use24HourFormat ? "HH:mm" : "h:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
