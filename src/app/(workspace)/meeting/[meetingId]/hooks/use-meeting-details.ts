"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useChatCore } from "@/hooks/use-chat-core";
import { ActionItem, TranscriptSegment } from "@/config/types";
import type { MeetingByIdResult } from "@/helpers/meetings";
import {
  removeActionItem,
  createActionItem,
} from "@/app/actions/meeting-action-items";

interface UseMeetingDetailProps {
  currentUserId: string;
  meetingData: MeetingByIdResult;
  meetingId: string;
}

export type MeetingDetailError =
  | "meetingError"
  | "actionItemError"
  | "ragProcessError";

function parseActionItems(raw: unknown): ActionItem[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((item, idx) => {
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      return {
        id: typeof obj.id === "number" ? obj.id : idx,
        text: typeof obj.text === "string" ? obj.text : String(item),
      };
    }
    return { id: idx, text: String(item) };
  });
}

function parseTranscriptSegments(raw: unknown): TranscriptSegment[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((seg) => {
    const s = seg as Record<string, unknown>;
    const speaker = String(s?.speaker ?? "Speaker");
    const words = Array.isArray(s?.words)
      ? s.words.map((w, i) => {
          const wObj = w as Record<string, unknown>;
          return {
            id: typeof wObj?.id === "number" ? wObj.id : i,
            word: String(wObj?.word ?? ""),
          };
        })
      : [];
    const offset = typeof s?.offset === "number" ? s.offset : 0;
    return { speaker, words, offset } as unknown as TranscriptSegment;
  });
}

function formatTranscriptToText(transcript: unknown): string {
  if (typeof transcript === "string") return transcript;

  if (Array.isArray(transcript)) {
    const segments = parseTranscriptSegments(transcript);
    return segments
      .map((seg) => `${seg.speaker}: ${seg.words.map((w) => w.word).join(" ")}`)
      .join("\n");
  }

  return "";
}

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

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (!isOwner) return;
      chat.handleSuggestionClick(suggestion);
    },
    [chat, isOwner]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      if (!isOwner) return;
      chat.handleInputChange(value);
    },
    [chat, isOwner]
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
    [isOwner, actionItems, meetingId]
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
              prev.map((item) => (item.id === tempId ? result.data! : item))
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
    [isOwner, actionItems, meetingId]
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
    showSuggestions: chat.showSuggestions,
    isChatLoading: chat.isLoading,
    isProcessingRag,
    isActionItemPending: isPending,
    setMessages: chat.setMessages,
    setShowSuggestions: chat.setShowSuggestions,
    handleSendMessage,
    handleSuggestionClick,
    handleInputChange,
    deleteActionItem,
    addActionItem,
    meetingInfo,
  };
}
