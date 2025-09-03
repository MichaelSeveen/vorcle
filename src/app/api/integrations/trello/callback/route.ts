import { getCurrentUser } from "@/helpers/user";
import { NextResponse } from "next/server";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.redirect(
      new URL(
        "/integrations?error=auth_failed",
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }

  return NextResponse.redirect(
    new URL("/integrations/trello/callback", process.env.NEXT_PUBLIC_APP_URL)
  );
}
