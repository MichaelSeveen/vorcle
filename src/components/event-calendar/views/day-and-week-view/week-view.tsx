import * as motion from "motion/react-client";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fadeIn,
  staggerContainer,
  transition,
} from "../../config/animation-utils";
import { useCalendar } from "../../context/calendar-context";
import { EventDialog } from "../../dialogs/event-dialog";
import { DroppableArea } from "../../drag-and-drop-utils/droppable-area";
import { groupEvents } from "../../config/utils";
import { Event } from "../../config/types";
import WeekViewMultiDayEventsRow from "./week-view-multi-day-events";
import RenderGroupedEvents from "./render-grouped-events";
import ViewTimeline from "./view-timeline";

interface Props {
  singleDayEvents: Event[];
  multiDayEvents: Event[];
}

export default function CalendarWeekView({
  singleDayEvents,
  multiDayEvents,
}: Props) {
  const { selectedDate, use24HourFormat } = useCalendar();

  const weekStart = startOfWeek(selectedDate || new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      transition={transition}
    >
      <motion.div
        className="flex flex-col items-center justify-center p-4 text-sm sm:hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <p className="text-pretty">
          Weekly view is not recommended on smaller devices. Please switch to a
          desktop device or use the daily view instead.
        </p>
      </motion.div>

      <motion.div
        className="hidden sm:flex flex-col"
        variants={staggerContainer}
      >
        <div>
          <WeekViewMultiDayEventsRow
            selectedDate={selectedDate || new Date()}
            multiDayEvents={multiDayEvents}
          />

          <motion.div
            className="relative z-20 flex border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
          >
            <div className="w-18" />
            <div className="grid flex-1 grid-cols-7 divide-x border-l">
              {weekDays.map((day, index) => (
                <motion.span
                  key={index}
                  className="py-1 sm:py-2 text-center text-xs font-medium text-muted-foreground"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, ...transition }}
                >
                  <span className="block sm:hidden">
                    {format(day, "EEE").charAt(0)}
                    <span className="block font-semibold text-xs text-foreground">
                      {format(day, "d")}
                    </span>
                  </span>

                  <span className="hidden sm:inline">
                    {format(day, "EE")}{" "}
                    <span className="ml-1 font-semibold text-foreground">
                      {format(day, "d")}
                    </span>
                  </span>
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        <ScrollArea className="h-[736px]" type="always">
          <div className="flex">
            {/* Hours column */}
            <motion.div className="relative w-18" variants={staggerContainer}>
              {hours.map((hour, index) => (
                <motion.div
                  key={hour}
                  className="relative"
                  style={{ height: "96px" }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02, ...transition }}
                >
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
                </motion.div>
              ))}
            </motion.div>

            {/* Week grid */}
            <motion.div
              className="relative flex-1 border-l"
              variants={staggerContainer}
            >
              <div className="grid grid-cols-7 divide-x">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = singleDayEvents.filter(
                    (event) =>
                      isSameDay(parseISO(event.startDate), day) ||
                      isSameDay(parseISO(event.endDate), day)
                  );
                  const groupedEvents = groupEvents(dayEvents);

                  return (
                    <motion.div
                      key={dayIndex}
                      className="relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: dayIndex * 0.1, ...transition }}
                    >
                      {hours.map((hour, index) => (
                        <motion.div
                          key={hour}
                          className="relative"
                          style={{ height: "96px" }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.01, ...transition }}
                        >
                          {index !== 0 && (
                            <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>
                          )}

                          <DroppableArea date={day} hour={hour} minute={0}>
                            <EventDialog
                              startDate={day}
                              startTime={{ hour, minute: 0 }}
                            >
                              <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                            </EventDialog>
                          </DroppableArea>

                          <DroppableArea date={day} hour={hour} minute={15}>
                            <EventDialog
                              startDate={day}
                              startTime={{ hour, minute: 15 }}
                            >
                              <div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                            </EventDialog>
                          </DroppableArea>

                          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>

                          <DroppableArea date={day} hour={hour} minute={30}>
                            <EventDialog
                              startDate={day}
                              startTime={{ hour, minute: 30 }}
                            >
                              <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                            </EventDialog>
                          </DroppableArea>

                          <DroppableArea date={day} hour={hour} minute={45}>
                            <EventDialog
                              startDate={day}
                              startTime={{ hour, minute: 45 }}
                            >
                              <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                            </EventDialog>
                          </DroppableArea>
                        </motion.div>
                      ))}

                      <RenderGroupedEvents
                        groupedEvents={groupedEvents}
                        day={day}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <ViewTimeline />
            </motion.div>
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
}
