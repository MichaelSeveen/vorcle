import type { TranscriptSegment } from "@/config/types";

export const TRANSCRIPT_TRANSLATION_LANGUAGE_CODES = [
	"en",
	"es",
	"fr",
	"de",
	"pt",
	"ar",
	"yo",
] as const;

export type TranscriptTranslationLanguage =
	(typeof TRANSCRIPT_TRANSLATION_LANGUAGE_CODES)[number];

export interface TranscriptDisplaySegment {
	speaker: string;
	text: string;
	offset: number;
	end: number;
}

export interface StoredTranscriptTranslation {
	sourceLanguage: string | null;
	targetLanguage: TranscriptTranslationLanguage;
	translatedAt: string;
	segments: TranscriptDisplaySegment[];
}

export type StoredTranscriptTranslations = Partial<
	Record<TranscriptTranslationLanguage, StoredTranscriptTranslation>
>;

export const TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS: Record<
	TranscriptTranslationLanguage,
	string
> = {
	en: "English",
	es: "Spanish",
	fr: "French",
	de: "German",
	pt: "Portuguese",
	ar: "Arabic",
	yo: "Yoruba",
};

export function normalizeLanguageCode(
	value: string | null | undefined,
): string | null {
	if (!value) {
		return null;
	}

	return value.trim().toLowerCase().split("-")[0] || null;
}

export function isSupportedTranscriptTranslationLanguage(
	value: string | null | undefined,
): value is TranscriptTranslationLanguage {
	if (!value) {
		return false;
	}

	return (TRANSCRIPT_TRANSLATION_LANGUAGE_CODES as readonly string[]).includes(
		normalizeLanguageCode(value) ?? "",
	);
}

export function getTranscriptLanguageLabel(
	languageCode: string | null | undefined,
): string {
	const normalizedLanguageCode = normalizeLanguageCode(languageCode);

	if (
		normalizedLanguageCode &&
		isSupportedTranscriptTranslationLanguage(normalizedLanguageCode)
	) {
		return TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS[normalizedLanguageCode];
	}

	if (!normalizedLanguageCode) {
		return "Unknown";
	}

	return normalizedLanguageCode.toUpperCase();
}

export function parseTranscriptSegments(raw: unknown): TranscriptSegment[] {
	if (!raw || !Array.isArray(raw)) return [];

	return raw.map((segment) => {
		const segmentObject = segment as Record<string, unknown>;
		const speaker = String(segmentObject?.speaker ?? "Speaker");
		const words = Array.isArray(segmentObject?.words)
			? segmentObject.words.map((word) => {
					const wordObject = word as Record<string, unknown>;
					return {
						word: String(wordObject?.word ?? ""),
						start: typeof wordObject?.start === "number" ? wordObject.start : 0,
						end: typeof wordObject?.end === "number" ? wordObject.end : 0,
					};
				})
			: [];
		const offset =
			typeof segmentObject?.offset === "number" ? segmentObject.offset : 0;

		return {
			speaker,
			words,
			offset,
		} as TranscriptSegment;
	});
}

export function getTranscriptSegmentText(segment: TranscriptSegment): string {
	return segment.words
		.map((word) => word.word)
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
}

export function getTranscriptSegmentEnd(segment: TranscriptSegment): number {
	return segment.words[segment.words.length - 1]?.end || segment.offset;
}

export function getTranscriptDisplaySegments(
	transcript: unknown,
): TranscriptDisplaySegment[] {
	if (typeof transcript === "string") {
		return transcript
			.split(/\r?\n/)
			.map((line, index) => {
				const trimmedLine = line.trim();

				if (!trimmedLine) {
					return null;
				}

				const separatorIndex = trimmedLine.indexOf(":");
				const hasSpeaker =
					separatorIndex > 0 &&
					separatorIndex < Math.min(trimmedLine.length, 40);
				const speaker = hasSpeaker
					? trimmedLine.slice(0, separatorIndex).trim()
					: "Speaker";
				const text = hasSpeaker
					? trimmedLine.slice(separatorIndex + 1).trim()
					: trimmedLine;

				if (!text) {
					return null;
				}

				const approximateOffset = index * 30;

				return {
					speaker,
					text,
					offset: approximateOffset,
					end: approximateOffset + 30,
				} satisfies TranscriptDisplaySegment;
			})
			.filter(
				(segment): segment is TranscriptDisplaySegment =>
					segment !== null && segment.text.length > 0,
			);
	}

	return parseTranscriptSegments(transcript).map((segment) => ({
		speaker: segment.speaker,
		text: getTranscriptSegmentText(segment),
		offset: segment.offset,
		end: getTranscriptSegmentEnd(segment),
	}));
}

export function formatTranscriptToText(transcript: unknown): string {
	if (typeof transcript === "string") return transcript;

	return getTranscriptDisplaySegments(transcript)
		.map((segment) => `${segment.speaker}: ${segment.text}`)
		.join("\n");
}

export function getStoredTranscriptTranslations(
	raw: unknown,
): StoredTranscriptTranslations {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		return {};
	}

	return Object.entries(
		raw as Record<string, unknown>,
	).reduce<StoredTranscriptTranslations>(
		(translations, [languageCode, value]) => {
			const normalizedLanguageCode = normalizeLanguageCode(languageCode);

			if (
				!normalizedLanguageCode ||
				!isSupportedTranscriptTranslationLanguage(normalizedLanguageCode)
			) {
				return translations;
			}

			const translationObject =
				value && typeof value === "object" && !Array.isArray(value)
					? (value as Record<string, unknown>)
					: null;

			if (!translationObject) {
				return translations;
			}

			const segments = Array.isArray(translationObject.segments)
				? translationObject.segments
						.map((segment) => {
							const segmentObject =
								segment &&
								typeof segment === "object" &&
								!Array.isArray(segment)
									? (segment as Record<string, unknown>)
									: null;

							if (!segmentObject) {
								return null;
							}

							return {
								speaker: String(segmentObject.speaker ?? "Speaker"),
								text: String(segmentObject.text ?? "").trim(),
								offset:
									typeof segmentObject.offset === "number"
										? segmentObject.offset
										: 0,
								end:
									typeof segmentObject.end === "number" ? segmentObject.end : 0,
							} satisfies TranscriptDisplaySegment;
						})
						.filter(
							(segment): segment is TranscriptDisplaySegment =>
								segment !== null && segment.text.length > 0,
						)
				: [];

			if (segments.length === 0) {
				return translations;
			}

			translations[normalizedLanguageCode] = {
				sourceLanguage: normalizeLanguageCode(
					typeof translationObject.sourceLanguage === "string"
						? translationObject.sourceLanguage
						: null,
				),
				targetLanguage: normalizedLanguageCode,
				translatedAt:
					typeof translationObject.translatedAt === "string"
						? translationObject.translatedAt
						: new Date(0).toISOString(),
				segments,
			};

			return translations;
		},
		{},
	);
}
