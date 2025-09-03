import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useChatCore } from "@/hooks/use-chat-core";
import { ActionItem, TranscriptSegment, MeetingData } from "@/config/types";
import { useParams } from "next/navigation";

interface Props {
  meetingData?: MeetingData;
  meetingId: string;
}

export function useMeetingDetail({ meetingData }: Props) {
  const params = useParams();
  const meetingId = params.meetingId as string;

  const { data, isPending } = useSession();

  const userId = data?.session.userId;

  const [isOwner, setIsOwner] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  const [localActionItems, setLocalActionItems] = useState<ActionItem[]>([]);

  const [meetingState, setMeetingState] = useState<MeetingData | undefined>(
    meetingData
  );
  const [loading, setLoading] = useState(!meetingData);

  const chat = useChatCore({
    apiEndpoint: "/api/rag/chat-meeting",
    getRequestBody: (input: string) => ({
      meetingId,
      question: input,
    }),
  });

  const handleSendMessage = async () => {
    if (!chat.chatInput.trim() || !isOwner) {
      return;
    }
    await chat.handleSendMessage();
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isOwner) {
      return;
    }

    chat.handleSuggestionClick(suggestion);
  };

  const handleInputChange = (value: string) => {
    if (!isOwner) {
      return;
    }

    chat.handleInputChange(value);
  };

  const refreshMeetingData = useCallback(async () => {
    setLoading(true);
    try {
      const meetingDataResponse = await fetch(`/api/meetings/${meetingId}`);

      if (!meetingDataResponse.ok) {
        throw new Error("Failed to fetch meeting data");
      }

      const meetingData = (await meetingDataResponse.json()) as MeetingData;

      if (meetingData) {
        setMeetingState(meetingData as MeetingData);

        const actionItems = (meetingData.actionItems ??
          []) as unknown as ActionItem[];
        setLocalActionItems(actionItems);

        const ownerStatus = userId ? userId === meetingData.userId : false;
        setIsOwner(ownerStatus);
        setUserChecked(true);
      }
    } catch (error) {
      console.error("Error fetching meeting:", error);
    } finally {
      setLoading(false);
    }
  }, [meetingId, userId]);

  useEffect(() => {
    if (meetingData) {
      setMeetingState(meetingData);
      const actionItems = (meetingData.actionItems ??
        []) as unknown as ActionItem[];
      setLocalActionItems(actionItems);

      if (!isPending) {
        setIsOwner(userId === meetingData.userId);
        setUserChecked(true);
      }

      setLoading(false);
    } else if (!isPending) {
      refreshMeetingData();
    }
  }, [meetingData, isPending, userId, refreshMeetingData]);

  useEffect(() => {
    const processTranscript = async (data: MeetingData) => {
      try {
        if (data.transcript && !data.ragProcessed && userId === data.userId) {
          let transcriptText = "";
          if (typeof data.transcript === "string") {
            transcriptText = data.transcript;
          } else if (Array.isArray(data.transcript)) {
            const transcriptData =
              data.transcript as unknown as TranscriptSegment[];
            transcriptText = transcriptData
              .map(
                (segment) =>
                  `${segment.speaker}: ${segment.words
                    .map((w) => w.word)
                    .join(" ")}`
              )
              .join("\n");
          }

          await fetch("/api/rag/process", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              meetingId,
              transcript: transcriptText,
              meetingTitle: data.title,
            }),
          });
        }
      } catch (error) {
        console.error("error checking RAG processing:", error);
      }
    };

    if (!isPending && userChecked && meetingState) {
      processTranscript(meetingState);
    }
  }, [meetingId, userId, isPending, userChecked, meetingState]);

  const deleteActionItem = async (id: number) => {
    if (!isOwner) return;

    setLocalActionItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addActionItem = async () => {
    if (!isOwner) return;
    await refreshMeetingData();
  };

  const displayActionItems =
    localActionItems.length > 0
      ? localActionItems.map((item) => ({
          id: item.id,
          text: item.text,
        }))
      : [];

  const meetingInfoData = meetingState
    ? {
        title: meetingState.title,
        date: new Date(meetingState.startTime).toLocaleDateString(),
        time: `${new Date(
          meetingState.startTime
        ).toLocaleTimeString()} - ${new Date(
          meetingState.endTime
        ).toLocaleTimeString()}`,
        userName: meetingState.user?.name || "User",
      }
    : {
        title: "Loading...",
        date: "Loading...",
        time: "Loading...",
        userName: "Loading...",
      };

  return {
    isOwner,
    userChecked,
    localActionItems,
    setLocalActionItems,
    meetingState,
    loading,
    setLoading,
    chatInput: chat.chatInput,
    messages: chat.messages,
    setMessages: chat.setMessages,
    showSuggestions: chat.showSuggestions,
    setShowSuggestions: chat.setShowSuggestions,
    isLoading: chat.isLoading,
    setIsLoading: chat.setIsLoading,
    handleSendMessage,
    handleSuggestionClick,
    handleInputChange,
    deleteActionItem,
    addActionItem,
    displayActionItems,
    meetingInfoData,
  };
}
