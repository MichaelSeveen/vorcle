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
		const tokenResponse = await fetch(
			"https://auth.atlassian.com/oauth/token",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					grant_type: "authorization_code",
					client_id: process.env.JIRA_CLIENT_ID as string,
					client_secret: process.env.JIRA_CLIENT_SECRET as string,
					redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`,
					code: code,
				}),
			},
		);

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error("token exchange failed:", errorText);
			throw new Error("failed to exchange code for token");
		}

		const tokenData = await tokenResponse.json();

		const resourcesResponse = await fetch(
			"https://api.atlassian.com/oauth/token/accessible-resources",
			{
				headers: {
					Authorization: `Bearer ${tokenData.access_token}`,
					Accept: "application/json",
				},
			},
		);

		if (!resourcesResponse.ok) {
			throw new Error("Failed to get accessible resources");
		}

		const resources = await resourcesResponse.json();
		const cloudId = resources[0]?.id;

		if (!cloudId) {
			throw new Error("No accesible jira reosurces found");
		}

		await db
			.insert(userIntegration)
			.values({
				userId: currentUserId,
				provider: "jira",
				accessToken: tokenData.access_token,
				refreshToken: tokenData.refresh_token,
				tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
				workspaceId: cloudId,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [userIntegration.userId, userIntegration.provider],
				set: {
					accessToken: tokenData.access_token,
					refreshToken: tokenData.refresh_token,
					tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
					workspaceId: cloudId,
					updatedAt: new Date(),
				},
			});

		return NextResponse.redirect(
			new URL(
				"/integrations?success=jira_connected&setup=jira",
				process.env.NEXT_PUBLIC_APP_URL,
			),
		);
	} catch (error) {
		console.error("Error saving jira integration:", error);
		return NextResponse.redirect(
			new URL(
				"/integrations?error=save_failed",
				process.env.NEXT_PUBLIC_APP_URL,
			),
		);
	}
}
