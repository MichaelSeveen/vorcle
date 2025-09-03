import { NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.updateMany({
      where: {
        id: currentUser.id,
      },
      data: {
        slackConnected: false,
        slackUserId: null,
        slackTeamId: null,
        preferredChannelId: null,
        preferredChannelName: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slack disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
