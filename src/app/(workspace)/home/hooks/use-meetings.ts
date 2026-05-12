import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { toggleMeetingBotAction } from "@/app/actions/toggle-meeting-bot-action";
import {
	GOOGLE_CALENDAR_SCOPES,
	type GoogleCalendarEvent,
} from "@/config/types";
import { linkSocial } from "@/lib/auth-client";

const POLL_INTERVAL_MS = 60_000;

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
	pendingToggleByEventId: Record<string, boolean>;
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
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isLinking, setIsLinking] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [isRefreshing, startRefreshTransition] = useTransition();

	const [optimisticToggles, setOptimisticToggles] = useState<
		Record<string, boolean>
	>({});
	const [pendingToggleByEventId, setPendingToggleByEventId] = useState<
		Record<string, boolean>
	>({});

	const isCalendarConnected = useMemo(
		() => Boolean(calendarStatus.connected ?? upcomingEvents.connected),
		[calendarStatus.connected, upcomingEvents.connected],
	);

	const events = useMemo(() => {
		if (!isCalendarConnected) {
			return [];
		}
		return upcomingEvents.events;
	}, [upcomingEvents.events, isCalendarConnected]);

	const refreshRoute = useCallback(() => {
		router.refresh();
	}, [router]);

	const refreshEvents = useCallback(() => {
		startRefreshTransition(() => {
			refreshRoute();
		});
	}, [refreshRoute]);

	const refreshEventsInBackground = useCallback(() => {
		refreshRoute();
	}, [refreshRoute]);

	useEffect(() => {
		let id: ReturnType<typeof setInterval>;

		function startPolling() {
			id = setInterval(() => {
				if (!document.hidden) {
					refreshEventsInBackground();
				}
			}, POLL_INTERVAL_MS);
		}

		function handleVisibility() {
			clearInterval(id);
			if (!document.hidden) {
				// Background refreshes should not put the manual sync button into a loading state.
				refreshEventsInBackground();
				startPolling();
			}
		}

		startPolling();
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			clearInterval(id);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [refreshEventsInBackground]);

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

			setError(null);
			setOptimisticToggles((prev) => ({ ...prev, [eventId]: newValue }));
			setPendingToggleByEventId((prev) => ({ ...prev, [eventId]: true }));

			startTransition(async () => {
				try {
					const result = await toggleMeetingBotAction(
						event.meetingId,
						newValue,
					);

					if (!result?.success) {
						setOptimisticToggles((prev) => {
							const next = { ...prev };
							delete next[eventId];
							return next;
						});
						setPendingToggleByEventId((prev) => {
							const next = { ...prev };
							delete next[eventId];
							return next;
						});

						const errorMsg =
							result?.error ||
							result?.message ||
							"Failed to toggle meeting bot";
						setError(errorMsg);
						console.error("Toggle meeting bot failed:", result);
					} else {
						setOptimisticToggles((prev) => {
							const next = { ...prev };
							delete next[eventId];
							return next;
						});
						setPendingToggleByEventId((prev) => {
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
					setPendingToggleByEventId((prev) => {
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
		[events, meetingBotState, refreshEvents],
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
		pendingToggleByEventId,
		isLinking,
		isRefreshing,
		refreshEvents,
		isTogglingBot: isPending,
		toggleMeetingBot,
		linkGoogleCalendar,
	};
}
