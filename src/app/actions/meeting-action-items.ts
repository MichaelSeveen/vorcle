"use server";

import { and, eq } from "drizzle-orm";
import type { ActionItem } from "@/config/types";
import { db } from "@/db";
import { meeting } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function createActionItem(meetingId: string, itemText: string) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) return { success: false, error: "Not authenticated" };

		if (!itemText || itemText.trim().length === 0) {
			return { success: false, error: "Action item text cannot be empty" };
		}

		if (itemText.trim().length > 500) {
			return {
				success: false,
				error: "Action item text too long (max 500 characters)",
			};
		}

		const [meetingRow] = await db
			.select()
			.from(meeting)
			.where(and(eq(meeting.id, meetingId), eq(meeting.userId, currentUser.id)))
			.limit(1);

		if (!meetingRow)
			return {
				success: false,
				error: "Meeting not found",
			};

		const existingItems =
			(meetingRow.actionItems as unknown as ActionItem[]) || [];

		const nextId =
			existingItems.length > 0
				? Math.max(...existingItems.map((item) => item.id || 0)) + 1
				: 1;

		const newActionItem = {
			id: nextId,
			text: itemText,
		};

		const updatedActionItems = [...existingItems, newActionItem];

		await db
			.update(meeting)
			.set({
				actionItems: updatedActionItems,
			})
			.where(
				and(eq(meeting.id, meetingId), eq(meeting.userId, currentUser.id)),
			);

		return { success: true, data: newActionItem };
	} catch (error) {
		console.error("Error adding action item", error);
		return { success: false, error: "Failed to add action item" };
	}
}

export async function removeActionItem(meetingId: string, itemId: number) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) return { success: false, error: "Not authenticated" };

		const [meetingRow] = await db
			.select()
			.from(meeting)
			.where(and(eq(meeting.id, meetingId), eq(meeting.userId, currentUser.id)))
			.limit(1);

		if (!meetingRow) return { success: false, error: "Meeting not found" };

		const actionItems =
			(meetingRow.actionItems as unknown as ActionItem[]) || [];

		const updatedActionItems = actionItems.filter((item) => item.id !== itemId);

		await db
			.update(meeting)
			.set({
				actionItems: updatedActionItems,
			})
			.where(
				and(eq(meeting.id, meetingId), eq(meeting.userId, currentUser.id)),
			);

		return { success: true };
	} catch (error) {
		console.error("Error deleting action item:", error);
		return { success: false, error: "Error deleting action item" };
	}
}
