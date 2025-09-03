import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { calendarConnected: true },
    });

    return NextResponse.redirect(
      new URL("/home?connected=direct", request.url)
    );
  } catch (error) {
    console.error("Connect callback error:", error);
    return NextResponse.redirect(
      new URL("/home?error=connect_failed", request.url)
    );
  }
}
