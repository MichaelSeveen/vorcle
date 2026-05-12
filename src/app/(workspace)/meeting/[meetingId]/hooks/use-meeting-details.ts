"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import {
	createActionItem,
	removeActionItem,
} from "@/app/actions/meeting-action-items";
import type { ActionItem } from "@/config/types";
import type { MeetingByIdResult } from "@/helpers/meetings";
import { parseActionItems } from "@/helpers/meetings/action-items";
import { useChatCore } from "@/hooks/use-chat-core";
import { formatTranscriptToText } from "@/lib/meetings/transcript";

interface UseMeetingDetailProps {
	currentUserId: string;
	meetingData: MeetingByIdResult;
	meetingId: string;
}

export type MeetingDetailError =
	| "meetingError"
	| "actionItemError"
	| "ragProcessError";

export function useMeetingDetail({
	currentUserId,
	meetingData,
	meetingId,
}: UseMeetingDetailProps) {
	const [error, setError] = useState<{
		type: MeetingDetailError;
		message: string;
	} | null>(null);
	const [isProcessingRag, setIsProcessingRag] = useState(false);

	const [isPending, startTransition] = useTransition();
	const [optimisticActionItems, setOptimisticActionItems] = useState<
		ActionItem[]
	>([]);

	const hasProcessedRag = useRef(false);

	const chat = useChatCore({
		apiEndpoint: "/api/rag/chat-meeting",
		getRequestBody: (input: string) => ({ meetingId, question: input }),
	});

	const meeting = useMemo(() => {
		if (!meetingData.ok) {
			setError({
				type: "meetingError",
				message: meetingData.error,
			});
			return null;
		}
		return meetingData.data;
	}, [meetingData]);

	const isOwner = useMemo(() => {
		if (!meeting) return false;
		return currentUserId === meeting.userId;
	}, [meeting, currentUserId]);

	const actionItems = useMemo(() => {
		if (optimisticActionItems.length > 0) {
			return optimisticActionItems;
		}
		if (!meeting) return [];
		return parseActionItems(meeting.actionItems);
	}, [meeting, optimisticActionItems]);

	const meetingInfo = useMemo(() => {
		if (!meeting) {
			return {
				title: "Meeting not found",
				date: "—",
				time: "—",
				userName: "—",
			};
		}

		const start = new Date(meeting.startTime);
		const end = new Date(meeting.endTime);

		return {
			title: meeting.title,
			date: start.toLocaleDateString(),
			time: `${start.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			})} - ${end.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			})}`,
			userName: meeting.user?.name || "Unknown User",
		};
	}, [meeting]);

	const handleSendMessage = useCallback(async () => {
		if (!chat.chatInput.trim() || !isOwner) return;
		await chat.handleSendMessage();
	}, [chat, isOwner]);

	const handleInputChange = useCallback(
		(value: string) => {
			if (!isOwner) return;
			chat.handleInputChange(value);
		},
		[chat, isOwner],
	);

	const deleteActionItem = useCallback(
		async (id: number) => {
			if (!isOwner) return;

			const previousItems = actionItems;
			const newItems = actionItems.filter((item) => item.id !== id);
			setOptimisticActionItems(newItems);

			startTransition(async () => {
				try {
					const result = await removeActionItem(meetingId, id);

					if (!result.success) {
						setOptimisticActionItems(previousItems);
						setError({
							type: "actionItemError",
							message: result.error || "Failed to delete action item",
						});
						return;
					}
				} catch (err) {
					setOptimisticActionItems(previousItems);

					const errorMsg =
						err instanceof Error ? err.message : "Failed to delete action item";

					setError({
						type: "actionItemError",
						message: errorMsg,
					});
					console.error("Error deleting action item:", err);
				}
			});
		},
		[isOwner, actionItems, meetingId],
	);

	const addActionItem = useCallback(
		async (text: string) => {
			if (!isOwner || !text.trim()) return;

			const tempId = Date.now();
			const newItem: ActionItem = { id: tempId, text: text.trim() };
			const previousItems = actionItems;
			setOptimisticActionItems([...actionItems, newItem]);

			startTransition(async () => {
				try {
					const result = await createActionItem(meetingId, text.trim());

					if (!result.success) {
						setOptimisticActionItems(previousItems);
						setError({
							type: "actionItemError",
							message: result.error || "Failed to add action item",
						});
						return;
					}

					if (result.data) {
						setOptimisticActionItems((prev) =>
							prev.map((item) => (item.id === tempId ? result.data : item)),
						);
					}
				} catch (err) {
					setOptimisticActionItems(previousItems);

					const errorMsg =
						err instanceof Error ? err.message : "Failed to add action item";
					setError({
						type: "actionItemError",
						message: errorMsg,
					});
					console.error("Error adding action item:", err);
				}
			});
		},
		[isOwner, actionItems, meetingId],
	);

	useEffect(() => {
		if (hasProcessedRag.current || !meeting || !isOwner) return;
		if (meeting.ragProcessed || !meeting.transcript) return;

		const processRag = async () => {
			setIsProcessingRag(true);
			hasProcessedRag.current = true;

			try {
				const transcriptText = formatTranscriptToText(meeting.transcript);

				if (!transcriptText) {
					console.warn("No transcript text to process");
					return;
				}

				const response = await fetch("/api/rag/process", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						meetingId,
						transcript: transcriptText,
						meetingTitle: meeting.title,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to process RAG");
				}
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "Failed to process transcript";

				setError({
					type: "ragProcessError",
					message: errorMsg,
				});
				hasProcessedRag.current = false;
			} finally {
				setIsProcessingRag(false);
			}
		};

		processRag();
	}, [meeting, isOwner, meetingId]);

	return {
		isOwner,
		meeting,
		error,
		actionItems,
		chatInput: chat.chatInput,
		messages: chat.messages,

		isChatLoading: chat.isLoading,
		isProcessingRag,
		isActionItemPending: isPending,
		setMessages: chat.setMessages,

		handleSendMessage,

		handleInputChange,
		deleteActionItem,
		addActionItem,
		meetingInfo,
	};
}
