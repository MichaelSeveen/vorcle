import { eq } from "drizzle-orm";
import type { Event, User } from "@/components/event-calendar/config/types";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getStoredCalendarEvents } from "./feed";

export async function getCalendarEvents(userId: string): Promise<Event[]> {
	return getStoredCalendarEvents(userId);
}

export async function getEventUsers(userId: string): Promise<User[]> {
	const [userRow] = await db
		.select({
			id: user.id,
			name: user.name,
			image: user.image,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!userRow) {
		return [];
	}

	return [
		{
			id: userRow.id,
			name: userRow.name,
			picturePath:
				userRow.image || `https://tapback.co/api/avatar/${userRow.name}.webp`,
		},
	];
}
