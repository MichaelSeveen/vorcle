"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { toast } from "sonner";
import type { Event } from "../config/types";
import { canEditEventInCalendar } from "../config/utils";
import { DndConfirmationDialog } from "../dialogs/dnd-confirmation";
import { useCalendar } from "./calendar-context";

interface PendingDropData {
	event: Event;
	newStartDate: Date;
	newEndDate: Date;
}

interface DragDropContextType {
	showConfirmation: boolean;
	setShowConfirmation: (show: boolean) => void;
	pendingDropData: PendingDropData | null;
	handleConfirmDrop: () => void;
	handleCancelDrop: () => void;
	handleDrop: (
		event: Event,
		targetDate: Date,
		hour?: number,
		minute?: number,
	) => void;
}

interface DndContextProviderProps {
	children: ReactNode;
	defaultShowConfirmation?: boolean;
	onEventDropped?: (event: Event, newStartDate: Date, newEndDate: Date) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(
	undefined,
);

export default function DndProvider({
	children,
	defaultShowConfirmation = false,
	onEventDropped,
}: DndContextProviderProps) {
	const { updateEvent } = useCalendar();
	const [pendingDropData, setPendingDropData] =
		useState<PendingDropData | null>(null);
	const [showConfirmation, setShowConfirmation] = useState<boolean>(
		defaultShowConfirmation,
	);

	const calculateNewDates = useCallback(
		(event: Event, targetDate: Date, hour?: number, minute?: number) => {
			const originalStart = new Date(event.startDate);
			const originalEnd = new Date(event.endDate);
			const duration = originalEnd.getTime() - originalStart.getTime();

			const newStart = new Date(targetDate);
			if (hour !== undefined) {
				newStart.setHours(hour, minute || 0, 0, 0);
			} else {
				newStart.setHours(
					originalStart.getHours(),
					originalStart.getMinutes(),
					0,
					0,
				);
			}

			return {
				newStart,
				newEnd: new Date(newStart.getTime() + duration),
			};
		},
		[],
	);

	const isSamePosition = useCallback((date1: Date, date2: Date) => {
		return date1.getTime() === date2.getTime();
	}, []);

	const handleEventUpdate = useCallback(
		(event: Event, newStartDate: Date, newEndDate: Date) => {
			try {
				const updatedEvent = {
					...event,
					startDate: newStartDate.toISOString(),
					endDate: newEndDate.toISOString(),
				};
				void updateEvent(updatedEvent);
			} catch {
				toast.error("Failed to update event");
			}
		},
		[updateEvent],
	);

	const performDrop = useCallback(
		(event: Event, newStartDate: Date, newEndDate: Date) => {
			const callback = onEventDropped ?? handleEventUpdate;
			callback(event, newStartDate, newEndDate);
		},
		[onEventDropped, handleEventUpdate],
	);

	const handleDrop = useCallback(
		(event: Event, targetDate: Date, hour?: number, minute?: number) => {
			if (!canEditEventInCalendar(event)) {
				return;
			}

			const { newStart, newEnd } = calculateNewDates(
				event,
				targetDate,
				hour,
				minute,
			);
			const originalStart = new Date(event.startDate);

			if (isSamePosition(originalStart, newStart)) {
				return;
			}

			if (showConfirmation) {
				setPendingDropData({
					event,
					newStartDate: newStart,
					newEndDate: newEnd,
				});
			} else {
				performDrop(event, newStart, newEnd);
			}
		},
		[calculateNewDates, isSamePosition, showConfirmation, performDrop],
	);

	const handleConfirmDrop = useCallback(() => {
		if (!pendingDropData) return;
		performDrop(
			pendingDropData.event,
			pendingDropData.newStartDate,
			pendingDropData.newEndDate,
		);
		setPendingDropData(null);
	}, [pendingDropData, performDrop]);

	const handleCancelDrop = useCallback(() => {
		setPendingDropData(null);
	}, []);

	const contextValue = useMemo(
		() => ({
			showConfirmation,
			setShowConfirmation,
			pendingDropData,
			handleConfirmDrop,
			handleCancelDrop,
			handleDrop,
		}),
		[
			showConfirmation,
			pendingDropData,
			handleConfirmDrop,
			handleCancelDrop,
			handleDrop,
		],
	);

	return (
		<DragDropContext.Provider value={contextValue}>
			{showConfirmation && pendingDropData && <DndConfirmationDialog />}
			{children}
		</DragDropContext.Provider>
	);
}

export function useDragDrop() {
	const context = useContext(DragDropContext);
	if (!context) {
		throw new Error("useDragDrop must be used within a DndContextProvider");
	}
	return context;
}
