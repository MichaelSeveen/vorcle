import prisma from "@/lib/prisma";
import { chatWithAI, createEmbedding, createManyEmbeddings } from "./google-ai";
import { saveManyVectors, searchVectors } from "./pinecone";
import { chunkTranscript, extractSpeaker } from "./text-chunker";

export async function processTranscript(
  meetingId: string,
  userId: string,
  transcript: string,
  meetingTitle?: string
) {
  const chunks = chunkTranscript(transcript);
  const texts = chunks.map((chunk) => chunk.content);
  const embeddings = await createManyEmbeddings(texts);

  const dbChunks = chunks.map((chunk) => ({
    meetingId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    speakerName: extractSpeaker(chunk.content),
    vectorId: `${meetingId}_chunk_${chunk.chunkIndex}`,
  }));

  await prisma.transcriptChunk.createMany({
    data: dbChunks,
    skipDuplicates: true,
  });

  const vectors = chunks.map((chunk, index) => ({
    id: `${meetingId}_chunk_${chunk.chunkIndex}`,
    values: embeddings[index],
    metadata: {
      meetingId,
      userId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      speakerName: extractSpeaker(chunk.content) || "Unknown",
      meetingTitle: meetingTitle || "Untitled Meeting",
    },
  }));

  await saveManyVectors(vectors);
}

export async function chatWithMeeting(
  userId: string,
  meetingId: string,
  question: string
) {
  const questionEmbedding = await createEmbedding(question);

  const results = await searchVectors(
    questionEmbedding,
    { userId, meetingId },
    5
  );

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });

  const context = results
    .map((result) => {
      const speaker = result.metadata?.speakerName || "Unknown";
      const content = result.metadata?.content || "";
      return `${speaker}: ${content}`;
    })
    .join("\n\n");

  const systemPrompt = `You are helping someone understand their meeting.
    Meeting: ${meeting?.title || "Untitled Meeting"}
    Date: ${
      meeting?.createdAt
        ? new Date(meeting.createdAt).toDateString()
        : "Unknown"
    }
    Answer the user's question based only on the meeting content provided below. If the answer isn't in the provided content, say so.`;

  const answer = await chatWithAI({
    system: systemPrompt,
    messages: [
      { role: "user", content: `Here's what was discussed:\n${context}` },
      {
        role: "assistant",
        content:
          "Understood. I will answer based only on this information. What is the question?",
      },
      { role: "user", content: question },
    ],
  });

  return {
    answer,
    sources: results.map((result) => ({
      meetingId: result.metadata?.meetingId as string,
      content: result.metadata?.content as string,
      speakerName: result.metadata?.speakerName as string,
      confidence: result.score,
    })),
  };
}

export async function chatWithAllMeetings(userId: string, question: string) {
  const questionEmbedding = await createEmbedding(question);

  const results = await searchVectors(questionEmbedding, { userId }, 8);

  const context = results
    .map((result) => {
      const meetingTitle = result.metadata?.meetingTitle || "Untitled Meeting";
      const speaker = result.metadata?.speakerName || "Unknown";
      const content = result.metadata?.content || "";
      return `Meeting: ${meetingTitle}\n${speaker}: ${content}`;
    })
    .join("\n\n---\n\n");

  const systemPrompt = `You are helping someone understand their meeting history. Answer the user's question based only on the meeting content provided below. When you reference something, mention which meeting it's from.`;

  const answer = await chatWithAI({
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Here's what was discussed across several meetings:\n${context}`,
      },
      {
        role: "assistant",
        content:
          "Okay, I will use only that information to answer the question.",
      },
      { role: "user", content: question },
    ],
  });

  return {
    answer,
    sources: results.map((result) => ({
      meetingId: result.metadata?.meetingId as string,
      meetingTitle: result.metadata?.meetingTitle as string,
      content: result.metadata?.content as string,
      speakerName: result.metadata?.speakerName as string,
      confidence: result.score,
    })),
  };
}
