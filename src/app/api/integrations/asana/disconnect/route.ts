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
          provider: "asana",
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting asana:", error);
    return NextResponse.json(
      { error: "Failed to disconnect asana" },
      { status: 500 }
    );
  }
}
