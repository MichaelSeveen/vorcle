import { ActionItemData } from "../integrations-helper-types";

export class TrelloConnect {
  private API_KEY = process.env.TRELLO_API_KEY as string;
  private BASE_URL = "https://api.trello.com/1";

  async getBoards(token: string) {
    const response = await fetch(
      `${this.BASE_URL}/members/me/boards?key=${this.API_KEY}&token=${token}`
    );

    if (!response.ok) {
      throw new Error("Failed to load trello boards");
    }

    return response.json();
  }

  async createBoard(token: string, name: string) {
    const response = await fetch(
      `${this.BASE_URL}/boards?key=${
        this.API_KEY
      }&token=${token}&name=${encodeURIComponent(name)}&defaultLists=true`,
      { method: "POST" }
    );

    if (!response.ok) {
      throw new Error("Failed to create trello board");
    }

    return response.json();
  }

  async getBoardLists(token: string, boardId: string) {
    const response = await fetch(
      `${this.BASE_URL}/boards/${boardId}/lists?key=${this.API_KEY}&token=${token}`
    );

    if (!response.ok) {
      throw new Error("Failed to load trello board lists");
    }

    return response.json();
  }
  async createCard(token: string, listId: string, data: ActionItemData) {
    const response = await fetch(
      `${this.BASE_URL}/cards?key=${
        this.API_KEY
      }&token=${token}&idList=${listId}&name=${encodeURIComponent(
        data.title
      )}&desc=${encodeURIComponent(data.description || "")}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create trello card");
    }

    return response.json();
  }
}
