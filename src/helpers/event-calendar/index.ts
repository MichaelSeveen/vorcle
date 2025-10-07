import {
  Event,
  EventColor,
  User,
} from "@/components/event-calendar/config/types";
import prisma from "@/lib/prisma";

export async function getCalendarEvents(): Promise<Event[]> {
  const events = await prisma.event.findMany({
    include: {
      user: true,
    },
  });

  return events.map((event) => {
    const attendees = (event.attendees as unknown as User[]) ?? [];

    return {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      color: event.color as EventColor,
      description: event.description || "",
      attendees,
      user: {
        id: event.user.id,
        name: event.user.name,
        picturePath:
          `https://tapback.co/api/avatar/${event.user.name}.webp` || null,
      },
    };
  });
}

export async function getEventUsers(): Promise<User[]> {
  const events = await prisma.event.findMany({
    include: { user: true },
  });

  const allUsers: User[] = events.flatMap((event) => {
    const attendees =
      (event.attendees as {
        id: string;
        name: string;
        picturePath: string | null;
      }[]) ?? [];

    const creator: User = {
      id: event.user.id,
      name: event.user.name,
      picturePath:
        `https://tapback.co/api/avatar/${event.user.name}.webp` || null,
    };

    return [...attendees, creator];
  });

  const uniqueUsers = Array.from(
    new Map(allUsers.map((u) => [u.id, u])).values()
  );

  return uniqueUsers;
}
