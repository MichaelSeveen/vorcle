import prisma from "@/lib/prisma";

export async function getMeetingById(meetingId: string, userId?: string) {
  try {
    if (!userId) return { success: false, error: "Not authenticated" };

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

    if (!meeting) return { success: false, error: "Meeting not found" };

    const data = {
      ...meeting,
      isOwner: userId === meeting.user.id,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Failed to load meeting", error);
    return { success: false, error: "Failed to load meeting" };
  }
}
