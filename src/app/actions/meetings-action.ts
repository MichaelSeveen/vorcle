"use server";

import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function removeMeetingById(meetingId: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
      include: {
        user: true,
      },
    });

    if (!meeting) {
      return { success: false, error: "Meeting not found" };
    }

    if (meeting.user.id !== currentUser.id)
      return { success: false, error: "Not authorized to delete this meeting" };

    await prisma.meeting.delete({
      where: {
        id: meetingId,
      },
    });

    return {
      success: true,
      message: "Meeting deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete meeting:", error);
    return { success: false, error: "Failed to delete meeting" };
  }
}
