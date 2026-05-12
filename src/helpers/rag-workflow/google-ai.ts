import {
	createGoogleGenerativeAI,
	type GoogleLanguageModelOptions,
} from "@ai-sdk/google";
import { embed, embedMany, generateText, type ModelMessage, Output } from "ai";
import type { z } from "zod";
import { summarySchema } from "@/lib/zod-schema/meeting-summary-schema";
import { buildTranscriptAnalysisSystemPrompt } from "../prompts";

const google = createGoogleGenerativeAI({
	apiKey: process.env.GOOGLE_API_KEY,
});

const embeddingModel = google.embedding("gemini-embedding-001");
const chatModel = google("gemini-2.5-pro");
const MEETING_INSIGHTS_MAX_OUTPUT_TOKENS = 8192;
const MEETING_INSIGHTS_THINKING_BUDGET = 1024;

function buildEmbeddingProviderOptions(
	taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
) {
	return {
		google: {
			outputDimensionality: 1536,
			taskType,
		},
	};
}

export async function createEmbedding(text: string): Promise<number[]> {
	const { embedding } = await embed({
		model: embeddingModel,
		value: text,
		providerOptions: buildEmbeddingProviderOptions("RETRIEVAL_QUERY"),
	});
	return embedding;
}

export async function createManyEmbeddings(
	texts: string[],
): Promise<number[][]> {
	if (texts.length === 0) {
		return [];
	}

	const { embeddings } = await embedMany({
		model: embeddingModel,
		values: texts,
		maxParallelCalls: 3,
		providerOptions: buildEmbeddingProviderOptions("RETRIEVAL_DOCUMENT"),
	});
	return embeddings;
}

export async function chatWithAI({
	system,
	messages,
}: {
	system?: string;
	messages: ModelMessage[];
}): Promise<string> {
	const { text } = await generateText({
		model: chatModel,
		system: system,
		messages: messages,
		temperature: 0.3,
		maxOutputTokens: 1000,
	});

	return text;
}

export async function generateMeetingInsights(
	transcriptText: string,
): Promise<z.infer<typeof summarySchema>> {
	const result = await generateText({
		model: chatModel,
		system: buildTranscriptAnalysisSystemPrompt(),
		prompt: `Analyze the following meeting transcript:\n\n${transcriptText}`,
		output: Output.object({
			schema: summarySchema,
		}),
		providerOptions: {
			google: {
				thinkingConfig: {
					thinkingBudget: MEETING_INSIGHTS_THINKING_BUDGET,
				},
			} satisfies GoogleLanguageModelOptions,
		},
		temperature: 0.2,
		maxOutputTokens: MEETING_INSIGHTS_MAX_OUTPUT_TOKENS,
	});

	if (result.finishReason !== "stop") {
		throw new Error(
			`Gemini did not complete meeting insight generation. finishReason=${result.finishReason}; rawFinishReason=${result.rawFinishReason ?? "unknown"}.`,
		);
	}

	return result.output;
}
