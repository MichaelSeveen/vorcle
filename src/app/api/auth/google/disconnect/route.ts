import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function POST() {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const [accountRow] = await db
			.select()
			.from(account)
			.where(
				and(
					eq(account.userId, currentUser.id),
					eq(account.providerId, "google"),
				),
			)
			.limit(1);

		if (!accountRow) {
			return NextResponse.json(
				{ error: "No Google account linked" },
				{ status: 400 },
			);
		}

		const tokenToRevoke = accountRow.refreshToken || accountRow.accessToken;

		if (tokenToRevoke) {
			try {
				const revokeResponse = await fetch(
					"https://oauth2.googleapis.com/revoke",
					{
						method: "POST",
						headers: { "Content-Type": "application/x-www-form-urlencoded" },
						body: new URLSearchParams({ token: tokenToRevoke }),
					},
				);
				if (!revokeResponse.ok) {
					console.warn(
						"Failed to revoke Google token:",
						await revokeResponse.text(),
					);
				}
			} catch (err) {
				console.warn("Error during token revocation:", err);
			}
		}

		await db
			.update(account)
			.set({
				accessToken: null,
				refreshToken: null,
				accessTokenExpiresAt: null,
				refreshTokenExpiresAt: null,
				scope:
					"https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/userinfo.email,openid",
			})
			.where(eq(account.id, accountRow.id));

		await db
			.update(user)
			.set({ calendarConnected: false })
			.where(eq(user.id, currentUser.id));

		return NextResponse.json({
			success: true,
			message: "Calendar disconnected successfully",
		});
	} catch (error) {
		console.error("Disconnect error:", error);
		return NextResponse.json(
			{ error: "Failed to disconnect calendar" },
			{ status: 500 },
		);
	}
}
