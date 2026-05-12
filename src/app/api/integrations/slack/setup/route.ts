import { WebClient } from "@slack/web-api";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { slackInstallation, user } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function GET() {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const [userRow] = await db
			.select()
			.from(user)
			.where(eq(user.id, currentUser.id))
			.limit(1);

		if (!userRow?.slackTeamId) {
			return NextResponse.json(
				{ error: "Slack is not connected" },
				{ status: 400 },
			);
		}

		const [installation] = await db
			.select()
			.from(slackInstallation)
			.where(eq(slackInstallation.teamId, userRow.slackTeamId))
			.limit(1);

		if (!installation) {
			return NextResponse.json(
				{ error: "Slack installation not found" },
				{ status: 400 },
			);
		}

		const slack = new WebClient(installation.botToken);

		const channels = await slack.conversations.list({
			types: "public_channel",
			limit: 50,
		});

		return NextResponse.json({
			channels:
				channels.channels?.map((channel) => ({
					id: channel.id,
					name: channel.name,
				})) || [],
		});
	} catch (error) {
		console.error("Slack setup error:", error);
		return NextResponse.json(
			{ error: "Failed to load channels" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { channelId, channelName } = await request.json();

		await db
			.update(user)
			.set({
				preferredChannelId: channelId,
				preferredChannelName: channelName,
			})
			.where(eq(user.id, currentUser.id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Slack setup save error:", error);
		return NextResponse.json(
			{ error: "Failed to save slack setup" },
			{ status: 500 },
		);
	}
}
