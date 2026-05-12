import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userIntegration } from "@/db/schema";
import { NotionConnect } from "@/helpers/integrations/notion";
import { withNotionAccessToken } from "@/helpers/integrations/notion/refresh-notion-token";
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
				eq(userIntegration.provider, "notion"),
			),
		)
		.limit(1);

	if (!integration) {
		return NextResponse.json(
			{ error: "Notion is not connected" },
			{ status: 400 },
		);
	}

	try {
		const notion = new NotionConnect();
		const databases = await withNotionAccessToken(integration, (accessToken) =>
			notion.searchDataSources(accessToken),
		);

		return NextResponse.json({ databases });
	} catch (error) {
		console.error("Error loading Notion databases:", error);
		return NextResponse.json(
			{ error: "Failed to load Notion databases" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { dataSourceId, databaseName } = await request.json();

	if (!dataSourceId || !databaseName) {
		return NextResponse.json(
			{ error: "Missing Notion data source ID or database name" },
			{ status: 400 },
		);
	}

	const [integration] = await db
		.select()
		.from(userIntegration)
		.where(
			and(
				eq(userIntegration.userId, currentUser.id),
				eq(userIntegration.provider, "notion"),
			),
		)
		.limit(1);

	if (!integration) {
		return NextResponse.json(
			{ error: "Notion is not connected" },
			{ status: 400 },
		);
	}

	try {
		const notion = new NotionConnect();

		await withNotionAccessToken(integration, (accessToken) =>
			notion.getDataSource(accessToken, dataSourceId),
		);

		await db
			.update(userIntegration)
			.set({
				boardId: dataSourceId,
				boardName: databaseName,
			})
			.where(eq(userIntegration.id, integration.id));

		return NextResponse.json({
			success: true,
			dataSourceId,
			databaseName,
		});
	} catch (error) {
		console.error("Error saving Notion setup:", error);
		return NextResponse.json(
			{ error: "Failed to save Notion setup" },
			{ status: 500 },
		);
	}
}
