"use client";

import type { ReactNode } from "react";
import { useDrop } from "react-dnd";
import { cn } from "@/lib/utils";
import type { Event } from "../config/types";
import { useDragDrop } from "../context/dnd-context";
import { ItemTypes } from "./custom-drag-layer";

interface DroppableAreaProps {
	date: Date;
	hour?: number;
	minute?: number;
	children: ReactNode;
}

export function DroppableArea({
	date,
	hour,
	minute,
	children,
}: DroppableAreaProps) {
	const { handleDrop } = useDragDrop();

	const [{ isOver, canDrop }, drop] = useDrop<
		{ event: Event },
		void,
		{ isOver: boolean; canDrop: boolean }
	>(
		() => ({
			accept: ItemTypes.EVENT,
			drop: (item) => {
				handleDrop(item.event, date, hour, minute);
			},
			collect: (monitor) => ({
				isOver: monitor.isOver(),
				canDrop: monitor.canDrop(),
			}),
		}),
		[date, hour, minute, handleDrop],
	);

	return (
		<div
			ref={drop as unknown as React.RefObject<HTMLDivElement>}
			className={cn("h-[24px]", isOver && canDrop && "bg-accent/50")}
		>
			{children}
		</div>
	);
}
