import { Pinecone, type PineconeRecord } from "@pinecone-database/pinecone";

interface PineconeFilters {
  userId: string;
  meetingId?: string;
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

export async function saveManyVectors(vectors: Array<PineconeRecord>) {
  const upsertData = vectors.map((v) => ({
    id: v.id,
    values: v.values,
    metadata: v.metadata,
  }));

  await index.upsert(upsertData);
}

export async function searchVectors(
  embedding: number[],
  filter: PineconeFilters,
  topK: number = 5
) {
  const result = await index.query({
    vector: embedding,
    filter,
    topK,
    includeMetadata: true,
  });

  return result.matches || [];
}
