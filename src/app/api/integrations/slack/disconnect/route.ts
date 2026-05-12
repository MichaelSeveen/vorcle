import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function POST() {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await db
			.update(user)
			.set({
				slackConnected: false,
				slackUserId: null,
				slackTeamId: null,
				preferredChannelId: null,
				preferredChannelName: null,
			})
			.where(eq(user.id, currentUser.id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Slack disconnect error:", error);
		return NextResponse.json(
			{ error: "Failed to disconnect" },
			{ status: 500 },
		);
	}
}
