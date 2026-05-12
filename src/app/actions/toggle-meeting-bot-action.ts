"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { segments } from "@/config/segments";
import { db } from "@/db";
import { meeting, user } from "@/db/schema";
import { releaseMeetingUsage } from "@/helpers/subscriptions/usage";
import { getCurrentUser } from "@/helpers/user";
import { leaveMeetingBot } from "@/lib/meetingbaas/bots";

function shouldLeaveRunningBot(status: string | null) {
	return status !== "completed" && status !== "failed" && status !== "canceled";
}

export async function toggleMeetingBotAction(
	meetingId: string,
	botScheduled: boolean,
) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) return { success: false, error: "Not authenticated" };

		const [userRow] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.id, currentUser.id))
			.limit(1);

		if (!userRow) return { success: false, error: "User not found" };

		const [meetingRow] = await db
			.select({
				id: meeting.id,
				botId: meeting.botId,
				botJoinedAt: meeting.botJoinedAt,
				botScheduled: meeting.botScheduled,
				botSent: meeting.botSent,
				botStatus: meeting.botStatus,
				meetingEnded: meeting.meetingEnded,
				usageCountedAt: meeting.usageCountedAt,
				userId: meeting.userId,
			})
			.from(meeting)
			.where(and(eq(meeting.id, meetingId), eq(meeting.userId, userRow.id)))
			.limit(1);

		if (!meetingRow) {
			return { success: false, error: "Meeting not found" };
		}

		const isDisablingBot = !botScheduled;

		if (
			isDisablingBot &&
			meetingRow.botId &&
			meetingRow.botSent &&
			!meetingRow.meetingEnded &&
			shouldLeaveRunningBot(meetingRow.botStatus)
		) {
			await leaveMeetingBot(meetingRow.botId);
		}

		const now = new Date();
		const [updatedMeeting] = await db.transaction(async (tx) => {
			if (
				isDisablingBot &&
				meetingRow.usageCountedAt &&
				!meetingRow.botJoinedAt
			) {
				await releaseMeetingUsage(meetingRow.userId, tx);
			}

			return tx
				.update(meeting)
				.set(
					isDisablingBot
						? {
								botFailureCode: null,
								botFailureMessage: null,
								botId: meetingRow.botJoinedAt ? meetingRow.botId : null,
								botScheduled: false,
								botSent: !!meetingRow.botJoinedAt,
								botStatus: "canceled",
								botStatusUpdatedAt: now,
								usageCountedAt: meetingRow.botJoinedAt
									? meetingRow.usageCountedAt
									: null,
							}
						: {
								botFailureCode: null,
								botFailureMessage: null,
								botScheduled: true,
								botStatus: meetingRow.botSent ? meetingRow.botStatus : null,
								botStatusUpdatedAt: now,
							},
				)
				.where(and(eq(meeting.id, meetingId), eq(meeting.userId, userRow.id)))
				.returning({
					botScheduled: meeting.botScheduled,
					botSent: meeting.botSent,
					botStatus: meeting.botStatus,
				});
		});

		if (!updatedMeeting) {
			return { success: false, error: "Meeting not found" };
		}

		revalidatePath(segments.workspace.home);
		revalidatePath(segments.workspace.calendar);

		return {
			success: true,
			botScheduled: updatedMeeting.botScheduled,
			botSent: updatedMeeting.botSent,
			botStatus: updatedMeeting.botStatus,
			message: `Bot ${
				updatedMeeting.botScheduled ? "enabled" : "disabled"
			} for meeting`,
		};
	} catch (error) {
		console.error("toggleMeetingBotAction error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update bot status",
		};
	}
}
