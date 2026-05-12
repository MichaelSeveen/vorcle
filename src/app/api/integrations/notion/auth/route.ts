import { NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";

const NOTION_STATE_COOKIE = "notion_oauth_state";

export async function GET() {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const clientId = process.env.NOTION_CLIENT_ID;
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;

	if (!clientId || !appUrl) {
		return NextResponse.json(
			{ error: "Notion integration is not configured" },
			{ status: 500 },
		);
	}

	const redirectUri = `${appUrl}/api/integrations/notion/callback`;
	const state = crypto.randomUUID();
	const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");

	authUrl.searchParams.set("client_id", clientId);
	authUrl.searchParams.set("redirect_uri", redirectUri);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("owner", "user");
	authUrl.searchParams.set("state", state);

	const response = NextResponse.redirect(authUrl);
	response.cookies.set(NOTION_STATE_COOKIE, state, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 10,
		path: "/",
	});

	return response;
}
