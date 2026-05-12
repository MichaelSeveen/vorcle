import { WebClient } from "@slack/web-api";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { slackInstallation, user } from "@/db/schema";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL as string;

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const error = searchParams.get("error");
		const state = searchParams.get("state");

		if (error) {
			console.error("slack oauth error:", error);
			return NextResponse.redirect(`${BASE_URL}/?slack=error`);
		}

		if (!code) {
			return NextResponse.json(
				{ error: "No authorization code" },
				{ status: 400 },
			);
		}

		const redirectUri = `${BASE_URL}/api/slack/oauth`;

		const clientId = process.env.SLACK_CLIENT_ID;
		const clientSecret = process.env.SLACK_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			throw new Error("SLACK_CLIENT_ID and SLACK_CLIENT_SECRET environment variables must be set");
		}

		const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				code: code,
				redirect_uri: redirectUri,
			}),
		});

		const tokenData = await tokenResponse.json();

		if (!tokenData.ok) {
			console.error("Failed to exchange oauth code:", tokenData.error);
			return NextResponse.redirect(`${BASE_URL}/?slack=error`);
		}

		await db
			.insert(slackInstallation)
			.values({
				teamId: tokenData.team.id,
				teamName: tokenData.team.name,
				botToken: tokenData.access_token,
				installerUserId: tokenData.authed_user.id,
			})
			.onConflictDoUpdate({
				target: slackInstallation.teamId,
				set: {
					teamName: tokenData.team.name,
					botToken: tokenData.access_token,
					installerUserId: tokenData.authed_user.id,
				},
			});

		try {
			const slack = new WebClient(tokenData.access_token);
			const userInfo = await slack.users.info({
				user: tokenData.authed_user.id,
			});

			if (userInfo.user?.profile?.email) {
				await db
					.update(user)
					.set({
						slackUserId: tokenData.authed_user.id,
						slackTeamId: tokenData.team.id,
						slackConnected: true,
					})
					.where(eq(user.email, userInfo.user.profile.email));
			}
		} catch (linkError) {
			console.error("Failed to link user during oauth:", linkError);
		}

		const returnTo = state?.startsWith("return=")
			? state.split("return=")[1]
			: null;

		if (returnTo === "integrations") {
			return NextResponse.redirect(`${BASE_URL}/integrations?setup=slack`);
		}
		return NextResponse.redirect(`${BASE_URL}/?slack=installed`);
	} catch (slackError) {
		console.error("Slack oauth error", slackError);

		return NextResponse.redirect(`${BASE_URL}/?slack=error`);
	}
}
