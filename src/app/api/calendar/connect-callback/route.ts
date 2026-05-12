import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getCurrentUser } from "@/helpers/user";

export async function GET(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await db
			.update(user)
			.set({ calendarConnected: true })
			.where(eq(user.id, currentUser.id));

		return NextResponse.redirect(
			new URL("/home?connected=direct", request.url),
		);
	} catch (error) {
		console.error("Connect callback error:", error);
		return NextResponse.redirect(
			new URL("/home?error=connect_failed", request.url),
		);
	}
}
