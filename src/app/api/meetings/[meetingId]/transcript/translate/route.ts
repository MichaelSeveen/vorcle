import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { meeting } from "@/db/schema";
import { translateTranscript } from "@/helpers/rag-workflow/translate";
import { getCurrentUser } from "@/helpers/user";
import {
	getStoredTranscriptTranslations,
	normalizeLanguageCode,
	TRANSCRIPT_TRANSLATION_LANGUAGE_CODES,
} from "@/lib/meetings/transcript";

const translateTranscriptRequestSchema = z.object({
	targetLanguage: z.enum(TRANSCRIPT_TRANSLATION_LANGUAGE_CODES),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ meetingId: string }> },
) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const requestJson = await request.json().catch(() => null);
		const validationResult =
			translateTranscriptRequestSchema.safeParse(requestJson);

		if (!validationResult.success) {
			return NextResponse.json(
				{ error: "Invalid transcript translation request" },
				{ status: 400 },
			);
		}

		const { meetingId } = await params;
		const [meetingRow] = await db
			.select({
				id: meeting.id,
				transcript: meeting.transcript,
				transcriptSourceLanguage: meeting.transcriptSourceLanguage,
				transcriptTranslations: meeting.transcriptTranslations,
			})
			.from(meeting)
			.where(and(eq(meeting.id, meetingId), eq(meeting.userId, currentUser.id)))
			.limit(1);

		if (!meetingRow) {
			return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
		}

		if (!meetingRow.transcript) {
			return NextResponse.json(
				{ error: "This meeting does not have a transcript yet" },
				{ status: 400 },
			);
		}

		const storedTranslations = getStoredTranscriptTranslations(
			meetingRow.transcriptTranslations,
		);
		const existingTranslation =
			storedTranslations[validationResult.data.targetLanguage];

		if (existingTranslation) {
			return NextResponse.json({
				cached: true,
				translation: existingTranslation,
			});
		}

		const translation = await translateTranscript({
			targetLanguage: validationResult.data.targetLanguage,
			transcript: meetingRow.transcript,
		});
		const transcriptSourceLanguage =
			normalizeLanguageCode(meetingRow.transcriptSourceLanguage) ??
			translation.sourceLanguage;
		const nextTranslations = {
			...storedTranslations,
			[validationResult.data.targetLanguage]: {
				...translation,
				sourceLanguage: transcriptSourceLanguage,
			},
		};

		await db
			.update(meeting)
			.set({
				transcriptSourceLanguage: transcriptSourceLanguage,
				transcriptTranslations: nextTranslations,
			})
			.where(
				and(eq(meeting.id, meetingId), eq(meeting.userId, currentUser.id)),
			);

		return NextResponse.json({
			cached: false,
			translation: nextTranslations[validationResult.data.targetLanguage],
		});
	} catch (error) {
		console.error("Failed to translate transcript", error);
		return NextResponse.json(
			{ error: "Failed to translate transcript" },
			{ status: 500 },
		);
	}
}
