import type { MeetingBaasWebhookEvent } from "@/lib/meetingbaas/types";

export const MEETING_BAAS_WEBHOOK_RECEIVED_EVENT =
	"meeting-baas/webhook.received" as const;

export interface MeetingBaasWebhookReceivedEventData {
	deliveryId: string;
	event: MeetingBaasWebhookEvent;
	receivedAt: string;
	svixId: string | null;
}

export function createMeetingBaasWebhookReceivedEvent(
	data: MeetingBaasWebhookReceivedEventData,
) {
	return {
		id: `meeting-baas-webhook-${data.deliveryId}`,
		name: MEETING_BAAS_WEBHOOK_RECEIVED_EVENT,
		data,
	};
}
