import { NextRequest, NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId, summary, actionItems } = await request.json();

    const existingUser = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
      },
    });

    if (!existingUser || !existingUser.slackTeamId) {
      return NextResponse.json(
        { error: "Slack is not enabled" },
        { status: 400 }
      );
    }

    const slackInstallation = await prisma.slackInstallation.findUnique({
      where: {
        teamId: existingUser.slackTeamId,
      },
    });

    if (!slackInstallation)
      return NextResponse.json(
        { error: "Slack workspace not found" },
        { status: 400 }
      );

    const slack = new WebClient(slackInstallation.botToken);
    const targetChannel = existingUser.preferredChannelId || "#general";

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
    });

    const meetingTitle = meeting?.title;

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
              text: `*Date:*\n${meeting?.startTime}`,
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
      { status: 500 }
    );
  }
}
