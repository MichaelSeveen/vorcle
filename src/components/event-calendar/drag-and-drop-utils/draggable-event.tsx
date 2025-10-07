"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";

import { Event } from "../config/types";
import { ItemTypes } from "./custom-drag-layer";
import { cn } from "@/lib/utils";

interface DraggableEventProps {
  event: Event;
  children: ReactNode;
}

export function DraggableEvent({ event, children }: DraggableEventProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: () => {
      const width = ref.current?.offsetWidth || 0;
      const height = ref.current?.offsetHeight || 0;
      return { event, children, width, height };
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  drag(ref);

  return (
    <div
      ref={ref}
      className={cn(
        "cursor-pointer",
        isDragging && "opacity-40 cursor-grabbing"
      )}
    >
      {children}
    </div>
  );
}
