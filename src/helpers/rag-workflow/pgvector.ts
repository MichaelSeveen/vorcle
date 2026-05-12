import { and, cosineDistance, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { meeting, transcriptChunk } from "@/db/schema";

interface TranscriptSearchFilters {
	userId: string;
	meetingId?: string;
}

export interface TranscriptSearchResult {
	content: string;
	distance: unknown;
	meetingId: string;
	meetingTitle: string | null;
	speakerName: string | null;
}

export async function searchTranscriptChunks(
	embedding: number[],
	filter: TranscriptSearchFilters,
	topK: number = 5,
): Promise<TranscriptSearchResult[]> {
	const distance = cosineDistance(transcriptChunk.embedding, embedding);
	const where = filter.meetingId
		? and(
				eq(meeting.userId, filter.userId),
				eq(transcriptChunk.meetingId, filter.meetingId),
				isNotNull(transcriptChunk.embedding),
			)
		: and(
				eq(meeting.userId, filter.userId),
				isNotNull(transcriptChunk.embedding),
			);

	return db
		.select({
			content: transcriptChunk.content,
			distance,
			meetingId: transcriptChunk.meetingId,
			meetingTitle: meeting.title,
			speakerName: transcriptChunk.speakerName,
		})
		.from(transcriptChunk)
		.innerJoin(meeting, eq(transcriptChunk.meetingId, meeting.id))
		.where(where)
		.orderBy(distance)
		.limit(topK);
}
