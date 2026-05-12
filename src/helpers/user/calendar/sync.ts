import "server-only";

import { and, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { account, meeting, user } from "@/db/schema";
import {
	getValidGoogleAccessToken,
	markCalendarDisconnected,
} from "./google-auth";

interface CalendarSyncCandidate {
	accessToken: string | null;
	accessTokenExpiresAt: Date | null;
	refreshToken: string | null;
	userId: string;
}

interface GoogleCalendarEventResponse {
	items?: GoogleCalendarEvent[];
}

interface GoogleCalendarEvent {
	attendees?: Array<{ email?: string }>;
	conferenceData?: {
		entryPoints?: Array<{ uri?: string }>;
	};
	description?: string;
	htmlLink?: string;
	end?: {
		date?: string;
		dateTime?: string;
	};
	hangoutLink?: string;
	id?: string;
	location?: string;
	start?: {
		date?: string;
		dateTime?: string;
	};
	status?: string;
	summary?: string;
}

async function removeCalendarMeetingByEventId(calendarEventId: string) {
	await db.delete(meeting).where(eq(meeting.calendarEventId, calendarEventId));
}

async function upsertCalendarMeeting(
	userId: string,
	event: GoogleCalendarEvent,
) {
	const meetingUrl =
		event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri;

	if (
		!event.id ||
		!meetingUrl ||
		!event.start?.dateTime ||
		!event.end?.dateTime
	) {
		return 0;
	}

	const attendees = event.attendees?.length
		? event.attendees
				.filter((attendee) => attendee.email)
				.map((attendee) => ({
					email: attendee.email,
					name: attendee.email,
				}))
		: null;

	const [existingMeeting] = await db
		.select({
			botSent: meeting.botSent,
			id: meeting.id,
		})
		.from(meeting)
		.where(eq(meeting.calendarEventId, event.id))
		.limit(1);

	if (existingMeeting) {
		const now = new Date();
		const updateData = {
			attendees,
			description: event.description || null,
			endTime: new Date(event.end.dateTime),
			location: event.location || null,
			meetingUrl,
			startTime: new Date(event.start.dateTime),
			title: event.summary || "Untitled Meeting",
			updatedAt: now,
		};

		await db
			.update(meeting)
			.set(
				existingMeeting.botSent
					? updateData
					: {
							...updateData,
							botScheduled: true,
						},
			)
			.where(eq(meeting.id, existingMeeting.id));

		return 1;
	}

	const now = new Date();
	await db.insert(meeting).values({
		attendees,
		botScheduled: true,
		calendarEventId: event.id,
		createdAt: now,
		description: event.description || null,
		endTime: new Date(event.end.dateTime),
		isFromCalendar: true,
		location: event.location || null,
		meetingUrl,
		startTime: new Date(event.start.dateTime),
		title: event.summary || "Untitled Meeting",
		updatedAt: now,
		userId,
	});

	return 1;
}

async function syncUserCalendar(candidate: CalendarSyncCandidate) {
	const now = new Date();
	const accessToken = await getValidGoogleAccessToken(candidate);

	if (!accessToken) {
		return { removed: 0, upserted: 0 };
	}

	const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${sevenDaysFromNow.toISOString()}&singleEvents=true&orderBy=startTime&showDeleted=true`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		if (response.status === 401 || response.status === 403) {
			await markCalendarDisconnected(candidate.userId);
			return { removed: 0, upserted: 0 };
		}

		throw new Error(`Calendar API failed: ${response.status}`);
	}

	const data = (await response.json()) as GoogleCalendarEventResponse;
	const events = data.items ?? [];

	const existingMeetings = await db
		.select({
			calendarEventId: meeting.calendarEventId,
			id: meeting.id,
		})
		.from(meeting)
		.where(
			and(
				eq(meeting.userId, candidate.userId),
				eq(meeting.isFromCalendar, true),
				gte(meeting.startTime, now),
			),
		);

	const seenGoogleEventIds = new Set<string>();
	let removed = 0;
	let upserted = 0;

	for (const event of events) {
		if (!event.id) {
			continue;
		}

		if (event.status === "cancelled") {
			await removeCalendarMeetingByEventId(event.id);
			removed += 1;
			continue;
		}

		seenGoogleEventIds.add(event.id);
		upserted += await upsertCalendarMeeting(candidate.userId, event);
	}

	for (const dbMeeting of existingMeetings) {
		if (
			dbMeeting.calendarEventId &&
			!seenGoogleEventIds.has(dbMeeting.calendarEventId)
		) {
			await db.delete(meeting).where(eq(meeting.id, dbMeeting.id));
			removed += 1;
		}
	}

	return { removed, upserted };
}

export async function syncAllUserCalendars() {
	const candidates = await db
		.select({
			accessToken: account.accessToken,
			accessTokenExpiresAt: account.accessTokenExpiresAt,
			refreshToken: account.refreshToken,
			userId: user.id,
		})
		.from(user)
		.innerJoin(
			account,
			and(eq(account.userId, user.id), eq(account.providerId, "google")),
		)
		.where(
			and(eq(user.calendarConnected, true), isNotNull(account.accessToken)),
		);

	let failedUsers = 0;
	let removed = 0;
	let syncedUsers = 0;
	let upserted = 0;

	for (const candidate of candidates) {
		try {
			const result = await syncUserCalendar(candidate);
			syncedUsers += 1;
			removed += result.removed;
			upserted += result.upserted;
		} catch (error) {
			failedUsers += 1;
			console.error(`Calendar sync failed for ${candidate.userId}:`, error);
		}
	}

	return {
		failedUsers,
		removed,
		syncedUsers,
		totalUsers: candidates.length,
		upserted,
	};
}
