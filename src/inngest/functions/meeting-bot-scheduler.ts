import { scheduleBotsForUpcomingMeetings } from "@/helpers/meetings/schedule-bots";
import { inngest } from "../client";

export const meetingBotScheduler = inngest.createFunction(
	{
		id: "meeting-bot-scheduler",
		triggers: [{ cron: "*/5 * * * *" }],
	},
	async ({ step }) =>
		step.run("schedule-meeting-bots", async () =>
			scheduleBotsForUpcomingMeetings(),
		),
);
