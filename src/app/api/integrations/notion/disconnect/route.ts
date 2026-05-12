import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { userIntegration } from "@/db/schema";
import {
	getNotionOAuthCredentials,
	NOTION_API_VERSION,
} from "@/helpers/integrations/notion";
import { getCurrentUser } from "@/helpers/user";

export async function POST() {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const [integration] = await db
			.select()
			.from(userIntegration)
			.where(
				and(
					eq(userIntegration.userId, currentUser.id),
					eq(userIntegration.provider, "notion"),
				),
			)
			.limit(1);

		if (integration) {
			await revokeNotionToken(integration.accessToken).catch((error) => {
				console.error(
					"Failed to revoke Notion token during disconnect:",
					error,
				);
			});
		}

		await db
			.delete(userIntegration)
			.where(
				and(
					eq(userIntegration.userId, currentUser.id),
					eq(userIntegration.provider, "notion"),
				),
			);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error disconnecting Notion:", error);
		return NextResponse.json(
			{ error: "Failed to disconnect Notion" },
			{ status: 500 },
		);
	}
}

async function revokeNotionToken(token: string) {
	const { clientId, clientSecret } = getNotionOAuthCredentials();
	const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
		"base64",
	);

	const response = await fetch("https://api.notion.com/v1/oauth/revoke", {
		method: "POST",
		headers: {
			Authorization: `Basic ${credentials}`,
			"Content-Type": "application/json",
			Accept: "application/json",
			"Notion-Version": NOTION_API_VERSION,
		},
		body: JSON.stringify({
			token,
		}),
	});

	if (!response.ok) {
		const payload = await response.text();
		throw new Error(
			`Notion revoke token failed (${response.status}): ${payload || "Unknown error"}`,
		);
	}
}
