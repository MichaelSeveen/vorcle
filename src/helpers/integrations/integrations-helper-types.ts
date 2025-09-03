export interface IntegrationConfig {
  provider: "asana" | "jira" | "trello";
  connected: boolean;
  boardName?: string;
  projectName?: string;
}

export interface ActionItemData {
  title: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
}
