import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userIntegration } from "@/db/schema";
import { TrelloConnect } from "@/helpers/integrations/trello";
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
				eq(userIntegration.provider, "trello"),
			),
		)
		.limit(1);

	if (!integration) {
		return NextResponse.json(
			{ error: "Trello is not connected" },
			{ status: 400 },
		);
	}

	try {
		const trello = new TrelloConnect();

		const boards = await trello.getBoards(integration.accessToken);

		return NextResponse.json({ boards });
	} catch (error) {
		console.error("Error loading trello boards:", error);
		return NextResponse.json(
			{ error: "Failed to load boards" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { boardId, boardName, createNew } = await request.json();

	const [integration] = await db
		.select()
		.from(userIntegration)
		.where(
			and(
				eq(userIntegration.userId, currentUser.id),
				eq(userIntegration.provider, "trello"),
			),
		)
		.limit(1);

	if (!integration) {
		return NextResponse.json(
			{ error: "Trello is not connected" },
			{ status: 400 },
		);
	}

	try {
		const trello = new TrelloConnect();

		let finalBoardId = boardId;
		let finalBoardName = boardName;

		if (createNew && boardName) {
			const newBoard = await trello.createBoard(
				integration.accessToken,
				boardName,
			);

			finalBoardId = newBoard.id;
			finalBoardName = newBoard.name;
		}

		await db
			.update(userIntegration)
			.set({
				boardId: finalBoardId,
				boardName: finalBoardName,
			})
			.where(eq(userIntegration.id, integration.id));

		return NextResponse.json({
			success: true,
			boardId: finalBoardId,
			boardName: finalBoardName,
		});
	} catch (error) {
		console.error("Error setting up trello board:", error);
		return NextResponse.json(
			{ error: "Failed to setup trello board" },
			{ status: 500 },
		);
	}
}
