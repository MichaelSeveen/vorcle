import { type NextRequest, NextResponse } from "next/server";
import { getCalendarFeed } from "@/helpers/event-calendar/feed";
import { expandCalendarEventsInRange } from "@/helpers/event-calendar/recurrence";
import { getCurrentUser } from "@/helpers/user";

export async function GET(request: NextRequest) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const leadMinutes = Number(searchParams.get("leadMinutes") ?? "10");
	const includeGoogleOverlay =
		searchParams.get("includeGoogleOverlay") === "true";
	const timeZone = searchParams.get("timeZone") ?? "UTC";
	const from = searchParams.get("from");
	const to = searchParams.get("to");
	const rangeStart = from ? new Date(from) : new Date();
	const rangeEnd = to
		? new Date(to)
		: new Date(rangeStart.getTime() + leadMinutes * 60 * 1000);

	if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
		return NextResponse.json({ error: "Invalid range" }, { status: 400 });
	}

	const events = await getCalendarFeed({
		user: {
			id: currentUser.id,
			name: currentUser.name,
			image: currentUser.image,
		},
		rangeStart,
		rangeEnd,
		timeZone,
		includeGoogleOverlay,
	});

	const expandedEvents = expandCalendarEventsInRange(
		events,
		rangeStart,
		rangeEnd,
	).filter((event) => {
		const start = new Date(event.startDate);
		return start >= rangeStart && start <= rangeEnd;
	});

	return NextResponse.json({
		events: expandedEvents,
		leadMinutes,
	});
}
