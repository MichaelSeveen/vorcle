import { getCurrentUserTokenUsage } from "@/lib/token-usage";
import { getCurrentUser } from "@/helpers/user";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const result = await getCurrentUserTokenUsage(user.id);
  return NextResponse.json(result);
}
