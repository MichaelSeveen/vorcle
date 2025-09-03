import { incrementUserMeetingsTokenUsage } from "@/lib/token-usage";
import { getCurrentUser } from "@/helpers/user";
import { NextResponse } from "next/server";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  const result = await incrementUserMeetingsTokenUsage(user.id);
  return NextResponse.json(result);
}
