import { chatWithMeeting } from "@/helpers/rag-workflow/utils";
import { getCurrentUser } from "@/helpers/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = currentUser.id;

  const { meetingId, question } = await request.json();

  if (!meetingId || !question) {
    return NextResponse.json(
      { error: "Missing meetingId or question" },
      { status: 400 }
    );
  }

  try {
    const response = await chatWithMeeting(userId, meetingId, question);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}
