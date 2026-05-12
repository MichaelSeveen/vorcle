import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { userIntegration } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function POST() {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		await db
			.delete(userIntegration)
			.where(
				and(
					eq(userIntegration.userId, currentUser.id),
					eq(userIntegration.provider, "trello"),
				),
			);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error disconnecting trello:", error);
		return NextResponse.json(
			{ error: "Failed to disconnect trello" },
			{ status: 500 },
		);
	}
}
