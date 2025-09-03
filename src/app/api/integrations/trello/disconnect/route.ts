import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.userIntegration.delete({
      where: {
        userId_provider: {
          userId: currentUser.id,
          provider: "trello",
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting trello:", error);
    return NextResponse.json(
      { error: "Failed to disconnect trello" },
      { status: 500 }
    );
  }
}
