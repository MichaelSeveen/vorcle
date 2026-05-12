import type { TranscriptSegment } from "@/config/types";

export type BotStatusCode =
	| "queued"
	| "joining"
	| "in_call_recording"
	| "transcribing"
	| "completed"
	| "failed";

export interface BotStatusChangePayload {
	event: "bot.status_change";
	data: {
		bot_id: string;
		event_id: string;
		status: {
			code: BotStatusCode;
			created_at: string;
			start_time?: number;
		};
		extra?: Record<string, unknown>;
	};
}

export interface BotCompletedPayload {
	event: "bot.completed";
	data: {
		bot_id: string;
		event_id: string;
		video?: string | null;
		audio?: string | null;
		transcription?: string | null;
		raw_transcription?: string | null;
		diarization?: string | null;
		chat_messages?: string | null;
		duration_seconds: number | null;
		participants?: unknown[];
		speakers?: unknown[];
		extra?: Record<string, unknown>;
	};
}

export interface BotChatMessagePayload {
	event: "bot.chat_message";
	data: {
		bot_id: string;
		event_id: string;
		message_id: string;
		sender_name: string;
		sender_id: number | null;
		text: string;
		sent_at: string;
	};
	extra?: Record<string, unknown>;
}

export interface BotFailedPayload {
	event: "bot.failed";
	data: {
		bot_id: string;
		event_id: string;
		error_code: string;
		error_message: string;
		extra?: Record<string, unknown>;
	};
}

export type MeetingBaasWebhookEvent =
	| BotStatusChangePayload
	| BotCompletedPayload
	| BotChatMessagePayload
	| BotFailedPayload;

export interface MeetingBaasTranscriptionArtifact {
	bot_id: string;
	provider: string;
	result: {
		utterances: Array<{
			text: string;
			language?: string;
			start: number;
			end: number;
			confidence?: number;
			channel?: number;
			speaker?: string | null;
			words?: Array<{
				word: string;
				start: number;
				end: number;
				confidence?: number;
			}>;
		}>;
		languages?: string[];
		total_utterances?: number;
		total_duration?: number;
	};
	created_at: string;
}

export interface MeetingBaasChatMessageArtifactItem {
	message_id: string;
	sender_name: string;
	sender_id: number | null;
	text: string;
	timestamp: string;
}

export type MeetingBaasTranscriptSegments = TranscriptSegment[];
