import "server-only";
import prisma from "@/lib/prisma";

export async function getUserCalendarStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { calendarConnected: true },
    });

    const account = await prisma.account.findFirst({
      where: { userId: userId, providerId: "google" },
      select: { accessToken: true },
    });

    if (!user || !account) {
      return {
        success: false,
        message: "User does not exist",
      };
    }

    const connected = user.calendarConnected && !!account.accessToken;

    return { success: true, connected };
  } catch (error) {
    console.error("Error loading calendar status", error);
    return {
      success: false,
      connected: false,
      message: "Error loading calendar status",
    };
  }
}
