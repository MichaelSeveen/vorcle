import { NextRequest, NextResponse } from "next/server";
import { AsanaConnect } from "@/helpers/integrations/asana";
import { conditionalRefreshToken } from "@/helpers/integrations/conditional-refresh-token";
import { JiraConnect } from "@/helpers/integrations/jira";
import { TrelloConnect } from "@/helpers/integrations/trello";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  color: string | null;
  idBoard: string;
  pos: number;
  subscribed: boolean;
  softLimit: number | null;
  type: string | null;
  datasource: {
    filter: boolean;
  };
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, actionItem, meetingId } = await request.json();

  let integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId: currentUser.id,
        provider,
      },
    },
  });

  if (!integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 400 }
    );
  }

  if (provider === "jira" || provider === "asana") {
    try {
      integration = await conditionalRefreshToken(integration);
    } catch (error) {
      console.error(`Token refresh failed for ${provider}:`, error);
      return NextResponse.json(
        { error: `Please reconnect your ${provider} integration` },
        { status: 400 }
      );
    }
  }

  try {
    if (provider === "trello") {
      if (!integration.boardId) {
        return NextResponse.json(
          { error: "Board not configured" },
          { status: 400 }
        );
      }

      const trello = new TrelloConnect();

      const lists: TrelloList[] = await trello.getBoardLists(
        integration.accessToken,
        integration.boardId
      );

      const todoList =
        lists.find(
          (list: TrelloList) =>
            list.name.toLowerCase().includes("to do") ||
            list.name.toLowerCase().includes("todo")
        ) || lists[0];

      if (!todoList) {
        return NextResponse.json(
          { error: "No suitable list found" },
          { status: 400 }
        );
      }

      await trello.createCard(integration.accessToken, todoList.id, {
        title: actionItem,
        description: `Action item from meeting ${meetingId || "Unknown"}`,
      });
    } else if (provider === "jira") {
      if (!integration.projectId || !integration.workspaceId) {
        return NextResponse.json(
          { error: "Project not configured" },
          { status: 400 }
        );
      }

      const jira = new JiraConnect();

      const title = actionItem || "Untitled action item";
      const description = `Action item from meeting ${meetingId || "Unknown"}`;

      await jira.createIssue(
        integration.accessToken,
        integration.workspaceId,
        integration.projectId,
        {
          title,
          description,
        }
      );
    } else if (provider === "asana") {
      if (!integration.projectId) {
        return NextResponse.json(
          { error: "Project not configured" },
          { status: 400 }
        );
      }

      const asana = new AsanaConnect();

      await asana.createTask(integration.accessToken, integration.projectId, {
        title: actionItem,
        description: `Action item from meeting ${meetingId || "Unknown"}`,
      });
    } else if (provider === "slack") {
      if (!integration.boardId) {
        return NextResponse.json(
          { error: "Slack channel not configured" },
          { status: 400 }
        );
      }

      const slackResponse = await fetch(
        "https://slack.com/api/chat.postMessage",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: integration.boardId,
            text: `Action item from meeting ${
              meetingId || "Unknown"
            }*\n${actionItem}`,
          }),
        }
      );

      const slackResult = await slackResponse.json();
      if (!slackResponse.ok) {
        throw new Error(`Slack API error: ${slackResult.error}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error creating action item in ${provider}:`, error);
    return NextResponse.json(
      { error: `Failed to create action item in ${provider}` },
      { status: 500 }
    );
  }
}
