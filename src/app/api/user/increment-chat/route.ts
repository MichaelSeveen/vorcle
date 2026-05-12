import { NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";
import { incrementUserChatTokenUsage } from "@/lib/token-usage";

export async function POST() {
	const user = await getCurrentUser();

	if (!user) {
		return NextResponse.json(
			{ success: false, message: "Unauthorized" },
			{ status: 401 },
		);
	}

	const result = await incrementUserChatTokenUsage(user.id);
	return NextResponse.json(result);
}
