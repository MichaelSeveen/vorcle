import { TZDate } from "@date-fns/tz";
import {
	endOfDay,
	endOfMonth,
	endOfWeek,
	endOfYear,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from "date-fns";
import type { ByWeekday, Options } from "rrule";
import { RRule, RRuleSet } from "rrule";
import type {
	CalendarView,
	Event,
	RecurrenceEndType,
	RecurrenceFrequency,
	WeekdayCode,
} from "@/components/event-calendar/config/types";
import { WEEKDAY_CODES } from "@/components/event-calendar/config/types";
import { buildCalendarEventId, sortCalendarEvents } from "./normalize";

const FLOATING_WEEKDAY_CODES = [
	"MO",
	"TU",
	"WE",
	"TH",
	"FR",
	"SA",
	"SU",
] as const;

const FREQUENCY_TO_RRULE: Record<RecurrenceFrequency, number> = {
	daily: RRule.DAILY,
	weekly: RRule.WEEKLY,
	monthly: RRule.MONTHLY,
	yearly: RRule.YEARLY,
};

const RRULE_TO_FREQUENCY: Record<number, RecurrenceFrequency> = {
	[RRule.DAILY]: "daily",
	[RRule.WEEKLY]: "weekly",
	[RRule.MONTHLY]: "monthly",
	[RRule.YEARLY]: "yearly",
};

const WEEKDAY_LABELS: Record<WeekdayCode, string> = {
	SU: "Sunday",
	MO: "Monday",
	TU: "Tuesday",
	WE: "Wednesday",
	TH: "Thursday",
	FR: "Friday",
	SA: "Saturday",
};

const WEEKDAY_TO_RRULE = {
	SU: RRule.SU,
	MO: RRule.MO,
	TU: RRule.TU,
	WE: RRule.WE,
	TH: RRule.TH,
	FR: RRule.FR,
	SA: RRule.SA,
} as const;

const UTC_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
	year: "numeric",
});

interface ParsedRecurrenceRule {
	byDay: WeekdayCode[];
	count: number | null;
	freq: RecurrenceFrequency;
	interval: number;
	options: Partial<Options>;
	until: Date | null;
}

interface ZonedParts {
	day: number;
	hour: number;
	millisecond: number;
	minute: number;
	monthIndex: number;
	second: number;
	year: number;
}

function getRecurrenceTimeZone(event: Event) {
	return event.recurrence?.timezone ?? event.timeZone ?? "UTC";
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
	const zonedDate = new TZDate(date, timeZone);
	return {
		day: zonedDate.getDate(),
		hour: zonedDate.getHours(),
		millisecond: zonedDate.getMilliseconds(),
		minute: zonedDate.getMinutes(),
		monthIndex: zonedDate.getMonth(),
		second: zonedDate.getSeconds(),
		year: zonedDate.getFullYear(),
	};
}

function createFloatingDate(parts: ZonedParts) {
	return new Date(
		Date.UTC(
			parts.year,
			parts.monthIndex,
			parts.day,
			parts.hour,
			parts.minute,
			parts.second,
			parts.millisecond,
		),
	);
}

function toFloatingRRuleDate(date: Date, timeZone: string) {
	return createFloatingDate(getZonedParts(date, timeZone));
}

function fromFloatingRRuleDate(date: Date, timeZone: string) {
	const zonedDate = new TZDate(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
		date.getUTCHours(),
		date.getUTCMinutes(),
		date.getUTCSeconds(),
		date.getUTCMilliseconds(),
		timeZone,
	);

	return new Date(zonedDate.getTime());
}

function getWeekdayCodeFromDate(date: Date, timeZone: string): WeekdayCode {
	const zonedDate = new TZDate(date, timeZone);
	return WEEKDAY_CODES[zonedDate.getDay()] as WeekdayCode;
}

function parseStoredUntil(value: string, timeZone?: string | null) {
	const trimmedValue = value.trim();

	if (/^\d{8}(T\d{6}Z?)?$/.test(trimmedValue)) {
		try {
			return (
				RRule.parseString(`FREQ=DAILY;UNTIL=${trimmedValue}`).until ?? null
			);
		} catch {
			return null;
		}
	}

	const parsedDate = new Date(trimmedValue);
	if (Number.isNaN(parsedDate.getTime())) {
		return null;
	}

	return timeZone ? toFloatingRRuleDate(parsedDate, timeZone) : parsedDate;
}

function toRRuleUntilString(date: Date) {
	return [
		date.getUTCFullYear().toString().padStart(4, "0"),
		(date.getUTCMonth() + 1).toString().padStart(2, "0"),
		date.getUTCDate().toString().padStart(2, "0"),
		"T",
		date.getUTCHours().toString().padStart(2, "0"),
		date.getUTCMinutes().toString().padStart(2, "0"),
		date.getUTCSeconds().toString().padStart(2, "0"),
		"Z",
	].join("");
}

function normalizeStoredRule(rule: string, timeZone?: string | null) {
	return rule.replace(/UNTIL=([^;\n]+)/gi, (segment, untilValue) => {
		const parsedUntil = parseStoredUntil(untilValue, timeZone);
		return parsedUntil ? `UNTIL=${toRRuleUntilString(parsedUntil)}` : segment;
	});
}

function normalizeWeekdayCodes(
	value: ByWeekday | ByWeekday[] | null | undefined,
): WeekdayCode[] {
	const weekdays = Array.isArray(value) ? value : value ? [value] : [];

	return weekdays
		.map((weekday) => {
			if (typeof weekday === "number") {
				return FLOATING_WEEKDAY_CODES[weekday] ?? null;
			}

			if (typeof weekday === "string") {
				return WEEKDAY_CODES.includes(weekday as WeekdayCode)
					? (weekday as WeekdayCode)
					: null;
			}

			const serializedWeekday = weekday.toString();
			return serializedWeekday.length === 2 &&
				WEEKDAY_CODES.includes(serializedWeekday as WeekdayCode)
				? (serializedWeekday as WeekdayCode)
				: null;
		})
		.filter((weekday): weekday is WeekdayCode => weekday !== null);
}

function parseRecurrenceRule(
	rule: string,
	timeZone?: string | null,
): ParsedRecurrenceRule {
	const options = RRule.parseString(normalizeStoredRule(rule, timeZone));
	const frequency =
		typeof options.freq === "number"
			? (RRULE_TO_FREQUENCY[options.freq] ?? "weekly")
			: "weekly";

	return {
		byDay: normalizeWeekdayCodes(options.byweekday),
		count: typeof options.count === "number" ? options.count : null,
		freq: frequency,
		interval:
			typeof options.interval === "number" && options.interval > 0
				? options.interval
				: 1,
		options,
		until: options.until instanceof Date ? options.until : null,
	};
}

function serializeRecurrenceRule(options: Partial<Options>) {
	const rruleLine = RRule.optionsToString(options)
		.split(/\r?\n/)
		.find((line) => line.startsWith("RRULE:"));

	return rruleLine ? rruleLine.replace(/^RRULE:/, "") : null;
}

function eventOverlapsRange(event: Event, rangeStart: Date, rangeEnd: Date) {
	const start = new Date(event.startDate);
	const end = new Date(event.endDate);

	return start <= rangeEnd && end >= rangeStart;
}

function buildRecurringEventSet(event: Event, timeZone: string) {
	if (!event.recurrence?.rule) {
		return null;
	}

	const parsedRule = parseRecurrenceRule(event.recurrence.rule, timeZone);
	const recurrenceSet = new RRuleSet();
	recurrenceSet.rrule(
		new RRule({
			...parsedRule.options,
			dtstart: toFloatingRRuleDate(new Date(event.startDate), timeZone),
		}),
	);

	for (const exDate of event.recurrence.exDates ?? []) {
		const parsedExDate = new Date(exDate);
		if (Number.isNaN(parsedExDate.getTime())) {
			continue;
		}

		recurrenceSet.exdate(toFloatingRRuleDate(parsedExDate, timeZone));
	}

	return recurrenceSet;
}

function buildOccurrence(event: Event, occurrenceStartDate: Date) {
	const duration =
		new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
	const occurrenceEndDate = new Date(occurrenceStartDate.getTime() + duration);
	const occurrenceStartIso = occurrenceStartDate.toISOString();

	return {
		...event,
		id: buildCalendarEventId(event.source, event.sourceId, occurrenceStartIso),
		startDate: occurrenceStartIso,
		endDate: occurrenceEndDate.toISOString(),
		recurrence: {
			rule: event.recurrence?.rule ?? null,
			timezone: event.recurrence?.timezone ?? null,
			exDates: event.recurrence?.exDates ?? [],
			isInstance: true,
			occurrenceStart: occurrenceStartIso,
		},
	};
}

function toPickerDate(date: Date) {
	return new Date(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
		12,
		0,
		0,
		0,
	);
}

export function isRecurringEvent(event: Event) {
	return Boolean(event.recurrence?.rule);
}

export function getVisibleRangeForView(view: CalendarView, date: Date) {
	switch (view) {
		case "day":
			return { start: startOfDay(date), end: endOfDay(date) };
		case "week":
			return { start: startOfWeek(date), end: endOfWeek(date) };
		case "year":
			return { start: startOfYear(date), end: endOfYear(date) };
		case "month":
			return {
				start: startOfWeek(startOfMonth(date)),
				end: endOfWeek(endOfMonth(date)),
			};
		case "agenda":
			return { start: startOfMonth(date), end: endOfMonth(date) };
	}
}

export function buildRRuleFromForm(args: {
	repeats: boolean;
	repeatFrequency: RecurrenceFrequency;
	repeatInterval: number;
	repeatWeekdays: WeekdayCode[];
	repeatEndType: RecurrenceEndType;
	repeatUntil?: Date | null;
	repeatCount?: number | null;
	startDate: Date;
	startTime: { hour: number; minute: number };
	timeZone: string;
}) {
	if (!args.repeats) {
		return null;
	}

	const selectedWeekdays =
		args.repeatFrequency === "weekly"
			? args.repeatWeekdays.length > 0
				? args.repeatWeekdays
				: [getWeekdayCodeFromDate(args.startDate, args.timeZone)]
			: [];

	return serializeRecurrenceRule({
		byweekday:
			selectedWeekdays.length > 0
				? selectedWeekdays.map((weekday) => WEEKDAY_TO_RRULE[weekday])
				: null,
		count:
			args.repeatEndType === "after" && args.repeatCount
				? args.repeatCount
				: null,
		freq: FREQUENCY_TO_RRULE[args.repeatFrequency],
		interval: args.repeatInterval,
		until:
			args.repeatEndType === "on" && args.repeatUntil
				? new Date(
						Date.UTC(
							args.repeatUntil.getFullYear(),
							args.repeatUntil.getMonth(),
							args.repeatUntil.getDate(),
							args.startTime.hour,
							args.startTime.minute,
							0,
							0,
						),
					)
				: null,
	});
}

export function getRecurrenceFormValues(event?: Event) {
	const defaults = {
		repeats: false,
		repeatFrequency: "weekly" as RecurrenceFrequency,
		repeatInterval: 1,
		repeatWeekdays: [] as WeekdayCode[],
		repeatEndType: "never" as RecurrenceEndType,
		repeatUntil: null as Date | null,
		repeatCount: null as number | null,
	};

	if (!event?.recurrence?.rule) {
		return defaults;
	}

	try {
		const timeZone = getRecurrenceTimeZone(event);
		const rule = parseRecurrenceRule(event.recurrence.rule, timeZone);

		return {
			repeats: true,
			repeatFrequency: rule.freq,
			repeatInterval: rule.interval,
			repeatWeekdays:
				rule.byDay.length > 0
					? rule.byDay
					: [getWeekdayCodeFromDate(new Date(event.startDate), timeZone)],
			repeatEndType: rule.count
				? ("after" as const)
				: rule.until
					? ("on" as const)
					: ("never" as const),
			repeatUntil: rule.until ? toPickerDate(rule.until) : null,
			repeatCount: rule.count,
		};
	} catch (error) {
		console.error("Failed to parse recurrence rule for form defaults", error);
		return defaults;
	}
}

export function getRecurrenceSummary(event: Event) {
	if (!event.recurrence?.rule) {
		return null;
	}

	try {
		const rule = parseRecurrenceRule(
			event.recurrence.rule,
			getRecurrenceTimeZone(event),
		);
		const unitLabel =
			rule.freq === "daily"
				? rule.interval === 1
					? "every day"
					: `every ${rule.interval} days`
				: rule.freq === "weekly"
					? rule.interval === 1
						? "every week"
						: `every ${rule.interval} weeks`
					: rule.freq === "monthly"
						? rule.interval === 1
							? "every month"
							: `every ${rule.interval} months`
						: rule.interval === 1
							? "every year"
							: `every ${rule.interval} years`;
		const weekdayText =
			rule.byDay.length > 0
				? ` on ${rule.byDay.map((day) => WEEKDAY_LABELS[day]).join(", ")}`
				: "";
		const untilText = rule.until
			? `; series ends ${UTC_DATE_FORMATTER.format(rule.until)}`
			: "";
		const countText = rule.count ? `; ${rule.count} occurrences total` : "";

		return `Repeats ${unitLabel}${weekdayText}${untilText}${countText}`;
	} catch (error) {
		console.error("Failed to build recurrence summary", error);
		return null;
	}
}

export function expandRecurringEvent(
	event: Event,
	rangeStart: Date,
	rangeEnd: Date,
) {
	if (!isRecurringEvent(event) || !event.recurrence?.rule) {
		return eventOverlapsRange(event, rangeStart, rangeEnd) ? [event] : [];
	}

	try {
		const timeZone = getRecurrenceTimeZone(event);
		const recurrenceSet = buildRecurringEventSet(event, timeZone);
		if (!recurrenceSet) {
			return [];
		}

		const duration =
			new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
		const floatingRangeStart = toFloatingRRuleDate(
			new Date(rangeStart.getTime() - duration),
			timeZone,
		);
		const floatingRangeEnd = toFloatingRRuleDate(rangeEnd, timeZone);

		return recurrenceSet
			.between(floatingRangeStart, floatingRangeEnd, true)
			.map((occurrenceDate) =>
				buildOccurrence(event, fromFloatingRRuleDate(occurrenceDate, timeZone)),
			)
			.filter((occurrence) =>
				eventOverlapsRange(occurrence, rangeStart, rangeEnd),
			);
	} catch (error) {
		console.error("Failed to expand recurring event", error);
		return eventOverlapsRange(event, rangeStart, rangeEnd) ? [event] : [];
	}
}

export function expandCalendarEventsInRange(
	events: Event[],
	rangeStart: Date,
	rangeEnd: Date,
) {
	return sortCalendarEvents(
		events.flatMap((event) =>
			isRecurringEvent(event)
				? expandRecurringEvent(event, rangeStart, rangeEnd)
				: eventOverlapsRange(event, rangeStart, rangeEnd)
					? [event]
					: [],
		),
	);
}
