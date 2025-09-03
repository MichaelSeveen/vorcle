import { NextRequest, NextResponse } from "next/server";
import { processTranscript } from "@/helpers/rag-workflow/utils";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = currentUser.id;

  const { meetingId, transcript, meetingTitle } = await request.json();

  if (!meetingId || !transcript) {
    return NextResponse.json(
      { error: "Missing meetingId or transcript" },
      { status: 400 }
    );
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
      select: {
        ragProcessed: true,
        userId: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (meeting.ragProcessed) {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    await processTranscript(meetingId, userId, transcript, meetingTitle);

    await prisma.meeting.update({
      where: {
        id: meetingId,
      },
      data: {
        ragProcessed: true,
        ragProcessedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing transcript:", error);
    return NextResponse.json(
      { error: "Failed to process transcript" },
      { status: 500 }
    );
  }
}
