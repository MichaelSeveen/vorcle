import type { ActionItemData } from "../integrations-helper-types";

const NOTION_API_BASE_URL = "https://api.notion.com/v1";

export const NOTION_API_VERSION = "2026-03-11";

type NotionRichText = {
	plain_text?: string;
};

type NotionSearchResult = {
	object: string;
	id: string;
	title?: NotionRichText[];
	in_trash?: boolean;
};

type NotionSearchResponse = {
	results: NotionSearchResult[];
	has_more: boolean;
	next_cursor: string | null;
};

type NotionDataSourceProperty = {
	name?: string;
	type: string;
};

type NotionDataSourceResponse = {
	properties: Record<string, NotionDataSourceProperty>;
};

type NotionPageBlock = {
	object: "block";
	type: "paragraph";
	paragraph: {
		rich_text: Array<{
			type: "text";
			text: {
				content: string;
			};
		}>;
	};
};

export type NotionSelectableDatabase = {
	id: string;
	name: string;
};

export class NotionApiError extends Error {
	status: number;
	code?: string;
	details?: unknown;

	constructor(
		message: string,
		options: {
			status: number;
			code?: string;
			details?: unknown;
		},
	) {
		super(message);
		this.name = "NotionApiError";
		this.status = options.status;
		this.code = options.code;
		this.details = options.details;
	}
}

export class NotionConnect {
	async searchDataSources(accessToken: string) {
		const dataSources = new Map<string, NotionSelectableDatabase>();
		let nextCursor: string | null = null;

		do {
			const response: NotionSearchResponse =
				await this.request<NotionSearchResponse>("/search", accessToken, {
					method: "POST",
					body: JSON.stringify({
						filter: {
							property: "object",
							value: "data_source",
						},
						page_size: 100,
						start_cursor: nextCursor ?? undefined,
					}),
				});

			for (const result of response.results) {
				if (result.object !== "data_source" || result.in_trash) {
					continue;
				}

				dataSources.set(result.id, {
					id: result.id,
					name: this.richTextToPlainText(result.title) || "Untitled",
				});
			}

			nextCursor = response.has_more ? response.next_cursor : null;
		} while (nextCursor);

		return Array.from(dataSources.values()).sort((left, right) =>
			left.name.localeCompare(right.name),
		);
	}

	async getDataSource(accessToken: string, dataSourceId: string) {
		return this.request<NotionDataSourceResponse>(
			`/data_sources/${dataSourceId}`,
			accessToken,
		);
	}

	async createPage(
		accessToken: string,
		dataSourceId: string,
		title: string,
		children: NotionPageBlock[],
	) {
		const dataSource = await this.getDataSource(accessToken, dataSourceId);
		const titleProperty = this.getTitlePropertyName(dataSource.properties);

		return this.request("/pages", accessToken, {
			method: "POST",
			body: JSON.stringify({
				parent: {
					type: "data_source_id",
					data_source_id: dataSourceId,
				},
				properties: {
					[titleProperty]: {
						title: [
							{
								text: {
									content: title,
								},
							},
						],
					},
				},
				children,
			}),
		});
	}

	async createActionItem(
		accessToken: string,
		dataSourceId: string,
		actionItem: ActionItemData,
	) {
		const details = [
			actionItem.description,
			actionItem.assignee ? `Owner: ${actionItem.assignee}` : null,
			actionItem.dueDate ? `Deadline: ${actionItem.dueDate}` : null,
		].filter((value): value is string => Boolean(value));

		const children =
			details.length > 0
				? details.map((detail) => this.createParagraphBlock(detail))
				: [this.createParagraphBlock("Action item captured from Vorcle.")];

		return this.createPage(
			accessToken,
			dataSourceId,
			actionItem.title,
			children,
		);
	}

	private async request<T>(
		path: string,
		accessToken: string,
		init?: RequestInit,
	): Promise<T> {
		const headers = new Headers(init?.headers);
		headers.set("Authorization", `Bearer ${accessToken}`);
		headers.set("Notion-Version", NOTION_API_VERSION);
		headers.set("Accept", "application/json");

		if (init?.body && !headers.has("Content-Type")) {
			headers.set("Content-Type", "application/json");
		}

		const response = await fetch(`${NOTION_API_BASE_URL}${path}`, {
			...init,
			headers,
		});

		const payload = await this.parseResponse(response);

		if (!response.ok) {
			throw new NotionApiError(
				this.extractErrorMessage(payload, response.status),
				{
					status: response.status,
					code: this.extractErrorCode(payload),
					details: payload,
				},
			);
		}

		return payload as T;
	}

	private async parseResponse(response: Response): Promise<unknown> {
		const text = await response.text();

		if (!text) {
			return null;
		}

		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	}

	private getTitlePropertyName(
		properties: Record<string, NotionDataSourceProperty>,
	) {
		for (const [propertyName, propertyValue] of Object.entries(properties)) {
			if (propertyValue.type === "title") {
				return propertyValue.name || propertyName;
			}
		}

		throw new Error(
			"Could not find a title property in the selected Notion data source",
		);
	}

	private createParagraphBlock(content: string): NotionPageBlock {
		return {
			object: "block",
			type: "paragraph",
			paragraph: {
				rich_text: [
					{
						type: "text",
						text: {
							content,
						},
					},
				],
			},
		};
	}

	private richTextToPlainText(value?: NotionRichText[]) {
		return value
			?.map((item) => item.plain_text ?? "")
			.join("")
			.trim();
	}

	private extractErrorMessage(payload: unknown, status: number) {
		if (
			payload &&
			typeof payload === "object" &&
			"message" in payload &&
			typeof payload.message === "string"
		) {
			return payload.message;
		}

		if (typeof payload === "string" && payload.length > 0) {
			return payload;
		}

		return `Notion request failed with status ${status}`;
	}

	private extractErrorCode(payload: unknown) {
		if (
			payload &&
			typeof payload === "object" &&
			"code" in payload &&
			typeof payload.code === "string"
		) {
			return payload.code;
		}

		return undefined;
	}
}

export function getNotionOAuthCredentials() {
	const clientId = process.env.NOTION_CLIENT_ID;
	const clientSecret = process.env.NOTION_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error("Missing Notion OAuth credentials");
	}

	return {
		clientId,
		clientSecret,
	};
}
