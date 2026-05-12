import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
	getTranscriptDisplaySegments,
	normalizeLanguageCode,
	type StoredTranscriptTranslation,
	TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS,
	type TranscriptDisplaySegment,
	type TranscriptTranslationLanguage,
} from "@/lib/meetings/transcript";

const google = createGoogleGenerativeAI({
	apiKey: process.env.GOOGLE_API_KEY,
});

const translationModel = google("gemini-2.5-pro");
const MAX_SEGMENTS_PER_BATCH = 20;
const MAX_CHARACTERS_PER_BATCH = 7000;
const TRANSLATION_MAX_OUTPUT_TOKENS = 4096;

const translationBatchSchema = z.object({
	detectedSourceLanguage: z.string().nullable(),
	segments: z.array(
		z.object({
			index: z.number().int().nonnegative(),
			text: z.string().min(1),
		}),
	),
});

interface TranslationInputSegment extends TranscriptDisplaySegment {
	index: number;
}

function buildTranslationBatches(
	segments: TranscriptDisplaySegment[],
): TranslationInputSegment[][] {
	const batches: TranslationInputSegment[][] = [];
	let currentBatch: TranslationInputSegment[] = [];
	let currentBatchCharacters = 0;

	segments.forEach((segment, index) => {
		const nextSegment: TranslationInputSegment = {
			...segment,
			index,
		};
		const nextBatchCharacters = currentBatchCharacters + segment.text.length;
		const shouldFlushBatch =
			currentBatch.length >= MAX_SEGMENTS_PER_BATCH ||
			(currentBatch.length > 0 &&
				nextBatchCharacters > MAX_CHARACTERS_PER_BATCH);

		if (shouldFlushBatch) {
			batches.push(currentBatch);
			currentBatch = [];
			currentBatchCharacters = 0;
		}

		currentBatch.push(nextSegment);
		currentBatchCharacters += segment.text.length;
	});

	if (currentBatch.length > 0) {
		batches.push(currentBatch);
	}

	return batches;
}

export async function translateTranscript({
	targetLanguage,
	transcript,
}: {
	targetLanguage: TranscriptTranslationLanguage;
	transcript: unknown;
}): Promise<StoredTranscriptTranslation> {
	const transcriptSegments = getTranscriptDisplaySegments(transcript);

	if (transcriptSegments.length === 0) {
		throw new Error("No transcript segments found to translate");
	}

	const translatedTextByIndex = new Map<number, string>();
	let detectedSourceLanguage: string | null = null;

	for (const batch of buildTranslationBatches(transcriptSegments)) {
		const result = await generateText({
			model: translationModel,
			system: `You translate meeting transcript segments into ${TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS[targetLanguage]} (${targetLanguage}).
Return every segment in the same order with the same index.
Translate only the spoken text and do not omit or merge segments.
Detect the source language and return it as an ISO 639-1 code when possible.`,
			prompt: JSON.stringify({
				targetLanguage,
				targetLanguageLabel:
					TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS[targetLanguage],
				segments: batch.map(({ index, speaker, text }) => ({
					index,
					speaker,
					text,
				})),
			}),
			output: Output.object({
				schema: translationBatchSchema,
			}),
			temperature: 0,
			maxOutputTokens: TRANSLATION_MAX_OUTPUT_TOKENS,
		});

		const expectedIndexes = new Set(batch.map((segment) => segment.index));

		if (result.output.segments.length !== batch.length) {
			throw new Error("Translation response did not include every segment");
		}

		for (const segment of result.output.segments) {
			if (!expectedIndexes.has(segment.index)) {
				throw new Error("Translation response returned an unexpected segment");
			}

			translatedTextByIndex.set(segment.index, segment.text.trim());
		}

		if (!detectedSourceLanguage) {
			detectedSourceLanguage = normalizeLanguageCode(
				result.output.detectedSourceLanguage,
			);
		}
	}

	const translatedSegments = transcriptSegments.map((segment, index) => {
		const translatedText = translatedTextByIndex.get(index);

		if (!translatedText) {
			throw new Error("Translation response missed a transcript segment");
		}

		return {
			...segment,
			text: translatedText,
		};
	});

	return {
		sourceLanguage: detectedSourceLanguage,
		targetLanguage,
		translatedAt: new Date().toISOString(),
		segments: translatedSegments,
	};
}
