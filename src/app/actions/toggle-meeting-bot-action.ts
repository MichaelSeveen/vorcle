"use server";

import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function toggleMeetingBotAction(
  meetingId: string,
  botScheduled: boolean
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) return { success: false, error: "Not authenticated" };

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) return { success: false, error: "User not found" };

    const meeting = await prisma.meeting.update({
      where: { id: meetingId, userId: user.id },
      data: { botScheduled },
    });

    return {
      success: true,
      botScheduled: meeting.botScheduled,
      message: `Bot ${
        meeting.botScheduled ? "enabled" : "disabled"
      } for meeting`,
    };
  } catch (error) {
    console.error("toggleMeetingBotAction error:", error);
    return {
      success: false,
      error: "Failed to update bot status",
    };
  }
}
