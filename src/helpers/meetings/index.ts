import "server-only";
import { and, asc, eq, gte } from "drizzle-orm";
import type { GoogleCalendarEvent, MeetingData } from "@/config/types";
import { db } from "@/db";
import { meeting, user } from "@/db/schema";
import { createMeetingArtifactReadUrl } from "@/lib/meetingbaas/storage";

export type MeetingByIdResult =
	| {
			ok: true;
			data: MeetingData;
	  }
	| { ok: false; error: string };

export async function getMeetingById(
	meetingId: string,
	userId: string,
): Promise<MeetingByIdResult> {
	try {
		const [row] = await db
			.select({
				id: meeting.id,
				title: meeting.title,
				description: meeting.description,
				startTime: meeting.startTime,
				endTime: meeting.endTime,
				transcript: meeting.transcript,
				transcriptSourceLanguage: meeting.transcriptSourceLanguage,
				transcriptTranslations: meeting.transcriptTranslations,
				summary: meeting.summary,
				decisions: meeting.decisions,
				blockers: meeting.blockers,
				actionItems: meeting.actionItems,
				audioObjectKey: meeting.audioObjectKey,
				processed: meeting.processed,
				processedAt: meeting.processedAt,
				recordingUrl: meeting.recordingUrl,
				emailSent: meeting.emailSent,
				emailSentAt: meeting.emailSentAt,
				userId: meeting.userId,
				ragProcessed: meeting.ragProcessed,
				attendees: meeting.attendees,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
				},
			})
			.from(meeting)
			.innerJoin(user, eq(meeting.userId, user.id))
			.where(and(eq(meeting.id, meetingId), eq(meeting.userId, userId)))
			.limit(1);

		if (!row) return { ok: false, error: "Meeting not found" };

		const isOwner = userId === row.user.id;
		let signedRecordingUrl = row.recordingUrl;

		if (isOwner && row.audioObjectKey) {
			try {
				signedRecordingUrl = await createMeetingArtifactReadUrl(
					row.audioObjectKey,
				);
			} catch (error) {
				console.error("Failed to create signed meeting recording URL", error);
			}
		}

		const data = {
			...row,
			isOwner,
			recordingUrl: signedRecordingUrl,
		};

		return { ok: true, data };
	} catch (error) {
		console.error("Failed to load meeting", error);
		return { ok: false, error: "Failed to load meeting" };
	}
}

type GetUpcomingMeetingsResult =
	| {
			ok: true;
			events: GoogleCalendarEvent[];
			connected: boolean;
			source: string;
	  }
	| { ok: false; events: []; connected: false; error: string };

export async function getUpcomingMeetings(
	userId: string,
	isCalendarConnected: boolean | null | undefined,
): Promise<GetUpcomingMeetingsResult> {
	try {
		const now = new Date();
		const upcomingMeetings = await db
			.select()
			.from(meeting)
			.where(
				and(
					eq(meeting.userId, userId),
					gte(meeting.startTime, now),
					eq(meeting.isFromCalendar, true),
				),
			)
			.orderBy(asc(meeting.startTime))
			.limit(10);

		const events = upcomingMeetings.map<GoogleCalendarEvent>((m) => ({
			attendees: Array.isArray(m.attendees)
				? m.attendees
				: typeof m.attendees === "string"
					? JSON.parse(m.attendees)
					: [],
			id: m.calendarEventId || m.id,
			summary: m.title,
			start: { dateTime: m.startTime.toISOString() },
			end: { dateTime: m.endTime.toISOString() },
			hangoutLink: m.meetingUrl,
			conferenceData: m.meetingUrl
				? { entryPoints: [{ uri: m.meetingUrl }] }
				: null,
			botScheduled: m.botScheduled,
			meetingId: m.id,
			botSent: m.botSent,
			botStatus: m.botStatus,
			botFailureCode: m.botFailureCode,
			botFailureMessage: m.botFailureMessage,
		}));

		return {
			ok: true,
			events,
			connected: !!isCalendarConnected,
			source: "database-sync",
		};
	} catch (error) {
		console.error("Error loading your upcoming meetings:", error);
		return {
			ok: false,
			events: [],
			connected: false,
			error: "Failed to load upcoming meetings",
		};
	}
}
