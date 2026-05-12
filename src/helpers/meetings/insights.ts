export function parseInsightList(raw: unknown): string[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	return raw.flatMap((item) => {
		if (typeof item !== "string") {
			return [];
		}

		const value = item.trim();
		return value.length > 0 ? [value] : [];
	});
}
