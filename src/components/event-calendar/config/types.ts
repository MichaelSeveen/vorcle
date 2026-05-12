export type CalendarView = "day" | "week" | "month" | "year" | "agenda";

export const EVENT_COLORS = [
	"blue",
	"green",
	"red",
	"yellow",
	"purple",
	"orange",
] as const;

export type EventColor = (typeof EVENT_COLORS)[number];

export interface User {
	id: string;
	name: string;
	picturePath: string | null;
}

export type CalendarEventSource = "manual" | "meeting" | "google-overlay";

export type CalendarEventResponseStatus =
	| "accepted"
	| "declined"
	| "tentative"
	| "needsAction";

export interface CalendarEventAttendee {
	id?: string;
	name: string;
	email?: string | null;
	picturePath?: string | null;
	responseStatus?: CalendarEventResponseStatus;
}

export interface CalendarRecurrence {
	rule: string | null;
	timezone: string | null;
	exDates?: string[];
	isInstance?: boolean;
	occurrenceStart?: string | null;
}

export interface Event {
	id: string;
	source: CalendarEventSource;
	sourceId: string;
	startDate: string;
	endDate: string;
	title: string;
	color: EventColor;
	location: string | null;
	meetingLink: string | null;
	description: string;
	attendees?: CalendarEventAttendee[];
	readOnly: boolean;
	editable: boolean;
	removable: boolean;
	externalUrl?: string | null;
	meetingId?: string | null;
	googleEventId?: string | null;
	botScheduled?: boolean;
	botSent?: boolean;
	botStatus?: string | null;
	isAllDay: boolean;
	timeZone?: string | null;
	recurrence?: CalendarRecurrence | null;
	user: User;
}

export interface ManualEventInput {
	title: string;
	description: string;
	startDate: string;
	endDate: string;
	color: EventColor;
	location: string | null;
	meetingLink: string | null;
	attendees?: CalendarEventAttendee[];
	isAllDay: boolean;
	timeZone?: string | null;
	recurrence?: CalendarRecurrence | null;
}

export const RECURRENCE_FREQUENCIES = [
	"daily",
	"weekly",
	"monthly",
	"yearly",
] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const RECURRENCE_END_TYPES = ["never", "on", "after"] as const;

export type RecurrenceEndType = (typeof RECURRENCE_END_TYPES)[number];

export const WEEKDAY_CODES = [
	"SU",
	"MO",
	"TU",
	"WE",
	"TH",
	"FR",
	"SA",
] as const;

export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export interface CalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
