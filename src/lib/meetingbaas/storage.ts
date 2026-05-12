import "server-only";

import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type MeetingArtifactKind =
	| "audio"
	| "video"
	| "transcription"
	| "raw-transcription"
	| "diarization"
	| "chat-messages";

const ARTIFACT_CONFIG: Record<
	MeetingArtifactKind,
	{ contentType: string; extension: string; fileName: string; folder: string }
> = {
	audio: {
		contentType: "audio/flac",
		extension: "flac",
		fileName: "meeting-audio",
		folder: "audio",
	},
	"chat-messages": {
		contentType: "application/json",
		extension: "json",
		fileName: "chat-messages",
		folder: "chat",
	},
	diarization: {
		contentType: "application/x-ndjson",
		extension: "jsonl",
		fileName: "speaker-diarization",
		folder: "diarization",
	},
	"raw-transcription": {
		contentType: "application/json",
		extension: "json",
		fileName: "raw-transcription",
		folder: "transcription",
	},
	transcription: {
		contentType: "application/json",
		extension: "json",
		fileName: "transcription",
		folder: "transcription",
	},
	video: {
		contentType: "video/mp4",
		extension: "mp4",
		fileName: "meeting-video",
		folder: "video",
	},
};

function getBucketName() {
	const bucket = process.env.AWS_S3_BUCKET;

	if (!bucket) {
		throw new Error("AWS_S3_BUCKET is not set");
	}

	return bucket;
}

function sanitizePathSegment(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function getS3Client() {
	const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
	const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
	const region = process.env.AWS_REGION;
	const endpoint = process.env.AWS_ENDPOINT_URL_S3;

	if (!accessKeyId || !secretAccessKey || !region) {
		throw new Error(
			"AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION must all be set",
		);
	}

	return new S3Client({
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
		...(endpoint ? { endpoint, forcePathStyle: true } : {}),
		region,
		requestChecksumCalculation: "WHEN_REQUIRED",
		responseChecksumValidation: "WHEN_REQUIRED",
	});
}

function getResponseContentType(
	response: Response,
	artifactKind: MeetingArtifactKind,
) {
	return (
		response.headers.get("content-type") ||
		ARTIFACT_CONFIG[artifactKind].contentType
	);
}

function getResponseContentLength(response: Response) {
	const rawContentLength = response.headers.get("content-length");

	if (!rawContentLength) {
		return undefined;
	}

	const contentLength = Number(rawContentLength);

	return Number.isSafeInteger(contentLength) && contentLength >= 0
		? contentLength
		: undefined;
}

function getArtifactMetadata({
	artifactKind,
	botId,
	meetingId,
	userId,
}: {
	artifactKind: MeetingArtifactKind;
	botId: string;
	meetingId: string;
	userId: string;
}) {
	return {
		artifactkind: artifactKind,
		botid: botId,
		meetingid: meetingId,
		userid: userId,
	};
}

export function buildMeetingArtifactKey({
	artifactKind,
	meetingId,
	meetingTitle,
	userId,
}: {
	artifactKind: MeetingArtifactKind;
	meetingId: string;
	meetingTitle: string;
	userId: string;
}) {
	const config = ARTIFACT_CONFIG[artifactKind];
	const safeMeetingId = sanitizePathSegment(meetingId) || "meeting";
	const safeMeetingTitle =
		sanitizePathSegment(meetingTitle) || "untitled-meeting";
	const safeUserId = sanitizePathSegment(userId) || "user";

	return [
		"users",
		safeUserId,
		"meetings",
		safeMeetingId,
		safeMeetingTitle,
		config.folder,
		`${config.fileName}.${config.extension}`,
	].join("/");
}

export async function copyMeetingArtifactToS3({
	artifactKind,
	artifactUrl,
	botId,
	meetingId,
	meetingTitle,
	userId,
}: {
	artifactKind: MeetingArtifactKind;
	artifactUrl: string;
	botId: string;
	meetingId: string;
	meetingTitle: string;
	userId: string;
}) {
	const response = await fetch(artifactUrl);

	if (!response.ok || !response.body) {
		throw new Error(
			`Failed to download ${artifactKind} artifact: ${response.status}`,
		);
	}

	const key = buildMeetingArtifactKey({
		artifactKind,
		meetingId,
		meetingTitle,
		userId,
	});
	const s3 = getS3Client();
	const contentLength = getResponseContentLength(response);
	const contentType = getResponseContentType(response, artifactKind);
	const metadata = getArtifactMetadata({
		artifactKind,
		botId,
		meetingId,
		userId,
	});

	if (contentLength !== undefined) {
		await s3.send(
			new PutObjectCommand({
				Bucket: getBucketName(),
				Body: Readable.fromWeb(response.body as unknown as NodeReadableStream),
				ContentLength: contentLength,
				ContentType: contentType,
				Key: key,
				Metadata: metadata,
			}),
		);

		return key;
	}

	const buffer = Buffer.from(await response.arrayBuffer());

	await s3.send(
		new PutObjectCommand({
			Bucket: getBucketName(),
			Body: buffer,
			ContentLength: buffer.length,
			ContentType: contentType,
			Key: key,
			Metadata: metadata,
		}),
	);

	return key;
}

export async function downloadJsonArtifactAndStore({
	artifactKind,
	artifactUrl,
	botId,
	meetingId,
	meetingTitle,
	userId,
}: {
	artifactKind: Extract<
		MeetingArtifactKind,
		"chat-messages" | "diarization" | "raw-transcription" | "transcription"
	>;
	artifactUrl: string;
	botId: string;
	meetingId: string;
	meetingTitle: string;
	userId: string;
}) {
	const response = await fetch(artifactUrl);

	if (!response.ok) {
		throw new Error(
			`Failed to download ${artifactKind} artifact: ${response.status}`,
		);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	const key = buildMeetingArtifactKey({
		artifactKind,
		meetingId,
		meetingTitle,
		userId,
	});
	const s3 = getS3Client();

	await s3.send(
		new PutObjectCommand({
			Bucket: getBucketName(),
			Body: buffer,
			ContentLength: buffer.length,
			ContentType: getResponseContentType(response, artifactKind),
			Key: key,
			Metadata: getArtifactMetadata({
				artifactKind,
				botId,
				meetingId,
				userId,
			}),
		}),
	);

	return { buffer, key };
}

export async function createMeetingArtifactReadUrl(
	key: string,
	expiresInSeconds = 3600,
) {
	const s3 = getS3Client();

	return getSignedUrl(
		s3 as never,
		new GetObjectCommand({
			Bucket: getBucketName(),
			Key: key,
		}) as never,
		{ expiresIn: expiresInSeconds },
	);
}
