export interface IntegrationConfig {
	provider: "asana" | "jira" | "notion" | "trello";
	connected: boolean;
	boardName?: string;
	databaseName?: string;
	projectName?: string;
}

export interface ActionItemData {
	title: string;
	description?: string;
	dueDate?: string;
	assignee?: string;
}
