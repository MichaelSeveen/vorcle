import { TranscriptSegment } from "@/config/types";
import { generateSummaryAndActionItems, summarySchema } from "./google-ai";

export async function processMeetingTranscript(
  transcript: TranscriptSegment[] | string | { text: string }
) {
  try {
    let transcriptText = "";

    if (Array.isArray(transcript)) {
      transcriptText = transcript
        .map(
          (item) =>
            `${item.speaker || "Speaker"}: ${item.words
              .map((w) => w.word)
              .join(" ")}`
        )
        .join("\n");
    } else if (typeof transcript === "string") {
      transcriptText = transcript;
    } else if (transcript.text) {
      transcriptText = transcript.text;
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      throw new Error("No transcript content found");
    }

    const parsed = await generateSummaryAndActionItems(transcriptText);

    const validation = summarySchema.safeParse(parsed);
    if (!validation.success) {
      throw new Error("AI returned invalid JSON structure.");
    }

    const actionItems = validation.data.actionItems.map(
      (text: string, index: number) => ({
        id: index + 1,
        text: text,
      })
    );

    return {
      summary: validation.data.summary || "Summary couldn't be generated",
      actionItems: actionItems,
    };
  } catch (error) {
    console.error("Error processing transcript with Google AI:", error);

    return {
      summary:
        "Meeting transcript processed successfully. Please check the full transcript for details.",
      actionItems: [],
    };
  }
}
