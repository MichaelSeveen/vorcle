"use client";

import { SearchField } from "@heroui/react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState, useTransition } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 650;

export function MeetingSearchInput() {
	const [, startTransition] = useTransition();

	const queryStateOptions = {
		clearOnDefault: true,
		history: "replace" as const,
		scroll: false,
		shallow: false,
		startTransition,
		throttleMs: 50,
	};

	const [{ query }, setSearchParams] = useQueryStates({
		page: parseAsInteger.withOptions(queryStateOptions).withDefault(1),
		query: parseAsString.withOptions(queryStateOptions).withDefault(""),
	});

	const [draftQuery, setDraftQuery] = useState(query);

	useEffect(() => {
		setDraftQuery(query);
	}, [query]);

	const commitQuery = (nextQuery: string) => {
		const normalizedQuery = nextQuery.trim().replace(/\s+/g, " ");

		void setSearchParams({
			page: 1,
			query: normalizedQuery || null,
		});
	};

	const debouncedCommit = useDebouncedCallback(commitQuery, SEARCH_DEBOUNCE_MS);

	const handleQueryChange = (value: string) => {
		setDraftQuery(value);
		debouncedCommit(value);
	};

	const commitImmediately = (nextQuery = draftQuery) => {
		debouncedCommit.cancel();
		startTransition(() => {
			commitQuery(nextQuery);
		});
	};

	return (
		<SearchField
			aria-label="Search meetings"
			fullWidth
			onChange={handleQueryChange}
			onClear={() => {
				setDraftQuery("");
				debouncedCommit.cancel();
				startTransition(() => {
					commitQuery("");
				});
			}}
			onSubmit={commitImmediately}
			value={draftQuery}
		>
			<SearchField.Group className="h-11">
				<SearchField.SearchIcon />
				<SearchField.Input
					className="h-full"
					onBlur={() => commitImmediately()}
					placeholder="Search by title or participant"
				/>
				<SearchField.ClearButton />
			</SearchField.Group>
		</SearchField>
	);
}
