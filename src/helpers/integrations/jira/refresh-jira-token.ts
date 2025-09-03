import { UserIntegration } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function refreshJiraToken(integration: UserIntegration) {
  try {
    const response = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: process.env.JIRA_CLIENT_ID as string,
        client_secret: process.env.JIRA_CLIENT_SECRET as string,
        refresh_token: integration.refreshToken as string,
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh jira token");
      throw new Error("Failed to refresh jira token");
    }

    const data = await response.json();

    const updatedIntegration = await prisma.userIntegration.update({
      where: {
        id: integration.id,
      },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    });

    return updatedIntegration;
  } catch (error) {
    console.error("Error refreshing jira token", error);
    throw error;
  }
}
