import "server-only";

import { createHash } from "node:crypto";
import type { MeetingBaasWebhookEvent } from "./types";

export function getMeetingBaasWebhookBotId(event: MeetingBaasWebhookEvent) {
	return "bot_id" in event.data ? event.data.bot_id : null;
}

export function getMeetingBaasWebhookEventId(event: MeetingBaasWebhookEvent) {
	return "event_id" in event.data ? event.data.event_id : null;
}

export function getMeetingBaasWebhookDeliveryId({
	event,
	svixId,
}: {
	event: MeetingBaasWebhookEvent;
	svixId?: string | null;
}) {
	const normalizedSvixId = svixId?.trim();

	if (normalizedSvixId) {
		return normalizedSvixId;
	}

	const eventId = getMeetingBaasWebhookEventId(event);

	if (eventId) {
		return eventId;
	}

	const botId = getMeetingBaasWebhookBotId(event);

	if (botId) {
		return `${event.event}:${botId}`;
	}

	return `payload:${createHash("sha256")
		.update(JSON.stringify(event))
		.digest("hex")}`;
}

export function getMeetingBaasExtraString(
	extra: Record<string, unknown> | null | undefined,
	key: string,
) {
	const value = extra?.[key];

	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

export function getMeetingIdFromMeetingBaasExtra(
	extra: Record<string, unknown> | null | undefined,
) {
	return getMeetingBaasExtraString(extra, "meeting_id");
}

export function hasAppMeetingReference(
	extra: Record<string, unknown> | null | undefined,
) {
	return Boolean(
		getMeetingBaasExtraString(extra, "meeting_id") ||
			getMeetingBaasExtraString(extra, "user_id"),
	);
}
