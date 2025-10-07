import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transition } from "../config/animation-utils";
import { EventColor } from "../config/types";
import { eventBulletVariants } from "../variant-utils";

export function EventBullet({
  color,
  className,
}: {
  color: EventColor;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(eventBulletVariants({ color, className }))}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.2 }}
      transition={transition}
    />
  );
}
