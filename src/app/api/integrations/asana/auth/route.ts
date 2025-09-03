import { NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.ASANA_CLIENT_ID;

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/asana/callback`;

  const scope =
    "projects:read projects:write tasks:read tasks:write users:read workspaces:read";

  const state = currentUser.id;

  const authUrl = `https://app.asana.com/-/oauth_authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&state=${state}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(authUrl);
}
