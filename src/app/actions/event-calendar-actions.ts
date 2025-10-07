"use server";

import { getCurrentUser } from "@/helpers/user";
import { Event, EventColor } from "@/components/event-calendar/config/types";
import prisma from "@/lib/prisma";

export async function create(data: Omit<Event, "id" | "user">) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        meetingLink: data.meetingLink || null,
        color: data.color || ("blue" as EventColor),
        startDate: data.startDate,
        endDate: data.endDate,
        attendees:
          data.attendees?.map((user) => ({
            ...user,
          })) || [],
        user: { connect: { id: currentUser.id } },
      },
    });

    if (newEvent) {
      const existingEvent = await prisma.event.findUnique({
        where: {
          id: newEvent.id,
        },
        include: {
          user: true,
        },
      });

      if (!existingEvent) {
        return {
          success: false,
          error: "Event not found",
        };
      }

      const eventWithUser = {
        ...newEvent,
        startDate: newEvent.startDate.toISOString(),
        endDate: newEvent.endDate.toISOString(),
        color: newEvent.color as EventColor,
        description: newEvent.description ?? "",
        attendees: (newEvent.attendees as unknown as Event["attendees"]) ?? [],
        user: {
          id: existingEvent.user.id,
          name: existingEvent.user.name,
          picturePath: existingEvent.user.image,
        },
      };

      return {
        success: true,
        event: eventWithUser,
      };
    }

    return { success: false, error: "Failed to create event" };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function update(data: Event) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const updatedEvent = await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        meetingLink: data.meetingLink,
        color: data.color,
        startDate: data.startDate,
        endDate: data.endDate,
        attendees: data.attendees?.map((user) => ({ ...user })) || [],
      },
    });

    const existingEvent = await prisma.event.findUnique({
      where: { id: updatedEvent.id },
      include: { user: true },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found" };
    }

    const eventWithUser = {
      ...updatedEvent,
      startDate: updatedEvent.startDate.toISOString(),
      endDate: updatedEvent.endDate.toISOString(),
      color: updatedEvent.color as EventColor,
      description: updatedEvent.description || "",
      attendees:
        (updatedEvent.attendees as unknown as Event["attendees"]) || [],
      user: {
        id: existingEvent.user.id,
        name: existingEvent.user.name,
        picturePath: existingEvent.user.image || null,
      },
    };

    return { success: true, event: eventWithUser };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function remove(id: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }
    await prisma.event.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
