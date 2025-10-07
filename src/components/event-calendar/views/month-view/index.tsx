import * as motion from "motion/react-client";
import { useMemo } from "react";
import { staggerContainer, transition } from "../../config/animation-utils";
import { useCalendar } from "../../context/calendar-context";

import {
  calculateMonthEventPositions,
  getCalendarCells,
} from "../../config/utils";

import type { Event } from "../../config/types";
import { DayCell } from "./day-cell";

interface IProps {
  singleDayEvents: Event[];
  multiDayEvents: Event[];
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarMonthView({
  singleDayEvents,
  multiDayEvents,
}: IProps) {
  const { selectedDate } = useCalendar();

  const allEvents = [...multiDayEvents, ...singleDayEvents];

  const cells = useMemo(() => {
    if (!selectedDate) return [];
    return getCalendarCells(selectedDate);
  }, [selectedDate]);

  const eventPositions = useMemo(() => {
    if (!selectedDate) return {};
    return calculateMonthEventPositions(
      multiDayEvents,
      singleDayEvents,
      selectedDate
    );
  }, [multiDayEvents, singleDayEvents, selectedDate]);

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer}>
      <div className="grid grid-cols-7 divide-x">
        {WEEK_DAYS.map((day, index) => (
          <motion.div
            key={day}
            className="flex items-center justify-center py-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, ...transition }}
          >
            <span className="text-xs font-medium">{day}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden">
        {cells.map((cell, index) => (
          <DayCell
            key={index}
            cell={cell}
            events={allEvents}
            eventPositions={eventPositions}
          />
        ))}
      </div>
    </motion.div>
  );
}
