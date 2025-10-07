import "server-only";

import prisma from "@/lib/prisma";
import { UserIntegrationResult } from "@/config/types";

export async function getUserIntegrationStatus(userId: string) {
  try {
    const integrations = await prisma.userIntegration.findMany({
      where: {
        userId,
      },
    });

    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
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

    return result;
  } catch (error) {
    console.error("Failed to load integration status:", error);
    return [];
  }
}
