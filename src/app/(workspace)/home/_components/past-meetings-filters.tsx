"use client";

import { MeetingCreatedAtRangeCalendar } from "@/components/meetings/meeting-created-at-range-calendar";
import { MeetingSearchInput } from "@/components/meetings/meeting-search-input";

export default function PastMeetingsFilters() {
	return (
		<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
			<MeetingSearchInput />
			<MeetingCreatedAtRangeCalendar />
		</div>
	);
}
