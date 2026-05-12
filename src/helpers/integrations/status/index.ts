import "server-only";

import { eq } from "drizzle-orm";
import type { UserIntegrationResult } from "@/config/types";
import { db } from "@/db";
import { user, userIntegration } from "@/db/schema";

export async function getUserIntegrationStatus(userId: string) {
	try {
		const integrations = await db
			.select()
			.from(userIntegration)
			.where(eq(userIntegration.userId, userId));

		const [existingUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		const allProviders: Pick<
			UserIntegrationResult,
			"provider" | "name" | "isProviderConnected"
		>[] = [
			{ provider: "trello", name: "Trello", isProviderConnected: false },
			{ provider: "jira", name: "Jira", isProviderConnected: false },
			{ provider: "asana", name: "Asana", isProviderConnected: false },
			{ provider: "notion", name: "Notion", isProviderConnected: false },
		];

		const result: UserIntegrationResult[] = allProviders.map((provider) => {
			const integration = integrations.find(
				(i) => i.provider === provider.provider,
			);

			return {
				...provider,
				isProviderConnected: !!integration,
				boardName: integration?.boardName,
				databaseName:
					provider.provider === "notion" ? integration?.boardName : null,
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
