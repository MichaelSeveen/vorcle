import { NextRequest, NextResponse } from "next/server";
import { processMeetingTranscript } from "@/helpers/rag-workflow";
import { processTranscript } from "@/helpers/rag-workflow/utils";
import { incrementMeetingUsage } from "@/lib/token-usage";
import { TranscriptSegment } from "@/config/types";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const webhook = await request.json();

    if (webhook.event === "complete") {
      const webhookData = webhook.data;

      const meeting = await prisma.meeting.findFirst({
        where: {
          botId: webhookData.bot_id,
        },
        include: {
          user: true,
        },
      });

      if (!meeting) {
        console.error("Meeting not found for bot id:", webhookData.bot_id);
        return NextResponse.json(
          { error: "Meeting not found" },
          { status: 404 }
        );
      }

      await incrementMeetingUsage(meeting.userId);

      if (!meeting.user.email) {
        console.error("User email not found for this meeting", meeting.id);
        return NextResponse.json(
          { error: "User email not found" },
          { status: 400 }
        );
      }

      await prisma.meeting.update({
        where: {
          id: meeting.id,
        },
        data: {
          meetingEnded: true,
          transcriptReady: true,
          transcript: webhookData.transcript || null,
          recordingUrl: webhookData.mp4 || null,
          speakers: webhookData.speakers || null,
        },
      });

      if (webhookData.transcript && !meeting.processed) {
        try {
          const processed = await processMeetingTranscript(
            webhookData.transcript
          );

          let transcriptText = "";

          if (Array.isArray(webhookData.transcript)) {
            const transcriptData =
              webhookData.transcript as unknown as TranscriptSegment[];

            transcriptText = transcriptData
              .map(
                (item) =>
                  `${item.speaker || "Speaker"}: ${item.words
                    .map((w) => w.word)
                    .join(" ")}`
              )
              .join("\n");
          } else {
            transcriptText = webhookData.transcript;
          }

          // try {
          //     await sendMeetingSummaryEmail({
          //         userEmail: meeting.user.email,
          //         userName: meeting.user.name || 'User',
          //         meetingTitle: meeting.title,
          //         summary: processed.summary,
          //         actionItems: processed.actionItems,
          //         meetingId: meeting.id,
          //         meetingDate: meeting.startTime.toLocaleDateString()
          //     })

          //     await prisma.meeting.update({
          //         where: {
          //             id: meeting.id
          //         },
          //         data: {
          //             emailSent: true,
          //             emailSentAt: new Date()
          //         }
          //     })
          // } catch (emailError) {
          //     console.error('failed to send the email:', emailError)
          // }

          await processTranscript(
            meeting.id,
            meeting.userId,
            transcriptText,
            meeting.title
          );

          await prisma.meeting.update({
            where: {
              id: meeting.id,
            },
            data: {
              summary: processed.summary,
              actionItems: processed.actionItems,
              processed: true,
              processedAt: new Date(),
              ragProcessed: true,
              ragProcessedAt: new Date(),
            },
          });
        } catch (processingError) {
          console.error("Failed to process the transcript:", processingError);

          await prisma.meeting.update({
            where: {
              id: meeting.id,
            },
            data: {
              processed: true,
              processedAt: new Date(),
              summary:
                "Processing failed. Please check the transcript manually.",
              actionItems: [],
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Meeting processed successfully",
        meetingId: meeting.id,
      });
    }
    return NextResponse.json({
      success: true,
      message: "Webhook received but no action needed",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
