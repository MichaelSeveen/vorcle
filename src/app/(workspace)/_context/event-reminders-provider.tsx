"use client";

import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { type PropsWithChildren, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "@/components/event-calendar/config/hooks";
import {
	CALENDAR_SETTINGS_STORAGE_KEY,
	DEFAULT_CALENDAR_SETTINGS,
} from "@/components/event-calendar/config/settings";
import type { Event } from "@/components/event-calendar/config/types";
import { segments } from "@/config/segments";

const FIRED_REMINDERS_KEY = "calendar-fired-reminders";

function buildReminderKey(event: Event, leadMinutes: number) {
	return `${event.id}:${event.startDate}:${leadMinutes}`;
}

export function EventRemindersProvider({ children }: PropsWithChildren) {
	const router = useRouter();
	const [settings] = useLocalStorage(
		CALENDAR_SETTINGS_STORAGE_KEY,
		DEFAULT_CALENDAR_SETTINGS,
	);
	const firedReminderKeys = useRef<Set<string>>(new Set());

	useEffect(() => {
		try {
			const savedKeys = window.sessionStorage.getItem(FIRED_REMINDERS_KEY);
			firedReminderKeys.current = new Set(
				savedKeys ? (JSON.parse(savedKeys) as string[]) : [],
			);
		} catch (error) {
			console.error("Failed to read fired reminder keys", error);
		}
	}, []);

	const persistReminderKeys = useCallback(() => {
		window.sessionStorage.setItem(
			FIRED_REMINDERS_KEY,
			JSON.stringify(Array.from(firedReminderKeys.current)),
		);
	}, []);

	const openEvent = useCallback(
		(event: Event) => {
			if (event.source === "meeting" && event.meetingId) {
				router.push(`/meeting/${event.meetingId}`);
				return;
			}

			if (
				event.source === "google-overlay" &&
				(event.externalUrl || event.meetingLink)
			) {
				window.open(
					event.externalUrl ?? event.meetingLink ?? "",
					"_blank",
					"noopener,noreferrer",
				);
				return;
			}

			router.push(segments.workspace.calendar);
		},
		[router],
	);

	const maybeToastReminder = useCallback(
		(event: Event) => {
			const reminderKey = buildReminderKey(event, settings.reminderLeadMinutes);

			if (firedReminderKeys.current.has(reminderKey)) {
				return;
			}

			firedReminderKeys.current.add(reminderKey);
			persistReminderKeys();

			toast(event.title, {
				action: {
					label:
						event.source === "meeting"
							? "Open meeting"
							: event.source === "google-overlay"
								? "Open event"
								: "Open calendar",
					onClick: () => openEvent(event),
				},
				description: `Starts ${formatDistanceToNowStrict(
					parseISO(event.startDate),
					{
						addSuffix: true,
					},
				)}`,
			});
		},
		[openEvent, persistReminderKeys, settings.reminderLeadMinutes],
	);

	const pollReminders = useCallback(async () => {
		if (
			document.hidden ||
			!settings.remindersEnabled ||
			settings.reminderLeadMinutes <= 0
		) {
			return;
		}

		try {
			const now = new Date();
			const rangeEnd = new Date(
				now.getTime() + settings.reminderLeadMinutes * 60 * 1000,
			);
			const timeZone =
				Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
			const searchParams = new URLSearchParams({
				leadMinutes: String(settings.reminderLeadMinutes),
				includeGoogleOverlay: String(settings.showGoogleOverlay),
				from: now.toISOString(),
				to: rangeEnd.toISOString(),
				timeZone,
			});
			const response = await fetch(
				`/api/calendar/reminders?${searchParams.toString()}`,
			);

			if (!response.ok) {
				throw new Error(`Reminder request failed: ${response.status}`);
			}

			const data = (await response.json()) as { events?: Event[] };
			for (const event of data.events ?? []) {
				maybeToastReminder(event);
			}
		} catch (error) {
			console.error("Failed to poll event reminders", error);
		}
	}, [
		maybeToastReminder,
		settings.remindersEnabled,
		settings.reminderLeadMinutes,
		settings.showGoogleOverlay,
	]);

	useEffect(() => {
		void pollReminders();
		const interval = window.setInterval(() => {
			void pollReminders();
		}, 60_000);

		return () => {
			window.clearInterval(interval);
		};
	}, [pollReminders]);

	return children;
}
