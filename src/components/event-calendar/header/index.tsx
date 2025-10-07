"use client";

import { motion } from "motion/react";
import { Plus } from "lucide-react";
import {
  slideFromLeft,
  slideFromRight,
  transition,
} from "../config/animation-utils";
import { Button } from "@/components/ui/button";
import { useCalendar } from "../context/calendar-context";
import { EventDialog } from "../dialogs/event-dialog";
import DateNavigator from "./date-navigator";
import EventColorFilter from "./event-color-filter";
import CurrentDayButton from "./current-day-button";
import UsersMenu from "./users-menu";
import ViewTabs from "./view-tabs";
import { Settings } from "./settings";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CalendarHeader() {
  const { view, filteredEvents } = useCalendar();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
      <motion.div
        className="flex items-center gap-3"
        variants={slideFromLeft}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <CurrentDayButton />
        <DateNavigator view={view} events={filteredEvents} />
      </motion.div>

      <motion.div
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
        variants={slideFromRight}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <div className="flex items-center gap-3">
          {!isMobile ? <EventColorFilter /> : null}
          <ViewTabs />
        </div>

        <div className="flex items-center gap-3">
          <UsersMenu />

          <EventDialog>
            <Button>
              {!isMobile ? <Plus /> : null}
              Add Event
            </Button>
          </EventDialog>
          <Settings />
        </div>
      </motion.div>
    </div>
  );
}
