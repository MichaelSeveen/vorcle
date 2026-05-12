"use client";

import { Button, Chip, Label, Link, Modal, ScrollShadow } from "@heroui/react";
import {
	Calendar03Icon,
	ChatBotIcon,
	Clock01Icon,
	Link03Icon,
	Location01Icon,
	NoteIcon,
	RepeatIcon,
	User03Icon,
	UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, parseISO } from "date-fns";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { getRecurrenceSummary } from "@/helpers/event-calendar/recurrence";
import type { Event } from "../config/types";
import { formatTime, getEventSourceLabel } from "../config/utils";
import { useCalendar } from "../context/calendar-context";
import { EventDialog } from "./event-dialog";
import RemoveEventDialog from "./remove-event";

interface Props {
	event: Event;
	children: ReactNode;
}

export function EventDetailsDialog({ event, children }: Props) {
	const startDate = parseISO(event.startDate);
	const endDate = parseISO(event.endDate);
	const { getSourceEventById, use24HourFormat } = useCalendar();
	const sourceEvent = getSourceEventById(event.sourceId) ?? event;
	const recurrenceSummary = getRecurrenceSummary(sourceEvent);
	const attendees =
		event.attendees && event.attendees.length > 0
			? event.attendees.map((attendee) => attendee.name).join(", ")
			: "No attendees";

	return (
		<Modal>
			<Modal.Trigger className="block w-full text-left">
				{children}
			</Modal.Trigger>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading className="flex flex-wrap items-center gap-2">
								<span>{event.title}</span>
								<Chip size="sm" variant="secondary">
									{getEventSourceLabel(event)}
								</Chip>
								{sourceEvent.recurrence?.rule ? (
									<Chip size="sm" variant="secondary">
										Repeats
									</Chip>
								) : null}
							</Modal.Heading>
							<p className="sr-only">Details of the calendar event</p>
						</Modal.Header>

						<Modal.Body>
							<ScrollShadow className="max-h-[35rem] overflow-auto">
								<div className="space-y-4">
									<div className="flex items-start gap-2">
										<HugeiconsIcon icon={User03Icon} size={16} />
										<div>
											<Label>Responsible</Label>
											<p className="text-sm text-foreground">
												{event.user.name}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-2">
										<HugeiconsIcon icon={UserMultiple02Icon} size={16} />
										<div>
											<Label>Attendees</Label>
											<p className="text-sm text-foreground">
												{attendees}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-2">
										<HugeiconsIcon icon={Calendar03Icon} size={16} />
										<div>
											<Label>Start Date</Label>
											<time
												dateTime={startDate.toISOString()}
												className="text-sm text-foreground"
											>
												{format(startDate, "EEEE dd MMMM")}
												<span className="mx-1">at</span>
												{formatTime(startDate, use24HourFormat)}
											</time>
										</div>
									</div>

									<div className="flex items-start gap-2">
										<HugeiconsIcon icon={Clock01Icon} size={16} />
										<div>
											<Label>End Date</Label>
											<time
												dateTime={endDate.toISOString()}
												className="text-sm text-foreground"
											>
												{format(endDate, "EEEE dd MMMM")}
												<span className="mx-1">at</span>
												{formatTime(endDate, use24HourFormat)}
											</time>
										</div>
									</div>

									{event.location ? (
										<div className="flex items-start gap-2">
											<HugeiconsIcon icon={Location01Icon} size={16} />
											<div>
												<Label>Location</Label>
												<p className="text-sm text-foreground">
													{event.location}
												</p>
											</div>
										</div>
									) : null}

									{event.meetingLink ? (
										<div className="flex items-start gap-2">
											<HugeiconsIcon icon={Link03Icon} size={16} />
											<div>
												<Label>Meeting Link</Label>
												<a
													className="text-sm text-primary hover:underline"
													href={event.meetingLink}
													target="_blank"
													rel="noreferrer"
												>
													{event.meetingLink}
												</a>
											</div>
										</div>
									) : null}

									{recurrenceSummary ? (
										<div className="flex items-start gap-2">
											<HugeiconsIcon icon={RepeatIcon} size={16} />
											<div>
												<Label>Recurrence</Label>
												<p className="text-sm text-foreground">
													{recurrenceSummary}
												</p>
											</div>
										</div>
									) : null}

									{event.botStatus ? (
										<div className="flex items-start gap-2">
											<HugeiconsIcon icon={ChatBotIcon} size={16} />
											<div>
												<Label>Bot Status</Label>
												<p className="text-sm text-foreground capitalize">
													{event.botStatus}
												</p>
											</div>
										</div>
									) : null}

									<div className="flex items-start gap-2">
										<HugeiconsIcon icon={NoteIcon} size={16} />
										<div>
											<Label>Description</Label>
											<p className="text-sm text-foreground">
												{event.description || "No description"}
											</p>
										</div>
									</div>
								</div>
							</ScrollShadow>
						</Modal.Body>

						<Modal.Footer>
							{event.source === "manual" && sourceEvent.editable ? (
								<>
									<EventDialog event={sourceEvent}>
										<Button variant="outline">
											{sourceEvent.recurrence?.rule ? "Edit series" : "Edit"}
										</Button>
									</EventDialog>
									{sourceEvent.removable ? (
										<RemoveEventDialog
											eventId={sourceEvent.sourceId}
											label={
												sourceEvent.recurrence?.rule
													? "Delete series"
													: "Delete"
											}
										/>
									) : null}
								</>
							) : null}

							{event.source === "meeting" && event.meetingId ? (
								<NextLink href={`/meeting/${event.meetingId}`}>
									<Button variant="outline">Open meeting</Button>
								</NextLink>
							) : null}

							{event.source === "google-overlay" &&
							(event.externalUrl || event.meetingLink) ? (
								<Link
									href={event.externalUrl ?? event.meetingLink ?? "#"}
									target="_blank"
									rel="noreferrer"
								>
									Open in Google
								</Link>
							) : null}
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
