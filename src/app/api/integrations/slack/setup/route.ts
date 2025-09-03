import { NextRequest, NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
      },
    });

    if (!user?.slackTeamId) {
      return NextResponse.json(
        { error: "Slack is not connected" },
        { status: 400 }
      );
    }

    const slackInstallation = await prisma.slackInstallation.findUnique({
      where: {
        teamId: user.slackTeamId,
      },
    });

    if (!slackInstallation) {
      return NextResponse.json(
        { error: "Slack installation not found" },
        { status: 400 }
      );
    }

    const slack = new WebClient(slackInstallation.botToken);

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
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId, channelName } = await request.json();

    await prisma.user.updateMany({
      where: {
        id: currentUser.id,
      },
      data: {
        preferredChannelId: channelId,
        preferredChannelName: channelName,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slack setup save error:", error);
    return NextResponse.json(
      { error: "Failed to save slack setup" },
      { status: 500 }
    );
  }
}
