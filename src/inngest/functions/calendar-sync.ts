import { syncAllUserCalendars } from "@/helpers/user/calendar/sync";
import { inngest } from "../client";

export const calendarSync = inngest.createFunction(
	{
		id: "calendar-sync",
		triggers: [{ cron: "*/5 * * * *" }],
	},
	async ({ step }) =>
		step.run("sync-google-calendars", async () => syncAllUserCalendars()),
);
