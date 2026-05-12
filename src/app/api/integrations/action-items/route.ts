import { WebClient } from "@slack/web-api";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import type { ActionItem } from "@/config/types";
import { db } from "@/db";
import { slackInstallation, user, userIntegration } from "@/db/schema";
import { AsanaConnect } from "@/helpers/integrations/asana";
import { conditionalRefreshToken } from "@/helpers/integrations/conditional-refresh-token";
import { JiraConnect } from "@/helpers/integrations/jira";
import { NotionConnect } from "@/helpers/integrations/notion";
import { withNotionAccessToken } from "@/helpers/integrations/notion/refresh-notion-token";
import { TrelloConnect } from "@/helpers/integrations/trello";
import { getCurrentUser } from "@/helpers/user";

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

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { provider, actionItem, meetingId } = await request.json();
	const item = actionItem as ActionItem | undefined;
	const title = item?.text?.trim();

	if (!provider || !item || !title) {
		return NextResponse.json(
			{ error: "Provider and action item text are required" },
			{ status: 400 },
		);
	}

	const description = buildActionItemDescription(item, meetingId);

	if (provider === "slack") {
		return postToSlack(currentUser.id, title, description);
	}

	let [integration] = await db
		.select()
		.from(userIntegration)
		.where(
			and(
				eq(userIntegration.userId, currentUser.id),
				eq(userIntegration.provider, provider),
			),
		)
		.limit(1);

	if (!integration) {
		return NextResponse.json(
			{ error: "Integration not found" },
			{ status: 400 },
		);
	}

	if (provider === "jira" || provider === "asana") {
		try {
			integration = await conditionalRefreshToken(integration);
		} catch (error) {
			console.error(`Token refresh failed for ${provider}:`, error);
			return NextResponse.json(
				{ error: `Please reconnect your ${provider} integration` },
				{ status: 400 },
			);
		}
	}

	try {
		if (provider === "trello") {
			if (!integration.boardId) {
				return NextResponse.json(
					{ error: "Board not configured" },
					{ status: 400 },
				);
			}

			const trello = new TrelloConnect();
			const lists: TrelloList[] = await trello.getBoardLists(
				integration.accessToken,
				integration.boardId,
			);

			const todoList =
				lists.find(
					(list: TrelloList) =>
						list.name.toLowerCase().includes("to do") ||
						list.name.toLowerCase().includes("todo"),
				) || lists[0];

			if (!todoList) {
				return NextResponse.json(
					{ error: "No suitable list found" },
					{ status: 400 },
				);
			}

			await trello.createCard(integration.accessToken, todoList.id, {
				title,
				description,
			});
		} else if (provider === "jira") {
			if (!integration.projectId || !integration.workspaceId) {
				return NextResponse.json(
					{ error: "Project not configured" },
					{ status: 400 },
				);
			}

			const jira = new JiraConnect();

			await jira.createIssue(
				integration.accessToken,
				integration.workspaceId,
				integration.projectId,
				{
					title,
					description,
				},
			);
		} else if (provider === "asana") {
			if (!integration.projectId) {
				return NextResponse.json(
					{ error: "Project not configured" },
					{ status: 400 },
				);
			}

			const asana = new AsanaConnect();

			await asana.createTask(integration.accessToken, integration.projectId, {
				title,
				description,
			});
		} else if (provider === "notion") {
			if (!integration.boardId) {
				return NextResponse.json(
					{ error: "Database not configured" },
					{ status: 400 },
				);
			}

			const notion = new NotionConnect();

			await withNotionAccessToken(integration, (accessToken) =>
				notion.createActionItem(accessToken, integration.boardId as string, {
					title,
					description,
					assignee: item.owner || undefined,
					dueDate: item.deadline || undefined,
				}),
			);
		} else {
			return NextResponse.json(
				{ error: `Unsupported integration provider: ${provider}` },
				{ status: 400 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(`Error creating action item in ${provider}:`, error);
		return NextResponse.json(
			{ error: `Failed to create action item in ${provider}` },
			{ status: 500 },
		);
	}
}

async function postToSlack(userId: string, title: string, description: string) {
	try {
		const [existingUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!existingUser?.slackTeamId) {
			return NextResponse.json(
				{ error: "Slack is not connected" },
				{ status: 400 },
			);
		}

		const [installation] = await db
			.select()
			.from(slackInstallation)
			.where(eq(slackInstallation.teamId, existingUser.slackTeamId))
			.limit(1);

		if (!installation) {
			return NextResponse.json(
				{ error: "Slack workspace not found" },
				{ status: 400 },
			);
		}

		const slack = new WebClient(installation.botToken);

		await slack.chat.postMessage({
			channel: existingUser.preferredChannelId || "#general",
			text: `*${title}*\n${description}`,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error creating action item in slack:", error);
		return NextResponse.json(
			{ error: "Failed to create action item in slack" },
			{ status: 500 },
		);
	}
}

function buildActionItemDescription(
	actionItem: ActionItem,
	meetingId?: string,
) {
	const lines = [`Action item from meeting ${meetingId || "Unknown"}`];

	if (actionItem.owner) {
		lines.push(`Owner: ${actionItem.owner}`);
	}

	if (actionItem.deadline) {
		lines.push(`Deadline: ${actionItem.deadline}`);
	}

	return lines.join("\n");
}
