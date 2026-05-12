"use client";

import { Button, Popover, RangeCalendar } from "@heroui/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarDate } from "@internationalized/date";
import { format } from "date-fns";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { type ComponentProps, useMemo, useState, useTransition } from "react";
import {
	getCalendarDateFromToken,
	parseMeetingDateRange,
	serializeMeetingDateRange,
} from "@/lib/meetings/search-filters";

interface MeetingCreatedAtRangeCalendarProps {
	className?: string;
}

type HeroRangeCalendarValue = ComponentProps<typeof RangeCalendar>["value"];
type HeroRangeCalendarSelection = NonNullable<HeroRangeCalendarValue>;
type CalendarDateParts = {
	year: number;
	month: number;
	day: number;
};

function getHeroCalendarDateFromToken(token: string | null | undefined) {
	const date = getCalendarDateFromToken(token);

	return date
		? new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
		: null;
}

function getDateTokenFromCalendarDate(date: CalendarDateParts): string {
	return `${date.year}-${String(date.month).padStart(2, "0")}-${String(
		date.day,
	).padStart(2, "0")}`;
}

function getTriggerLabel(range: {
	from: Date | undefined;
	to: Date | undefined;
}) {
	if (!range.from) {
		return "Created date";
	}

	if (!range.to) {
		return `${format(range.from, "MMM d, yyyy")} onward`;
	}

	return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}

export function MeetingCreatedAtRangeCalendar({
	className,
}: MeetingCreatedAtRangeCalendarProps) {
	const [, startTransition] = useTransition();
	const [isOpen, setIsOpen] = useState(false);

	const queryStateOptions = {
		clearOnDefault: true,
		history: "replace" as const,
		scroll: false,
		shallow: false,
		startTransition,
		throttleMs: 50,
	};

	const [{ createdAt }, setSearchParams] = useQueryStates({
		createdAt: parseAsString.withOptions(queryStateOptions).withDefault(""),
		page: parseAsInteger.withOptions(queryStateOptions).withDefault(1),
	});

	const parsedRange = useMemo(
		() => parseMeetingDateRange(createdAt),
		[createdAt],
	);

	const selectedRange = useMemo<HeroRangeCalendarValue>(() => {
		const start = getHeroCalendarDateFromToken(parsedRange.from);
		const end = getHeroCalendarDateFromToken(parsedRange.to);

		if (!start || !end) {
			return null;
		}

		return { end, start } as unknown as HeroRangeCalendarSelection;
	}, [parsedRange]);

	const previewRange = useMemo(
		() => ({
			from: getCalendarDateFromToken(parsedRange.from),
			to: getCalendarDateFromToken(parsedRange.to),
		}),
		[parsedRange],
	);

	const handleSelect = (range: HeroRangeCalendarSelection) => {
		const nextValue = serializeMeetingDateRange({
			from: getDateTokenFromCalendarDate(range.start),
			to: getDateTokenFromCalendarDate(range.end),
		});

		void setSearchParams({
			createdAt: nextValue || null,
			page: 1,
		});
		setIsOpen(false);
	};

	const handleClear = () => {
		void setSearchParams({
			createdAt: null,
			page: 1,
		});
		setIsOpen(false);
	};

	return (
		<Popover isOpen={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger>
				<Button className={className} type="button" variant="outline">
					<HugeiconsIcon icon={Calendar03Icon} size={16} />
					{getTriggerLabel(previewRange)}
				</Button>
			</Popover.Trigger>
			<Popover.Content className="w-fit p-0">
				<RangeCalendar
					aria-label="Filter meetings by created date"
					className="p-3"
					onChange={handleSelect}
					value={selectedRange}
				>
					<RangeCalendar.Header>
						<RangeCalendar.Heading />
						<RangeCalendar.NavButton slot="previous" />
						<RangeCalendar.NavButton slot="next" />
					</RangeCalendar.Header>
					<RangeCalendar.Grid>
						<RangeCalendar.GridHeader>
							{(day) => (
								<RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
							)}
						</RangeCalendar.GridHeader>
						<RangeCalendar.GridBody>
							{(date) => <RangeCalendar.Cell date={date} />}
						</RangeCalendar.GridBody>
					</RangeCalendar.Grid>
				</RangeCalendar>

				{createdAt ? (
					<div className="border-t p-2">
						<Button
							fullWidth
							size="sm"
							type="button"
							variant="tertiary"
							onPress={handleClear}
						>
							Clear
						</Button>
					</div>
				) : null}
			</Popover.Content>
		</Popover>
	);
}
