import { useCallback, useMemo, useState, useTransition } from "react";
import { linkSocial } from "@/lib/auth-client";
import { toggleMeetingBotAction } from "@/app/actions/toggle-meeting-bot-action";
import { GOOGLE_CALENDAR_SCOPES, GoogleCalendarEvent } from "@/config/types";

interface UseMeetingsProps {
  upcomingEvents: {
    ok: boolean;
    events: GoogleCalendarEvent[];
    connected: boolean;
    source: string;
  };
  calendarStatus: {
    success: boolean;
    message?: string;
    connected?: boolean;
  };
}

interface UseMeetingsReturn {
  events: GoogleCalendarEvent[];
  isCalendarConnected: boolean;
  error: string | null;
  meetingBotState: Record<string, boolean>;
  isLinking: boolean;
  isTogglingBot: boolean;
  isRefreshing: boolean;
  refreshEvents: () => void;
  toggleMeetingBot: (eventId: string) => Promise<void>;
  linkGoogleCalendar: () => Promise<void>;
}

export function useMeetings({
  upcomingEvents,
  calendarStatus,
}: UseMeetingsProps): UseMeetingsReturn {
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();

  const [optimisticToggles, setOptimisticToggles] = useState<
    Record<string, boolean>
  >({});

  const isCalendarConnected = useMemo(
    () => calendarStatus.success && (calendarStatus.connected ?? false),
    [calendarStatus.success, calendarStatus.connected]
  );

  const events = useMemo(() => {
    if (!isCalendarConnected) {
      return [];
    }
    return upcomingEvents.events;
  }, [upcomingEvents.events, isCalendarConnected]);

  const refreshEvents = useCallback(() => {
    startRefreshTransition(() => {
      window.location.reload();
    });
  }, []);

  const meetingBotState = useMemo(() => {
    const state: Record<string, boolean> = {};

    events.forEach((event) => {
      state[event.id] = optimisticToggles[event.id] ?? event.botScheduled;
    });

    return state;
  }, [events, optimisticToggles]);

  const toggleMeetingBot = useCallback(
    async (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (!event?.meetingId) {
        console.warn(`Event ${eventId} not found or missing meetingId`);
        return;
      }

      const currentValue = meetingBotState[eventId] ?? false;
      const newValue = !currentValue;

      setOptimisticToggles((prev) => ({ ...prev, [eventId]: newValue }));

      startTransition(async () => {
        try {
          const result = await toggleMeetingBotAction(
            event.meetingId,
            newValue
          );

          if (!result?.success) {
            setOptimisticToggles((prev) => {
              const next = { ...prev };
              delete next[eventId];
              return next;
            });

            const errorMsg = result?.message || "Failed to toggle meeting bot";
            setError(errorMsg);
            console.error("Toggle meeting bot failed:", result);
          } else {
            setOptimisticToggles((prev) => {
              const next = { ...prev };
              delete next[eventId];
              return next;
            });

            refreshEvents();
          }
        } catch (err) {
          setOptimisticToggles((prev) => {
            const next = { ...prev };
            delete next[eventId];
            return next;
          });

          const errorMsg =
            err instanceof Error ? err.message : "Failed to toggle meeting bot";
          setError(errorMsg);
          console.error("Toggle meeting bot error:", err);
        }
      });
    },
    [events, meetingBotState, refreshEvents]
  );

  const linkGoogleCalendar = useCallback(async () => {
    setIsLinking(true);
    setError(null);

    try {
      await linkSocial({
        provider: "google",
        scopes: [...GOOGLE_CALENDAR_SCOPES],
        callbackURL: "/api/calendar/connect-callback",
      });

      refreshEvents();
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to connect to your calendar";
      setError(errorMsg);
      console.error("Error connecting calendar:", err);
    } finally {
      setIsLinking(false);
    }
  }, [refreshEvents]);

  return {
    events,
    isCalendarConnected,
    error,
    meetingBotState,
    isLinking,
    isRefreshing,
    refreshEvents,
    isTogglingBot: isPending,
    toggleMeetingBot,
    linkGoogleCalendar,
  };
}
