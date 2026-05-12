import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import type { UserIntegration } from "@/db/schema";
import { userIntegration } from "@/db/schema";
import { AsanaConnect } from "@/helpers/integrations/asana";
import { refreshAsanaToken } from "@/helpers/integrations/asana/refresh-asana-token";
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
				eq(userIntegration.provider, "asana"),
			),
		)
		.limit(1);

	if (!integration) {
		return NextResponse.json(
			{ error: "Asana is not connected" },
			{ status: 400 },
		);
	}

	try {
		const validToken = await getValidToken(integration);
		const asana = new AsanaConnect();

		const workspaces = await asana.getWorkspaces(validToken);

		const workspaceId = workspaces.data[0]?.gid;

		if (!workspaceId) {
			return NextResponse.json(
				{ error: "No workspace found" },
				{ status: 400 },
			);
		}

		const projects = await asana.getProjects(validToken, workspaceId);

		return NextResponse.json({
			projects: projects.data || [],
			workspaceId,
		});
	} catch (error) {
		console.error("Error loading asana projects:", error);
		return NextResponse.json(
			{ error: "Failed to load asana projects" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { projectId, projectName, workspaceId, createNew } =
		await request.json();

	const [integration] = await db
		.select()
		.from(userIntegration)
		.where(
			and(
				eq(userIntegration.userId, currentUser.id),
				eq(userIntegration.provider, "asana"),
			),
		)
		.limit(1);

	if (!integration) {
		return NextResponse.json(
			{ error: "Asana is not connected" },
			{ status: 400 },
		);
	}

	try {
		const validToken = await getValidToken(integration);

		const asana = new AsanaConnect();

		let finalProjectId = projectId;
		let finalProjectName = projectName;

		if (createNew && projectName) {
			const newProject = await asana.createProject(
				validToken,
				workspaceId,
				projectName,
			);
			finalProjectId = newProject.data.gid;
			finalProjectName = newProject.data.name;
		}

		await db
			.update(userIntegration)
			.set({
				projectId: finalProjectId,
				projectName: finalProjectName,
				workspaceId: workspaceId,
			})
			.where(eq(userIntegration.id, integration.id));

		return NextResponse.json({
			success: true,
			projectId: finalProjectId,
			projectName: finalProjectName,
		});
	} catch (error) {
		console.error("Error setting up asana project:", error);
		return NextResponse.json(
			{ error: "Failed to setup asana project" },
			{ status: 500 },
		);
	}
}

async function getValidToken(integration: UserIntegration) {
	if (integration.tokenExpiresAt && new Date() > integration.tokenExpiresAt) {
		const updated = await refreshAsanaToken(integration);
		return updated.accessToken;
	}

	return integration.accessToken;
}
