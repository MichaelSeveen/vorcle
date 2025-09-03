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
      where: { id: currentUser.id },
      select: { calendarConnected: true },
    });

    const account = await prisma.account.findFirst({
      where: { userId: currentUser.id, providerId: "google" },
      select: { accessToken: true },
    });

    return NextResponse.json({
      connected: user?.calendarConnected && !!account?.accessToken,
    });
  } catch (error) {
    console.error("Error fetching calendar status", error);
    return NextResponse.json({ connected: false });
  }
}
