"use client";

import { Card, Link, ScrollShadow } from "@heroui/react";
import { NoteDoneIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { useMemo } from "react";
import type { Meeting } from "@/db/schema";

interface PastMeetingsProps {
	data: Meeting[];
}

function formatDayLabel(date: Date): string {
	if (isToday(date)) return "Today";
	if (isYesterday(date)) return "Yesterday";
	return format(date, "EEE, MMM d");
}

function groupMeetingsByDay(meetings: Meeting[]) {
	const groups = new Map<string, { label: string; meetings: Meeting[] }>();

	for (const meeting of meetings) {
		const day = startOfDay(meeting.startTime);
		const key = day.toISOString();

		let group = groups.get(key);
		if (!group) {
			group = { label: formatDayLabel(day), meetings: [] };
			groups.set(key, group);
		}
		group.meetings.push(meeting);
	}

	return [...groups.values()];
}

interface PastMeetingItemProps {
	meeting: Meeting;
}

function PastMeetingItem({ meeting }: PastMeetingItemProps) {
	const timeRange = `${format(meeting.startTime, "h:mm a")} – ${format(meeting.endTime, "h:mm a")}`;

	return (
		<Card className="w-full items-stretch md:flex-row">
			<div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-muted/40">
				<HugeiconsIcon
					icon={NoteDoneIcon}
					size={36}
					color="currentColor"
					strokeWidth={1.5}
				/>
			</div>

			<div className="flex flex-1 flex-col gap-3">
				<Card.Header className="gap-1">
					<Card.Title className="pr-8">{meeting.title}</Card.Title>
					{meeting.description && (
						<Card.Description className="line-clamp-2">
							{meeting.description}
						</Card.Description>
					)}

					<Link
						className="absolute top-5 right-5 no-underline hover:underline"
						href={`/meeting/${meeting.id}`}
					>
						View meeting
						<Link.Icon />
					</Link>
				</Card.Header>

				<Card.Footer className="mt-auto flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
					<span className="text-sm font-medium text-foreground">
						{timeRange}
					</span>
				</Card.Footer>
			</div>
		</Card>
	);
}

export default function PastMeetings({ data }: PastMeetingsProps) {
	const grouped = useMemo(() => groupMeetingsByDay(data), [data]);

	if (data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<HugeiconsIcon
					icon={NoteDoneIcon}
					size={48}
					className="text-foreground/40"
					strokeWidth={1.5}
				/>
				<p className="mt-3 text-sm text-foreground">
					No past meetings yet
				</p>
			</div>
		);
	}

	return (
		<ScrollShadow
			className="flex max-h-[calc(100svh-20rem)] flex-col gap-6 pr-1"
			orientation="vertical"
		>
			{grouped.map((group) => (
				<div key={group.label} className="flex flex-col gap-3">
					<h3 className="py-1 text-xs font-semibold uppercase tracking-wider text-foreground">
						{group.label}
					</h3>
					<div className="flex flex-col gap-3">
						{group.meetings.map((meeting) => (
							<PastMeetingItem key={meeting.id} meeting={meeting} />
						))}
					</div>
				</div>
			))}
		</ScrollShadow>
	);
}
