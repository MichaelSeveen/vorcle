import { TrelloConnect } from "@/helpers/integrations/trello";
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
        provider: "trello",
      },
    },
  });

  if (!integration) {
    return NextResponse.json(
      { error: "Trello is not connected" },
      { status: 400 }
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
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, boardName, createNew } = await request.json();

  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId: currentUser.id,
        provider: "trello",
      },
    },
  });
  if (!integration) {
    return NextResponse.json(
      { error: "Trello is not connected" },
      { status: 400 }
    );
  }

  try {
    const trello = new TrelloConnect();

    let finalBoardId = boardId;
    let finalBoardName = boardName;

    if (createNew && boardName) {
      const newBoard = await trello.createBoard(
        integration.accessToken,
        boardName
      );

      finalBoardId = newBoard.id;
      finalBoardName = newBoard.name;
    }

    await prisma.userIntegration.update({
      where: {
        id: integration.id,
      },
      data: {
        boardId: finalBoardId,
        boardName: finalBoardName,
      },
    });

    return NextResponse.json({
      success: true,
      boardId: finalBoardId,
      boardName: finalBoardName,
    });
  } catch (error) {
    console.error("Error setting up trello board:", error);
    return NextResponse.json(
      { error: "Failed to setup trello board" },
      { status: 500 }
    );
  }
}
