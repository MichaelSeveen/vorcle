import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { UserIntegration } from "@/db/schema";
import { userIntegration } from "@/db/schema";
import {
	getNotionOAuthCredentials,
	NOTION_API_VERSION,
	NotionApiError,
} from "./index";

export async function refreshNotionToken(integration: UserIntegration) {
	if (!integration.refreshToken) {
		throw new Error("Notion refresh token is missing");
	}

	const { clientId, clientSecret } = getNotionOAuthCredentials();
	const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
		"base64",
	);

	const response = await fetch("https://api.notion.com/v1/oauth/token", {
		method: "POST",
		headers: {
			Authorization: `Basic ${credentials}`,
			"Content-Type": "application/json",
			Accept: "application/json",
			"Notion-Version": NOTION_API_VERSION,
		},
		body: JSON.stringify({
			grant_type: "refresh_token",
			refresh_token: integration.refreshToken,
		}),
	});

	const payload = await parseResponse(response);

	if (!response.ok) {
		throw new NotionApiError(extractErrorMessage(payload, response.status), {
			status: response.status,
			code: extractErrorCode(payload),
			details: payload,
		});
	}

	const tokenData = payload as {
		access_token: string;
		refresh_token: string;
	};

	const [updatedIntegration] = await db
		.update(userIntegration)
		.set({
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
		})
		.where(eq(userIntegration.id, integration.id))
		.returning();

	return updatedIntegration;
}

export async function withNotionAccessToken<T>(
	integration: UserIntegration,
	operation: (accessToken: string) => Promise<T>,
) {
	try {
		return await operation(integration.accessToken);
	} catch (error) {
		if (
			!(error instanceof NotionApiError) ||
			error.status !== 401 ||
			!integration.refreshToken
		) {
			throw error;
		}

		const refreshedIntegration = await refreshNotionToken(integration);
		return operation(refreshedIntegration.accessToken);
	}
}

async function parseResponse(response: Response) {
	const text = await response.text();

	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function extractErrorMessage(payload: unknown, status: number) {
	if (
		payload &&
		typeof payload === "object" &&
		"message" in payload &&
		typeof payload.message === "string"
	) {
		return payload.message;
	}

	if (typeof payload === "string" && payload.length > 0) {
		return payload;
	}

	return `Failed to refresh Notion token (${status})`;
}

function extractErrorCode(payload: unknown) {
	if (
		payload &&
		typeof payload === "object" &&
		"code" in payload &&
		typeof payload.code === "string"
	) {
		return payload.code;
	}

	return undefined;
}
