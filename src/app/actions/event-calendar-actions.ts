"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type {
	Event,
	ManualEventInput,
} from "@/components/event-calendar/config/types";
import { segments } from "@/config/segments";
import { db } from "@/db";
import { event, user } from "@/db/schema";
import { normalizeManualEventRow } from "@/helpers/event-calendar/normalize";
import { getCurrentUser } from "@/helpers/user";

export async function create(data: ManualEventInput) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { success: false, error: "Not authenticated" };
		}

		const [newEvent] = await db
			.insert(event)
			.values({
				attendees: data.attendees?.length ? data.attendees : null,
				color: data.color,
				description: data.description || null,
				endDate: new Date(data.endDate),
				isAllDay: data.isAllDay,
				location: data.location || null,
				meetingLink: data.meetingLink || null,
				recurrenceExDates: data.recurrence?.exDates?.length
					? data.recurrence.exDates
					: null,
				recurrenceRule: data.recurrence?.rule ?? null,
				recurrenceTimezone: data.recurrence?.timezone ?? data.timeZone ?? null,
				startDate: new Date(data.startDate),
				timeZone: data.timeZone ?? null,
				title: data.title,
				userId: currentUser.id,
			})
			.returning();

		if (newEvent) {
			const [userRow] = await db
				.select({ id: user.id, name: user.name, image: user.image })
				.from(user)
				.where(eq(user.id, currentUser.id))
				.limit(1);

			if (!userRow) {
				return { success: false, error: "User not found" };
			}

			revalidatePath(segments.workspace.calendar);

			return {
				success: true,
				event: normalizeManualEventRow({
					...newEvent,
					user: userRow,
				}),
			};
		}

		return { success: false, error: "Failed to create event" };
	} catch (error) {
		console.error("Error creating event:", error);
		return { success: false, error: "Failed to create event" };
	}
}

export async function update(data: Event) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { success: false, error: "Not authenticated" };
		}

		if (data.source !== "manual" || !data.editable) {
			return { success: false, error: "Only manual events can be edited" };
		}

		const [updatedEvent] = await db
			.update(event)
			.set({
				attendees: data.attendees?.length ? data.attendees : null,
				color: data.color,
				description: data.description,
				endDate: new Date(data.endDate),
				isAllDay: data.isAllDay,
				location: data.location,
				meetingLink: data.meetingLink,
				recurrenceExDates: data.recurrence?.exDates?.length
					? data.recurrence.exDates
					: null,
				recurrenceRule: data.recurrence?.rule ?? null,
				recurrenceTimezone: data.recurrence?.timezone ?? data.timeZone ?? null,
				startDate: new Date(data.startDate),
				timeZone: data.timeZone ?? null,
				title: data.title,
			})
			.where(and(eq(event.id, data.sourceId), eq(event.userId, currentUser.id)))
			.returning();

		if (!updatedEvent) {
			return { success: false, error: "Event not found" };
		}

		const [userRow] = await db
			.select({ id: user.id, name: user.name, image: user.image })
			.from(user)
			.where(eq(user.id, currentUser.id))
			.limit(1);

		if (!userRow) {
			return { success: false, error: "User not found" };
		}

		revalidatePath(segments.workspace.calendar);

		return {
			success: true,
			event: normalizeManualEventRow({
				...updatedEvent,
				user: userRow,
			}),
		};
	} catch (error) {
		console.error("Error updating event:", error);
		return { success: false, error: "Failed to update event" };
	}
}

export async function remove(id: string) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { success: false, error: "Not authenticated" };
		}

		const [deletedEvent] = await db
			.delete(event)
			.where(and(eq(event.id, id), eq(event.userId, currentUser.id)))
			.returning({ id: event.id });

		if (!deletedEvent) {
			return { success: false, error: "Event not found" };
		}

		revalidatePath(segments.workspace.calendar);

		return { success: true };
	} catch (error) {
		console.error("Error deleting event:", error);
		return { success: false, error: "Failed to delete event" };
	}
}
