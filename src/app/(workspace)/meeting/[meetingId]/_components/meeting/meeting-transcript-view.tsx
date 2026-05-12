"use client";

import {
	Description,
	ErrorMessage,
	Label,
	ListBox,
	ScrollShadow,
	Select,
	Spinner,
} from "@heroui/react";
import { useMemo, useState, useTransition } from "react";
import {
	getStoredTranscriptTranslations,
	getTranscriptDisplaySegments,
	getTranscriptLanguageLabel,
	normalizeLanguageCode,
	type StoredTranscriptTranslation,
	type StoredTranscriptTranslations,
	TRANSCRIPT_TRANSLATION_LANGUAGE_CODES,
	TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS,
	type TranscriptTranslationLanguage,
} from "@/lib/meetings/transcript";

interface MeetingTranscriptViewProps {
	meetingId: string;
	transcript: unknown;
	transcriptSourceLanguage?: string | null;
	transcriptTranslations?: unknown;
}

export default function MeetingTranscriptView({
	meetingId,
	transcript,
	transcriptSourceLanguage,
	transcriptTranslations,
}: MeetingTranscriptViewProps) {
	const [isPending, startTransition] = useTransition();
	const [selectedLanguage, setSelectedLanguage] = useState<
		"original" | TranscriptTranslationLanguage
	>("original");
	const [translationError, setTranslationError] = useState<string | null>(null);
	const [sourceLanguage, setSourceLanguage] = useState<string | null>(() =>
		normalizeLanguageCode(transcriptSourceLanguage),
	);

	const storedTranslationsFromProps = useMemo(
		() => getStoredTranscriptTranslations(transcriptTranslations),
		[transcriptTranslations],
	);
	const [localTranslations, setLocalTranslations] =
		useState<StoredTranscriptTranslations>({});

	const storedTranslations: StoredTranscriptTranslations = useMemo(
		() => ({ ...storedTranslationsFromProps, ...localTranslations }),
		[storedTranslationsFromProps, localTranslations],
	);

	const originalSegments = useMemo(
		() => getTranscriptDisplaySegments(transcript),
		[transcript],
	);

	const activeTranslation =
		selectedLanguage === "original"
			? null
			: (storedTranslations[selectedLanguage] ?? null);
	const visibleSegments = activeTranslation?.segments ?? originalSegments;
	const sourceLanguageLabel = getTranscriptLanguageLabel(sourceLanguage);

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);

		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	};

	const getSpeakerSegmentTime = (startTime: number, endTime: number) => {
		return `${formatTime(startTime)} - ${formatTime(endTime)}`;
	};

	const handleLanguageChange = (value: string) => {
		setTranslationError(null);

		if (value === "original") {
			setSelectedLanguage("original");
			return;
		}

		if (
			!(TRANSCRIPT_TRANSLATION_LANGUAGE_CODES as readonly string[]).includes(
				value,
			)
		) {
			return;
		}

		const nextLanguage = value as TranscriptTranslationLanguage;
		setSelectedLanguage(nextLanguage);

		if (storedTranslations[nextLanguage]) {
			return;
		}

		startTransition(async () => {
			try {
				const response = await fetch(
					`/api/meetings/${meetingId}/transcript/translate`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							targetLanguage: nextLanguage,
						}),
					},
				);
				const responseJson = (await response.json().catch(() => null)) as {
					error?: string;
					translation?: StoredTranscriptTranslation;
				} | null;

				if (!response.ok || !responseJson?.translation) {
					throw new Error(
						responseJson?.error || "Failed to translate this transcript",
					);
				}

				setLocalTranslations((currentTranslations) => ({
					...currentTranslations,
					[nextLanguage]: responseJson.translation,
				}));
				setSourceLanguage(
					normalizeLanguageCode(responseJson.translation.sourceLanguage),
				);
			} catch (error) {
				setSelectedLanguage("original");
				setTranslationError(
					error instanceof Error
						? error.message
						: "Failed to translate this transcript",
				);
			}
		});
	};

	if (originalSegments.length === 0) {
		return (
			<div className="my-20 text-center">
				<p className="text-lg text-foreground">No transcript available</p>
			</div>
		);
	}

	return (
		<div className="pb-4">
			<div className="w-full max-w-[12rem] ml-auto">
				<Select
					aria-label="Display transcript language"
					value={selectedLanguage}
					onChange={(key) => handleLanguageChange(key as string)}
					className="w-full"
					placeholder="Select a language"
				>
					<Label>Transcript Language: {sourceLanguageLabel}</Label>
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							<ListBox.Item id="original" textValue="Original transcript">
								Original transcript
								<ListBox.ItemIndicator />
							</ListBox.Item>
							{TRANSCRIPT_TRANSLATION_LANGUAGE_CODES.map((languageCode) => (
								<ListBox.Item
									key={languageCode}
									id={languageCode}
									textValue={
										TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS[languageCode]
									}
								>
									{TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS[languageCode]}
									<ListBox.ItemIndicator />
								</ListBox.Item>
							))}
						</ListBox>
					</Select.Popover>
				</Select>
				<Description>
					{isPending && selectedLanguage !== "original" ? (
						<span className="inline-flex items-center gap-1">
							<Spinner />
							Translating transcript…
						</span>
					) : selectedLanguage === "original" ? (
						"Showing the original transcript."
					) : activeTranslation ? (
						`Showing the ${TRANSCRIPT_TRANSLATION_LANGUAGE_LABELS[selectedLanguage]} transcript.`
					) : (
						"Select a language to create and store a translated transcript."
					)}
				</Description>
				{translationError ? (
					<ErrorMessage>{translationError}</ErrorMessage>
				) : null}
			</div>

			<ScrollShadow className="h-[28rem]">
				<ul>
					{visibleSegments.map((segment) => (
						<li
							key={`${segment.speaker}-${segment.offset}-${segment.end}-${segment.text.slice(0, 24)}`}
							className="flex flex-col gap-2 items-start border-b last:border-b-0 pt-0.5 pb-3"
						>
							<p>
								<strong>{segment.speaker}</strong> •{" "}
								<span className="text-accent underline">
									{getSpeakerSegmentTime(segment.offset, segment.end)}
								</span>
							</p>
							<p className="text-foreground leading-relaxed">
								{segment.text}
							</p>
						</li>
					))}
				</ul>
			</ScrollShadow>
		</div>
	);
}
