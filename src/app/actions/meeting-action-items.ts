"use server";

import { ActionItem } from "@/config/types";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";
import type { InputJsonValue } from "@prisma/client/runtime/client";

export async function createActionItem(meetingId: string, itemText: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) return { success: false, error: "Not authenticated" };

    if (!itemText || itemText.trim().length === 0) {
      return { success: false, error: "Action item text cannot be empty" };
    }

    if (itemText.trim().length > 500) {
      return {
        success: false,
        error: "Action item text too long (max 500 characters)",
      };
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId: currentUser.id,
      },
    });

    if (!meeting)
      return {
        success: false,
        error: "Meeting not found",
      };

    const existingItems =
      (meeting.actionItems as unknown as ActionItem[]) || [];

    const nextId =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.id || 0)) + 1
        : 1;

    const newActionItem = {
      id: nextId,
      text: itemText,
    };

    const updatedActionItems = [...existingItems, newActionItem];

    await prisma.meeting.update({
      where: {
        id: meetingId,
      },
      data: {
        actionItems: updatedActionItems as unknown as InputJsonValue,
      },
    });

    return { success: true, data: newActionItem };
  } catch (error) {
    console.error("Error adding action item", error);
    return { success: false, error: "Failed to add action item" };
  }
}

export async function removeActionItem(meetingId: string, itemId: number) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) return { success: false, error: "Not authenticated" };

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId: currentUser.id,
      },
    });

    if (!meeting) return { success: false, error: "Meeting not found" };

    const actionItems = (meeting.actionItems as unknown as ActionItem[]) || [];

    const updatedActionItems = actionItems.filter((item) => item.id !== itemId);

    await prisma.meeting.update({
      where: {
        id: meetingId,
      },
      data: {
        actionItems: updatedActionItems as unknown as InputJsonValue,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting action item:", error);
    return { success: false, error: "Error deleting action item" };
  }
}
