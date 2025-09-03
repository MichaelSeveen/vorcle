import { NextRequest, NextResponse } from "next/server";
import { chatWithAllMeetings } from "@/helpers/rag-workflow/utils";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { question, userId: slackUserId } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    let targetUserId = slackUserId;

    if (!slackUserId) {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      targetUserId = currentUser.id;
    } else {
      const user = await prisma.user.findUnique({
        where: {
          id: slackUserId,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      targetUserId = user.id;
    }

    const response = await chatWithAllMeetings(targetUserId, question);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      {
        error: "Failed to process question",
        answer:
          "I encountered an error while searching your meetings. Please try again.",
      },
      { status: 500 }
    );
  }
}
