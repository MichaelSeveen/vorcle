import { getSortingStateParser } from "@/lib/data-table/parsers";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  createParser,
} from "nuqs/server";
import { MeetingTableItems } from "@/config/types";

export const parseCreatedAt = createParser<number[]>({
  parse(queryValue) {
    if (!queryValue) return [];
    const parts = queryValue.split(",");
    const nums = parts.map((s) => Number(s)).filter((n) => !Number.isNaN(n));

    return nums.length > 0 ? nums : [];
  },

  serialize(value) {
    return Array.isArray(value) && value.length > 0 ? value.join(",") : "";
  },
});

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<MeetingTableItems>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  title: parseAsString.withDefault(""),
  createdAt: parseCreatedAt.withDefault([]),
});

export type GetMeetingDataSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
