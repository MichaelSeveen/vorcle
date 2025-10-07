import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import {
  embed,
  embedMany,
  generateObject,
  generateText,
  type ModelMessage,
} from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const embeddingModel = "text-embedding-004";
const chatModel = "gemini-1.5-flash-latest";

export async function createEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(embeddingModel),
    value: text,
  });
  return embedding;
}

export async function createManyEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel(embeddingModel),
    values: texts,
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
    model: google("gemini-2.5-pro"),
    system: system,
    messages: messages,
    temperature: 0.3,
    maxOutputTokens: 1000,
  });

  return text;
}

export const summarySchema = z.object({
  summary: z
    .string()
    .describe(
      "A clear, concise summary (2-3 sentences) of the main discussion points and decisions."
    ),
  actionItems: z
    .array(z.string())
    .describe(
      "A list of specific, actionable tasks mentioned in the meeting. Return an empty array if none are found."
    ),
});

export async function generateSummaryAndActionItems(
  transcriptText: string
): Promise<z.infer<typeof summarySchema>> {
  const { object } = await generateObject({
    model: google(chatModel),
    system:
      "You are an AI assistant that analyzes meeting transcripts. Analyze the provided transcript and extract a concise summary and a list of specific action items. Format your response as a JSON object matching the provided schema.",
    prompt: `Please analyze this meeting transcript:\n\n${transcriptText}`,
    schema: summarySchema,
    mode: "json",
    temperature: 0.3,
    maxOutputTokens: 1000,
  });

  return object;
}
