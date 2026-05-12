import {
	Alert,
	Button,
	Card,
	Label,
	Link,
	Spinner,
	Switch,
} from "@heroui/react";
import { Link04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";

import { EmptyStateIcon, GoogleCalendarIcon } from "@/components/custom-icons";
import type { GoogleCalendarEvent } from "@/config/types";
import { cn } from "@/lib/utils";

interface UpcomingMeetingsProps {
	upcomingEvents: GoogleCalendarEvent[];
	calendarConnected: boolean;
	error: string | null;
	loading: boolean;
	meetingBotState: { [key: string]: boolean };
	pendingToggleByEventId: { [key: string]: boolean };
	onBotToggle: (eventId: string) => void;
	onConnectCalendar: () => void;
}

function UpcomingMeetingsError({ error }: { error: string }) {
	return (
		<Alert status="danger">
			<Alert.Indicator />
			<Alert.Content>
				<Alert.Title>Upcoming meetings error</Alert.Title>
				<Alert.Description>{error}</Alert.Description>
			</Alert.Content>
		</Alert>
	);
}

function getBotStatusMessage(
	event: GoogleCalendarEvent,
	isPending: boolean,
	botEnabled: boolean,
) {
	if (isPending) {
		return {
			label: "Updating bot...",
			tone: "text-foreground",
		};
	}

	if (!botEnabled) {
		return {
			label: "Bot disabled for this meeting.",
			tone: "text-foreground",
		};
	}

	if (event.botFailureMessage) {
		return {
			label: event.botFailureMessage,
			tone: "text-destructive",
		};
	}

	switch (event.botStatus) {
		case "queued":
			return {
				label: "Bot queued and ready to join.",
				tone: "text-emerald-600",
			};
		case "in_call_recording":
			return {
				label: "Bot is in the meeting and recording.",
				tone: "text-emerald-600",
			};
		case "blocked":
			return {
				label: "Bot is blocked until the issue is resolved.",
				tone: "text-amber-600",
			};
		case "canceled":
			return {
				label: "Bot canceled for this meeting.",
				tone: "text-foreground",
			};
		default:
			return {
				label: event.botSent
					? "Bot has been scheduled."
					: "Bot will be sent automatically before the meeting starts.",
				tone: "text-foreground",
			};
	}
}

function ConnectCalendarCard({
	error,
	onConnect,
	loading,
}: {
	error: string | null;
	onConnect: () => void;
	loading: boolean;
}) {
	return (
		<div className="space-y-4 my-20">
			{error ? <UpcomingMeetingsError error={error} /> : null}
			<div className="flex items-center justify-center">
				<Card className="w-full max-w-sm">
					<Card.Header>
						<GoogleCalendarIcon className="mx-auto size-[4rem]" />
						<Card.Title className="text-center">Connect Calendar</Card.Title>
						<Card.Description className="text-center">
							Connect your Google Calendar to sync your meetings.
						</Card.Description>
					</Card.Header>
					<Card.Footer>
						<Button
							onPress={onConnect}
							isPending={loading}
							fullWidth
							className="w-full cursor-pointer"
						>
							{({ isPending }) => (
								<>
									{isPending ? (
										<Spinner color="current" size="sm" />
									) : (
										<HugeiconsIcon icon={Link04Icon} />
									)}
									{isPending ? "Connecting..." : "Connect"}
								</>
							)}
						</Button>
					</Card.Footer>
				</Card>
			</div>
		</div>
	);
}

function EmptyMeetingsState() {
	return (
		<div className="flex flex-col items-center justify-center my-20">
			<EmptyStateIcon className="h-[8rem] w-[8.5rem]" />
			<h3 className="font-medium mb-2 text-foreground text-xl">
				No upcoming meetings.
			</h3>
			<p className="text-foreground text-sm">Your calendar is clear.</p>
		</div>
	);
}

function MeetingsList({
	events,
	meetingBotState,
	pendingToggleByEventId,
	onBotToggle,
}: {
	events: GoogleCalendarEvent[];
	meetingBotState: { [key: string]: boolean };
	pendingToggleByEventId: { [key: string]: boolean };
	onBotToggle: (eventId: string) => void;
}) {
	return (
		<div className="space-y-3">
			{events.map((event) => {
				const botEnabled = !!meetingBotState[event.id];
				const isPending = !!pendingToggleByEventId[event.id];
				const status = getBotStatusMessage(event, isPending, botEnabled);

				const currentMonth = new Date(
					event.start?.dateTime || event.start?.date || "",
				);
				const formattedMonth = format(currentMonth, "MMM").toUpperCase();
				const formattedDay = format(currentMonth, "d");

				return (
					<Card key={event.id} className="w-full items-stretch md:flex-row">
						<div className="relative h-20 w-full shrink-0 rounded-2xl sm:size-20 flex flex-col">
							<span className="text-xl">{formattedMonth}</span>
							<span className="text-red-600">{formattedDay}</span>
						</div>
						<div className="flex flex-1 flex-col gap-3">
							<Card.Header className="gap-1">
								<div className="flex items-center gap-3 pr-8">
									<Card.Title>{event.summary || "No Title"}</Card.Title>
									<p className={cn("text", status.tone)}>{status.label}</p>
								</div>
								<Card.Description className="sr-only">
									The description of the meeting
								</Card.Description>

								<Switch
									aria-label="Send the bot to this meeting"
									className="absolute top-5 right-5"
									isSelected={botEnabled}
									onChange={() => onBotToggle(event.id)}
									isDisabled={isPending}
								>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
									<Switch.Content>
										<Label className="text-sm">Send Bot</Label>
									</Switch.Content>
								</Switch>
							</Card.Header>
							<Card.Footer className="mt-auto flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
								{event.attendees ? (
									<div className="flex flex-col">
										<span className="text-sm font-medium text-foreground">
											Attendees
										</span>
										<span className="text-xs text-muted">
											{event.attendees.length} attendee
											{event.attendees.length > 1 ? "s" : ""}
										</span>
									</div>
								) : null}

								{(event.hangoutLink || event.location) && (
									<Link
										href={event.hangoutLink || event.location || "#"}
										target="_blank"
										rel="noopener noreferrer"
									>
										Join Meeting
									</Link>
								)}
							</Card.Footer>
						</div>
					</Card>
				);
			})}
		</div>
	);
}

export default function UpcomingMeetings({
	upcomingEvents,
	calendarConnected,
	error,
	loading,
	meetingBotState,
	pendingToggleByEventId,
	onBotToggle,
	onConnectCalendar,
}: UpcomingMeetingsProps) {
	if (!calendarConnected)
		return (
			<ConnectCalendarCard
				error={error}
				onConnect={onConnectCalendar}
				loading={loading}
			/>
		);
	if (upcomingEvents.length === 0)
		return (
			<div className="space-y-4">
				{error ? <UpcomingMeetingsError error={error} /> : null}
				<EmptyMeetingsState />
			</div>
		);

	return (
		<div className="space-y-4">
			{error ? <UpcomingMeetingsError error={error} /> : null}
			<MeetingsList
				events={upcomingEvents}
				meetingBotState={meetingBotState}
				pendingToggleByEventId={pendingToggleByEventId}
				onBotToggle={onBotToggle}
			/>
		</div>
	);
}
