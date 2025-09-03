import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  const { token } = await request.json();

  if (!currentUser || !token) {
    return NextResponse.json(
      { error: "Missing user id or token" },
      { status: 400 }
    );
  }

  try {
    await prisma.userIntegration.upsert({
      where: {
        userId_provider: {
          userId: currentUser.id,
          provider: "trello",
        },
      },
      update: {
        accessToken: token,
        updatedAt: new Date(),
      },
      create: {
        userId: currentUser.id,
        provider: "trello",
        accessToken: token,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving trello integration:", error);
    return NextResponse.json(
      { error: "Failed to save trello integration" },
      { status: 500 }
    );
  }
}
