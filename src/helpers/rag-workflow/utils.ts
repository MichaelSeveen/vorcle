import { and, asc, eq } from "drizzle-orm";
import type { TranscriptSegment } from "@/config/types";
import { db } from "@/db";
import { meeting, transcriptChunk } from "@/db/schema";
import { formatTranscriptToText } from "@/lib/meetings/transcript";
import { summarySchema } from "@/lib/zod-schema/meeting-summary-schema";
import {
	buildMultiMeetingQASystemPrompt,
	buildSingleMeetingQASystemPrompt,
} from "../prompts";
import {
	chatWithAI,
	createEmbedding,
	createManyEmbeddings,
	generateMeetingInsights,
} from "./google-ai";
import { searchTranscriptChunks } from "./pgvector";
import { chunkTranscript, extractSpeaker } from "./text-chunker";

const EXCERPT_REFERENCE_PATTERN = /\s*\[Excerpt\s+\d+\]/gi;
const SUMMARY_REQUEST_PATTERN =
	/\b(summarize|summarise|summary|recap|overview|tl;?dr|key points|what happened)\b/i;
const MAX_SUMMARY_CONTEXT_CHUNKS = 24;
const MAX_SUMMARY_CONTEXT_CHARACTERS = 12_000;
const EMPTY_AI_ANSWER =
	"I found meeting content, but could not generate a readable answer. Please try rephrasing your question.";
const MISSING_MEETING_ANSWER =
	"I could not find that meeting in your workspace.";
const MISSING_TRANSCRIPT_ANSWER =
	"I could not find processed transcript content for that meeting yet. Please try again after the transcript finishes processing.";
const UNUSABLE_MEETING_SUMMARIES = new Set([
	"Summary couldn't be generated",
	"Meeting transcript processed successfully. Please check the full transcript for details.",
]);

function stripInternalExcerptReferences(answer: string) {
	return answer
		.replace(EXCERPT_REFERENCE_PATTERN, "")
		.replace(/[ \t]+([,.;:!?])/g, "$1")
		.replace(/[ \t]{2,}/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function toVisibleAnswer(answer: string, fallback = EMPTY_AI_ANSWER) {
	return stripInternalExcerptReferences(answer) || fallback;
}

function isSummaryRequest(question: string) {
	return SUMMARY_REQUEST_PATTERN.test(question);
}

function getUsableMeetingSummary(summary: string | null) {
	const trimmedSummary = summary?.trim();

	if (!trimmedSummary || UNUSABLE_MEETING_SUMMARIES.has(trimmedSummary)) {
		return null;
	}

	return stripInternalExcerptReferences(trimmedSummary) || null;
}

function trimContext(context: string) {
	if (context.length <= MAX_SUMMARY_CONTEXT_CHARACTERS) {
		return context;
	}

	return `${context.slice(0, MAX_SUMMARY_CONTEXT_CHARACTERS).trim()}\n\n[Transcript truncated]`;
}

function buildExcerptContext(
	chunks: Array<{ content: string; speakerName?: string | null }>,
) {
	return trimContext(
		chunks
			.map((chunk, index) => {
				const speaker = chunk.speakerName || "Unknown";
				return `[Excerpt ${index + 1}]
			Speaker: ${speaker}
			Content: ${chunk.content}`;
			})
			.join("\n\n"),
	);
}

async function getMeetingTranscriptChunks(meetingId: string) {
	return db
		.select({
			content: transcriptChunk.content,
			speakerName: transcriptChunk.speakerName,
			meetingId: transcriptChunk.meetingId,
		})
		.from(transcriptChunk)
		.where(eq(transcriptChunk.meetingId, meetingId))
		.orderBy(asc(transcriptChunk.chunkIndex))
		.limit(MAX_SUMMARY_CONTEXT_CHUNKS);
}

function getTranscriptFallbackChunks(meetingId: string, transcript: unknown) {
	const transcriptText = formatTranscriptToText(transcript).trim();

	if (!transcriptText) {
		return [];
	}

	return chunkTranscript(transcriptText)
		.slice(0, MAX_SUMMARY_CONTEXT_CHUNKS)
		.map((chunk) => ({
			content: chunk.content,
			speakerName: extractSpeaker(chunk.content),
			meetingId,
		}));
}

export async function processTranscript(
	meetingId: string,
	_userId: string,
	transcript: string,
	_meetingTitle?: string,
) {
	const chunks = chunkTranscript(transcript);

	if (chunks.length === 0) {
		throw new Error("Transcript did not produce any searchable chunks");
	}

	const texts = chunks.map((chunk) => chunk.content);
	const embeddings = await createManyEmbeddings(texts);

	const dbChunks = chunks.map((chunk, index) => ({
		meetingId,
		chunkIndex: chunk.chunkIndex,
		content: chunk.content,
		embedding: embeddings[index],
		speakerName: extractSpeaker(chunk.content),
	}));

	await db.transaction(async (tx) => {
		await tx
			.delete(transcriptChunk)
			.where(eq(transcriptChunk.meetingId, meetingId));
		await tx.insert(transcriptChunk).values(dbChunks);
	});
}

export async function chatWithMeeting(
	userId: string,
	meetingId: string,
	question: string,
) {
	const [meetingRow] = await db
		.select()
		.from(meeting)
		.where(and(eq(meeting.id, meetingId), eq(meeting.userId, userId)))
		.limit(1);

	if (!meetingRow) {
		return {
			answer: MISSING_MEETING_ANSWER,
			sources: [],
		};
	}

	if (isSummaryRequest(question)) {
		const existingSummary = getUsableMeetingSummary(meetingRow.summary);

		if (existingSummary) {
			return {
				answer: existingSummary,
				sources: [],
			};
		}

		const storedChunks = await getMeetingTranscriptChunks(meetingId);
		const chunks =
			storedChunks.length > 0
				? storedChunks
				: getTranscriptFallbackChunks(meetingId, meetingRow.transcript);

		if (chunks.length === 0) {
			return {
				answer: MISSING_TRANSCRIPT_ANSWER,
				sources: [],
			};
		}

		const answer = await chatWithAI({
			system: buildSingleMeetingQASystemPrompt(
				meetingRow.title,
				meetingRow.createdAt,
			),
			messages: [
				{
					role: "user",
					content: `Meeting transcript excerpts: ${buildExcerptContext(chunks)}
                Question: ${question}`,
				},
			],
		});

		return {
			answer: toVisibleAnswer(answer),
			sources: chunks.map((chunk, index) => ({
				excerptId: index + 1,
				meetingId: chunk.meetingId,
				content: chunk.content,
				speakerName: chunk.speakerName || "Unknown",
				confidence: 1,
			})),
		};
	}

	const questionEmbedding = await createEmbedding(question);

	const results = await searchTranscriptChunks(
		questionEmbedding,
		{ userId, meetingId },
		5,
	);

	if (results.length === 0) {
		return {
			answer:
				"I could not find transcript excerpts that match that question yet. If this meeting was just processed, give it a moment and try again.",
			sources: [],
		};
	}

	const context = buildExcerptContext(results);

	const answer = await chatWithAI({
		system: buildSingleMeetingQASystemPrompt(
			meetingRow.title,
			meetingRow.createdAt,
		),
		messages: [
			{
				role: "user",
				content: `Meeting transcript excerpts: ${context}
                Question: ${question}`,
			},
		],
	});

	return {
		answer: toVisibleAnswer(answer),
		sources: results.map((result, index) => ({
			excerptId: index + 1,
			meetingId: result.meetingId,
			content: result.content,
			speakerName: result.speakerName || "Unknown",
			confidence: Math.max(0, 1 - Number(result.distance)),
		})),
	};
}

export async function chatWithAllMeetings(userId: string, question: string) {
	const questionEmbedding = await createEmbedding(question);

	const results = await searchTranscriptChunks(
		questionEmbedding,
		{ userId },
		8,
	);

	if (results.length === 0) {
		return {
			answer:
				"I could not find transcript excerpts that match that question yet. Try asking about a processed meeting or a more specific topic.",
			sources: [],
		};
	}

	const context = results
		.map((result, index) => {
			const meetingTitle = result.meetingTitle || "Untitled Meeting";
			const speaker = result.speakerName || "Unknown";
			const content = result.content;

			return `[Excerpt ${index + 1}]
					Meeting: ${meetingTitle}
					Speaker: ${speaker}
					Content: ${content}`;
		})
		.join("\n\n---\n\n");

	const answer = await chatWithAI({
		system: buildMultiMeetingQASystemPrompt(),
		messages: [
			{
				role: "user",
				content: `Transcript excerpts from multiple meetings: ${context}
				Question: ${question}`,
			},
		],
	});

	return {
		answer: toVisibleAnswer(answer),
		sources: results.map((result, index) => ({
			excerptId: index + 1,
			meetingId: result.meetingId,
			meetingTitle: result.meetingTitle || "Untitled Meeting",
			content: result.content,
			speakerName: result.speakerName || "Unknown",
			confidence: Math.max(0, 1 - Number(result.distance)),
		})),
	};
}

export async function processMeetingTranscript(
	transcript: TranscriptSegment[] | string | { text: string },
) {
	try {
		let transcriptText = "";

		if (Array.isArray(transcript)) {
			transcriptText = transcript
				.map((item) => {
					const speaker = item.speaker || "Speaker";
					const text = item.words
						.map((w) => w.word)
						.join(" ")
						.trim();
					return text ? `${speaker}: ${text}` : "";
				})
				.filter(Boolean)
				.join("\n");
		} else if (typeof transcript === "string") {
			transcriptText = transcript;
		} else if (transcript?.text) {
			transcriptText = transcript.text;
		}

		if (!transcriptText || transcriptText.trim().length === 0) {
			throw new Error("No transcript content found");
		}

		const parsed = await generateMeetingInsights(transcriptText);

		const validation = summarySchema.safeParse(parsed);
		if (!validation.success) {
			throw new Error("AI returned invalid JSON structure.");
		}

		const data = validation.data;

		return {
			summary: data.summary || "Summary couldn't be generated",
			decisions: data.decisions,
			blockers: data.blockers,
			actionItems: data.actionItems.map((item, index) => ({
				id: index + 1,
				text: item.task,
				owner: item.owner,
				deadline: item.deadline,
			})),
		};
	} catch (error) {
		console.error("Error processing transcript with Google AI:", error);

		return {
			summary:
				"Meeting transcript processed successfully. Please check the full transcript for details.",
			decisions: [],
			blockers: [],
			actionItems: [],
		};
	}
}
