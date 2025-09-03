import { NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: currentUser.id,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const pastMeetings = await prisma.meeting.findMany({
      where: {
        userId: user.id,
        meetingEnded: true,
      },
      orderBy: {
        endTime: "desc",
      },
      take: 10,
    });

    return NextResponse.json({ meetings: pastMeetings });
  } catch (error) {
    console.error("Error fetching past meetinggs", error);
    return NextResponse.json(
      { error: "failed to fetch past meetings", meetings: [] },
      { status: 500 }
    );
  }
}
