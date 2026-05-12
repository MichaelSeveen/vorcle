import {
	createParser,
	createSearchParamsCache,
	parseAsInteger,
	parseAsString,
} from "nuqs/server";
import type {
	MeetingSearchParams,
	MeetingSearchSort,
	MeetingSearchSortColumn,
} from "@/helpers/meetings/search";

const sortableMeetingColumns = new Set<MeetingSearchSortColumn>([
	"createdAt",
	"endTime",
	"startTime",
	"title",
	"updatedAt",
]);

function isMeetingSearchSort(value: unknown): value is MeetingSearchSort {
	if (!value || typeof value !== "object") {
		return false;
	}

	const sort = value as { desc?: unknown; id?: unknown };

	return (
		typeof sort.id === "string" &&
		sortableMeetingColumns.has(sort.id as MeetingSearchSortColumn) &&
		(typeof sort.desc === "boolean" || typeof sort.desc === "undefined")
	);
}

const parseMeetingSort = createParser<MeetingSearchSort[]>({
	parse(queryValue) {
		if (!queryValue) {
			return [];
		}

		try {
			const value = JSON.parse(queryValue) as unknown;

			return Array.isArray(value) ? value.filter(isMeetingSearchSort) : [];
		} catch {
			return [];
		}
	},
	serialize(value) {
		return value.length > 0 ? JSON.stringify(value) : "";
	},
});

export const searchParamsCache = createSearchParamsCache({
	createdAt: parseAsString.withDefault(""),
	page: parseAsInteger.withDefault(1),
	perPage: parseAsInteger.withDefault(10),
	query: parseAsString.withDefault(""),
	sort: parseMeetingSort.withDefault([]),
});

export type GetMeetingDataSchema = MeetingSearchParams;
