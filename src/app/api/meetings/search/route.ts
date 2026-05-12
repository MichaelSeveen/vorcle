import { type NextRequest, NextResponse } from "next/server";
import { searchMeetings } from "@/helpers/meetings/search";
import { getCurrentUser } from "@/helpers/user";
import { searchParamsCache } from "@/lib/zod-schema";

export async function GET(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const input = searchParamsCache.parse(
			Object.fromEntries(request.nextUrl.searchParams.entries()),
		);
		const result = await searchMeetings({
			userId: currentUser.id,
			input,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Failed to search meetings", error);
		return NextResponse.json(
			{ error: "Failed to search meetings" },
			{ status: 500 },
		);
	}
}
