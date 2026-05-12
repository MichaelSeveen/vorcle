import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";
import { getGoogleOverlayEvents } from "@/helpers/user/calendar/google-overlay";

export async function GET(request: NextRequest) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");
	const timeZone = searchParams.get("timeZone");

	if (!from || !to || !timeZone) {
		return NextResponse.json(
			{ error: "Missing from, to, or timeZone query parameter" },
			{ status: 400 },
		);
	}

	const rangeStart = new Date(from);
	const rangeEnd = new Date(to);

	if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
		return NextResponse.json({ error: "Invalid range" }, { status: 400 });
	}

	const events = await getGoogleOverlayEvents({
		rangeStart,
		rangeEnd,
		timeZone,
		user: {
			id: currentUser.id,
			name: currentUser.name,
			image: currentUser.image,
		},
	});

	return NextResponse.json({ events });
}
