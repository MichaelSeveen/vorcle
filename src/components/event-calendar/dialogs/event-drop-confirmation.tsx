"use client";

import { AlertDialog, Button } from "@heroui/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Event } from "../config/types";
import { formatTime, getColorClass } from "../config/utils";
import { useCalendar } from "../context/calendar-context";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	event: Event | null;
	newStartDate: Date | null;
	newEndDate: Date | null;
	onConfirm: () => void;
	onCancel: () => void;
}

export function EventDropConfirmationDialog({
	open,
	onOpenChange,
	event,
	newStartDate,
	newEndDate,
	onConfirm,
	onCancel,
}: Props) {
	const { use24HourFormat } = useCalendar();

	if (!event || !newStartDate || !newEndDate) {
		return null;
	}

	const originalStart = new Date(event.startDate);

	const formatDate = (date: Date) => {
		return (
			format(date, "MMM dd, yyyy 'at '") + formatTime(date, use24HourFormat)
		);
	};

	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	const handleCancel = () => {
		onCancel();
		onOpenChange(false);
	};

	return (
		<AlertDialog>
			<AlertDialog.Backdrop isOpen={open} onOpenChange={onOpenChange}>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-[425px]">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="warning" />
							<AlertDialog.Heading>Confirm Event Move</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								Are you sure you want to move
								<span
									className={cn(
										getColorClass(event.color),
										"mx-1 p-0.5 rounded",
									)}
								>
									{event.title}
								</span>
								event from
								<strong className="mx-1">{formatDate(originalStart)}</strong> to
								<strong className="mx-1">{formatDate(newStartDate)}</strong>?
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary" onPress={handleCancel}>
								Cancel
							</Button>
							<Button onPress={handleConfirm}>Move Event</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</AlertDialog>
	);
}
