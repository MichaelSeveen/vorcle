import type { UserIntegration } from "@/db/schema";
import { refreshAsanaToken } from "./asana/refresh-asana-token";
import { refreshJiraToken } from "./jira/refresh-jira-token";

export async function conditionalRefreshToken(integration: UserIntegration) {
	const now = new Date();
	const expiresAt = integration.tokenExpiresAt;

	if (!expiresAt || now >= new Date(expiresAt.getTime() - 5 * 60 * 1000)) {
		switch (integration.provider) {
			case "jira":
				return await refreshJiraToken(integration);
			case "asana":
				return await refreshAsanaToken(integration);
			default:
				return integration;
		}
	}
	return integration;
}
