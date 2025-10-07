import "server-only";
import prisma from "@/lib/prisma";
import { GoogleCalendarEvent, MeetingData } from "@/config/types";

export type MeetingByIdResult =
  | {
      ok: true;
      data: MeetingData;
    }
  | { ok: false; error: string };

export async function getMeetingById(
  meetingId: string,
  userId: string
): Promise<MeetingByIdResult> {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!meeting) return { ok: false, error: "Meeting not found" };

    const data = {
      ...meeting,
      isOwner: userId === meeting.user.id,
    };

    return { ok: true, data };
  } catch (error) {
    console.error("Failed to load meeting", error);
    return { ok: false, error: "Failed to load meeting" };
  }
}

type GetUpcomingMeetingsResult =
  | {
      ok: true;
      events: GoogleCalendarEvent[];
      connected: boolean;
      source: string;
    }
  | { ok: false; events: []; connected: false; error: string };

export async function getUpcomingMeetings(
  userId: string,
  isCalendarConnected: boolean | null | undefined
): Promise<GetUpcomingMeetingsResult> {
  if (isCalendarConnected)
    return { ok: true, events: [], connected: true, source: "calendar" };

  try {
    const now = new Date();
    const upcomingMeetings = await prisma.meeting.findMany({
      where: { userId, startTime: { gte: now }, isFromCalendar: true },
      orderBy: { startTime: "asc" },
      take: 10,
    });

    const events = upcomingMeetings.map<GoogleCalendarEvent>((meeting) => ({
      id: meeting.calendarEventId || meeting.id,
      summary: meeting.title,
      start: { dateTime: meeting.startTime.toISOString() },
      end: { dateTime: meeting.endTime.toISOString() },
      attendees: meeting.attendees
        ? JSON.parse(meeting.attendees as string)
        : [],
      hangoutLink: meeting.meetingUrl,
      conferenceData: meeting.meetingUrl
        ? { entryPoints: [{ uri: meeting.meetingUrl }] }
        : null,
      botScheduled: meeting.botScheduled,
      meetingId: meeting.id,
    }));

    return {
      ok: true,
      events,
      connected: !!isCalendarConnected,
      source: "database",
    };
  } catch (error) {
    console.error("Error loading your upcoming meetings:", error);
    return {
      ok: false,
      events: [],
      connected: false,
      error: "Failed to load upcoming meetings",
    };
  }
}
