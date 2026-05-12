import { WebClient } from "@slack/web-api";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meeting, slackInstallation, user } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function POST(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { meetingId, summary, actionItems } = await request.json();

		const [existingUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, currentUser.id))
			.limit(1);

		if (!existingUser?.slackTeamId) {
			return NextResponse.json(
				{ error: "Slack is not enabled" },
				{ status: 400 },
			);
		}

		const [installation] = await db
			.select()
			.from(slackInstallation)
			.where(eq(slackInstallation.teamId, existingUser.slackTeamId))
			.limit(1);

		if (!installation)
			return NextResponse.json(
				{ error: "Slack workspace not found" },
				{ status: 400 },
			);

		const slack = new WebClient(installation.botToken);
		const targetChannel = existingUser.preferredChannelId || "#general";

		const [meetingRow] = await db
			.select()
			.from(meeting)
			.where(eq(meeting.id, meetingId))
			.limit(1);

		const meetingTitle = meetingRow?.title;

		await slack.chat.postMessage({
			channel: targetChannel,
			blocks: [
				{
					type: "header",
					text: {
						type: "plain_text",
						text: "📝 Meeting Summary",
						emoji: true,
					},
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: `*Meeting:*\n${meetingTitle}`,
						},
						{
							type: "mrkdwn",
							text: `*Date:*\n${meetingRow?.startTime}`,
						},
					],
				},
				{
					type: "divider",
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*📋 Summary:*\n${summary}`,
					},
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*✅ Action Items:*\n${actionItems}`,
					},
				},

				{
					type: "context",
					elements: [
						{
							type: "mrkdwn",
							text: `Posted by ${
								existingUser.name.split(" ")[0] || "User"
							} · ${new Date().toLocaleString()}`,
						},
					],
				},
			],
		});

		return NextResponse.json({
			success: true,
			message: `Meeting summary posted to ${
				existingUser.preferredChannelName || "#general"
			}`,
		});
	} catch (error) {
		console.error("Error posting to slack:", error);
		return NextResponse.json(
			{ error: "Failed to post to slack" },
			{ status: 500 },
		);
	}
}
