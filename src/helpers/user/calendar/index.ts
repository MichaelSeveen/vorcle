import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, user } from "@/db/schema";

export async function getUserCalendarStatus(userId: string) {
	try {
		const [userRow] = await db
			.select({ calendarConnected: user.calendarConnected })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		const [accountRow] = await db
			.select({ accessToken: account.accessToken })
			.from(account)
			.where(and(eq(account.userId, userId), eq(account.providerId, "google")))
			.limit(1);

		if (!userRow || !accountRow) {
			return {
				success: false,
				message: "User does not exist",
			};
		}

		const connected = Boolean(
			userRow.calendarConnected && accountRow.accessToken,
		);

		return { success: true, connected };
	} catch (error) {
		console.error("Error loading calendar status", error);
		return {
			success: false,
			connected: false,
			message: "Error loading calendar status",
		};
	}
}
