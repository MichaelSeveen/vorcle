import { NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";
import { IntegrationProvider } from "@/config/types";

export type UserIntegrationResult = {
  provider: IntegrationProvider;
  name: string;
  isProviderConnected: boolean;
  boardName?: string | null;
  projectName?: string | null;
  channelName?: string | null;
};

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const integrations = await prisma.userIntegration.findMany({
      where: {
        userId: currentUser.id,
      },
    });

    const existingUser = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
      },
    });

    const allProviders: Pick<
      UserIntegrationResult,
      "provider" | "name" | "isProviderConnected"
    >[] = [
      { provider: "trello", name: "Trello", isProviderConnected: false },
      { provider: "jira", name: "Jira", isProviderConnected: false },
      { provider: "asana", name: "Asana", isProviderConnected: false },
    ];

    const result: UserIntegrationResult[] = allProviders.map((provider) => {
      const integration = integrations.find(
        (i) => i.provider === provider.provider
      );

      return {
        ...provider,
        isProviderConnected: !!integration,
        boardName: integration?.boardName,
        projectName: integration?.projectName,
      };
    });

    if (existingUser?.slackConnected) {
      result.push({
        provider: "slack",
        name: "Slack",
        isProviderConnected: true,
        channelName: existingUser.preferredChannelName || "Not Set",
      });
    } else {
      result.push({
        provider: "slack",
        name: "Slack",
        isProviderConnected: false,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("error fetching integration statsu:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
