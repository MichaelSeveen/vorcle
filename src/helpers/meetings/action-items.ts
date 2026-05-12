import type { ActionItem } from "@/config/types";

export function parseActionItems(raw: unknown): ActionItem[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	return raw.flatMap((item, index) => {
		if (typeof item === "string") {
			return [{ id: index + 1, text: item }];
		}

		if (typeof item !== "object" || item === null) {
			return [];
		}

		const value = item as Record<string, unknown>;
		const text =
			typeof value.text === "string" && value.text.trim().length > 0
				? value.text.trim()
				: typeof value.task === "string" && value.task.trim().length > 0
					? value.task.trim()
					: null;

		if (!text) {
			return [];
		}

		return [
			{
				deadline:
					typeof value.deadline === "string" && value.deadline.trim().length > 0
						? value.deadline.trim()
						: null,
				id: typeof value.id === "number" ? value.id : index + 1,
				owner:
					typeof value.owner === "string" && value.owner.trim().length > 0
						? value.owner.trim()
						: null,
				text,
			},
		];
	});
}

export function formatActionItemMetadata(item: ActionItem) {
	const parts = [];

	if (item.owner) {
		parts.push(`Owner: ${item.owner}`);
	}

	if (item.deadline) {
		parts.push(`Deadline: ${item.deadline}`);
	}

	return parts.join(" | ");
}

export function formatActionItemForExport(item: ActionItem) {
	const metadata = formatActionItemMetadata(item);

	return metadata ? `${item.text} (${metadata})` : item.text;
}
