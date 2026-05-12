import "server-only";

import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { meeting, user } from "@/db/schema";
import {
	consumeMeetingUsage,
	releaseMeetingUsage,
} from "@/helpers/subscriptions/usage";
import {
	isZoomMeetingUrl,
	joinMeeting,
	leaveMeetingBot,
} from "@/lib/meetingbaas/bots";
import { getUsableZoomCredentialIdForUser } from "@/lib/meetingbaas/zoom-credentials";
import { canUserSendBot } from "@/lib/token-usage";

function getFailureStatus(code?: string) {
	return code === "SUBSCRIPTION_RESTRICTION" || code === "MEETING_LIMIT_REACHED"
		? "blocked"
		: "failed";
}

export async function scheduleBotsForUpcomingMeetings() {
	const now = new Date();
	const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

	const upcomingMeetings = await db
		.select({
			id: meeting.id,
			meetingUrl: meeting.meetingUrl,
			title: meeting.title,
			userBotImageUrl: user.botImageUrl,
			userBotName: user.botName,
			userId: meeting.userId,
			botFailureCode: meeting.botFailureCode,
			botStatus: meeting.botStatus,
		})
		.from(meeting)
		.innerJoin(user, eq(meeting.userId, user.id))
		.where(
			and(
				gte(meeting.startTime, now),
				lte(meeting.startTime, fiveMinutesFromNow),
				eq(meeting.botScheduled, true),
				eq(meeting.botSent, false),
				isNotNull(meeting.meetingUrl),
			),
		);

	let scheduled = 0;
	let skipped = 0;

	for (const upcomingMeeting of upcomingMeetings) {
		let scheduledBotId: string | null = null;
		let meetingUsageCounted = false;

		try {
			const permission = await canUserSendBot(upcomingMeeting.userId);

			if (!permission.allowed) {
				if (
					upcomingMeeting.botFailureCode !== permission.code ||
					upcomingMeeting.botStatus !== getFailureStatus(permission.code)
				) {
					await db
						.update(meeting)
						.set({
							botFailureCode: permission.code ?? "SUBSCRIPTION_RESTRICTION",
							botFailureMessage: permission.reason,
							botSent: false,
							botStatus: getFailureStatus(permission.code),
							botStatusUpdatedAt: new Date(),
						})
						.where(eq(meeting.id, upcomingMeeting.id));
				}

				skipped += 1;
				continue;
			}

			let zoomCredentialId: string | undefined;

			if (isZoomMeetingUrl(upcomingMeeting.meetingUrl as string)) {
				const resolvedZoomCredentialId = await getUsableZoomCredentialIdForUser(
					upcomingMeeting.userId,
				);

				if (!resolvedZoomCredentialId) {
					throw new Error(
						"No active Zoom credential found. Connect or reconnect Zoom before recording external Zoom meetings.",
					);
				}

				zoomCredentialId = resolvedZoomCredentialId;
			}

			const scheduledBot = await joinMeeting({
				botImageUrl: upcomingMeeting.userBotImageUrl,
				botName: upcomingMeeting.userBotName,
				extraData: {
					meeting_id: upcomingMeeting.id,
					user_id: upcomingMeeting.userId,
				},
				meetingUrl: upcomingMeeting.meetingUrl as string,
				zoomCredentialId,
			});
			scheduledBotId = scheduledBot.bot_id;

			const meetingUsageResult = await db.transaction((tx) =>
				consumeMeetingUsage(upcomingMeeting.userId, tx),
			);

			if (!meetingUsageResult.allowed) {
				try {
					await leaveMeetingBot(scheduledBot.bot_id);
				} catch (leaveError) {
					console.error(
						`[MeetingBaas] Failed to rollback bot ${scheduledBot.bot_id} after usage rejection:`,
						leaveError,
					);
				}

				await db
					.update(meeting)
					.set({
						botFailureCode: meetingUsageResult.code ?? "MEETING_LIMIT_REACHED",
						botFailureMessage: meetingUsageResult.reason,
						botSent: false,
						botStatus: getFailureStatus(meetingUsageResult.code),
						botStatusUpdatedAt: new Date(),
						usageCountedAt: null,
					})
					.where(eq(meeting.id, upcomingMeeting.id));

				skipped += 1;
				continue;
			}

			meetingUsageCounted = true;

			await db
				.update(meeting)
				.set({
					botFailureCode: null,
					botFailureMessage: null,
					botId: scheduledBot.bot_id,
					botSent: true,
					botStatus: "queued",
					botStatusUpdatedAt: new Date(),
					usageCountedAt: new Date(),
				})
				.where(eq(meeting.id, upcomingMeeting.id));

			scheduled += 1;
		} catch (error) {
			skipped += 1;
			const message =
				error instanceof Error ? error.message : "Unknown scheduling error";

			if (meetingUsageCounted) {
				try {
					await db.transaction((tx) =>
						releaseMeetingUsage(upcomingMeeting.userId, tx),
					);
				} catch (releaseError) {
					console.error(
						`[MeetingBaas] Failed to release usage after scheduler error for ${upcomingMeeting.title}:`,
						releaseError,
					);
				}
			}

			if (scheduledBotId) {
				try {
					await leaveMeetingBot(scheduledBotId);
				} catch (leaveError) {
					console.error(
						`[MeetingBaas] Failed to leave bot ${scheduledBotId} after scheduler error:`,
						leaveError,
					);
				}
			}

			await db
				.update(meeting)
				.set({
					botFailureCode: null,
					botFailureMessage: message,
					botSent: false,
					botStatus: "failed",
					botStatusUpdatedAt: new Date(),
					usageCountedAt: null,
				})
				.where(eq(meeting.id, upcomingMeeting.id));

			console.error(
				`[MeetingBaas] Bot scheduling failed for ${upcomingMeeting.title}:`,
				error,
			);
		}
	}

	return { scheduled, skipped };
}
