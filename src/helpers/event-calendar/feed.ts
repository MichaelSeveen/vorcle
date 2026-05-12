import { and, eq, or } from "drizzle-orm";
import type { Event } from "@/components/event-calendar/config/types";
import { db } from "@/db";
import { event, meeting, user } from "@/db/schema";
import { getGoogleOverlayEvents } from "@/helpers/user/calendar/google-overlay";
import {
	mergeCalendarEventSources,
	normalizeManualEventRow,
	normalizeMeetingRow,
	sortCalendarEvents,
} from "./normalize";

export async function getStoredCalendarEvents(
	userId: string,
): Promise<Event[]> {
	const [manualEventRows, meetingRows] = await Promise.all([
		db
			.select({
				id: event.id,
				title: event.title,
				description: event.description,
				startDate: event.startDate,
				endDate: event.endDate,
				color: event.color,
				location: event.location,
				meetingLink: event.meetingLink,
				attendees: event.attendees,
				isAllDay: event.isAllDay,
				timeZone: event.timeZone,
				recurrenceRule: event.recurrenceRule,
				recurrenceTimezone: event.recurrenceTimezone,
				recurrenceExDates: event.recurrenceExDates,
				user: {
					id: user.id,
					name: user.name,
					image: user.image,
				},
			})
			.from(event)
			.innerJoin(user, eq(event.userId, user.id))
			.where(eq(event.userId, userId)),
		db
			.select({
				id: meeting.id,
				title: meeting.title,
				description: meeting.description,
				startTime: meeting.startTime,
				endTime: meeting.endTime,
				attendees: meeting.attendees,
				meetingUrl: meeting.meetingUrl,
				location: meeting.location,
				calendarEventId: meeting.calendarEventId,
				botScheduled: meeting.botScheduled,
				botSent: meeting.botSent,
				botStatus: meeting.botStatus,
				user: {
					id: user.id,
					name: user.name,
					image: user.image,
				},
			})
			.from(meeting)
			.innerJoin(user, eq(meeting.userId, user.id))
			.where(
				and(
					eq(meeting.userId, userId),
					or(eq(meeting.botScheduled, true), eq(meeting.botSent, true)),
				),
			),
	]);

	return sortCalendarEvents([
		...manualEventRows.map(normalizeManualEventRow),
		...meetingRows.map(normalizeMeetingRow),
	]);
}

export async function getCalendarFeed(args: {
	user: {
		id: string;
		name: string;
		image?: string | null;
	};
	rangeStart?: Date;
	rangeEnd?: Date;
	timeZone?: string | null;
	includeGoogleOverlay?: boolean;
}): Promise<Event[]> {
	const storedEvents = await getStoredCalendarEvents(args.user.id);

	if (
		!args.includeGoogleOverlay ||
		!args.rangeStart ||
		!args.rangeEnd ||
		!args.timeZone
	) {
		return storedEvents;
	}

	const googleOverlayEvents = await getGoogleOverlayEvents({
		rangeStart: args.rangeStart,
		rangeEnd: args.rangeEnd,
		timeZone: args.timeZone,
		user: args.user,
	});

	return mergeCalendarEventSources(storedEvents, googleOverlayEvents);
}
