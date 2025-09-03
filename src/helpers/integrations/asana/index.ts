import { ActionItemData } from "../integrations-helper-types";

export class AsanaConnect {
  private BASE_URL = "https://app.asana.com/api/1.0";

  async getWorkspaces(token: string) {
    const response = await fetch(`${this.BASE_URL}/workspaces`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load workspaces");
    }

    return response.json();
  }

  async getProjects(token: string, workspaceId: string) {
    const response = await fetch(
      `${this.BASE_URL}/projects?workspace=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load projects");
    }

    return response.json();
  }

  async createProject(token: string, workspaceId: string, projectName: string) {
    const response = await fetch(`${this.BASE_URL}/projects`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          name: projectName,
          workspace: workspaceId,
        },
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to create project");
    }

    return response.json();
  }

  async createTask(token: string, projectId: string, data: ActionItemData) {
    const response = await fetch(`${this.BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          name: data.title,
          notes: data.description || "Action item from the meeting",
          projects: [projectId],
        },
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to create task");
    }

    return response.json();
  }
}
