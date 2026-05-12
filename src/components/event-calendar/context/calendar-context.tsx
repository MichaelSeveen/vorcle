"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { create, remove, update } from "@/app/actions/event-calendar-actions";
import {
	mergeCalendarEventSources,
	sortCalendarEvents,
} from "@/helpers/event-calendar/normalize";
import {
	expandCalendarEventsInRange,
	getVisibleRangeForView,
} from "@/helpers/event-calendar/recurrence";
import { useLocalStorage } from "../config/hooks";
import {
	CALENDAR_SETTINGS_STORAGE_KEY,
	type CalendarSettings,
	DEFAULT_CALENDAR_SETTINGS,
} from "../config/settings";
import type {
	CalendarView,
	Event,
	EventColor,
	ManualEventInput,
	User,
} from "../config/types";
import { shouldUseMultiDayEventLane } from "../config/utils";

interface CalendarContext {
	selectedDate: Date | null;
	view: CalendarView;
	setView: (view: CalendarView) => void;
	agendaModeGroupBy: "date" | "color";
	setAgendaModeGroupBy: (groupBy: "date" | "color") => void;
	use24HourFormat: boolean;
	toggleTimeFormat: () => void;
	setSelectedDate: (date: Date | undefined | null) => void;
	selectedUserId: User["id"] | "all";
	setSelectedUserId: (userId: User["id"] | "all") => void;
	badgeVariant: "dot" | "colored";
	setBadgeVariant: (variant: "dot" | "colored") => void;
	showGoogleOverlay: boolean;
	setShowGoogleOverlay: (enabled: boolean) => void;
	remindersEnabled: boolean;
	setRemindersEnabled: (enabled: boolean) => void;
	reminderLeadMinutes: number;
	setReminderLeadMinutes: (minutes: number) => void;
	selectedColors: EventColor[];
	filterEventsBySelectedColors: (colors: EventColor) => void;
	filterEventsBySelectedUser: (userId: User["id"] | "all") => void;
	users: User[];
	allEvents: Event[];
	filteredEvents: Event[];
	singleDayEvents: Event[];
	multiDayEvents: Event[];
	addEvent: (event: ManualEventInput) => Promise<void>;
	updateEvent: (event: Event) => Promise<void>;
	removeEvent: (eventId: string) => Promise<void>;
	getSourceEventById: (sourceId: string) => Event | undefined;
	clearFilter: () => void;
}

const CalendarContext = createContext<CalendarContext | undefined>(undefined);

export function CalendarProvider({
	children,
	users,
	events,
	badge = "colored",
	view = "month",
}: {
	children: React.ReactNode;
	users: User[];
	events: Event[];
	view?: CalendarView;
	badge?: "dot" | "colored";
}) {
	const [settings, setSettings] = useLocalStorage<CalendarSettings>(
		CALENDAR_SETTINGS_STORAGE_KEY,
		{
			...DEFAULT_CALENDAR_SETTINGS,
			badgeVariant: badge,
			view,
		},
	);
	const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
	const [selectedUserId, setSelectedUserId] = useState<User["id"] | "all">(
		"all",
	);
	const [selectedColors, setSelectedColors] = useState<EventColor[]>([]);
	const [manualAndMeetingEvents, setManualAndMeetingEvents] = useState<Event[]>(
		events || [],
	);
	const [googleOverlayEvents, setGoogleOverlayEvents] = useState<Event[]>([]);

	const visibleRange = useMemo(() => {
		if (!selectedDate) {
			return null;
		}

		return getVisibleRangeForView(settings.view, selectedDate);
	}, [selectedDate, settings.view]);

	useEffect(() => {
		if (!settings.showGoogleOverlay || !visibleRange) {
			setGoogleOverlayEvents([]);
			return;
		}

		const controller = new AbortController();
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
		const currentVisibleRange = visibleRange;

		async function loadGoogleOverlay() {
			try {
				const searchParams = new URLSearchParams({
					from: currentVisibleRange.start.toISOString(),
					to: currentVisibleRange.end.toISOString(),
					timeZone,
				});
				const response = await fetch(
					`/api/calendar/google-overlay?${searchParams.toString()}`,
					{
						signal: controller.signal,
					},
				);

				if (!response.ok) {
					throw new Error(`Google overlay request failed: ${response.status}`);
				}

				const data = (await response.json()) as { events?: Event[] };

				if (!controller.signal.aborted) {
					setGoogleOverlayEvents(sortCalendarEvents(data.events ?? []));
				}
			} catch (error) {
				if (!controller.signal.aborted) {
					console.error("Failed to load Google overlay events", error);
					setGoogleOverlayEvents([]);
				}
			}
		}

		void loadGoogleOverlay();

		return () => {
			controller.abort();
		};
	}, [settings.showGoogleOverlay, visibleRange]);

	useEffect(() => {
		setManualAndMeetingEvents(events || []);
	}, [events]);

	const updateSettings = (nextSettings: Partial<CalendarSettings>) => {
		setSettings((currentSettings) => ({
			...currentSettings,
			...nextSettings,
		}));
	};

	const allEvents = useMemo(() => {
		if (!visibleRange) {
			return [];
		}

		const mergedEvents = settings.showGoogleOverlay
			? mergeCalendarEventSources(manualAndMeetingEvents, googleOverlayEvents)
			: manualAndMeetingEvents;

		return expandCalendarEventsInRange(
			mergedEvents,
			visibleRange.start,
			visibleRange.end,
		);
	}, [
		googleOverlayEvents,
		manualAndMeetingEvents,
		settings.showGoogleOverlay,
		visibleRange,
	]);

	const filteredEvents = useMemo(() => {
		let currentEvents = allEvents.filter((event) => {
			return (
				selectedUserId === "all" ||
				event.user.id === selectedUserId ||
				(Array.isArray(event.attendees) &&
					event.attendees.some((attendee) => attendee.id === selectedUserId))
			);
		});

		if (selectedColors.length > 0) {
			currentEvents = currentEvents.filter((event) =>
				selectedColors.includes(event.color),
			);
		}

		return currentEvents;
	}, [allEvents, selectedColors, selectedUserId]);

	const singleDayEvents = useMemo(
		() => filteredEvents.filter((event) => !shouldUseMultiDayEventLane(event)),
		[filteredEvents],
	);

	const multiDayEvents = useMemo(
		() => filteredEvents.filter((event) => shouldUseMultiDayEventLane(event)),
		[filteredEvents],
	);

	const handleSelectDate = (date: Date | undefined | null) => {
		if (!date) return;
		setSelectedDate(date);
	};

	const addEvent = async (eventInput: ManualEventInput) => {
		const { success, error, event: newEvent } = await create(eventInput);

		if (success && newEvent) {
			setManualAndMeetingEvents((currentEvents) =>
				sortCalendarEvents([...currentEvents, newEvent]),
			);
			toast.success("Event created successfully");
			return;
		}

		toast.error(error);
	};

	const updateEvent = async (eventInput: Event) => {
		const { success, error, event: updatedEvent } = await update(eventInput);

		if (success && updatedEvent) {
			setManualAndMeetingEvents((currentEvents) =>
				sortCalendarEvents(
					currentEvents.map((event) =>
						event.source === "manual" &&
						event.sourceId === updatedEvent.sourceId
							? updatedEvent
							: event,
					),
				),
			);
			toast.success("Event updated successfully");
			return;
		}

		toast.error(error);
	};

	const removeEvent = async (eventId: string) => {
		const { success, error } = await remove(eventId);

		if (success) {
			setManualAndMeetingEvents((currentEvents) =>
				currentEvents.filter(
					(event) => !(event.source === "manual" && event.sourceId === eventId),
				),
			);
			toast.success("Event deleted successfully");
			return;
		}

		toast.error(error);
	};

	const filterEventsBySelectedColors = (color: EventColor) => {
		const isColorSelected = selectedColors.includes(color);
		setSelectedColors(
			isColorSelected
				? selectedColors.filter((selectedColor) => selectedColor !== color)
				: [...selectedColors, color],
		);
	};

	const filterEventsBySelectedUser = (userId: User["id"] | "all") => {
		setSelectedUserId(userId);
	};

	const clearFilter = () => {
		setSelectedColors([]);
		setSelectedUserId("all");
	};

	const getSourceEventById = (sourceId: string) =>
		[...manualAndMeetingEvents, ...googleOverlayEvents].find(
			(event) => event.sourceId === sourceId,
		);

	const value = {
		selectedDate,
		setSelectedDate: handleSelectDate,
		selectedUserId,
		setSelectedUserId,
		badgeVariant: settings.badgeVariant,
		setBadgeVariant: (variant: "dot" | "colored") =>
			updateSettings({ badgeVariant: variant }),
		showGoogleOverlay: settings.showGoogleOverlay,
		setShowGoogleOverlay: (enabled: boolean) =>
			updateSettings({ showGoogleOverlay: enabled }),
		remindersEnabled: settings.remindersEnabled,
		setRemindersEnabled: (enabled: boolean) =>
			updateSettings({ remindersEnabled: enabled }),
		reminderLeadMinutes: settings.reminderLeadMinutes,
		setReminderLeadMinutes: (minutes: number) =>
			updateSettings({ reminderLeadMinutes: minutes }),
		users,
		selectedColors,
		filterEventsBySelectedColors,
		filterEventsBySelectedUser,
		allEvents,
		filteredEvents,
		singleDayEvents,
		multiDayEvents,
		view: settings.view,
		use24HourFormat: settings.use24HourFormat,
		toggleTimeFormat: () =>
			updateSettings({ use24HourFormat: !settings.use24HourFormat }),
		setView: (nextView: CalendarView) => updateSettings({ view: nextView }),
		agendaModeGroupBy: settings.agendaModeGroupBy,
		setAgendaModeGroupBy: (groupBy: "date" | "color") =>
			updateSettings({ agendaModeGroupBy: groupBy }),
		addEvent,
		updateEvent,
		removeEvent,
		getSourceEventById,
		clearFilter,
	};

	return (
		<CalendarContext.Provider value={value}>
			{children}
		</CalendarContext.Provider>
	);
}

export function useCalendar(): CalendarContext {
	const context = useContext(CalendarContext);
	if (!context)
		throw new Error("useCalendar must be used within a CalendarProvider.");
	return context;
}
