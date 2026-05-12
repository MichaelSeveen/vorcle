import { calendarSync } from "./calendar-sync";
import { subscriptionUsageMaintenance } from "./chat-reset";
import { meetingBaasWebhookProcessor } from "./meeting-baas-webhook";
import { meetingBotScheduler } from "./meeting-bot-scheduler";
import { zoomCredentialHealth } from "./zoom-credential-health";

export const inngestFunctions = [
	calendarSync,
	meetingBaasWebhookProcessor,
	meetingBotScheduler,
	subscriptionUsageMaintenance,
	zoomCredentialHealth,
];

export {
	calendarSync,
	meetingBaasWebhookProcessor,
	meetingBotScheduler,
	subscriptionUsageMaintenance,
	zoomCredentialHealth,
};
