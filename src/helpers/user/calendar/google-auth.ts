import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, user } from "@/db/schema";

export interface GoogleAccountTokens {
	userId: string;
	accessToken: string | null;
	accessTokenExpiresAt: Date | null;
	refreshToken: string | null;
}

export async function markCalendarDisconnected(
	userId: string,
	clearRefreshToken = false,
) {
	await db
		.update(user)
		.set({ calendarConnected: false })
		.where(eq(user.id, userId));

	if (clearRefreshToken) {
		await db
			.update(account)
			.set({
				accessToken: null,
				accessTokenExpiresAt: null,
				refreshToken: null,
			})
			.where(and(eq(account.userId, userId), eq(account.providerId, "google")));
	}
}

export async function getGoogleAccountTokens(userId: string) {
	const [accountRow] = await db
		.select({
			accessToken: account.accessToken,
			accessTokenExpiresAt: account.accessTokenExpiresAt,
			refreshToken: account.refreshToken,
			userId: account.userId,
		})
		.from(account)
		.where(and(eq(account.userId, userId), eq(account.providerId, "google")))
		.limit(1);

	return accountRow ?? null;
}

export async function refreshGoogleAccessToken(
	userId: string,
	refreshToken: string | null,
): Promise<string | null> {
	if (!refreshToken) {
		await markCalendarDisconnected(userId, true);
		return null;
	}

	try {
		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: process.env.GOOGLE_CLIENT_ID as string,
				client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			}),
		});

		const tokens = (await response.json()) as {
			access_token?: string;
			expires_in?: number;
		};

		if (!response.ok || !tokens.access_token) {
			await markCalendarDisconnected(userId);
			return null;
		}

		await db
			.update(account)
			.set({
				accessToken: tokens.access_token,
				accessTokenExpiresAt: new Date(
					Date.now() + (tokens.expires_in ?? 3600) * 1000,
				),
			})
			.where(and(eq(account.userId, userId), eq(account.providerId, "google")));

		return tokens.access_token;
	} catch (error) {
		console.error(`Token refresh error for ${userId}:`, error);
		await markCalendarDisconnected(userId);
		return null;
	}
}

export async function getValidGoogleAccessToken(
	tokens: GoogleAccountTokens,
): Promise<string | null> {
	const now = new Date();
	const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

	if (
		!tokens.accessToken ||
		!tokens.accessTokenExpiresAt ||
		tokens.accessTokenExpiresAt <= tenMinutesFromNow
	) {
		return refreshGoogleAccessToken(tokens.userId, tokens.refreshToken);
	}

	return tokens.accessToken;
}
