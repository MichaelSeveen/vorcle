import { formatDate } from "date-fns";
import { motion } from "motion/react";
import { buttonHover, transition } from "../config/animation-utils";
import { useCalendar } from "../context/calendar-context";
import { cn } from "@/lib/utils";
import { getTimeBasedColor } from "../config/utils";

export default function CurrentDayButton() {
  const { setSelectedDate } = useCalendar();

  const today = new Date();
  const timeBasedBg = getTimeBasedColor(today);
  const handleClick = () => setSelectedDate(today);

  return (
    <motion.button
      className="flex size-14 flex-col items-start overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      onClick={handleClick}
      variants={buttonHover}
      whileHover="hover"
      whileTap="tap"
      transition={transition}
    >
      <motion.p
        className={cn(
          "flex h-6 w-full items-center justify-center text-center text-xs font-semibold text-primary-foreground",
          timeBasedBg
        )}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, ...transition }}
      >
        {formatDate(today, "MMM").toUpperCase()}
      </motion.p>
      <motion.p
        className="flex w-full items-center justify-center text-lg font-bold"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, ...transition }}
      >
        {today.getDate()}
      </motion.p>
    </motion.button>
  );
}
