import { type NextRequest, NextResponse } from "next/server";
import { chatWithMeeting } from "@/helpers/rag-workflow/utils";
import { getCurrentUser } from "@/helpers/user";
import {
	decrementChatUsage,
	incrementUserChatTokenUsage,
} from "@/lib/token-usage";

export async function POST(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		const userId = currentUser.id;

		const { meetingId, question } = await request.json();

		if (!meetingId || !question) {
			return NextResponse.json(
				{ error: "Missing meetingId or question" },
				{ status: 400 },
			);
		}
		const usageResult = await incrementUserChatTokenUsage(userId);
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
			const response = await chatWithMeeting(userId, meetingId, question);

			return NextResponse.json(response);
		} catch (chatError) {
			try {
				await decrementChatUsage(userId);
			} catch (releaseError) {
				console.error(
					"Failed to refund chat usage after meeting chat error:",
					releaseError,
				);
			}

			throw chatError;
		}
	} catch (error) {
		console.error("Error in chat:", error);
		return NextResponse.json(
			{ error: "Failed to process question" },
			{ status: 500 },
		);
	}
}
