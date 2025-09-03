import { NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.TRELLO_API_KEY;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/integrations/trello/callback`;

  const authUrl = `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key=${apiKey}&return_url=${encodeURIComponent(
    redirectUri
  )}`;

  return NextResponse.redirect(authUrl);
}
