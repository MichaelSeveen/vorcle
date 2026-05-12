import "server-only";

import type { Event } from "@/components/event-calendar/config/types";
import { normalizeGoogleOverlayEvent } from "@/helpers/event-calendar/normalize";
import {
	getGoogleAccountTokens,
	getValidGoogleAccessToken,
	markCalendarDisconnected,
} from "./google-auth";

interface GoogleOverlayApiResponse {
	items?: GoogleOverlayApiEvent[];
}

interface GoogleOverlayApiEvent {
	id?: string;
	summary?: string;
	description?: string;
	location?: string;
	htmlLink?: string;
	hangoutLink?: string | null;
	conferenceData?: {
		entryPoints?: Array<{ uri?: string }>;
	};
	start?: {
		date?: string;
		dateTime?: string;
	};
	end?: {
		date?: string;
		dateTime?: string;
	};
	attendees?: Array<{
		email?: string;
		displayName?: string;
		responseStatus?: "accepted" | "declined" | "tentative" | "needsAction";
		self?: boolean;
	}>;
	status?: string;
}

export async function getGoogleOverlayEvents(args: {
	rangeStart: Date;
	rangeEnd: Date;
	timeZone: string;
	user: {
		id: string;
		name: string;
		image?: string | null;
	};
}): Promise<Event[]> {
	const tokens = await getGoogleAccountTokens(args.user.id);

	if (!tokens) {
		return [];
	}

	const accessToken = await getValidGoogleAccessToken(tokens);

	if (!accessToken) {
		return [];
	}

	const searchParams = new URLSearchParams({
		orderBy: "startTime",
		showDeleted: "false",
		singleEvents: "true",
		timeMax: args.rangeEnd.toISOString(),
		timeMin: args.rangeStart.toISOString(),
		timeZone: args.timeZone,
	});

	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/primary/events?${searchParams.toString()}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		if (response.status === 401 || response.status === 403) {
			await markCalendarDisconnected(args.user.id);
			return [];
		}

		throw new Error(`Google Calendar overlay failed: ${response.status}`);
	}

	const data = (await response.json()) as GoogleOverlayApiResponse;

	return (data.items ?? [])
		.filter(
			(event): event is GoogleOverlayApiEvent & { id: string } =>
				!!event.id && event.status !== "cancelled",
		)
		.map((event) =>
			normalizeGoogleOverlayEvent({
				event: {
					...event,
					attendees: event.attendees?.map((attendee) => ({
						email: attendee.email,
						name: attendee.displayName ?? attendee.email,
						responseStatus: attendee.responseStatus,
					})),
					id: event.id,
				},
				timeZone: args.timeZone,
				user: args.user,
			}),
		)
		.filter((event): event is Event => event !== null);
}
