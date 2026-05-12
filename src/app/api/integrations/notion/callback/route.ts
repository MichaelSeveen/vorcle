import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userIntegration } from "@/db/schema";
import {
	getNotionOAuthCredentials,
	NOTION_API_VERSION,
} from "@/helpers/integrations/notion";
import { getCurrentUser } from "@/helpers/user";

const NOTION_STATE_COOKIE = "notion_oauth_state";

type NotionOAuthTokenPayload = {
	access_token: string;
	refresh_token?: string | null;
	workspace_id?: string | null;
	workspace_name?: string | null;
};

export async function GET(request: NextRequest) {
	const currentUser = await getCurrentUser();
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;

	if (!currentUser || !appUrl) {
		return NextResponse.redirect(
			new URL("/integrations?error=notion_auth_failed", appUrl ?? request.url),
		);
	}

	const { searchParams } = new URL(request.url);
	const code = searchParams.get("code");
	const error = searchParams.get("error");
	const state = searchParams.get("state");
	const storedState = request.cookies.get(NOTION_STATE_COOKIE)?.value;

	if (error) {
		return clearStateCookie(
			NextResponse.redirect(
				new URL("/integrations?error=notion_access_denied", appUrl),
			),
		);
	}

	if (!code || !state || !storedState || state !== storedState) {
		return clearStateCookie(
			NextResponse.redirect(
				new URL("/integrations?error=notion_auth_failed", appUrl),
			),
		);
	}

	try {
		const { clientId, clientSecret } = getNotionOAuthCredentials();
		const redirectUri = `${appUrl}/api/integrations/notion/callback`;
		const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
			"base64",
		);

		const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
			method: "POST",
			headers: {
				Authorization: `Basic ${credentials}`,
				"Content-Type": "application/json",
				Accept: "application/json",
				"Notion-Version": NOTION_API_VERSION,
			},
			body: JSON.stringify({
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
			}),
		});

		const payload = await parseResponse(tokenResponse);

		if (!tokenResponse.ok) {
			console.error("Notion OAuth callback failed:", payload);
			return clearStateCookie(
				NextResponse.redirect(
					new URL("/integrations?error=notion_auth_failed", appUrl),
				),
			);
		}

		if (!isNotionOAuthTokenPayload(payload)) {
			console.error(
				"Notion OAuth callback returned an unexpected payload:",
				payload,
			);
			return clearStateCookie(
				NextResponse.redirect(
					new URL("/integrations?error=notion_auth_failed", appUrl),
				),
			);
		}

		await db
			.insert(userIntegration)
			.values({
				userId: currentUser.id,
				provider: "notion",
				accessToken: payload.access_token,
				refreshToken: payload.refresh_token ?? null,
				workspaceId: payload.workspace_id ?? null,
				domain: payload.workspace_name ?? null,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [userIntegration.userId, userIntegration.provider],
				set: {
					accessToken: payload.access_token,
					refreshToken: payload.refresh_token ?? null,
					workspaceId: payload.workspace_id ?? null,
					domain: payload.workspace_name ?? null,
					updatedAt: new Date(),
				},
			});

		return clearStateCookie(
			NextResponse.redirect(
				new URL("/integrations?success=notion_connected&setup=notion", appUrl),
			),
		);
	} catch (error) {
		console.error("Error saving Notion integration:", error);
		return clearStateCookie(
			NextResponse.redirect(
				new URL("/integrations?error=notion_auth_failed", appUrl),
			),
		);
	}
}

async function parseResponse(response: Response) {
	const text = await response.text();

	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function clearStateCookie(response: NextResponse) {
	response.cookies.set(NOTION_STATE_COOKIE, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/",
	});

	return response;
}

function isNotionOAuthTokenPayload(
	payload: unknown,
): payload is NotionOAuthTokenPayload {
	if (!payload || typeof payload !== "object") {
		return false;
	}

	return (
		"access_token" in payload &&
		typeof payload.access_token === "string" &&
		(!("refresh_token" in payload) ||
			payload.refresh_token === null ||
			typeof payload.refresh_token === "string") &&
		(!("workspace_id" in payload) ||
			payload.workspace_id === null ||
			typeof payload.workspace_id === "string") &&
		(!("workspace_name" in payload) ||
			payload.workspace_name === null ||
			typeof payload.workspace_name === "string")
	);
}
