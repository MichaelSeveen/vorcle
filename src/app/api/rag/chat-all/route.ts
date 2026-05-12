import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { chatWithAllMeetings } from "@/helpers/rag-workflow/utils";
import { getCurrentUser } from "@/helpers/user";
import {
	decrementChatUsage,
	incrementUserChatTokenUsage,
} from "@/lib/token-usage";

export async function POST(request: NextRequest) {
	try {
		const { question, userId: slackUserId } = await request.json();

		if (!question) {
			return NextResponse.json({ error: "Missing question" }, { status: 400 });
		}

		let targetUserId = slackUserId;

		if (!slackUserId) {
			const currentUser = await getCurrentUser();

			if (!currentUser) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}

			targetUserId = currentUser.id;
		} else {
			const [userRow] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.id, slackUserId))
				.limit(1);

			if (!userRow) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			targetUserId = userRow.id;
		}

		const usageResult = await incrementUserChatTokenUsage(targetUserId);
		if (!usageResult.success) {
			return NextResponse.json(
				{
					error: usageResult.message ?? "Chat limit reached",
					upgradeRequired: usageResult.upgradeRequired ?? false,
				},
				{ status: 403 },
			);
		}

		try {
			const response = await chatWithAllMeetings(targetUserId, question);

			return NextResponse.json(response);
		} catch (chatError) {
			try {
				await decrementChatUsage(targetUserId);
			} catch (releaseError) {
				console.error(
					"Failed to refund chat usage after chat-all error:",
					releaseError,
				);
			}

			throw chatError;
		}
	} catch (error) {
		console.error("Error in chat:", error);
		return NextResponse.json(
			{
				error: "Failed to process question",
				answer:
					"I encountered an error while searching your meetings. Please try again.",
			},
			{ status: 500 },
		);
	}
}
