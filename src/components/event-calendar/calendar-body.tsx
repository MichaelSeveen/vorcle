"use client";

import { motion } from "motion/react";
import { useCalendar } from "./context/calendar-context";
import { fadeIn, transition } from "./config/animation-utils";
import CalendarMonthView from "./views/month-view";
import CalendarWeekView from "./views/day-and-week-view/week-view";
import CalendarDayView from "./views/day-and-week-view/day-view";
import CalendarAgendaView from "./views/agenda-view";
import ReactDndProvider from "./drag-and-drop-utils/react-dnd-provider";

export default function CalendarBody() {
  const { view, singleDayEvents, multiDayEvents } = useCalendar();

  return (
    <ReactDndProvider>
      <motion.div
        key={view}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeIn}
        transition={transition}
      >
        {view === "month" && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "week" && (
          <CalendarWeekView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "day" && (
          <CalendarDayView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "agenda" && (
          <motion.div
            key="agenda"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeIn}
            transition={transition}
          >
            <CalendarAgendaView
              singleDayEvents={singleDayEvents}
              multiDayEvents={multiDayEvents}
            />
          </motion.div>
        )}
      </motion.div>
    </ReactDndProvider>
  );
}
