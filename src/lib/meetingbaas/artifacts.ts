import "server-only";

import type { TranscriptSegment } from "@/config/types";
import {
	copyMeetingArtifactToS3,
	downloadJsonArtifactAndStore,
	type MeetingArtifactKind,
} from "./storage";
import type {
	MeetingBaasChatMessageArtifactItem,
	MeetingBaasTranscriptionArtifact,
} from "./types";

interface BotDetailsWithChatMessages {
	audio: string | null;
	chat_messages?: string | null;
	diarization: string | null;
	raw_transcription: string | null;
	transcription: string | null;
	video: string | null;
}

const OPTIONAL_ARTIFACT_FLAGS = {
	"chat-messages": "MEETING_BAAS_STORE_CHAT_MESSAGES",
	diarization: "MEETING_BAAS_STORE_DIARIZATION",
	"raw-transcription": "MEETING_BAAS_STORE_RAW_TRANSCRIPTION",
	video: "MEETING_BAAS_STORE_VIDEO",
} as const satisfies Record<
	Exclude<MeetingArtifactKind, "audio" | "transcription">,
	string
>;

export interface PersistedMeetingArtifacts {
	audioObjectKey: string | null;
	chatMessagesObjectKey: string | null;
	diarizationObjectKey: string | null;
	failedArtifacts: MeetingArtifactKind[];
	rawTranscriptionObjectKey: string | null;
	recordingUrl: string | null;
	transcriptSegments: TranscriptSegment[];
	transcriptText: string;
	transcriptionObjectKey: string | null;
	videoObjectKey: string | null;
}

export class MeetingArtifactPersistenceError extends Error {
	constructor(readonly failedArtifacts: MeetingArtifactKind[]) {
		super(`Failed to persist meeting artifacts: ${failedArtifacts.join(", ")}`);
		this.name = "MeetingArtifactPersistenceError";
	}
}

function isEnabled(value: string | undefined) {
	return value
		? ["1", "true", "yes", "on"].includes(value.toLowerCase())
		: false;
}

function shouldStoreOptionalArtifact(
	artifactKind: keyof typeof OPTIONAL_ARTIFACT_FLAGS,
) {
	return isEnabled(process.env[OPTIONAL_ARTIFACT_FLAGS[artifactKind]]);
}

export function parseMeetingBaasTranscriptionArtifact(
	content: string,
): MeetingBaasTranscriptionArtifact {
	const parsed = JSON.parse(content) as MeetingBaasTranscriptionArtifact;

	if (!parsed?.result?.utterances || !Array.isArray(parsed.result.utterances)) {
		throw new Error(
			"Transcription artifact does not contain result.utterances",
		);
	}

	return parsed;
}

export function parseMeetingBaasChatMessagesArtifact(content: string) {
	const parsed = JSON.parse(content) as MeetingBaasChatMessageArtifactItem[];

	if (!Array.isArray(parsed)) {
		throw new Error("Chat messages artifact is not an array");
	}

	return parsed;
}

export function mapTranscriptionArtifactToSegments(
	artifact: MeetingBaasTranscriptionArtifact,
) {
	return artifact.result.utterances.map<TranscriptSegment>(
		(utterance, index) => {
			const words =
				Array.isArray(utterance.words) && utterance.words.length > 0
					? utterance.words.map((word) => ({
							end: word.end,
							start: word.start,
							word: word.word,
						}))
					: utterance.text
							.split(/\s+/)
							.filter(Boolean)
							.map((word) => ({
								end: utterance.end,
								start: utterance.start,
								word,
							}));

			return {
				offset: index,
				speaker: utterance.speaker || "Speaker",
				words,
			};
		},
	);
}

export function transcriptSegmentsToText(segments: TranscriptSegment[]) {
	return segments
		.map(
			(segment) =>
				`${segment.speaker || "Speaker"}: ${segment.words
					.map((word) => word.word)
					.join(" ")}`,
		)
		.join("\n");
}

export async function persistMeetingArtifacts({
	botDetails,
	botId,
	meetingId,
	meetingTitle,
	userId,
}: {
	botDetails: BotDetailsWithChatMessages;
	botId: string;
	meetingId: string;
	meetingTitle: string;
	userId: string;
}): Promise<PersistedMeetingArtifacts> {
	let audioObjectKey: string | null = null;
	let videoObjectKey: string | null = null;
	let transcriptionObjectKey: string | null = null;
	let rawTranscriptionObjectKey: string | null = null;
	let diarizationObjectKey: string | null = null;
	let chatMessagesObjectKey: string | null = null;
	let transcriptSegments: TranscriptSegment[] = [];
	let transcriptText = "";
	const failedArtifacts: MeetingArtifactKind[] = [];

	if (botDetails.audio) {
		try {
			audioObjectKey = await copyMeetingArtifactToS3({
				artifactKind: "audio",
				artifactUrl: botDetails.audio,
				botId,
				meetingId,
				meetingTitle,
				userId,
			});
		} catch (error) {
			failedArtifacts.push("audio");
			console.error("Failed to persist audio artifact:", error);
		}
	}

	if (botDetails.video && shouldStoreOptionalArtifact("video")) {
		try {
			videoObjectKey = await copyMeetingArtifactToS3({
				artifactKind: "video",
				artifactUrl: botDetails.video,
				botId,
				meetingId,
				meetingTitle,
				userId,
			});
		} catch (error) {
			failedArtifacts.push("video");
			console.error("Failed to persist video artifact:", error);
		}
	}

	if (botDetails.transcription) {
		try {
			const storedTranscription = await downloadJsonArtifactAndStore({
				artifactKind: "transcription",
				artifactUrl: botDetails.transcription,
				botId,
				meetingId,
				meetingTitle,
				userId,
			});

			transcriptionObjectKey = storedTranscription.key;
			const transcriptionArtifact = parseMeetingBaasTranscriptionArtifact(
				storedTranscription.buffer.toString("utf8"),
			);
			transcriptSegments = mapTranscriptionArtifactToSegments(
				transcriptionArtifact,
			);
			transcriptText = transcriptSegmentsToText(transcriptSegments);
		} catch (error) {
			failedArtifacts.push("transcription");
			console.error("Failed to persist transcription artifact:", error);
		}
	}

	if (
		botDetails.raw_transcription &&
		shouldStoreOptionalArtifact("raw-transcription")
	) {
		try {
			const storedRawTranscription = await downloadJsonArtifactAndStore({
				artifactKind: "raw-transcription",
				artifactUrl: botDetails.raw_transcription,
				botId,
				meetingId,
				meetingTitle,
				userId,
			});

			rawTranscriptionObjectKey = storedRawTranscription.key;
		} catch (error) {
			failedArtifacts.push("raw-transcription");
			console.error("Failed to persist raw transcription artifact:", error);
		}
	}

	if (botDetails.diarization && shouldStoreOptionalArtifact("diarization")) {
		try {
			const storedDiarization = await downloadJsonArtifactAndStore({
				artifactKind: "diarization",
				artifactUrl: botDetails.diarization,
				botId,
				meetingId,
				meetingTitle,
				userId,
			});

			diarizationObjectKey = storedDiarization.key;
		} catch (error) {
			failedArtifacts.push("diarization");
			console.error("Failed to persist diarization artifact:", error);
		}
	}

	if (
		botDetails.chat_messages &&
		shouldStoreOptionalArtifact("chat-messages")
	) {
		try {
			const storedChatMessages = await downloadJsonArtifactAndStore({
				artifactKind: "chat-messages",
				artifactUrl: botDetails.chat_messages,
				botId,
				meetingId,
				meetingTitle,
				userId,
			});

			parseMeetingBaasChatMessagesArtifact(
				storedChatMessages.buffer.toString("utf8"),
			);
			chatMessagesObjectKey = storedChatMessages.key;
		} catch (error) {
			failedArtifacts.push("chat-messages");
			console.error("Failed to persist chat messages artifact:", error);
		}
	}

	if (failedArtifacts.length > 0) {
		throw new MeetingArtifactPersistenceError(failedArtifacts);
	}

	return {
		audioObjectKey,
		chatMessagesObjectKey,
		diarizationObjectKey,
		failedArtifacts,
		rawTranscriptionObjectKey,
		recordingUrl: botDetails.audio ?? null,
		transcriptSegments,
		transcriptText,
		transcriptionObjectKey,
		videoObjectKey,
	};
}
