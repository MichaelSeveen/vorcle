import { eq } from "drizzle-orm";
import { db } from "@/db";
import { slackInstallation } from "@/db/schema";

export async function authorizeSlack(source: { teamId?: string }) {
	try {
		const { teamId } = source;

		if (!teamId) {
			throw new Error("No team ID provided");
		}
		const [installation] = await db
			.select()
			.from(slackInstallation)
			.where(eq(slackInstallation.teamId, teamId))
			.limit(1);

		if (!installation) {
			console.error("Installation not found or inactive for the team:", teamId);
			throw new Error(`Installation not found for team: ${teamId}`);
		}

		return {
			botToken: installation.botToken,
			teamId: installation.teamId,
		};
	} catch (error) {
		console.error("Auth error:", error);
		throw error;
	}
}
