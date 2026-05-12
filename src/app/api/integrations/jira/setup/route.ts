import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import type { UserIntegration } from "@/db/schema";
import { userIntegration } from "@/db/schema";
import { JiraConnect } from "@/helpers/integrations/jira";
import { refreshJiraToken } from "@/helpers/integrations/jira/refresh-jira-token";
import { getCurrentUser } from "@/helpers/user";

export async function GET() {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const [integration] = await db
		.select()
		.from(userIntegration)
		.where(
			and(
				eq(userIntegration.userId, currentUser.id),
				eq(userIntegration.provider, "jira"),
			),
		)
		.limit(1);

	if (!integration?.workspaceId) {
		return NextResponse.json(
			{ error: "Jira is not connected" },
			{ status: 400 },
		);
	}

	try {
		const validToken = await getValidToken(integration);
		const jira = new JiraConnect();

		const projects = await jira.getProjects(
			validToken,
			integration.workspaceId,
		);
		return NextResponse.json({
			projects: projects.values || [],
		});
	} catch (error) {
		console.error("Error loading jira projects:", error);
		return NextResponse.json(
			{ error: "Failed to load jira projects" },
			{ status: 500 },
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

	const [integration] = await db
		.select()
		.from(userIntegration)
		.where(
			and(
				eq(userIntegration.userId, currentUser.id),
				eq(userIntegration.provider, "jira"),
			),
		)
		.limit(1);

	if (!integration?.workspaceId) {
		return NextResponse.json(
			{ error: "Jira is not connected" },
			{ status: 400 },
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
					key,
				);

				finalProjectName = projectName;
				finalProjectKey = newProject.key;
			} catch (createError) {
				console.error("Failed to create jira project:", createError);
				return NextResponse.json(
					{
						error:
							"Failed to create jira project. You may not have admin permissions.",
					},
					{ status: 403 },
				);
			}
		} else if (projectId) {
			const projects = await jira.getProjects(
				validToken,
				integration.workspaceId,
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
					{ status: 404 },
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
				{ status: 400 },
			);
		}

		await db
			.update(userIntegration)
			.set({
				projectId: finalProjectKey,
				projectName: finalProjectName,
			})
			.where(eq(userIntegration.id, integration.id));

		return NextResponse.json({
			success: true,
			projectId: finalProjectKey,
			projectName: finalProjectName,
		});
	} catch (error) {
		console.error("Error setting up jira project:", error);
		return NextResponse.json(
			{ error: "Failed to setup jira project" },
			{ status: 500 },
		);
	}
}

async function getValidToken(integration: UserIntegration) {
	if (integration.tokenExpiresAt && new Date() > integration.tokenExpiresAt) {
		const updated = await refreshJiraToken(integration);
		return updated.accessToken;
	}

	return integration.accessToken;
}
