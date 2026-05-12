interface ParsedDateToken {
	year: number;
	month: number;
	day: number;
}

export interface ParsedMeetingDateRange {
	from: string | null;
	to: string | null;
}

const DATE_TOKEN_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateToken(
	token: string | null | undefined,
): ParsedDateToken | null {
	if (!token) {
		return null;
	}

	const trimmedToken = token.trim();
	const match = DATE_TOKEN_PATTERN.exec(trimmedToken);

	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const localDate = new Date(year, month - 1, day);

	if (
		localDate.getFullYear() !== year ||
		localDate.getMonth() !== month - 1 ||
		localDate.getDate() !== day
	) {
		return null;
	}

	return {
		year,
		month,
		day,
	};
}

function getLocalDateFromParts(parts: ParsedDateToken): Date {
	return new Date(parts.year, parts.month - 1, parts.day);
}

function getUtcDateFromParts(parts: ParsedDateToken, endOfDay: boolean): Date {
	return new Date(
		Date.UTC(
			parts.year,
			parts.month - 1,
			parts.day,
			endOfDay ? 23 : 0,
			endOfDay ? 59 : 0,
			endOfDay ? 59 : 0,
			endOfDay ? 999 : 0,
		),
	);
}

export function getDateToken(date: Date | null | undefined): string | null {
	if (!date) {
		return null;
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function parseMeetingDateRange(
	value: string | null | undefined,
): ParsedMeetingDateRange {
	if (!value?.trim()) {
		return {
			from: null,
			to: null,
		};
	}

	const [rawFrom, rawTo] = value.split(",", 2);
	const fromParts = parseDateToken(rawFrom);
	const toParts = parseDateToken(rawTo);

	if (fromParts && toParts) {
		const fromTime = getUtcDateFromParts(fromParts, false).getTime();
		const toTime = getUtcDateFromParts(toParts, false).getTime();

		if (fromTime > toTime) {
			return {
				from: rawTo ?? null,
				to: rawFrom ?? null,
			};
		}
	}

	return {
		from: fromParts ? (rawFrom ?? null) : null,
		to: toParts ? (rawTo ?? null) : null,
	};
}

export function serializeMeetingDateRange(
	range: ParsedMeetingDateRange,
): string {
	const values = [range.from, range.to].filter((value): value is string =>
		Boolean(value),
	);

	return values.join(",");
}

export function getCalendarDateFromToken(
	token: string | null | undefined,
): Date | undefined {
	const parts = parseDateToken(token);

	return parts ? getLocalDateFromParts(parts) : undefined;
}

export function getPostgresDateBounds(value: string | null | undefined): {
	from: Date | undefined;
	to: Date | undefined;
} {
	const range = parseMeetingDateRange(value);
	const fromParts = parseDateToken(range.from);
	const toParts = parseDateToken(range.to);

	return {
		from: fromParts ? getUtcDateFromParts(fromParts, false) : undefined,
		to: toParts ? getUtcDateFromParts(toParts, true) : undefined,
	};
}
