"use client";

import { AlertDialog, Button } from "@heroui/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCalendar } from "../context/calendar-context";

export default function RemoveEventDialog({
	eventId,
	label = "Delete",
}: {
	eventId: string;
	label?: string;
}) {
	const { removeEvent } = useCalendar();

	if (!eventId) {
		return null;
	}

	const handleRemoveEvent = async () => {
		await removeEvent(eventId);
	};

	return (
		<AlertDialog>
			<Button variant="danger">
				<HugeiconsIcon icon={Delete02Icon} />
				{label}
			</Button>
			<AlertDialog.Backdrop>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-[425px]">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="danger" />
							<AlertDialog.Heading>
								Are you absolutely sure?
							</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								This action cannot be undone. This will permanently delete the
								event.
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary">
								Cancel
							</Button>
							<Button variant="danger" onPress={handleRemoveEvent}>
								Delete event
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</AlertDialog>
	);
}
