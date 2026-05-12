import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meeting } from "@/db/schema";
import { processTranscript } from "@/helpers/rag-workflow/utils";
import { getCurrentUser } from "@/helpers/user";

export async function POST(request: NextRequest) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = currentUser.id;

	const { meetingId, transcript, meetingTitle } = await request.json();

	if (!meetingId || !transcript) {
		return NextResponse.json(
			{ error: "Missing meetingId or transcript" },
			{ status: 400 },
		);
	}

	try {
		const [meetingRow] = await db
			.select({
				ragProcessed: meeting.ragProcessed,
				userId: meeting.userId,
			})
			.from(meeting)
			.where(eq(meeting.id, meetingId))
			.limit(1);

		if (!meetingRow) {
			return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
		}

		if (meetingRow.userId !== userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (meetingRow.ragProcessed) {
			return NextResponse.json({
				success: true,
				message: "Already processed",
			});
		}

		await processTranscript(meetingId, userId, transcript, meetingTitle);

		await db
			.update(meeting)
			.set({
				ragProcessed: true,
				ragProcessedAt: new Date(),
			})
			.where(eq(meeting.id, meetingId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error processing transcript:", error);
		return NextResponse.json(
			{ error: "Failed to process transcript" },
			{ status: 500 },
		);
	}
}
