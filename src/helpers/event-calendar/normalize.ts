import { TZDate } from "@date-fns/tz";
import type {
	CalendarEventAttendee,
	CalendarEventSource,
	Event,
	EventColor,
	User,
} from "@/components/event-calendar/config/types";

const SOURCE_COLOR_MAP: Record<CalendarEventSource, EventColor> = {
	manual: "blue",
	meeting: "green",
	"google-overlay": "yellow",
};

function getFallbackPicturePath(name: string) {
	return `https://tapback.co/api/avatar/${name}.webp`;
}

function normalizeEventColor(
	color: string | null | undefined,
	source: CalendarEventSource,
) {
	if (
		color === "blue" ||
		color === "green" ||
		color === "red" ||
		color === "yellow" ||
		color === "purple" ||
		color === "orange"
	) {
		return color;
	}

	return SOURCE_COLOR_MAP[source];
}

function normalizeUser(data: {
	id: string;
	name: string;
	image?: string | null;
}): User {
	return {
		id: data.id,
		name: data.name,
		picturePath: data.image || getFallbackPicturePath(data.name),
	};
}

function parseUnknownArray<T>(value: unknown): T[] {
	if (!value) {
		return [];
	}

	if (Array.isArray(value)) {
		return value as T[];
	}

	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? (parsed as T[]) : [];
		} catch {
			return [];
		}
	}

	return [];
}

function normalizeAttendee(value: unknown): CalendarEventAttendee | null {
	if (!value) {
		return null;
	}

	if (typeof value === "string") {
		return {
			email: value,
			name: value,
			picturePath: getFallbackPicturePath(value),
		};
	}

	if (typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const email = typeof record.email === "string" ? record.email : null;
	const name =
		typeof record.name === "string"
			? record.name
			: email ||
				(typeof record.text === "string" ? record.text : "Unknown attendee");

	return {
		id: typeof record.id === "string" ? record.id : undefined,
		name,
		email,
		picturePath:
			typeof record.picturePath === "string"
				? record.picturePath
				: getFallbackPicturePath(name),
		responseStatus:
			record.responseStatus === "accepted" ||
			record.responseStatus === "declined" ||
			record.responseStatus === "tentative" ||
			record.responseStatus === "needsAction"
				? record.responseStatus
				: undefined,
	};
}

export function normalizeAttendees(value: unknown): CalendarEventAttendee[] {
	return parseUnknownArray<unknown>(value)
		.map(normalizeAttendee)
		.filter((attendee): attendee is CalendarEventAttendee => attendee !== null);
}

export function normalizeExDates(value: unknown): string[] {
	return parseUnknownArray<unknown>(value).filter(
		(item): item is string => typeof item === "string",
	);
}

export function buildCalendarEventId(
	source: CalendarEventSource,
	sourceId: string,
	occurrenceStart?: string | null,
) {
	if (!occurrenceStart) {
		return `${source}:${sourceId}`;
	}

	return `${source}:${sourceId}::${occurrenceStart}`;
}

export function normalizeManualEventRow(row: {
	id: string;
	title: string;
	description: string | null;
	startDate: Date;
	endDate: Date;
	color: string;
	location: string | null;
	meetingLink: string | null;
	attendees: unknown;
	isAllDay: boolean;
	timeZone: string | null;
	recurrenceRule: string | null;
	recurrenceTimezone: string | null;
	recurrenceExDates: unknown;
	user: {
		id: string;
		name: string;
		image: string | null;
	};
}): Event {
	return {
		id: buildCalendarEventId("manual", row.id),
		source: "manual",
		sourceId: row.id,
		title: row.title,
		description: row.description ?? "",
		startDate: row.startDate.toISOString(),
		endDate: row.endDate.toISOString(),
		color: normalizeEventColor(row.color, "manual"),
		location: row.location ?? null,
		meetingLink: row.meetingLink ?? null,
		attendees: normalizeAttendees(row.attendees),
		readOnly: false,
		editable: true,
		removable: true,
		isAllDay: row.isAllDay,
		timeZone: row.timeZone ?? null,
		recurrence: row.recurrenceRule
			? {
					rule: row.recurrenceRule,
					timezone: row.recurrenceTimezone ?? row.timeZone ?? null,
					exDates: normalizeExDates(row.recurrenceExDates),
				}
			: null,
		user: normalizeUser(row.user),
	};
}

export function normalizeMeetingRow(row: {
	id: string;
	title: string;
	description: string | null;
	startTime: Date;
	endTime: Date;
	attendees: unknown;
	meetingUrl: string | null;
	location: string | null;
	calendarEventId: string | null;
	botScheduled: boolean;
	botSent: boolean;
	botStatus: string | null;
	user: {
		id: string;
		name: string;
		image: string | null;
	};
}): Event {
	return {
		id: buildCalendarEventId("meeting", row.id),
		source: "meeting",
		sourceId: row.id,
		title: row.title,
		description: row.description ?? "",
		startDate: row.startTime.toISOString(),
		endDate: row.endTime.toISOString(),
		color: SOURCE_COLOR_MAP.meeting,
		location: row.location ?? null,
		meetingLink: row.meetingUrl ?? null,
		attendees: normalizeAttendees(row.attendees),
		readOnly: true,
		editable: false,
		removable: false,
		meetingId: row.id,
		googleEventId: row.calendarEventId ?? null,
		botScheduled: row.botScheduled,
		botSent: row.botSent,
		botStatus: row.botStatus ?? null,
		isAllDay: false,
		timeZone: null,
		recurrence: null,
		user: normalizeUser(row.user),
	};
}

interface GoogleOverlayDateRange {
	startDate: string;
	endDate: string;
	isAllDay: boolean;
}

function parseGoogleDateToParts(value: string) {
	const [year, month, day] = value.split("-").map(Number);
	return { year, monthIndex: month - 1, day };
}

function buildZonedDate(dateValue: string, timeZone: string) {
	const parts = parseGoogleDateToParts(dateValue);

	return new TZDate(
		parts.year,
		parts.monthIndex,
		parts.day,
		0,
		0,
		0,
		0,
		timeZone,
	);
}

function normalizeGoogleDateRange(args: {
	start?: { date?: string; dateTime?: string };
	end?: { date?: string; dateTime?: string };
	timeZone: string;
}): GoogleOverlayDateRange | null {
	if (args.start?.dateTime && args.end?.dateTime) {
		return {
			startDate: new Date(args.start.dateTime).toISOString(),
			endDate: new Date(args.end.dateTime).toISOString(),
			isAllDay: false,
		};
	}

	if (args.start?.date && args.end?.date) {
		const start = buildZonedDate(args.start.date, args.timeZone);
		const endExclusive = buildZonedDate(args.end.date, args.timeZone);
		const end = new Date(endExclusive.getTime() - 1);

		return {
			startDate: new Date(start.getTime()).toISOString(),
			endDate: end.toISOString(),
			isAllDay: true,
		};
	}

	return null;
}

export function normalizeGoogleOverlayEvent(args: {
	event: {
		id: string;
		summary?: string;
		description?: string;
		location?: string;
		htmlLink?: string;
		hangoutLink?: string | null;
		conferenceData?: {
			entryPoints?: Array<{ uri?: string }>;
		};
		start?: { date?: string; dateTime?: string };
		end?: { date?: string; dateTime?: string };
		attendees?: unknown[];
	};
	timeZone: string;
	user: {
		id: string;
		name: string;
		image?: string | null;
	};
}): Event | null {
	const range = normalizeGoogleDateRange({
		start: args.event.start,
		end: args.event.end,
		timeZone: args.timeZone,
	});

	if (!range) {
		return null;
	}

	const meetingLink =
		args.event.hangoutLink ||
		args.event.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.uri)
			?.uri ||
		null;

	return {
		id: buildCalendarEventId("google-overlay", args.event.id),
		source: "google-overlay",
		sourceId: args.event.id,
		title: args.event.summary || "Google Calendar event",
		description: args.event.description ?? "",
		startDate: range.startDate,
		endDate: range.endDate,
		color: SOURCE_COLOR_MAP["google-overlay"],
		location: args.event.location ?? null,
		meetingLink,
		attendees: normalizeAttendees(args.event.attendees),
		readOnly: true,
		editable: false,
		removable: false,
		externalUrl: args.event.htmlLink ?? null,
		googleEventId: args.event.id,
		isAllDay: range.isAllDay,
		timeZone: args.timeZone,
		recurrence: null,
		user: normalizeUser(args.user),
	};
}

export function sortCalendarEvents(events: Event[]) {
	return [...events].sort((left, right) => {
		const startDiff =
			new Date(left.startDate).getTime() - new Date(right.startDate).getTime();

		if (startDiff !== 0) {
			return startDiff;
		}

		const endDiff =
			new Date(left.endDate).getTime() - new Date(right.endDate).getTime();

		if (endDiff !== 0) {
			return endDiff;
		}

		return left.title.localeCompare(right.title);
	});
}

export function mergeCalendarEventSources(
	manualAndMeetingEvents: Event[],
	googleOverlayEvents: Event[],
) {
	const mergedByKey = new Map<string, Event>();
	const eventsByPriority = [
		...manualAndMeetingEvents.filter((event) => event.source === "meeting"),
		...manualAndMeetingEvents.filter((event) => event.source === "manual"),
		...googleOverlayEvents,
	];

	for (const event of eventsByPriority) {
		const dedupeKey = event.googleEventId
			? `google:${event.googleEventId}`
			: `${event.source}:${event.sourceId}`;

		if (!mergedByKey.has(dedupeKey)) {
			mergedByKey.set(dedupeKey, event);
		}
	}

	return sortCalendarEvents(Array.from(mergedByKey.values()));
}
