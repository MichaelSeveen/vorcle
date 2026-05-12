import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { UserIntegration } from "@/db/schema";
import { userIntegration } from "@/db/schema";

export async function refreshAsanaToken(integration: UserIntegration) {
	try {
		const response = await fetch("https://app.asana.com/-/oauth_token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "refresh_token",
				client_id: process.env.ASANA_CLIENT_ID as string,
				client_secret: process.env.ASANA_CLIENT_SECRET as string,
				refresh_token: integration.refreshToken as string,
			}),
		});

		if (!response.ok) {
			console.error("Failed to refresh asana token");
			throw new Error("Failed to refresh asana token");
		}

		const data = await response.json();

		const [updatedIntegration] = await db
			.update(userIntegration)
			.set({
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
			})
			.where(eq(userIntegration.id, integration.id))
			.returning();

		return updatedIntegration;
	} catch (error) {
		console.error("Error refreshing asana token", error);
		throw error;
	}
}
