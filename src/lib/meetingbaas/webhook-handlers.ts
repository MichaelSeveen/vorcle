import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meeting, meetingBaasWebhookEvent, user } from "@/db/schema";
import {
	processMeetingTranscript,
	processTranscript,
} from "@/helpers/rag-workflow/utils";
import { releaseMeetingUsage } from "@/helpers/subscriptions/usage";
import { sendEmail } from "@/lib/email";
import { renderMeetingSummaryEmail } from "@/lib/email/templates/meeting-summary";
import { persistMeetingArtifacts } from "./artifacts";
import { deleteBotArtifacts, getBotDetails } from "./bots";
import type {
	BotChatMessagePayload,
	BotCompletedPayload,
	BotFailedPayload,
	BotStatusChangePayload,
	MeetingBaasWebhookEvent as MeetingBaasWebhookEventPayload,
} from "./types";
import {
	getMeetingBaasWebhookBotId,
	getMeetingBaasWebhookDeliveryId,
	getMeetingBaasWebhookEventId,
	getMeetingIdFromMeetingBaasExtra,
	hasAppMeetingReference,
} from "./webhook-utils";

async function recordWebhookDelivery({
	botId,
	deliveryId,
	eventId,
	eventType,
}: {
	botId?: string;
	deliveryId: string;
	eventId?: string;
	eventType: string;
}) {
	await db
		.insert(meetingBaasWebhookEvent)
		.values({
			botId: botId ?? null,
			eventId: eventId ?? null,
			eventType,
			svixId: deliveryId,
		})
		.onConflictDoNothing({
			target: meetingBaasWebhookEvent.svixId,
		});
}

async function isWebhookDeliveryProcessed(deliveryId: string) {
	const [existingDelivery] = await db
		.select({ id: meetingBaasWebhookEvent.id })
		.from(meetingBaasWebhookEvent)
		.where(eq(meetingBaasWebhookEvent.svixId, deliveryId))
		.limit(1);

	return Boolean(existingDelivery);
}

async function resolveMeetingIdForBot({
	botId,
	extra,
	eventType,
}: {
	botId: string;
	extra?: Record<string, unknown> | null;
	eventType: string;
}) {
	const [meetingByBotId] = await db
		.select({ id: meeting.id })
		.from(meeting)
		.where(eq(meeting.botId, botId))
		.limit(1);

	if (meetingByBotId) {
		return meetingByBotId.id;
	}

	const meetingId = getMeetingIdFromMeetingBaasExtra(extra);

	if (!meetingId) {
		return null;
	}

	const [meetingByExtra] = await db
		.select({
			botId: meeting.botId,
			id: meeting.id,
		})
		.from(meeting)
		.where(eq(meeting.id, meetingId))
		.limit(1);

	if (!meetingByExtra) {
		return null;
	}

	if (meetingByExtra.botId && meetingByExtra.botId !== botId) {
		console.warn(
			`[MeetingBaas] Ignoring ${eventType} for bot ${botId}; meeting ${meetingId} is already linked to bot ${meetingByExtra.botId}`,
		);
		return null;
	}

	if (!meetingByExtra.botId) {
		await db
			.update(meeting)
			.set({
				botId,
				botStatusUpdatedAt: new Date(),
			})
			.where(eq(meeting.id, meetingByExtra.id));
	}

	return meetingByExtra.id;
}

function handleMissingMeetingForBot({
	botId,
	eventType,
	extra,
}: {
	botId: string;
	eventType: string;
	extra?: Record<string, unknown> | null;
}) {
	const message = `[MeetingBaas] Meeting not found for bot ${botId}`;

	if (hasAppMeetingReference(extra)) {
		throw new Error(`${message} while handling ${eventType}`);
	}

	console.error(message);
}

async function handleBotStatusChange(event: BotStatusChangePayload) {
	const { bot_id, extra, status } = event.data;
	const meetingId = await resolveMeetingIdForBot({
		botId: bot_id,
		eventType: event.event,
		extra,
	});

	if (!meetingId) {
		handleMissingMeetingForBot({
			botId: bot_id,
			eventType: event.event,
			extra,
		});
		return;
	}

	const joinedAt =
		status.code === "in_call_recording" || status.code === "completed"
			? new Date(status.created_at)
			: undefined;

	await db
		.update(meeting)
		.set({
			botJoinedAt: joinedAt,
			botStatus: status.code,
			botStatusUpdatedAt: new Date(status.created_at),
		})
		.where(eq(meeting.id, meetingId));
}

async function handleBotCompleted(event: BotCompletedPayload) {
	const { bot_id, extra } = event.data;
	const meetingId = await resolveMeetingIdForBot({
		botId: bot_id,
		eventType: event.event,
		extra,
	});

	if (!meetingId) {
		handleMissingMeetingForBot({
			botId: bot_id,
			eventType: event.event,
			extra,
		});
		return;
	}

	const [meetingRow] = await db
		.select({
			id: meeting.id,
			processed: meeting.processed,
			title: meeting.title,
			userEmail: user.email,
			userId: meeting.userId,
			emailSent: meeting.emailSent,
		})
		.from(meeting)
		.innerJoin(user, eq(meeting.userId, user.id))
		.where(eq(meeting.id, meetingId))
		.limit(1);

	if (!meetingRow) {
		handleMissingMeetingForBot({
			botId: bot_id,
			eventType: event.event,
			extra,
		});
		return;
	}

	const botDetails = (await getBotDetails(bot_id)) as Awaited<
		ReturnType<typeof getBotDetails>
	> & {
		chat_messages?: string | null;
	};

	const persistedArtifacts = await persistMeetingArtifacts({
		botDetails,
		botId: bot_id,
		meetingId: meetingRow.id,
		meetingTitle: meetingRow.title,
		userId: meetingRow.userId,
	});

	await db
		.update(meeting)
		.set({
			audioObjectKey: persistedArtifacts.audioObjectKey,
			botFailureCode: null,
			botFailureMessage: null,
			botJoinedAt: botDetails.joined_at ? new Date(botDetails.joined_at) : null,
			botStatus: "completed",
			botStatusUpdatedAt: new Date(),
			chatMessagesObjectKey: persistedArtifacts.chatMessagesObjectKey,
			diarizationObjectKey: persistedArtifacts.diarizationObjectKey,
			meetingEnded: true,
			rawTranscriptionObjectKey: persistedArtifacts.rawTranscriptionObjectKey,
			recordingUrl: persistedArtifacts.recordingUrl,
			speakers: botDetails.speakers ?? null,
			transcript:
				persistedArtifacts.transcriptSegments.length > 0
					? persistedArtifacts.transcriptSegments
					: null,
			transcriptReady: persistedArtifacts.transcriptSegments.length > 0,
			transcriptionObjectKey: persistedArtifacts.transcriptionObjectKey,
			videoObjectKey: persistedArtifacts.videoObjectKey,
		})
		.where(eq(meeting.id, meetingRow.id));

	if (
		persistedArtifacts.transcriptSegments.length > 0 &&
		!meetingRow.processed &&
		persistedArtifacts.transcriptText.trim().length > 0
	) {
		let processedMeetingData = {
			actionItems: [] as Array<{
				id: number;
				text: string;
				owner?: string | null;
				deadline?: string | null;
			}>,
			blockers: [] as string[],
			decisions: [] as string[],
			summary: "Processing failed. Please check the transcript manually.",
		};

		try {
			processedMeetingData = await processMeetingTranscript(
				persistedArtifacts.transcriptSegments,
			);

			await processTranscript(
				meetingRow.id,
				meetingRow.userId,
				persistedArtifacts.transcriptText,
				meetingRow.title,
			);

			await db
				.update(meeting)
				.set({
					actionItems: processedMeetingData.actionItems,
					blockers: processedMeetingData.blockers,
					decisions: processedMeetingData.decisions,
					processed: true,
					processedAt: new Date(),
					ragProcessed: true,
					ragProcessedAt: new Date(),
					summary: processedMeetingData.summary,
				})
				.where(eq(meeting.id, meetingRow.id));
		} catch (processingError) {
			console.error(
				"[MeetingBaas] Failed to process transcript artifact:",
				processingError,
			);

			processedMeetingData = {
				actionItems: [],
				blockers: [],
				decisions: [],
				summary: "Processing failed. Please check the transcript manually.",
			};

			await db
				.update(meeting)
				.set({
					actionItems: [],
					blockers: [],
					decisions: [],
					processed: true,
					processedAt: new Date(),
					summary: "Processing failed. Please check the transcript manually.",
				})
				.where(eq(meeting.id, meetingRow.id));
		}

		if (meetingRow.userEmail && !meetingRow.emailSent) {
			try {
				const appUrl = process.env.NEXT_PUBLIC_APP_URL;
				const meetingUrl = appUrl ? `${appUrl}/meeting/${meetingRow.id}` : null;

				await sendEmail({
					to: meetingRow.userEmail,
					subject: `Your Vorcle meeting summary: ${meetingRow.title}`,
					html: renderMeetingSummaryEmail({
						actionItems: processedMeetingData.actionItems,
						blockers: processedMeetingData.blockers,
						decisions: processedMeetingData.decisions,
						meetingTitle: meetingRow.title,
						meetingUrl,
						summary: processedMeetingData.summary,
					}),
				});

				await db
					.update(meeting)
					.set({
						emailSent: true,
						emailSentAt: new Date(),
					})
					.where(eq(meeting.id, meetingRow.id));
			} catch (emailError) {
				console.error(
					`[MeetingBaas] Failed to send meeting summary email for ${meetingRow.id}:`,
					emailError,
				);
			}
		}
	}
}

async function handleBotChatMessage(event: BotChatMessagePayload) {
	console.log(
		`[MeetingBaas] Chat message for bot ${event.data.bot_id} from ${event.data.sender_name}: ${event.data.text}`,
	);
}

async function handleBotFailed(event: BotFailedPayload) {
	const { bot_id, error_code, error_message, extra } = event.data;
	const meetingId = await resolveMeetingIdForBot({
		botId: bot_id,
		eventType: event.event,
		extra,
	});

	if (!meetingId) {
		handleMissingMeetingForBot({
			botId: bot_id,
			eventType: event.event,
			extra,
		});
		return;
	}

	const [meetingRow] = await db
		.select({
			id: meeting.id,
			botJoinedAt: meeting.botJoinedAt,
			usageCountedAt: meeting.usageCountedAt,
			userId: meeting.userId,
		})
		.from(meeting)
		.where(eq(meeting.id, meetingId))
		.limit(1);

	if (!meetingRow) {
		handleMissingMeetingForBot({
			botId: bot_id,
			eventType: event.event,
			extra,
		});
		return;
	}

	await db.transaction(async (tx) => {
		if (meetingRow.usageCountedAt && !meetingRow.botJoinedAt) {
			await releaseMeetingUsage(meetingRow.userId, tx);
		}

		await tx
			.update(meeting)
			.set({
				botFailureCode: error_code,
				botFailureMessage: error_message,
				botSent: false,
				botStatus: "failed",
				botStatusUpdatedAt: new Date(),
				usageCountedAt: meetingRow.botJoinedAt
					? meetingRow.usageCountedAt
					: null,
			})
			.where(eq(meeting.id, meetingRow.id));
	});
}

export async function handleWebhookEvent({
	deliveryId,
	event,
	svixId,
}: {
	deliveryId?: string;
	event: MeetingBaasWebhookEventPayload;
	svixId?: string | null;
}) {
	const resolvedDeliveryId =
		deliveryId ?? getMeetingBaasWebhookDeliveryId({ event, svixId });
	const botId = getMeetingBaasWebhookBotId(event) ?? undefined;
	const eventId = getMeetingBaasWebhookEventId(event) ?? undefined;
	const alreadyProcessed = await isWebhookDeliveryProcessed(resolvedDeliveryId);

	if (alreadyProcessed) {
		return;
	}

	switch (event.event) {
		case "bot.status_change":
			await handleBotStatusChange(event);
			break;
		case "bot.completed":
			await handleBotCompleted(event);
			break;
		case "bot.chat_message":
			await handleBotChatMessage(event);
			break;
		case "bot.failed":
			await handleBotFailed(event);
			break;
		default: {
			const exhaustiveCheck: never = event;
			console.warn(
				"[MeetingBaas] Unknown webhook event received",
				exhaustiveCheck,
			);
		}
	}

	await recordWebhookDelivery({
		botId,
		deliveryId: resolvedDeliveryId,
		eventId,
		eventType: event.event,
	});

	if (event.event === "bot.completed" && botId) {
		try {
			await deleteBotArtifacts(botId, true);
		} catch (error) {
			console.error(
				`[MeetingBaas] Failed to delete remote artifacts for bot ${botId}:`,
				error,
			);
		}
	}
}
