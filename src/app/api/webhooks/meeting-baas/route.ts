import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { inngest } from "@/inngest/client";
import { createMeetingBaasWebhookReceivedEvent } from "@/inngest/events";
import type { MeetingBaasWebhookEvent } from "@/lib/meetingbaas/types";
import { getMeetingBaasWebhookDeliveryId } from "@/lib/meetingbaas/webhook-utils";

export const runtime = "nodejs";

function timingSafeStringEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	if (leftBuffer.length !== rightBuffer.length) {
		return false;
	}

	return timingSafeEqual(leftBuffer, rightBuffer);
}

const webhookSecret = process.env.MEETING_BAAS_WEBHOOK_SECRET;
const configuredApiKey = process.env.MEETING_BAAS_API_KEY;

export async function POST(request: Request) {
	const svixId = request.headers.get("svix-id") ?? "";
	const svixTimestamp = request.headers.get("svix-timestamp") ?? "";
	const svixSignature = request.headers.get("svix-signature") ?? "";
	const meetingBaasApiKey = request.headers.get("x-meeting-baas-api-key");
	const hasSvixHeaders = Boolean(svixId && svixTimestamp && svixSignature);

	const payload = await request.text();

	if (!webhookSecret && !configuredApiKey) {
		console.error("[MeetingBaas] No webhook verification secret is configured");
		return NextResponse.json(
			{ error: "Webhook verification is not configured" },
			{ status: 500 },
		);
	}

	let event: MeetingBaasWebhookEvent | null = null;

	if (hasSvixHeaders && webhookSecret) {
		const webhook = new Webhook(webhookSecret);
		try {
			event = webhook.verify(payload, {
				"svix-id": svixId,
				"svix-signature": svixSignature,
				"svix-timestamp": svixTimestamp,
			}) as MeetingBaasWebhookEvent;
		} catch (error) {
			console.warn("[MeetingBaas] Svix verification failed:", error);
		}
	}

	if (!event && meetingBaasApiKey && configuredApiKey) {
		const validApiKey = timingSafeStringEqual(
			meetingBaasApiKey,
			configuredApiKey,
		);

		if (validApiKey) {
			try {
				event = JSON.parse(payload) as MeetingBaasWebhookEvent;
			} catch (error) {
				console.error("[MeetingBaas] Invalid webhook JSON payload:", error);
				return NextResponse.json(
					{ error: "Invalid webhook payload" },
					{ status: 400 },
				);
			}
		}
	}

	if (!event) {
		console.error("[MeetingBaas] Webhook verification failed", {
			hasMeetingBaasApiKey: Boolean(meetingBaasApiKey),
			hasSvixHeaders,
			hasWebhookSecret: Boolean(webhookSecret),
		});
		return NextResponse.json(
			{ error: "Invalid webhook signature" },
			{ status: 400 },
		);
	}

	const deliveryId = getMeetingBaasWebhookDeliveryId({ event, svixId });

	try {
		await inngest.send(
			createMeetingBaasWebhookReceivedEvent({
				deliveryId,
				event,
				receivedAt: new Date().toISOString(),
				svixId: svixId || null,
			}),
		);
	} catch (error) {
		console.error("[MeetingBaas] Failed to enqueue webhook event:", error);
		return NextResponse.json(
			{ error: "Failed to enqueue webhook event" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ received: true }, { status: 200 });
}
