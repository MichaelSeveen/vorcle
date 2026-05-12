import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userIntegration } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function GET(request: NextRequest) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const currentUserId = currentUser.id;

	const { searchParams } = new URL(request.url);

	const code = searchParams.get("code");
	const state = searchParams.get("state");

	if (!currentUserId || !code || state !== currentUserId) {
		return NextResponse.redirect(
			new URL(
				"/integrations?error=auth_failed",
				process.env.NEXT_PUBLIC_APP_URL,
			),
		);
	}

	try {
		const tokenResponse = await fetch("https://app.asana.com/-/oauth_token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				client_id: process.env.ASANA_CLIENT_ID as string,
				client_secret: process.env.ASANA_CLIENT_SECRET as string,
				redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/asana/callback`,
				code: code,
			}),
		});

		if (!tokenResponse.ok) {
			throw new Error("Failed to exchange code for token");
		}

		const tokenData = await tokenResponse.json();

		await db
			.insert(userIntegration)
			.values({
				userId: currentUserId,
				provider: "asana",
				accessToken: tokenData.access_token,
				refreshToken: tokenData.refresh_token,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [userIntegration.userId, userIntegration.provider],
				set: {
					accessToken: tokenData.access_token,
					refreshToken: tokenData.refresh_token,
					updatedAt: new Date(),
				},
			});

		return NextResponse.redirect(
			new URL(
				"/integrations?success=asana_connected&setup=asana",
				process.env.NEXT_PUBLIC_APP_URL,
			),
		);
	} catch (error) {
		console.error("Error saving asana integration:", error);
		return NextResponse.redirect(
			new URL(
				"/integrations?error=save_failed",
				process.env.NEXT_PUBLIC_APP_URL,
			),
		);
	}
}
