import { ProviderIntegration } from "@/config/types";
import { JiraConnect } from "@/helpers/integrations/jira";
import { refreshJiraToken } from "@/helpers/integrations/jira/refresh-jira-token";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId: currentUser.id,
        provider: "jira",
      },
    },
  });

  if (!integration || !integration.workspaceId) {
    return NextResponse.json(
      { error: "Jira is not connected" },
      { status: 400 }
    );
  }

  try {
    const validToken = await getValidToken(integration);
    const jira = new JiraConnect();

    const projects = await jira.getProjects(
      validToken,
      integration.workspaceId
    );
    return NextResponse.json({
      projects: projects.values || [],
    });
  } catch (error) {
    console.error("Error loading jira projects:", error);
    return NextResponse.json(
      { error: "Failed to load jira projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, projectName, projectKey, createNew } =
    await request.json();

  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId: currentUser.id,
        provider: "jira",
      },
    },
  });

  if (!integration || !integration.workspaceId) {
    return NextResponse.json(
      { error: "Jira is not connected" },
      { status: 400 }
    );
  }

  try {
    const validToken = await getValidToken(integration);

    const jira = new JiraConnect();

    let finalProjectName = projectName;
    let finalProjectKey = projectKey;

    if (createNew && projectName) {
      try {
        const suggestedKey = projectName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .substring(0, 10);

        const key = projectKey || suggestedKey;

        const newProject = await jira.createProject(
          validToken,
          integration.workspaceId,
          projectName,
          key
        );

        finalProjectName = projectName;
        finalProjectKey = newProject.key;
      } catch (error) {
        console.error("Failed to create jira project:", error);
        return NextResponse.json(
          {
            error:
              "Failed to create jira project. You may not have admin permissions.",
          },
          { status: 403 }
        );
      }
    } else if (projectId) {
      const projects = await jira.getProjects(
        validToken,
        integration.workspaceId
      );

      const projectValues = projects.values as {
        id: string;
        key: string;
        name: string;
      }[];

      const selectedProject = projectValues.find((p) => p.id === projectId);

      if (!selectedProject) {
        return NextResponse.json(
          { error: "Jira project not found" },
          { status: 404 }
        );
      }

      finalProjectKey = selectedProject.key;
      finalProjectName = selectedProject.name;
    } else {
      return NextResponse.json(
        {
          error:
            "Either projectId or createNew with projectName must be provided",
        },
        { status: 400 }
      );
    }

    await prisma.userIntegration.update({
      where: {
        id: integration.id,
      },
      data: {
        projectId: finalProjectKey,
        projectName: finalProjectName,
      },
    });

    return NextResponse.json({
      success: true,
      projectId: finalProjectKey,
      projectName: finalProjectName,
    });
  } catch (error) {
    console.error("Error setting up jira project:", error);
    return NextResponse.json(
      { error: "Failed to setup jira project" },
      { status: 500 }
    );
  }
}

async function getValidToken(integration: ProviderIntegration) {
  if (integration.tokenExpiresAt && new Date() > integration.tokenExpiresAt) {
    const updated = await refreshJiraToken(integration);
    return updated.accessToken;
  }

  return integration.accessToken;
}
