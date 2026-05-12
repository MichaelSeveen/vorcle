import "server-only";

import { getMeetingBaasClient } from "./client";

export function isZoomMeetingUrl(meetingUrl: string) {
	try {
		const hostname = new URL(meetingUrl).hostname.toLowerCase();
		return hostname.endsWith("zoom.us") || hostname.endsWith("zoomgov.com");
	} catch {
		return meetingUrl.includes("zoom.us") || meetingUrl.includes("zoomgov.com");
	}
}

export async function joinMeeting({
	botImageUrl,
	botName = "Vorcle Notetaker",
	extraData,
	meetingUrl,
	zoomCredentialId,
}: {
	botImageUrl?: string | null;
	botName?: string | null;
	extraData?: Record<string, unknown>;
	meetingUrl: string;
	zoomCredentialId?: string;
}) {
	const client = getMeetingBaasClient();
	const result = await client.createBot({
		allow_multiple_bots: false,
		bot_image: botImageUrl ?? undefined,
		bot_name: botName || "Vorcle Notetaker",
		extra: extraData,
		meeting_url: meetingUrl,
		recording_mode: "speaker_view",
		transcription_config: {
			provider: "gladia",
		},
		transcription_enabled: true,
		...(isZoomMeetingUrl(meetingUrl) && zoomCredentialId
			? {
					zoom_config: {
						credential_id: zoomCredentialId,
					},
				}
			: {}),
	});

	if (!result.success) {
		throw new Error(`Failed to create MeetingBaas bot: ${result.error}`);
	}

	return result.data;
}

export async function getBotDetails(botId: string) {
	const client = getMeetingBaasClient();
	const result = await client.getBotDetails({ bot_id: botId });

	if (!result.success) {
		throw new Error(`Failed to get MeetingBaas bot ${botId}: ${result.error}`);
	}

	return result.data;
}

export async function leaveMeetingBot(botId: string) {
	const client = getMeetingBaasClient();
	const result = await client.leaveBot({ bot_id: botId });

	if (!result.success) {
		throw new Error(`Failed to stop MeetingBaas bot ${botId}: ${result.error}`);
	}

	return result.data;
}

export async function deleteBotArtifacts(
	botId: string,
	deleteFromProvider = true,
) {
	const client = getMeetingBaasClient();
	const result = await client.deleteBotData({
		bot_id: botId,
		delete_from_provider: deleteFromProvider,
	});

	if (!result.success) {
		throw new Error(
			`Failed to delete MeetingBaas bot data for ${botId}: ${result.error}`,
		);
	}

	return result.data;
}
