import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { meetingId } = await params;

    console.log(meetingId);

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const responseData = {
      ...meeting,
      isOwner: currentUser.id === meeting.user?.id,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Failed to load meeting", error);
    return NextResponse.json(
      { error: "Failed to load meeting" },
      { status: 500 }
    );
  }
}
