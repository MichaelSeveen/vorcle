import "server-only";

import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	lte,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "@/db";
import { meeting } from "@/db/schema";
import { getPostgresDateBounds } from "@/lib/meetings/search-filters";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 50;

const meetingSortColumns = {
	createdAt: meeting.createdAt,
	endTime: meeting.endTime,
	startTime: meeting.startTime,
	title: meeting.title,
	updatedAt: meeting.updatedAt,
};

export type MeetingSearchSortColumn = keyof typeof meetingSortColumns;

export interface MeetingSearchSort {
	id: MeetingSearchSortColumn;
	desc?: boolean;
}

export interface MeetingSearchParams {
	createdAt: string;
	page: number;
	perPage: number;
	query: string;
	sort?: MeetingSearchSort[];
}

interface SearchMeetingsInput {
	userId: string;
	input: MeetingSearchParams;
}

function getMeetingSearchPagination(input: MeetingSearchParams) {
	const page =
		Number.isSafeInteger(input.page) && input.page > 0
			? input.page
			: DEFAULT_PAGE;
	const perPage =
		Number.isSafeInteger(input.perPage) && input.perPage > 0
			? Math.min(input.perPage, MAX_PER_PAGE)
			: DEFAULT_PER_PAGE;

	return {
		offset: (page - 1) * perPage,
		perPage,
	};
}

function getMeetingSearchConditions({
	input,
	userId,
}: SearchMeetingsInput): SQL[] {
	const conditions: SQL[] = [
		eq(meeting.userId, userId),
		eq(meeting.meetingEnded, true),
	];

	const trimmedQuery = input.query.trim();

	if (trimmedQuery) {
		const query = `%${trimmedQuery}%`;

		conditions.push(
			or(
				ilike(meeting.title, query),
				ilike(meeting.summary, query),
				ilike(meeting.description, query),
				sql`coalesce(${meeting.attendees}::text, '') ilike ${query}`,
			) as SQL,
		);
	}

	const createdAtBounds = getPostgresDateBounds(input.createdAt);

	if (createdAtBounds.from) {
		conditions.push(gte(meeting.createdAt, createdAtBounds.from));
	}

	if (createdAtBounds.to) {
		conditions.push(lte(meeting.createdAt, createdAtBounds.to));
	}

	return conditions;
}

function getMeetingSearchOrderBy(input: MeetingSearchParams) {
	if (!input.sort?.length) {
		return [desc(meeting.createdAt)];
	}

	const sortableColumns = input.sort.map((item) => {
		const column = meetingSortColumns[item.id];

		return item.desc ? desc(column) : asc(column);
	});

	return sortableColumns.length > 0
		? sortableColumns
		: [desc(meeting.createdAt)];
}

export async function searchMeetings({ input, userId }: SearchMeetingsInput) {
	const { offset, perPage } = getMeetingSearchPagination(input);
	const where = and(...getMeetingSearchConditions({ input, userId }));
	const orderBy = getMeetingSearchOrderBy(input);

	const [data, [{ total }]] = await Promise.all([
		db
			.select()
			.from(meeting)
			.where(where)
			.orderBy(...orderBy)
			.offset(offset)
			.limit(perPage),
		db.select({ total: count() }).from(meeting).where(where),
	]);

	return {
		data,
		pageCount: Math.ceil(total / perPage),
	};
}
