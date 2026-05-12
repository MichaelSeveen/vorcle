import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userIntegration } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function POST(request: NextRequest) {
	const currentUser = await getCurrentUser();
	const { token } = await request.json();

	if (!currentUser || !token) {
		return NextResponse.json(
			{ error: "Missing user id or token" },
			{ status: 400 },
		);
	}

	try {
		await db
			.insert(userIntegration)
			.values({
				userId: currentUser.id,
				provider: "trello",
				accessToken: token,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [userIntegration.userId, userIntegration.provider],
				set: {
					accessToken: token,
					updatedAt: new Date(),
				},
			});
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving trello integration:", error);
		return NextResponse.json(
			{ error: "Failed to save trello integration" },
			{ status: 500 },
		);
	}
}
