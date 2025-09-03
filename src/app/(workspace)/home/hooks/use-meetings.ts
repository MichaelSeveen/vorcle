import { linkSocial } from "@/lib/auth-client";
import { getClientSession } from "@/lib/get-client-session";
import { useCallback, useEffect, useState } from "react";
import { toggleMeetingBotAction } from "@/app/actions/toggle-meeting-bot-action";

export interface CalendarEvent {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{ email: string }>;
  location?: string;
  hangoutLink?: string;
  conferenceData?: unknown;
  botScheduled?: boolean;
  meetingId?: string;
}

export interface PastMeeting {
  id: string;
  title: string;
  description?: string | null;
  meetingUrl: string | null;
  startTime: Date;
  endTime: Date;
  attendees?: unknown;
  transcriptReady: boolean;
  recordingUrl?: string | null;
  speakers?: unknown;
}

export function useMeetings() {
  const [loading, setLoading] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [pastMeetingsLoading, setPastMeetingsLoading] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pastMeetings, setPastMeetings] = useState<PastMeeting[]>([]);
  const [meetingBotState, setMeetingBotState] = useState<
    Record<string, boolean>
  >({});

  const safeJsonFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      const res = await fetch(input, init);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      return data;
    },
    []
  );

  const fetchUpcomingEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const calendarStatus = await safeJsonFetch("/api/user/calendar-status");
      if (!calendarStatus?.connected) {
        setCalendarConnected(false);
        setUpcomingEvents([]);
        setError(
          "Calendar not connected for auto-sync. Connect to enable auto syncing."
        );
        return;
      }

      const upcoming = await safeJsonFetch("/api/meetings/upcoming");
      const events = upcoming.events ?? [];
      setUpcomingEvents(events as CalendarEvent[]);
      setCalendarConnected(true);

      const toggles: Record<string, boolean> = {};
      events.forEach((ev: CalendarEvent) => {
        toggles[ev.id] =
          typeof ev.botScheduled === "boolean" ? ev.botScheduled : false;
      });
      setMeetingBotState(toggles);
    } catch (err: unknown) {
      console.error("fetchUpcomingEvents error", err);
      const msg =
        err instanceof Error ? err.message : "Failed to fetch calendar events";
      setError(msg);
      setCalendarConnected(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [safeJsonFetch]);

  const fetchPastMeetings = useCallback(async () => {
    setPastMeetingsLoading(true);
    try {
      const result = await safeJsonFetch("/api/meetings/past");
      setPastMeetings((result.meetings as PastMeeting[]) ?? []);
    } catch (err: unknown) {
      console.error("fetchPastMeetings error:", err);
    } finally {
      setPastMeetingsLoading(false);
    }
  }, [safeJsonFetch]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      const userId = await getClientSession();

      if (!userId || cancelled) {
        setInitialLoading(false);
        setLoading(false);
        return;
      }

      await Promise.all([fetchUpcomingEvents(), fetchPastMeetings()]);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [fetchUpcomingEvents, fetchPastMeetings]);

  // Optimistic toggle using fetch-based API route
  // async function toggleMeetingBotOptimistic(eventId: string) {
  //     const event = upcomingEvents.find(e => e.id === eventId)
  //     if (!event?.meetingId) return

  //     // compute newValue atomically and update local state
  //     let newValue = false
  //     setMeetingBotState(prev => {
  //         newValue = !Boolean(prev[eventId])
  //         return { ...prev, [eventId]: newValue }
  //     })

  // try {
  //         const res = await fetch(`/api/meetings/${event.meetingId}/bot-toggle`, {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({ botScheduled: newValue })
  //         })

  //         if (!res.ok) {
  //             // revert
  //             setMeetingBotState(prev => ({ ...prev, [eventId]: !newValue }))
  //             const json = await res.json().catch(() => ({}))
  //             console.error('toggle meeting bot failed', json)
  //         }
  //     } catch (err: unknown) {
  //         setMeetingBotState(prev => ({ ...prev, [eventId]: !newValue }))
  //         console.error('toggleMeetingBot error', err)
  //     }
  // }

  async function toggleMeetingBotServerAction(eventId: string) {
    const event = upcomingEvents.find((e) => e.id === eventId);
    if (!event?.meetingId) return;

    let newValue = false;
    setMeetingBotState((prev) => {
      newValue = !Boolean(prev[eventId]);
      return { ...prev, [eventId]: newValue };
    });

    try {
      const result = await toggleMeetingBotAction(event.meetingId, newValue);
      if (!result?.success) {
        setMeetingBotState((prev) => ({ ...prev, [eventId]: !newValue }));
        console.error("server action failed", result);
      }
    } catch (err: unknown) {
      setMeetingBotState((prev) => ({ ...prev, [eventId]: !newValue }));
      console.error("toggleMeetingBotServerAction error", err);
    }
  }

  async function linkGoogleCalendar() {
    setLoading(true);
    try {
      await linkSocial({
        provider: "google",
        scopes: [
          "https://www.googleapis.com/auth/calendar.readonly",
          "https://www.googleapis.com/auth/calendar.events.readonly",
        ],
        callbackURL: "/api/calendar/connect-callback",
      });
    } catch (error) {
      console.error("Error syncing calendar", error);
      setError("Failed to connect to your calendar");
      setLoading(false);
    }
  }

  const getAttendeeList = (attendees: unknown): string[] => {
    if (!attendees) {
      return [];
    }

    try {
      const parsed = JSON.parse(String(attendees));
      if (Array.isArray(parsed)) {
        return parsed.map((name) => String(name).trim());
      }
      return [String(parsed).trim()];
    } catch {
      const attendeeString = String(attendees);
      return attendeeString
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    }
  };

  return {
    upcomingEvents,
    pastMeetings,
    loading,
    pastMeetingsLoading,
    calendarConnected,
    error,
    meetingBotState,
    initialLoading,
    fetchUpcomingEvents,
    fetchPastMeetings,
    toggleMeetingBotServerAction,
    linkGoogleCalendar,
    getAttendeeList,
  };
}
