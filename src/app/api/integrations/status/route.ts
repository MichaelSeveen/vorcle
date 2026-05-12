import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { UserIntegrationResult } from "@/config/types";
import { db } from "@/db";
import { user, userIntegration } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function GET() {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const integrations = await db
			.select()
			.from(userIntegration)
			.where(eq(userIntegration.userId, currentUser.id));

		const [existingUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, currentUser.id))
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

		return NextResponse.json(result);
	} catch (error) {
		console.error("error fetching integration statsu:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
