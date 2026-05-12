"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { meeting } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function removeMeetingById(meetingId: string) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { success: false, error: "Not authenticated" };
		}

		const [meetingRow] = await db
			.select({
				id: meeting.id,
				userId: meeting.userId,
			})
			.from(meeting)
			.where(eq(meeting.id, meetingId))
			.limit(1);

		if (!meetingRow) {
			return { success: false, error: "Meeting not found" };
		}

		if (meetingRow.userId !== currentUser.id)
			return {
				success: false,
				error: "Not authorized to delete this meeting",
			};

		await db
			.delete(meeting)
			.where(
				and(eq(meeting.id, meetingId), eq(meeting.userId, currentUser.id)),
			);

		return {
			success: true,
			message: "Meeting deleted successfully",
		};
	} catch (error) {
		console.error("Failed to delete meeting:", error);
		return { success: false, error: "Failed to delete meeting" };
	}
}
