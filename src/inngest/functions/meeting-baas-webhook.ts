import type { MeetingBaasWebhookReceivedEventData } from "@/inngest/events";
import { MEETING_BAAS_WEBHOOK_RECEIVED_EVENT } from "@/inngest/events";
import { handleWebhookEvent } from "@/lib/meetingbaas/webhook-handlers";
import { inngest } from "../client";

export const meetingBaasWebhookProcessor = inngest.createFunction(
	{
		id: "meeting-baas-webhook-processor",
		idempotency: "event.data.deliveryId",
		retries: 8,
		triggers: [{ event: MEETING_BAAS_WEBHOOK_RECEIVED_EVENT }],
	},
	async ({ event, step }) => {
		const data = event.data as MeetingBaasWebhookReceivedEventData;

		await step.run("process-meeting-baas-webhook", async () => {
			await handleWebhookEvent({
				deliveryId: data.deliveryId,
				event: data.event,
				svixId: data.svixId,
			});
		});
	},
);
