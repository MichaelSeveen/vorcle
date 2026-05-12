import type { CalendarView } from "./types";

export interface CalendarSettings {
	badgeVariant: "dot" | "colored";
	view: CalendarView;
	use24HourFormat: boolean;
	agendaModeGroupBy: "date" | "color";
	showGoogleOverlay: boolean;
	remindersEnabled: boolean;
	reminderLeadMinutes: number;
}

export const CALENDAR_SETTINGS_STORAGE_KEY = "calendar-settings";

export const REMINDER_LEAD_MINUTE_PRESETS = [5, 10, 15, 30] as const;

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
	badgeVariant: "colored",
	view: "month",
	use24HourFormat: true,
	agendaModeGroupBy: "date",
	showGoogleOverlay: true,
	remindersEnabled: false,
	reminderLeadMinutes: 10,
};
