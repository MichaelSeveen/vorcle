"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { cn } from "@/lib/utils";
import type { Event } from "../config/types";
import { canEditEventInCalendar } from "../config/utils";
import { ItemTypes } from "./custom-drag-layer";

interface DraggableEventProps {
	event: Event;
	children: ReactNode;
}

export function DraggableEvent({ event, children }: DraggableEventProps) {
	const ref = useRef<HTMLDivElement>(null);
	const canDrag = canEditEventInCalendar(event);

	const [{ isDragging }, drag, preview] = useDrag(
		() => ({
			canDrag,
			type: ItemTypes.EVENT,
			item: () => {
				const width = ref.current?.offsetWidth || 0;
				const height = ref.current?.offsetHeight || 0;
				return { event, children, width, height };
			},
			collect: (monitor) => ({ isDragging: monitor.isDragging() }),
		}),
		[canDrag, children, event],
	);

	useEffect(() => {
		preview(getEmptyImage(), { captureDraggingState: true });
	}, [preview]);

	drag(ref);

	return (
		<div
			ref={ref}
			className={cn(
				canDrag ? "cursor-pointer" : "cursor-default",
				isDragging && "opacity-40 cursor-grabbing",
			)}
		>
			{children}
		</div>
	);
}
