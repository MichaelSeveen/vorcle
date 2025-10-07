"use client";

import { useMemo } from "react";
import { formatDate } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonHover, transition } from "../config/animation-utils";
import { useCalendar } from "../context/calendar-context";

import { getEventsCount, navigateDate, rangeText } from "../config/utils";
import { Event, CalendarView } from "../config/types";

interface Props {
  view: CalendarView;
  events: Event[];
}

const MotionButton = motion.create(Button);
const MotionBadge = motion.create(Badge);

export default function DateNavigator({ view, events }: Props) {
  const { selectedDate, setSelectedDate } = useCalendar();

  const eventCount = useMemo(() => {
    if (!selectedDate) return 0;
    return getEventsCount(events, selectedDate, view);
  }, [events, selectedDate, view]);

  const month = selectedDate ? formatDate(selectedDate, "MMMM") : "";
  const year = selectedDate ? selectedDate.getFullYear() : "";
  const range = selectedDate ? rangeText(view, selectedDate) : "";

  const handlePrevious = () => {
    if (!selectedDate) return;
    setSelectedDate(navigateDate(selectedDate, view, "previous"));
  };

  const handleNext = () => {
    if (!selectedDate) return;
    setSelectedDate(navigateDate(selectedDate, view, "next"));
  };

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <motion.span
          className="text-lg font-semibold"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={transition}
        >
          {month} {year}
        </motion.span>
        <AnimatePresence mode="wait">
          <MotionBadge
            key={eventCount}
            variant="secondary"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={transition}
          >
            {eventCount} events
          </MotionBadge>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <MotionButton
          variant="outline"
          size="icon"
          className="size-6"
          onClick={handlePrevious}
          variants={buttonHover}
          whileHover="hover"
          whileTap="tap"
        >
          <ChevronLeft />
        </MotionButton>

        <motion.p
          className="text-sm text-muted-foreground font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
        >
          {range}
        </motion.p>

        <MotionButton
          variant="outline"
          size="icon"
          className="size-6"
          onClick={handleNext}
          variants={buttonHover}
          whileHover="hover"
          whileTap="tap"
        >
          <ChevronRight />
        </MotionButton>
      </div>
    </div>
  );
}
